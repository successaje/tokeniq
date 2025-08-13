import { createPublicClient, http } from 'viem';
import { coreTestnet2 } from './chains';

// Create a public client for the Core Testnet
export const publicClient = createPublicClient({
  chain: coreTestnet2,
  transport: http(),
});

export * from 'viem';
