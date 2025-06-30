import { useState, useCallback } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { useVaults } from './useVaults';
import { useTokenApproval } from './useTokenApproval';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

type UseVaultDepositProps = {
  vaultAddress?: Address;
  tokenAddress?: Address;
};

type DepositState = {
  isDepositing: boolean;
  isApproving: boolean;
  isApproved: boolean;
  error: Error | null;
  txHash: `0x${string}` | null;
};

export function useVaultDeposit({
  vaultAddress,
  tokenAddress,
}: UseVaultDepositProps = {}) {
  const { address } = useAccount();
  const { depositToVault, getVault } = useVaults();
  
  const [state, setState] = useState<DepositState>({
    isDepositing: false,
    isApproving: false,
    isApproved: false,
    error: null,
    txHash: null,
  });

  // Set up token approval for the vault manager
  const {
    isApproved,
    isApproving,
    allowance,
    balance,
    decimals,
    needsApproval,
    approve,
    checkApproval,
    error: approvalError,
  } = useTokenApproval({
    tokenAddress: tokenAddress,
    spender: CONTRACT_ADDRESSES.vaultManager,
  });

  // Handle token approval
  const handleApprove = useCallback(async () => {
    if (!tokenAddress) {
      throw new Error('Token address is required for approval');
    }
    
    try {
      setState(prev => ({ ...prev, isApproving: true, error: null }));
      await approve();
      setState(prev => ({ ...prev, isApproved: true }));
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to approve token');
      setState(prev => ({
        ...prev,
        error: err,
      }));
      throw err;
    } finally {
      setState(prev => ({
        ...prev,
        isApproving: false,
      }));
    }
  }, [approve, tokenAddress]);

  // Handle deposit into vault
  const deposit = useCallback(async (amount: bigint) => {
    if (!vaultAddress) {
      throw new Error('Vault address is required for deposit');
    }
    
    if (!address) {
      throw new Error('Wallet not connected');
    }
    
    if (amount <= 0n) {
      throw new Error('Deposit amount must be greater than 0');
    }
    
    try {
      setState(prev => ({ ...prev, isDepositing: true, error: null, txHash: null }));
      
      // Execute the deposit
      const success = await depositToVault(vaultAddress, amount);
      
      if (!success) {
        throw new Error('Deposit transaction failed');
      }
      
      // Get the vault to refresh the balance
      await getVault(vaultAddress);
      
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to deposit into vault');
      setState(prev => ({
        ...prev,
        error: err,
      }));
      throw err;
    } finally {
      setState(prev => ({
        ...prev,
        isDepositing: false,
      }));
    }
  }, [vaultAddress, address, depositToVault, getVault]);

  // Combined state for the hook
  return {
    // Approval state
    isApproved,
    isApproving,
    allowance,
    balance,
    needsApproval,
    approve: handleApprove,
    checkApproval,
    approvalError,
    
    // Deposit state
    isDepositing: state.isDepositing,
    deposit,
    error: state.error || approvalError,
    txHash: state.txHash,
    
    // Combined loading state
    isLoading: state.isDepositing || isApproving,
    
    // Reset function
    reset: () => {
      setState({
        isDepositing: false,
        isApproving: false,
        isApproved: false,
        error: null,
        txHash: null,
      });
    },
  };
}
