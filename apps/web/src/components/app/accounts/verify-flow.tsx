"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleCheck, FileSignature, Fuel, Unplug } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { isAddressEqual } from "viem";
import { useConnection, useDisconnect, useSignMessage } from "wagmi";
import { Button } from "@/components/ui/button";
import { AddressText, ChainLabel } from "@/components/ui/identity";
import { Callout, StatusBadge } from "@/components/ui/status";
import { WalletPicker } from "@/components/wallet/wallet-picker";
import { Web3Provider } from "@/components/web3-provider";
import { ApiError, api, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import { dateTimeLabel, shortAddress } from "@/lib/format";
import type { TreasuryAccountDto, VerifyChallengeDto } from "@/lib/types";

type Problem = { tone: "danger" | "warning"; title: string; body: string; restart?: boolean };

function same(a: string, b: string) {
  try {
    return isAddressEqual(a as `0x${string}`, b as `0x${string}`);
  } catch {
    return a.toLowerCase() === b.toLowerCase();
  }
}

function walletError(err: unknown): Problem {
  const e = err as { name?: string; message?: string; shortMessage?: string };
  const msg = `${e?.name ?? ""} ${e?.shortMessage ?? ""} ${e?.message ?? ""}`.toLowerCase();
  if (msg.includes("userrejected") || msg.includes("rejected") || msg.includes("denied") || msg.includes("cancel"))
    return { tone: "warning", title: "You declined the signature request", body: "Nothing was signed and nothing changed. Sign again when you're ready; the message stays valid until it expires." };
  return { tone: "danger", title: "Your wallet couldn't sign the message", body: e?.shortMessage ?? "Try again, or use a different wallet." };
}

function apiProblem(err: unknown): Problem {
  if (!(err instanceof ApiError)) return { tone: "danger", title: "Verification failed", body: (err as Error)?.message ?? "Unknown error" };
  if (err.status === 403) return { tone: "warning", title: "Your role can't verify accounts", body: "Owners, admins, finance members and approvers can verify. Nothing was changed." };
  switch (err.code) {
    case "challenge_invalid":
      return { tone: "warning", title: "This message expired or was already used", body: "Prepare a new message and sign it. Nothing was changed.", restart: true };
    case "not_an_owner":
    case "wrong_signer":
    case "not_a_safe":
      return { tone: "danger", title: "This wallet can't verify the account", body: err.message, restart: true };
    case "bad_signature":
      return { tone: "danger", title: "The signature didn't match", body: `${err.message} Prepare a new message to try again.`, restart: true };
    case "sample_workspace":
      return { tone: "warning", title: "Sample accounts can't be verified", body: err.message };
    default:
      return { tone: "danger", title: "Verification failed", body: err.message, restart: err.status === 409 || err.status === 422 };
  }
}

function useCountdown(expiresAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  if (!expiresAt) return { expired: false, label: "" };
  const left = Math.max(0, Math.floor((Date.parse(expiresAt) - now) / 1000));
  return { expired: left === 0, label: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` };
}

function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Connect a wallet", "Prepare the message", "Sign and submit"];
  return (
    <ol className="flex gap-1.5" aria-label="Verification steps">
      {steps.map((s, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const state = n < current ? "done" : n === current ? "current" : "todo";
        return (
          <li key={s} className="min-w-0 flex-1" aria-current={state === "current" ? "step" : undefined}>
            <div className={cn("h-1 rounded-full", state === "todo" ? "bg-sunken" : "bg-accent")} aria-hidden="true" />
            <div className={cn("mt-1.5 truncate text-[11px]", state === "current" ? "font-medium text-text" : "text-text-3")}>
              {n}. {s}
              <span className="sr-only">{state === "done" ? " (done)" : state === "current" ? " (current)" : ""}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Inner({ orgId, account, explorerBase, onDone }: { orgId: string; account: TreasuryAccountDto; explorerBase: string | null; onDone: () => void }) {
  const qc = useQueryClient();
  const { address, isConnected, chain, connector } = useConnection();
  const disconnect = useDisconnect();
  const sign = useSignMessage();
  const [challenge, setChallenge] = useState<VerifyChallengeDto | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [verified, setVerified] = useState<TreasuryAccountDto | null>(null);
  const [force, setForce] = useState(false);
  const countdown = useCountdown(challenge?.expiresAt ?? null);
  const signerRef = useRef<string | null>(null);

  // A challenge is bound to one signer: switching wallets invalidates it.
  useEffect(() => {
    if (signerRef.current && address && !same(signerRef.current, address)) {
      setChallenge(null);
      setProblem(null);
      setForce(false);
    }
    signerRef.current = address ?? null;
  }, [address]);

  const owners = account.safe?.owners ?? [];
  const eligibility = useMemo(() => {
    if (!address) return null;
    if (account.kind === "safe") return owners.some((o) => same(o, address)) ? "owner" : "not_owner";
    return same(account.address, address) ? "self" : "wrong_wallet";
  }, [address, account.kind, account.address, owners]);

  const request = useMutation({
    mutationFn: () => api<VerifyChallengeDto>(orgPath(orgId, `/accounts/${account.id}/verify/challenge`), { method: "POST", body: { signer: address } }),
    onMutate: () => setProblem(null),
    onSuccess: (c) => setChallenge(c),
    onError: (e) => setProblem(apiProblem(e)),
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!challenge || !address) throw new Error("No message to sign");
      let signature: `0x${string}`;
      try {
        signature = await sign.mutateAsync({ message: challenge.message, account: address });
      } catch (e) {
        throw Object.assign(new Error("wallet"), { wallet: e });
      }
      return api<{ account: TreasuryAccountDto }>(orgPath(orgId, `/accounts/${account.id}/verify`), { method: "POST", body: { challengeId: challenge.challengeId, signature } });
    },
    onMutate: () => setProblem(null),
    onSuccess: ({ account: a }) => {
      setVerified(a);
      setChallenge(null);
      qc.invalidateQueries({ queryKey: ["org", orgId, "/accounts"] });
      qc.invalidateQueries({ queryKey: ["org", orgId, "/treasury"] });
    },
    onError: (e) => {
      const w = (e as { wallet?: unknown }).wallet;
      const p = w !== undefined ? walletError(w) : apiProblem(e);
      setProblem(p);
      if (p.restart) setChallenge(null);
    },
  });

  if (verified) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-start gap-2 rounded-[var(--radius-card)] border border-success/30 bg-success-subtle/40 p-4" role="status">
          <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
          <div className="text-[15px] font-semibold text-text">{verified.label} is verified</div>
          <p className="text-sm text-text-2">
            Control was proven by <span className="font-mono">{shortAddress(verified.verificationSigner ?? address ?? "")}</span>
            {verified.verifiedAt ? ` on ${dateTimeLabel(verified.verifiedAt)}` : ""}. Its balances now count toward reserve and deployable maths
            {verified.includeInTreasury ? "" : " once you include it in the treasury"}.
          </p>
          {account.kind === "safe" && <p className="text-xs text-text-3">If this signer is later removed as an owner, TokenIQ revokes the verification on the next sync.</p>}
        </div>
        <Button onClick={onDone}>Done</Button>
      </div>
    );
  }

  const step: 1 | 2 | 3 = !isConnected ? 1 : challenge ? 3 : 2;
  const canRequest = eligibility === "owner" || eligibility === "self" || force;

  return (
    <div className="space-y-5">
      <Steps current={step} />

      <ul className="space-y-1.5 text-[13px] text-text-2">
        <li className="flex gap-2">
          <FileSignature className="mt-0.5 size-4 shrink-0 text-text-3" aria-hidden="true" />
          Signing a message proves {account.kind === "safe" ? "an owner of this Safe" : "the holder of this wallet"} is part of your organization.
        </li>
        <li className="flex gap-2">
          <Fuel className="mt-0.5 size-4 shrink-0 text-text-3" aria-hidden="true" />
          It happens off-chain: no transaction, no gas, and it authorizes nothing. The network your wallet is on doesn't matter.
        </li>
      </ul>

      {!isConnected ? (
        <section aria-labelledby="connect-heading" className="space-y-2">
          <h3 id="connect-heading" className="text-[13px] font-medium text-text">
            {account.kind === "safe" ? "Connect a wallet that is an owner of this Safe" : `Connect the wallet ${shortAddress(account.address)}`}
          </h3>
          <WalletPicker />
          <p className="text-xs text-text-3">Smart-contract wallets work too: TokenIQ checks their signature on-chain (EIP-1271).</p>
        </section>
      ) : (
        <section aria-labelledby="connected-heading" className="space-y-3">
          <h3 id="connected-heading" className="sr-only">
            Connected wallet
          </h3>
          <div className="rounded-[var(--radius-control)] border border-hairline bg-surface px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-text-2">Connected{connector?.name ? ` with ${connector.name}` : ""}</span>
              <Button variant="ghost" size="sm" onClick={() => disconnect.mutate()} className="-mr-2 h-7">
                <Unplug className="size-3.5" aria-hidden="true" /> Use a different wallet
              </Button>
            </div>
            {address && <AddressText address={address} full className="mt-1 text-[13px] text-text" />}
            {chain && (
              <div className="mt-1 text-xs text-text-3">
                Wallet network: <ChainLabel chainId={chain.id} name={chain.name} className="text-text-3" /> (doesn&apos;t matter for signing)
              </div>
            )}
          </div>

          {account.kind === "safe" && (
            <div>
              <div className="text-xs font-medium text-text-2">
                Safe owners ({account.safe?.threshold ?? "?"} of {owners.length} must sign transactions; one owner is enough to verify)
              </div>
              <ul className="mt-1.5 divide-y divide-hairline rounded-[var(--radius-control)] border border-hairline" aria-label="Safe owners">
                {owners.map((o) => {
                  const you = !!address && same(o, address);
                  return (
                    <li key={o} className={cn("flex items-center justify-between gap-2 px-3 py-1.5", you && "bg-accent-subtle/50")}>
                      <AddressText address={o} explorer={explorerBase ? `${explorerBase}/address/${o}` : null} />
                      {you && (
                        <StatusBadge tone="success" icon={CircleCheck}>
                          Connected
                        </StatusBadge>
                      )}
                    </li>
                  );
                })}
                {owners.length === 0 && <li className="px-3 py-2 text-xs text-text-3">TokenIQ hasn&apos;t read the owners yet. Sync the account first.</li>}
              </ul>
            </div>
          )}

          {eligibility === "owner" && !challenge && <Callout tone="success">The connected wallet is a current owner of this Safe, so it can verify it.</Callout>}
          {eligibility === "self" && !challenge && <Callout tone="success">This is the wallet you added, so it can verify it.</Callout>}
          {eligibility === "not_owner" && (
            <Callout tone="warning" title="The connected wallet isn't an owner of this Safe">
              Connect one of the owners listed above. If an owner was added recently, TokenIQ re-reads the owners when you continue.
              {!force && (
                <Button variant="link" size="sm" className="ml-1 h-auto text-[13px]" onClick={() => setForce(true)}>
                  Check on-chain anyway
                </Button>
              )}
            </Callout>
          )}
          {eligibility === "wrong_wallet" && (
            <Callout tone="warning" title="This isn't the wallet you added">
              Only {shortAddress(account.address)} can prove control of itself. Switch accounts in your wallet or connect another wallet.
            </Callout>
          )}

          {!challenge ? (
            <Button onClick={() => request.mutate()} loading={request.isPending} loadingLabel="Preparing message" disabled={!canRequest}>
              Prepare message to sign
            </Button>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[13px] font-medium text-text">The exact message your wallet will show</h3>
                  <span className={cn("num text-xs", countdown.expired ? "font-medium text-danger" : "text-text-3")} aria-live="off">
                    {countdown.expired ? "Expired" : `Expires in ${countdown.label}`}
                  </span>
                </div>
                <pre tabIndex={0} aria-label="Message to sign" className="mt-1.5 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-[var(--radius-control)] border border-hairline bg-sunken p-3 font-mono text-[11.5px] leading-[1.55] text-text">
                  {challenge.message}
                </pre>
                <p className="mt-1.5 text-xs text-text-3">Check that the address and organization match before you sign. It can be used once.</p>
              </div>
              {countdown.expired ? (
                <Button onClick={() => request.mutate()} loading={request.isPending} loadingLabel="Preparing message">
                  Prepare a new message
                </Button>
              ) : (
                <Button onClick={() => submit.mutate()} loading={submit.isPending} loadingLabel={sign.isPending ? "Waiting for your wallet" : "Checking signature"}>
                  {submit.isPending ? (sign.isPending ? "Waiting for your wallet…" : "Checking signature…") : "Sign in wallet"}
                </Button>
              )}
            </div>
          )}
        </section>
      )}

      {problem && (
        <Callout tone={problem.tone} title={problem.title}>
          {problem.body}
        </Callout>
      )}
    </div>
  );
}

/** Connect a wallet, sign the challenge, submit. Loads wallet code only when mounted. */
export function VerifyFlow(props: { orgId: string; account: TreasuryAccountDto; explorerBase: string | null; onDone: () => void }) {
  if (props.account.verificationMethod === "sample") {
    return (
      <Callout tone="neutral" title="Sample accounts can't be verified">
        This account belongs to a sample workspace with simulated balances. Add a real account to verify it.
      </Callout>
    );
  }
  return (
    <Web3Provider>
      <Inner {...props} />
    </Web3Provider>
  );
}

