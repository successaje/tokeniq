"use client";

import { useState } from "react";
import { getAddress, isAddressEqual, type Hex } from "viem";
import { useAccount, useDisconnect, useSendTransaction, useSignTypedData, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { AddressText } from "@/components/ui/identity";
import { Callout } from "@/components/ui/status";
import { useToast } from "@/components/ui/toast";
import { WalletPicker } from "@/components/wallet/wallet-picker";
import { Web3Provider } from "@/components/web3-provider";
import { api, ApiError, orgPath } from "@/lib/api";
import type { ProposalDetail } from "@/lib/types";

const UINT_FIELDS = new Set(["value", "safeTxGas", "baseGas", "gasPrice", "nonce"]);

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

/** Sign the prepared Safe transaction (EIP-712) with an owner wallet. Keys never leave the wallet. */
function SignInner({ orgId, p, onDone }: { orgId: string; p: ProposalDetail; onDone: () => void }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signTypedDataAsync, isPending } = useSignTypedData();
  const gate = useChainGate(p.chainId);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!isConnected || !address) return <WalletPicker />;
  const owners = p.safeTx?.owners ?? [];
  const isOwner = owners.some((o) => isAddressEqual(o as Hex, address));
  const alreadySigned = p.signatures.some((s) => isAddressEqual(s.signer as Hex, address));

  async function sign() {
    if (!p.safeTx) return;
    setError(null);
    setBusy(true);
    try {
      const td = p.safeTx.typedData;
      const message = Object.fromEntries(Object.entries(td.message).map(([k, v]) => [k, UINT_FIELDS.has(k) ? BigInt(v) : k === "operation" ? Number(v) : v]));
      const params = {
        domain: { chainId: Number(td.domain.chainId), verifyingContract: getAddress(td.domain.verifyingContract) },
        types: td.types,
        primaryType: td.primaryType,
        message,
      } as unknown as Parameters<typeof signTypedDataAsync>[0];
      const signature = await signTypedDataAsync(params);
      const res = await api<{ signatures: number; threshold: number; ready: boolean }>(orgPath(orgId, `/proposals/${p.id}/signatures`), { method: "POST", body: { signature } });
      toast({ id: `sig-${p.id}`, tone: "success", title: "Signature recorded", description: `${res.signatures} of ${res.threshold} owner signatures collected.${res.ready ? " Ready to execute." : ""}` });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : walletError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-hairline bg-surface px-3 py-2 text-sm">
        <span className="text-text-2">Connected wallet</span>
        <AddressText address={address} />
      </div>
      {!isOwner && <Callout tone="warning">This wallet is not an owner of the Safe. Connect an owner wallet to sign.</Callout>}
      {alreadySigned && <Callout tone="success">This wallet has already signed this transaction.</Callout>}
      {isOwner && !alreadySigned && (
        <>
          <p className="text-[13px] text-text-2">
            Your wallet will show the Safe transaction (EIP-712). Check that the Safe address, nonce and data match what is shown above before signing. Signing does not submit anything on-chain.
          </p>
          {gate.wrongChain ? (
            <Button onClick={gate.ensure} loading={gate.switching} variant="secondary">
              Switch wallet network
            </Button>
          ) : (
            <Button onClick={sign} loading={busy || isPending} loadingLabel="Waiting for your signature">
              Sign as Safe owner
            </Button>
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

/** Submit execTransaction with the collected signatures. Any wallet can submit; it pays gas. */
function ExecuteInner({ orgId, p, onDone }: { orgId: string; p: ProposalDetail; onDone: () => void }) {
  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const gate = useChainGate(p.chainId);
  const { toast } = useToast();
  const [phase, setPhase] = useState<"idle" | "checking" | "wallet" | "recording">("idle");
  const [error, setError] = useState<string | null>(null);
  if (!isConnected || !address) return <WalletPicker />;

  async function execute() {
    setError(null);
    try {
      setPhase("checking");
      const data = await api<{ chainId: number; to: string; data: Hex; value: string; simulation: { gasUsed: string } }>(orgPath(orgId, `/proposals/${p.id}/execution-data`), { method: "POST", body: {} });
      setPhase("wallet");
      await gate.ensure();
      const hash = await sendTransactionAsync({ to: getAddress(data.to), data: data.data, value: 0n, chainId: data.chainId });
      setPhase("recording");
      toast({ id: `exec-${p.id}`, tone: "pending", title: "Transaction submitted", description: "Waiting for confirmation on-chain. This is not success yet." });
      await api(orgPath(orgId, `/proposals/${p.id}/executions`), { method: "POST", body: { txHash: hash } });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : walletError(err));
    } finally {
      setPhase("idle");
    }
  }
  const label = { idle: "Submit transaction", checking: "Re-checking policy and simulating…", wallet: "Confirm in your wallet…", recording: "Recording transaction…" }[phase];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-hairline bg-surface px-3 py-2 text-sm">
        <span className="text-text-2">Submitting from</span>
        <AddressText address={address} />
      </div>
      <p className="text-[13px] text-text-2">Before your wallet opens, TokenIQ re-checks policy, the Safe nonce and owner signatures, and simulates the transaction again. Once submitted, an on-chain transaction cannot be cancelled from TokenIQ.</p>
      <Button onClick={execute} loading={phase !== "idle"} loadingLabel={label}>
        {label}
      </Button>
      {error && <Callout tone="danger">{error}</Callout>}
    </div>
  );
}

export function SignPanel(props: { orgId: string; p: ProposalDetail; onDone: () => void }) {
  return (
    <Web3Provider>
      <SignInner {...props} />
    </Web3Provider>
  );
}

export function ExecutePanel(props: { orgId: string; p: ProposalDetail; onDone: () => void }) {
  return (
    <Web3Provider>
      <ExecuteInner {...props} />
    </Web3Provider>
  );
}
