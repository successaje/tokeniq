import { useState, useEffect, useCallback } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { useVaults } from './useVaults';
import { useVaultMetrics } from './useVaultMetrics';
import { useVaultStrategies } from './useVaultStrategies';
import { useVaultPositions } from './useVaultPositions';
import { useVaultTransactions } from './useVaultTransactions';
import { VaultType } from '@/types/contracts';

// Types for vault dashboard data
export interface VaultDashboardData {
  // Basic info
  address: Address;
  name: string;
  symbol: string;
  description: string;
  vaultType: VaultType;
  asset: Address;
  assetSymbol: string;
  assetDecimals: number;
  
  // Metrics
  tvl: bigint;
  apy: number;
  apy7d: number;
  apy30d: number;
  performanceFee: number;
  managementFee: number;
  totalShares: bigint;
  pricePerShare: bigint;
  lastHarvest: number;
  
  // User position
  userBalance: bigint;
  userValue: bigint;
  userShares: bigint;
  
  // Strategies
  strategies: {
    id: string;
    name: string;
    apy: number;
    allocation: number;
    tvl: bigint;
  }[];
  
  // Transaction history
  recentTransactions: Array<{
    type: 'deposit' | 'withdraw' | 'harvest' | 'strategy_update';
    amount: bigint;
    txHash: `0x${string}`;
    timestamp: number;
  }>;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: number | null;
}

type UseVaultDashboardProps = {
  vaultAddress: Address;
  refreshInterval?: number; // in milliseconds
};

export function useVaultDashboard({
  vaultAddress,
  refreshInterval = 30000, // 30 seconds
}: UseVaultDashboardProps) {
  const { address } = useAccount();
  
  // Get vault data
  const { getVault, allVaults, getUserVaultBalance, refreshVaults } = useVaults();
  const vault = getVault(vaultAddress);
  
  // Get vault metrics
  const { metrics, loading: metricsLoading, refresh: refreshMetrics } = useVaultMetrics({
    vaultAddress,
    refreshInterval,
  });
  
  // Get vault strategies
  const { strategies, loading: strategiesLoading, refresh: refreshStrategies } = useVaultStrategies({
    vaultAddress,
    refreshInterval,
  });
  
  // Get user's position in the vault
  const { getPosition, refresh: refreshPositions } = useVaultPositions({
    refreshInterval,
  });
  const userPosition = getPosition(vaultAddress);
  
  // Get transactions for the vault
  const { transactions, loading: transactionsLoading, refresh: refreshTransactions } = useVaultTransactions({
    vaultAddress,
    refreshInterval,
  });
  
  // Combined loading state
  const isLoading = !vault || metricsLoading || strategiesLoading || transactionsLoading;
  
  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshVaults(),
      refreshMetrics(),
      refreshStrategies(),
      refreshPositions(),
      refreshTransactions(),
    ]);
  }, [refreshVaults, refreshMetrics, refreshStrategies, refreshPositions, refreshTransactions]);
  
  // Format dashboard data
  const getDashboardData = useCallback((): VaultDashboardData | null => {
    if (!vault) return null;
    
    return {
      // Basic info
      address: vault.address,
      name: vault.name,
      symbol: vault.symbol,
      description: vault.description || `${vault.name} Vault`,
      vaultType: vault.vaultType,
      asset: vault.asset,
      assetSymbol: metrics.assetSymbol,
      assetDecimals: metrics.assetDecimals,
      
      // Metrics
      tvl: metrics.tvl,
      apy: metrics.apy,
      apy7d: metrics.apy7d,
      apy30d: metrics.apy30d,
      performanceFee: metrics.performanceFee,
      managementFee: metrics.managementFee,
      totalShares: metrics.totalShares,
      pricePerShare: metrics.pricePerShare,
      lastHarvest: metrics.lastHarvest,
      
      // User position
      userBalance: userPosition?.balance || BigInt(0),
      userValue: userPosition?.value || BigInt(0),
      userShares: userPosition?.shares || BigInt(0),
      
      // Strategies
      strategies: strategies.map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        apy: strategy.apy,
        allocation: strategy.allocation,
        tvl: strategy.tvl,
      })),
      
      // Recent transactions (last 5)
      recentTransactions: transactions
        .filter(tx => tx.type === 'deposit' || tx.type === 'withdraw' || tx.type === 'harvest')
        .slice(0, 5)
        .map(tx => ({
          type: tx.type,
          amount: tx.amount,
          txHash: tx.txHash,
          timestamp: tx.timestamp,
        })),
      
      // Loading states
      isLoading,
      isRefreshing: false, // TODO: Track refresh state if needed
      lastUpdated: Date.now(),
    };
  }, [vault, metrics, strategies, transactions, userPosition, isLoading]);
  
  // Set up polling for data refresh
  useEffect(() => {
    if (!vaultAddress) return;
    
    // Initial refresh
    refreshAll();
    
    // Set up interval for polling
    const intervalId = setInterval(refreshAll, refreshInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [vaultAddress, refreshInterval, refreshAll]);
  
  // Return the dashboard data
  return {
    data: getDashboardData(),
    isLoading,
    refresh: refreshAll,
    lastUpdated: getDashboardData()?.lastUpdated || null,
  };
}
