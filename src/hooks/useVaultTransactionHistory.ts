import { useState, useEffect, useCallback } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { useVaults } from './useVaults';

// Types for transaction history
export type TransactionType = 'deposit' | 'withdraw' | 'harvest' | 'approve' | 'stake' | 'unstake';

export interface VaultTransaction {
  id: string;
  type: TransactionType;
  vaultAddress: Address;
  vaultName: string;
  vaultSymbol: string;
  amount: bigint;
  tokenSymbol: string;
  tokenDecimals: number;
  txHash: `0x${string}`;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  from: Address;
  to: Address | null;
}

type UseVaultTransactionHistoryProps = {
  vaultAddress?: Address; // If provided, only show transactions for this vault
  userOnly?: boolean; // If true, only show transactions for the connected user
  limit?: number; // Maximum number of transactions to return
  refreshInterval?: number; // in milliseconds
};

export function useVaultTransactionHistory({
  vaultAddress,
  userOnly = true,
  limit = 50,
  refreshInterval = 30000, // 30 seconds
}: UseVaultTransactionHistoryProps = {}) {
  const { address } = useAccount();
  const { allVaults, getUserVaultTransactions } = useVaults();
  
  const [transactions, setTransactions] = useState<VaultTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Fetch transaction history
  const fetchTransactionHistory = useCallback(async () => {
    if (userOnly && !address) {
      setTransactions([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get all vaults or the specified vault
      const targetVaults = vaultAddress 
        ? allVaults.filter(v => v.address.toLowerCase() === vaultAddress.toLowerCase())
        : allVaults;
      
      // Get transactions for each vault
      const transactionsPromises = targetVaults.map(async (vault) => {
        try {
          // In a real implementation, this would fetch transactions from a subgraph or indexer
          // For now, we'll use the mock transaction data from the vault
          const vaultTxs = await getUserVaultTransactions(vault.address);
          
          return vaultTxs.map(tx => ({
            ...tx,
            vaultName: vault.name,
            vaultSymbol: vault.symbol,
            tokenSymbol: 'TOKEN', // This would come from the asset info
            tokenDecimals: 18,    // This would come from the asset info
            status: 'confirmed',   // In a real app, this would be determined by the transaction receipt
            from: address as Address, // In a real app, this would come from the transaction
            to: vault.address,     // The vault is the recipient for deposits
          }));
        } catch (err) {
          console.error(`Error fetching transactions for vault ${vault.address}:`, err);
          return [];
        }
      });
      
      // Wait for all transactions to be fetched
      const allTransactions = (await Promise.all(transactionsPromises)).flat();
      
      // Filter by user if needed
      const filteredTransactions = userOnly && address
        ? allTransactions.filter(tx => tx.from.toLowerCase() === address.toLowerCase())
        : allTransactions;
      
      // Sort by timestamp (newest first)
      const sortedTransactions = filteredTransactions.sort((a, b) => b.timestamp - a.timestamp);
      
      // Apply limit
      const limitedTransactions = limit ? sortedTransactions.slice(0, limit) : sortedTransactions;
      
      setTransactions(limitedTransactions);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error('Failed to fetch transaction history:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch transaction history'));
    } finally {
      setLoading(false);
    }
  }, [vaultAddress, userOnly, address, allVaults, limit, getUserVaultTransactions]);
  
  // Set up polling for data refresh
  useEffect(() => {
    // Initial fetch
    fetchTransactionHistory();
    
    // Set up interval for polling
    const intervalId = setInterval(fetchTransactionHistory, refreshInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchTransactionHistory, refreshInterval]);
  
  // Get transactions by type
  const getTransactionsByType = useCallback((type: TransactionType) => {
    return transactions.filter(tx => tx.type === type);
  }, [transactions]);
  
  // Get transactions by vault
  const getTransactionsByVault = useCallback((vaultAddr: Address) => {
    return transactions.filter(tx => 
      tx.vaultAddress.toLowerCase() === vaultAddr.toLowerCase()
    );
  }, [transactions]);
  
  // Get total volume by type
  const getTotalVolume = useCallback((type?: TransactionType) => {
    const filtered = type 
      ? transactions.filter(tx => tx.type === type)
      : transactions;
      
    return filtered.reduce((sum, tx) => sum + tx.amount, BigInt(0));
  }, [transactions]);
  
  // Get recent transactions (last 7 days)
  const getRecentTransactions = useCallback((days: number = 7) => {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return transactions.filter(tx => tx.timestamp >= cutoff);
  }, [transactions]);

  return {
    // State
    transactions,
    loading,
    error,
    lastUpdated,
    
    // Actions
    refresh: fetchTransactionHistory,
    
    // Getters
    getTransactionsByType,
    getTransactionsByVault,
    getTotalVolume,
    getRecentTransactions,
    
    // Aggregated data
    depositCount: getTransactionsByType('deposit').length,
    withdrawCount: getTransactionsByType('withdraw').length,
    totalDeposits: getTotalVolume('deposit'),
    totalWithdrawals: getTotalVolume('withdraw'),
    netFlow: getTotalVolume('deposit') - getTotalVolume('withdraw'),
  };
}
