"use client";

import { useState } from "react";
import { createSiweMessage } from "viem/siwe";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { Button } from "@/components/ui/button";
import { AddressText } from "@/components/ui/identity";
import { Callout } from "@/components/ui/status";
import { WalletPicker } from "@/components/wallet/wallet-picker";
import { Web3Provider } from "@/components/web3-provider";
import { authClient } from "@/lib/auth-client";

function Inner({ onSignedIn }: { onSignedIn: () => void }) {
  const { address, chainId, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [phase, setPhase] = useState<"idle" | "nonce" | "sign" | "verify">("idle");
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    if (!address || !chainId) return;
    setError(null);
    try {
      setPhase("nonce");
      const n = await authClient.siwe.nonce();
      if (n.error || !n.data) throw new Error("nonce");
      const message = createSiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to TokenIQ. This request will not trigger a blockchain transaction or cost any gas.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce: n.data.nonce,
        issuedAt: new Date(),
        expirationTime: new Date(Date.now() + 10 * 60 * 1000),
      });
      setPhase("sign");
      const signature = await signMessageAsync({ message });
      setPhase("verify");
      const v = await authClient.siwe.verify({ message, signature });
      if (v.error) throw new Error(v.error.message ?? "verify");
      onSignedIn();
    } catch (e) {
      const msg = (e as Error).message?.toLowerCase() ?? "";
      setError(msg.includes("rejected") || msg.includes("denied") ? "You declined the signature request. Nothing was signed." : "Sign-in failed. The message may have expired; try again.");
      setPhase("idle");
    }
  }

  if (!isConnected) return <WalletPicker />;
  const label = { idle: "Sign message to continue", nonce: "Preparing message…", sign: "Waiting for your signature…", verify: "Verifying signature…" }[phase];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-[var(--radius-control)] border border-hairline bg-surface px-3 py-2 text-sm">
        <span className="text-text-2">Connected</span>
        {address && <AddressText address={address} />}
      </div>
      <Button size="lg" className="w-full justify-center" loading={phase !== "idle"} loadingLabel={label} onClick={signIn}>
        {label}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => disconnect()}>
        Use a different wallet
      </Button>
      {error && <Callout tone="danger">{error}</Callout>}
    </div>
  );
}

export function WalletSignIn({ onSignedIn }: { onSignedIn: () => void }) {
  return (
    <Web3Provider>
      <Inner onSignedIn={onSignedIn} />
    </Web3Provider>
  );
}
