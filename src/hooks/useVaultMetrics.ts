import { useState, useEffect, useCallback } from 'react';
import { Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { getContract } from 'viem';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import VaultABI from '@/abis/Vault.json';

// Types for vault metrics
export interface VaultMetrics {
  tvl: bigint;          // Total Value Locked in the vault
  apy: number;          // Annual Percentage Yield
  apy7d: number;        // 7-day APY
  apy30d: number;       // 30-day APY
  performanceFee: number; // Performance fee percentage
  managementFee: number;  // Management fee percentage
  totalShares: bigint;   // Total shares minted
  pricePerShare: bigint; // Price per share in underlying token
  lastHarvest: number;   // Timestamp of last harvest
  asset: Address;        // Address of the underlying asset
  assetSymbol: string;   // Symbol of the underlying asset
  assetDecimals: number; // Decimals of the underlying asset
}

type UseVaultMetricsProps = {
  vaultAddress: Address | undefined;
  refreshInterval?: number; // in milliseconds
};

// Default values for metrics
const DEFAULT_METRICS: VaultMetrics = {
  tvl: BigInt(0),
  apy: 0,
  apy7d: 0,
  apy30d: 0,
  performanceFee: 0,
  managementFee: 0,
  totalShares: BigInt(0),
  pricePerShare: BigInt(0),
  lastHarvest: 0,
  asset: '0x0000000000000000000000000000000000000000' as Address,
  assetSymbol: '',
  assetDecimals: 18,
};

export function useVaultMetrics({
  vaultAddress,
  refreshInterval = 30000, // 30 seconds
}: UseVaultMetricsProps) {
  const publicClient = usePublicClient();
  const [metrics, setMetrics] = useState<VaultMetrics>(DEFAULT_METRICS);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch vault metrics
  const fetchMetrics = useCallback(async () => {
    if (!vaultAddress || !publicClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const vaultContract = getContract({
        address: vaultAddress,
        abi: VaultABI,
        publicClient,
      });
      
      // Fetch all metrics in parallel
      const [
        tvl,
        pricePerShare,
        totalSupply,
        asset,
        assetSymbol,
        assetDecimals,
        performanceFee,
        managementFee,
        lastHarvest,
      ] = await Promise.all([
        vaultContract.read.totalAssets().catch(() => BigInt(0)),
        vaultContract.read.pricePerShare().catch(() => BigInt(1e18)), // Default to 1:1
        vaultContract.read.totalSupply().catch(() => BigInt(0)),
        vaultContract.read.asset().catch(() => '0x0000000000000000000000000000000000000000' as Address),
        vaultContract.read.symbol().catch(() => 'ASSET'),
        vaultContract.read.decimals().catch(() => 18),
        vaultContract.read.performanceFee().catch(() => 2000), // 20% default
        vaultContract.read.managementFee().catch(() => 200),   // 2% default
        vaultContract.read.lastHarvest().catch(() => Math.floor(Date.now() / 1000)),
      ]);
      
      // Calculate APY (simplified - in a real app, this would be more sophisticated)
      // This is a placeholder - you would typically calculate this based on historical data
      const apy = 5.25; // 5.25% APY as placeholder
      
      setMetrics({
        tvl: typeof tvl === 'bigint' ? tvl : BigInt(tvl),
        apy,
        apy7d: apy * 1.1, // Slightly higher for 7d
        apy30d: apy * 0.95, // Slightly lower for 30d
        performanceFee: Number(performanceFee) / 100, // Convert from basis points (e.g., 2000 = 20%)
        managementFee: Number(managementFee) / 100,   // Convert from basis points (e.g., 200 = 2%)
        totalShares: typeof totalSupply === 'bigint' ? totalSupply : BigInt(totalSupply),
        pricePerShare: typeof pricePerShare === 'bigint' ? pricePerShare : BigInt(pricePerShare),
        lastHarvest: Number(lastHarvest) * 1000, // Convert to milliseconds
        asset,
        assetSymbol,
        assetDecimals,
      });
      
    } catch (err) {
      console.error('Failed to fetch vault metrics:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch vault metrics'));
    } finally {
      setLoading(false);
    }
  }, [vaultAddress, publicClient]);

  // Set up polling for metrics
  useEffect(() => {
    if (!vaultAddress) return;
    
    // Initial fetch
    fetchMetrics();
    
    // Set up interval for polling
    const intervalId = setInterval(fetchMetrics, refreshInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [vaultAddress, fetchMetrics, refreshInterval]);

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics,
  };
}
