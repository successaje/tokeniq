"use client";

import { Wallet } from "lucide-react";
import { useConnect, useConnectors, type Connector } from "wagmi";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/status";
import { walletConnectEnabled } from "@/lib/wagmi";

function describeError(err: Error | null): string | null {
  if (!err) return null;
  const msg = err.message.toLowerCase();
  if (msg.includes("rejected") || msg.includes("denied")) return "The connection request was rejected in your wallet.";
  if (msg.includes("already pending")) return "A connection request is already open in your wallet. Check the extension.";
  if (msg.includes("provider not found") || msg.includes("not installed")) return "That wallet isn't available in this browser.";
  return "We couldn't connect to that wallet. Try again or choose another.";
}

/** Lists wallets actually available in this browser (EIP-6963) plus WalletConnect when configured. */
export function WalletPicker({ onConnected }: { onConnected?: (c: Connector) => void }) {
  const connectors = useConnectors();
  const { connect, isPending, variables, error } = useConnect();
  // Hide the generic injected entry when specific EIP-6963 wallets were discovered.
  const discovered = connectors.filter((c) => c.type === "injected" && c.id !== "injected");
  const generic = connectors.filter((c) => c.id === "injected");
  const others = connectors.filter((c) => c.type === "walletConnect" || c.type === "safe");
  const list = [...(discovered.length ? discovered : generic), ...others];
  const hasInjected = discovered.length > 0 || (typeof window !== "undefined" && "ethereum" in window);
  return (
    <div className="space-y-2">
      {list.map((c) => (
        <Button
          key={c.uid}
          variant="secondary"
          size="lg"
          className="w-full justify-start"
          loading={isPending && variables?.connector === c}
          onClick={() => connect({ connector: c }, { onSuccess: () => onConnected?.(c) })}
        >
          {c.icon ? <img src={c.icon} alt="" className="size-5 rounded" /> : <Wallet className="size-4" aria-hidden="true" />}
          {c.id === "injected" ? "Browser wallet" : c.name}
          {c.type === "safe" && <span className="ml-auto text-xs text-text-3">Inside Safe&#123;Wallet&#125;</span>}
        </Button>
      ))}
      {!hasInjected && !walletConnectEnabled && <Callout tone="info">No wallet extension was detected in this browser. Install one such as Rabby or MetaMask, then reload this page.</Callout>}
      {describeError(error) && <Callout tone="danger">{describeError(error)}</Callout>}
    </div>
  );
}
