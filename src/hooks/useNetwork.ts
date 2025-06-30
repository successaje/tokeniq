import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN, isFeatureSupported } from '@/utils/networks';

export function useNetwork() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const router = useRouter();

  // Get the current chain from supported chains
  const activeChain = SUPPORTED_CHAINS.find(c => c.id === chainId) || null;
  
  // Check if the current chain is supported
  const isSupported = activeChain !== null;

  // Get the current chain or default to the first supported chain
  const chain = activeChain || DEFAULT_CHAIN;

  // Check if a feature is available on the current chain
  const isFeatureAvailable = (feature: string): boolean => {
    return isFeatureSupported(feature, chainId);
  };

  // Get the correct chain ID for a specific feature
  const getChainForFeature = (feature: string) => {
    const supportedChains = SUPPORTED_CHAINS.filter((c) =>
      isFeatureSupported(feature, c.id)
    );
    return supportedChains[0]?.id || DEFAULT_CHAIN.id;
  };

  // Handle chain switching
  const switchToChain = (chainId: number) => {
    if (switchChain) {
      switchChain({ chainId });
    }
  };

  // Show warning if connected to an unsupported chain
  useEffect(() => {
    if (isConnected && !isSupported && activeChain) {
      console.warn(`Chain ID ${chainId} is not supported`);
      // Optionally redirect or show a notification
    }
  }, [isConnected, isSupported, chainId, activeChain, router]);

  return {
    chain,
    chainId,
    isSupported,
    isConnected,
    isFeatureAvailable,
    getChainForFeature,
    switchChain: switchToChain,
    supportedChains: SUPPORTED_CHAINS,
  };
}
