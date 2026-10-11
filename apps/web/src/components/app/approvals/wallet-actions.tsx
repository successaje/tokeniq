"use client";

import { ExternalLink } from "lucide-react";
import { useRef, useState } from "react";
import { isAddressEqual, recoverTypedDataAddress, type Hex } from "viem";
import { useAccount, useDisconnect, useSendTransaction, useSignTypedData, useSwitchChain } from "wagmi";
import { explorerTxUrl, useMetaIndex } from "@/components/app/treasury/meta";
import { Button } from "@/components/ui/button";
import { AddressText } from "@/components/ui/identity";
import { Callout } from "@/components/ui/status";
import { useToast } from "@/components/ui/toast";
import { WalletPicker } from "@/components/wallet/wallet-picker";
import { Web3Provider } from "@/components/web3-provider";
import { api, ApiError, orgPath } from "@/lib/api";
import type { ProposalDetail } from "@/lib/types";
import { normalizeEip712Signature, verifyExecutionData, type SafeTxCheck } from "./safe-tx";

function walletError(err: unknown): string {
  const msg = ((err as Error)?.message ?? "").toLowerCase();
  if (msg.includes("rejected") || msg.includes("denied")) return "You declined the request in your wallet. Nothing was signed or sent.";
  if (msg.includes("insufficient funds")) return "The connected wallet doesn't have enough ETH to pay gas on this network.";
  if (msg.includes("chain")) return "Your wallet is on a different network. Switch networks and try again.";
  return "The wallet couldn't complete the request. Nothing was changed.";
}

function useChainGate(chainId: number) {
  const { chainId: current } = useAccount();
  const { switchChainAsync, isPending } = useSwitchChain();
  const ensure = async () => {
    if (current !== chainId) await switchChainAsync({ chainId });
  };
  return { wrongChain: current !== chainId, ensure, switching: isPending };
}

function Blocked({ check }: { check: SafeTxCheck | null }) {
  if (!check) return <p className="text-[13px] text-text-2">Checking the prepared transaction against the token list…</p>;
  return <Callout tone="danger">Blocked: the prepared transaction failed this page's checks (listed above). Nothing will be sent to a wallet.</Callout>;
}

/** Sign the prepared Safe transaction (EIP-712) with an owner wallet. Keys never leave the wallet. */
function SignInner({ orgId, p, check, onDone }: { orgId: string; p: ProposalDetail; check: SafeTxCheck | null; onDone: () => void }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signTypedDataAsync, isPending } = useSignTypedData();
  const gate = useChainGate(p.chainId);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  if (!isConnected || !address) return <WalletPicker />;
  const owners = p.safeTx?.owners ?? [];
  const isOwner = owners.some((o) => isAddressEqual(o as Hex, address));
  const alreadySigned = p.signatures.some((s) => isAddressEqual(s.signer as Hex, address));
  const review = check && check.problems.length === 0 ? check.review : null;

  async function switchNetwork() {
    setError(null);
    try {
      await gate.ensure();
    } catch (err) {
      setError(walletError(err));
    }
  }

  async function sign() {
    // Sign only the request that passed verification, exactly as reviewed on the page.
    if (!review || !address || inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setBusy(true);
    try {
      const signature = normalizeEip712Signature(await signTypedDataAsync({ account: address, ...review.request }));
      // The wallet must have signed the reviewed hash with the connected owner.
      const signer = await recoverTypedDataAddress({ ...review.request, signature });
      if (!isAddressEqual(signer, address)) {
        setError(`Your wallet returned a signature from ${signer}, not the connected account ${address}. Nothing was recorded.`);
        return;
      }
      const res = await api<{ signatures: number; threshold: number; ready: boolean }>(orgPath(orgId, `/proposals/${p.id}/signatures`), { method: "POST", body: { signature } });
      toast({ id: `sig-${p.id}`, tone: "success", title: "Signature recorded", description: `${res.signatures} of ${res.threshold} owner signatures collected.${res.ready ? " Ready to submit; nothing has executed yet." : ""}` });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : walletError(err));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-hairline bg-surface px-3 py-2 text-sm">
        <span className="text-text-2">Connected wallet</span>
        <AddressText address={address} full />
      </div>
      {!isOwner && <Callout tone="warning">This wallet is not an owner of the Safe. Connect an owner wallet to sign.</Callout>}
      {alreadySigned && <Callout tone="success">This wallet has already signed this transaction.</Callout>}
      {isOwner && !alreadySigned && (
        <>
          {!review ? (
            <Blocked check={check} />
          ) : (
            <>
              <p className="text-[13px] text-text-2">
                Your wallet will show this Safe transaction (EIP-712). Before approving it there, check that the network, Safe address, nonce and safeTxHash (or the domain and message hashes) match the values above. Signing does not submit anything on-chain.
              </p>
              {gate.wrongChain ? (
                <Button onClick={switchNetwork} loading={gate.switching} variant="secondary">
                  Switch wallet network
                </Button>
              ) : (
                <Button onClick={sign} loading={busy || isPending} loadingLabel="Waiting for your signature">
                  Sign as Safe owner
                </Button>
              )}
            </>
          )}
        </>
      )}
      <Button variant="ghost" size="sm" onClick={() => disconnect()}>
        Use a different wallet
      </Button>
      {error && <Callout tone="danger">{error}</Callout>}
    </div>
  );
}

// A transaction hash that a wallet broadcast but TokenIQ has not recorded yet. Kept
// per proposal and safeTxHash so a failed recording (or a reload) never leads to a
// second submission; the same hash is recorded again instead.
const pendingKey = (proposalId: string) => `tokeniq.pending-execution.${proposalId}`;

function readPending(proposalId: string, safeTxHash: string | null): Hex | null {
  try {
    const v = JSON.parse(localStorage.getItem(pendingKey(proposalId)) ?? "null") as { safeTxHash?: string; txHash?: string } | null;
    return v && safeTxHash && v.safeTxHash === safeTxHash && /^0x[0-9a-fA-F]{64}$/.test(v.txHash ?? "") ? (v.txHash as Hex) : null;
  } catch {
    return null;
  }
}

function writePending(proposalId: string, safeTxHash: string, txHash: Hex | null) {
  try {
    if (txHash) localStorage.setItem(pendingKey(proposalId), JSON.stringify({ safeTxHash, txHash, at: new Date().toISOString() }));
    else localStorage.removeItem(pendingKey(proposalId));
  } catch {
    /* storage unavailable: the hash stays in memory for this page */
  }
}

/** Submit execTransaction with the collected signatures. Any wallet can submit; it pays gas. */
function ExecuteInner({ orgId, p, check, onDone }: { orgId: string; p: ProposalDetail; check: SafeTxCheck | null; onDone: () => void }) {
  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const gate = useChainGate(p.chainId);
  const { toast } = useToast();
  const { chains } = useMetaIndex();
  const [phase, setPhase] = useState<"idle" | "checking" | "wallet" | "recording">("idle");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<Hex | null>(() => readPending(p.id, p.safeTxHash));
  const inFlight = useRef(false);
  const review = check && check.problems.length === 0 ? check.review : null;

  async function record(hash: Hex) {
    setError(null);
    setPhase("recording");
    try {
      await api(orgPath(orgId, `/proposals/${p.id}/executions`), { method: "POST", body: { txHash: hash } });
      writePending(p.id, p.safeTxHash ?? "", null);
      setSent(null);
      toast({ id: `exec-${p.id}`, tone: "info", title: "Submitted, not executed yet", description: "TokenIQ marks the proposal executed only after the receipt, the Safe's ExecutionSuccess event and enough confirmations." });
      onDone();
    } catch (err) {
      toast({ id: `exec-${p.id}`, tone: "warning", title: "Sent, but not recorded in TokenIQ", description: "Record the transaction again from the proposal page. Do not submit it a second time." });
      setError(`TokenIQ couldn't record the transaction: ${err instanceof ApiError ? err.message : "the request failed"}`);
    } finally {
      setPhase("idle");
    }
  }

  async function execute() {
    if (!review || !address || !p.safeTxHash || inFlight.current) return;
    inFlight.current = true;
    setError(null);
    try {
      setPhase("checking");
      const data = await api<{ chainId: number; to: string; data: Hex; value: string; simulation: { gasUsed: string } }>(orgPath(orgId, `/proposals/${p.id}/execution-data`), { method: "POST", body: {} });
      // The calldata must execute exactly the Safe transaction the owners signed, on the reviewed Safe and chain.
      const problems = verifyExecutionData(review, p.safeTx?.threshold ?? 1, data);
      if (problems.length) {
        setError(`Not submitted: ${problems.join(" ")}`);
        return;
      }
      setPhase("wallet");
      await gate.ensure();
      const hash = await sendTransactionAsync({ account: address, to: review.safe, data: data.data, value: 0n, chainId: review.chainId });
      writePending(p.id, p.safeTxHash, hash);
      setSent(hash);
      toast({ id: `exec-${p.id}`, tone: "pending", title: "Transaction sent", description: "Recording it in TokenIQ. This is not success yet." });
      await record(hash);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : walletError(err));
    } finally {
      inFlight.current = false;
      setPhase("idle");
    }
  }

  if (sent) {
    const explorer = explorerTxUrl(chains.get(p.chainId)?.explorer, sent);
    return (
      <div className="space-y-3">
        <Callout tone="warning" title="Transaction sent: do not submit it again">
          <span className="block">Your wallet broadcast this transaction, but TokenIQ has not recorded it yet, so it isn't being tracked.</span>
          <span className="mt-1 block break-all font-mono text-[12px] text-text">{sent}</span>
          {explorer && (
            <a href={explorer} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 text-xs text-accent underline underline-offset-2">
              View on explorer <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          )}
        </Callout>
        <Button onClick={() => record(sent)} loading={phase === "recording"} loadingLabel="Recording transaction">
          Record this transaction
        </Button>
        {error && <Callout tone="danger">{error}</Callout>}
      </div>
    );
  }
  if (!isConnected || !address) return <WalletPicker />;
  if (!review) return <Blocked check={check} />;
  const label = { idle: "Submit transaction", checking: "Re-checking policy and simulating…", wallet: "Confirm in your wallet…", recording: "Recording transaction…" }[phase];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-hairline bg-surface px-3 py-2 text-sm">
        <span className="text-text-2">Submitting from</span>
        <AddressText address={address} full />
      </div>
      <p className="text-[13px] text-text-2">
        Before your wallet opens, TokenIQ re-checks policy, the Safe nonce and owner signatures, simulates the transaction again, and this page checks that it executes exactly the Safe transaction shown above. Once submitted, an on-chain transaction cannot be cancelled from TokenIQ. Submitted is not executed: the proposal is marked executed only after confirmation.
      </p>
      <Button onClick={execute} loading={phase !== "idle"} loadingLabel={label}>
        {label}
      </Button>
      {error && <Callout tone="danger">{error}</Callout>}
    </div>
  );
}

export function SignPanel(props: { orgId: string; p: ProposalDetail; check: SafeTxCheck | null; onDone: () => void }) {
  return (
    <Web3Provider>
      <SignInner {...props} />
    </Web3Provider>
  );
}

export function ExecutePanel(props: { orgId: string; p: ProposalDetail; check: SafeTxCheck | null; onDone: () => void }) {
  return (
    <Web3Provider>
      <ExecuteInner {...props} />
    </Web3Provider>
  );
}
