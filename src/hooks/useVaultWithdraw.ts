import { useState, useCallback } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { useVaults } from './useVaults';

type UseVaultWithdrawProps = {
  vaultAddress?: Address;
};

type WithdrawState = {
  isWithdrawing: boolean;
  error: Error | null;
  txHash: `0x${string}` | null;
};

export function useVaultWithdraw({ vaultAddress }: UseVaultWithdrawProps = {}) {
  const { address } = useAccount();
  const { withdrawFromVault, getVault, getUserVaultBalance } = useVaults();
  
  const [state, setState] = useState<WithdrawState>({
    isWithdrawing: false,
    error: null,
    txHash: null,
  });

  // Handle withdrawal from vault
  const withdraw = useCallback(async (amount: bigint) => {
    if (!vaultAddress) {
      throw new Error('Vault address is required for withdrawal');
    }
    
    if (!address) {
      throw new Error('Wallet not connected');
    }
    
    if (amount <= 0n) {
      throw new Error('Withdrawal amount must be greater than 0');
    }
    
    try {
      setState(prev => ({ ...prev, isWithdrawing: true, error: null, txHash: null }));
      
      // Check user's balance in the vault
      const userBalance = await getUserVaultBalance(vaultAddress);
      if (userBalance < amount) {
        throw new Error('Insufficient balance for withdrawal');
      }
      
      // Execute the withdrawal
      const success = await withdrawFromVault(vaultAddress, amount);
      
      if (!success) {
        throw new Error('Withdrawal transaction failed');
      }
      
      // Refresh the vault data
      await getVault(vaultAddress);
      
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to withdraw from vault');
      setState(prev => ({
        ...prev,
        error: err,
      }));
      throw err;
    } finally {
      setState(prev => ({
        ...prev,
        isWithdrawing: false,
      }));
    }
  }, [vaultAddress, address, withdrawFromVault, getVault, getUserVaultBalance]);

  return {
    // Withdraw state
    isWithdrawing: state.isWithdrawing,
    withdraw,
    error: state.error,
    txHash: state.txHash,
    
    // Reset function
    reset: () => {
      setState({
        isWithdrawing: false,
        error: null,
        txHash: null,
      });
    },
  };
}
