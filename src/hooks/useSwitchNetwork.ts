import { useCallback } from 'react';
import { Chain, ChainId } from '@/config/contracts';
import { useNetwork, useSwitchNetwork as useWagmiSwitchNetwork } from 'wagmi';
import { CHAINS } from '@/config/contracts';

export function useSwitchNetwork() {
  const { chain: activeChain } = useNetwork();
  const { switchNetwork: switchWagmiNetwork, error, isLoading } = useWagmiSwitchNetwork();

  /**
   * Switch to a specific chain by ID
   */
  const switchNetwork = useCallback(async (chainId: ChainId) => {
    if (!switchWagmiNetwork) {
      console.error('Cannot switch network: No provider available');
      return false;
    }

    // If already on the requested chain, no need to switch
    if (activeChain?.id === chainId) {
      return true;
    }

    try {
      // Check if the chain is supported
      if (!CHAINS[chainId]) {
        console.error(`Chain ${chainId} is not supported`);
        return false;
      }

      // Switch network
      const result = switchWagmiNetwork(chainId);
      
      // If the switch returns a promise, wait for it
      if (result instanceof Promise) {
        await result;
      }
      
      return true;
    } catch (err) {
      console.error(`Failed to switch to chain ${chainId}:`, err);
      return false;
    }
  }, [activeChain?.id, switchWagmiNetwork]);

  /**
   * Switch to a specific chain by Chain object
   */
  const switchToNetwork = useCallback(async (chain: Chain) => {
    return switchNetwork(chain.id as ChainId);
  }, [switchNetwork]);

  /**
   * Get the current chain ID
   */
  const getCurrentChainId = useCallback((): ChainId | undefined => {
    return activeChain?.id as ChainId | undefined;
  }, [activeChain?.id]);

  /**
   * Check if the current chain matches the given chain ID
   */
  const isOnChain = useCallback((chainId: ChainId): boolean => {
    return activeChain?.id === chainId;
  }, [activeChain?.id]);

  return {
    // Current state
    currentChain: activeChain,
    currentChainId: activeChain?.id as ChainId | undefined,
    isSwitching: isLoading,
    error,
    
    // Actions
    switchNetwork,
    switchToNetwork,
    getCurrentChainId,
    isOnChain,
    
    // Chain information
    supportedChains: Object.values(CHAINS),
    getChain: (chainId: ChainId): Chain | undefined => CHAINS[chainId],
  };
}
