import { useCallback } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { VaultInfo, VaultType } from '@/types/contracts';
import { useContracts } from '@/contexts/ContractContext';

export function useVaults() {
  const { address } = useAccount();
  const {
    contracts,
    userVaults,
    allVaults,
    loading,
    error,
    refreshVaults,
    createVault: createVaultContext,
    depositToVault: depositToVaultContext,
    withdrawFromVault: withdrawFromVaultContext,
  } = useContracts();

  // Get vault by address
  const getVault = useCallback((vaultAddress: Address) => {
    return allVaults.find(vault => vault.address.toLowerCase() === vaultAddress.toLowerCase());
  }, [allVaults]);

  // Create a new vault
  const createVault = useCallback(async ({
    vaultType,
    name,
    symbol,
    asset,
  }: {
    vaultType: VaultType;
    name: string;
    symbol: string;
    asset: Address;
  }) => {
    if (!createVaultContext) {
      throw new Error('Contract context not available');
    }
    
    return createVaultContext({
      vaultType,
      name,
      symbol,
      asset,
    });
  }, [createVaultContext]);

  // Deposit to vault
  const depositToVault = useCallback(async (vaultAddress: Address, amount: bigint) => {
    if (!depositToVaultContext) {
      throw new Error('Contract context not available');
    }
    
    return depositToVaultContext(vaultAddress, amount);
  }, [depositToVaultContext]);

  // Withdraw from vault
  const withdrawFromVault = useCallback(async (vaultAddress: Address, amount: bigint) => {
    if (!withdrawFromVaultContext) {
      throw new Error('Contract context not available');
    }
    
    return withdrawFromVaultContext(vaultAddress, amount);
  }, [withdrawFromVaultContext]);

  // Get user's balance in a specific vault
  const getUserVaultBalance = useCallback(async (vaultAddress: Address): Promise<bigint> => {
    if (!contracts?.vaultManager?.read?.balanceOf || !address) return BigInt(0);
    
    try {
      const balance = await contracts.vaultManager.read.balanceOf([vaultAddress, address]);
      return typeof balance === 'bigint' ? balance : BigInt(0);
    } catch (error) {
      console.error('Failed to get user vault balance:', error);
      return BigInt(0);
    }
  }, [contracts?.vaultManager?.read, address]);

  // Get vault APY (simplified - implement actual APY calculation)
  const getVaultApy = useCallback(async (vaultAddress: Address): Promise<number> => {
    // Implement actual APY calculation based on your protocol
    // This is a placeholder
    return 5.25; // 5.25% APY
  }, []);

  return {
    // State
    userVaults,
    allVaults,
    loading,
    error,
    
    // Actions
    refreshVaults,
    getVault,
    createVault,
    depositToVault,
    withdrawFromVault,
    getUserVaultBalance,
    getVaultApy,
  };
}

// Hook for a specific vault
export function useVault(vaultAddress?: Address) {
  const { getVault, ...rest } = useVaults();
  const vault = vaultAddress ? getVault(vaultAddress) : null;
  
  return {
    vault,
    ...rest,
  };
}
