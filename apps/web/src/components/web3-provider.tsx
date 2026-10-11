"use client";

import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";

/** Wallet context for the parts of the product that sign. Marketing pages never load it. */
export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      {children}
    </WagmiProvider>
  );
}
