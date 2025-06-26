import { useState, useCallback, useEffect } from 'react';
import { Address, parseEther, formatEther, parseUnits } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { useVaults } from './useVaults';
import { useTokenApproval } from './useTokenApproval';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

type TransactionStatus = 'idle' | 'approving' | 'pending' | 'confirming' | 'completed' | 'failed';

type Transaction = {
  type: 'deposit' | 'withdraw' | 'approve';
  status: TransactionStatus;
  amount: string;
  tokenSymbol: string;
  tokenDecimals: number;
  txHash?: `0x${string}`;
  error?: string;
  timestamp: number;
};

type UseVaultTransactionsProps = {
  vaultAddress?: Address;
  tokenAddress?: Address;
  tokenSymbol?: string;
  tokenDecimals?: number;
};

export function useVaultTransactions({
  vaultAddress,
  tokenAddress,
  tokenSymbol = 'TOKEN',
  tokenDecimals = 18,
}: UseVaultTransactionsProps = {}) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const { depositToVault, withdrawFromVault, getVault } = useVaults();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Set up token approval
  const {
    isApproved,
    isApproving,
    allowance,
    balance,
    needsApproval,
    approve: approveToken,
    checkApproval,
    error: approvalError,
  } = useTokenApproval({
    tokenAddress,
    spender: CONTRACT_ADDRESSES.vaultManager,
  });

  // Update transaction state
  const updateTransaction = useCallback((updates: Partial<Transaction>) => {
    setTransaction(prev => ({
      ...(prev || {
        type: 'deposit',
        status: 'idle',
        amount: '0',
        tokenSymbol,
        tokenDecimals,
        timestamp: Date.now(),
      }),
      ...updates,
    }));
  }, [tokenSymbol, tokenDecimals]);

  // Handle token approval
  const approve = useCallback(async (amount: string) => {
    if (!tokenAddress) {
      throw new Error('Token address is required for approval');
    }
    
    try {
      setIsLoading(true);
      updateTransaction({
        type: 'approve',
        status: 'approving',
        amount,
      });
      
      await approveToken();
      
      updateTransaction({
        status: 'completed',
      });
      
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to approve token');
      console.error('Approval error:', error);
      
      updateTransaction({
        status: 'failed',
        error: error.message,
      });
      
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, approveToken, updateTransaction]);

  // Handle deposit
  const deposit = useCallback(async (amount: string) => {
    if (!vaultAddress) {
      throw new Error('Vault address is required for deposit');
    }
    
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Parse the amount to BigInt with correct decimals
      const amountWei = parseUnits(amount, tokenDecimals);
      
      // Update transaction state
      updateTransaction({
        type: 'deposit',
        status: 'pending',
        amount,
      });
      
      // Execute deposit
      const success = await depositToVault(vaultAddress, amountWei);
      
      if (!success) {
        throw new Error('Deposit transaction failed');
      }
      
      // Update transaction state to completed
      updateTransaction({
        status: 'completed',
      });
      
      // Refresh vault data
      await getVault(vaultAddress);
      
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Deposit failed');
      console.error('Deposit error:', error);
      
      updateTransaction({
        status: 'failed',
        error: error.message,
      });
      
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [vaultAddress, walletClient, tokenDecimals, updateTransaction, depositToVault, getVault]);

  // Handle withdrawal
  const withdraw = useCallback(async (amount: string) => {
    if (!vaultAddress) {
      throw new Error('Vault address is required for withdrawal');
    }
    
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Parse the amount to BigInt with correct decimals
      const amountWei = parseUnits(amount, tokenDecimals);
      
      // Update transaction state
      updateTransaction({
        type: 'withdraw',
        status: 'pending',
        amount,
      });
      
      // Execute withdrawal
      const success = await withdrawFromVault(vaultAddress, amountWei);
      
      if (!success) {
        throw new Error('Withdrawal transaction failed');
      }
      
      // Update transaction state to completed
      updateTransaction({
        status: 'completed',
      });
      
      // Refresh vault data
      await getVault(vaultAddress);
      
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Withdrawal failed');
      console.error('Withdrawal error:', error);
      
      updateTransaction({
        status: 'failed',
        error: error.message,
      });
      
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [vaultAddress, walletClient, tokenDecimals, updateTransaction, withdrawFromVault, getVault]);

  // Clear the current transaction
  const clearTransaction = useCallback(() => {
    setTransaction(null);
    setError(null);
  }, []);

  // Format token amount
  const formatTokenAmount = useCallback((amount: bigint, decimals: number = tokenDecimals): string => {
    try {
      return formatEther(amount * (10n ** BigInt(18 - decimals)));
    } catch (err) {
      console.error('Error formatting token amount:', err);
      return '0';
    }
  }, [tokenDecimals]);

  // Parse token amount
  const parseTokenAmount = useCallback((amount: string, decimals: number = tokenDecimals): bigint => {
    try {
      return parseUnits(amount, decimals);
    } catch (err) {
      console.error('Error parsing token amount:', err);
      return 0n;
    }
  }, [tokenDecimals]);

  return {
    // State
    transaction,
    isLoading,
    error,
    
    // Token approval
    isApproved,
    isApproving,
    allowance: formatTokenAmount(allowance),
    balance: formatTokenAmount(balance),
    needsApproval,
    
    // Actions
    approve,
    deposit,
    withdraw,
    clearTransaction,
    
    // Utilities
    formatTokenAmount,
    parseTokenAmount,
  };
}
