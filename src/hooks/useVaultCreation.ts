import { useState, useCallback } from 'react';
import { Address } from 'viem';
import { VaultType } from '@/types/contracts';
import { useVaults } from './useVaults';

type UseVaultCreationProps = {
  onSuccess?: (vaultAddress: Address) => void;
  onError?: (error: Error) => void;
};

type VaultCreationState = {
  isCreating: boolean;
  error: Error | null;
  txHash: `0x${string}` | null;
  vaultAddress: Address | null;
};

export function useVaultCreation({ 
  onSuccess,
  onError,
}: UseVaultCreationProps = {}) {
  const { createVault } = useVaults();
  
  const [state, setState] = useState<VaultCreationState>({
    isCreating: false,
    error: null,
    txHash: null,
    vaultAddress: null,
  });

  // Create a new vault
  const createNewVault = useCallback(async (
    vaultType: VaultType,
    name: string,
    symbol: string,
    asset: Address,
  ) => {
    try {
      setState(prev => ({
        ...prev,
        isCreating: true,
        error: null,
        txHash: null,
        vaultAddress: null,
      }));
      
      // Validate inputs
      if (!name.trim()) {
        throw new Error('Vault name is required');
      }
      
      if (!symbol.trim()) {
        throw new Error('Vault symbol is required');
      }
      
      if (!asset) {
        throw new Error('Asset address is required');
      }
      
      // Execute the vault creation
      const vaultAddress = await createVault({
        vaultType,
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        asset,
      });
      
      if (!vaultAddress) {
        throw new Error('Failed to create vault: No address returned');
      }
      
      // Update state
      setState(prev => ({
        ...prev,
        vaultAddress,
      }));
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(vaultAddress);
      }
      
      return vaultAddress;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create vault');
      
      setState(prev => ({
        ...prev,
        error: err,
      }));
      
      // Call error callback if provided
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setState(prev => ({
        ...prev,
        isCreating: false,
      }));
    }
  }, [createVault, onSuccess, onError]);

  // Reset the hook state
  const reset = useCallback(() => {
    setState({
      isCreating: false,
      error: null,
      txHash: null,
      vaultAddress: null,
    });
  }, []);

  return {
    // State
    isCreating: state.isCreating,
    error: state.error,
    txHash: state.txHash,
    vaultAddress: state.vaultAddress,
    
    // Actions
    createVault: createNewVault,
    reset,
  };
}
