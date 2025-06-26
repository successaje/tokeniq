import { useState, useEffect, useCallback } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { useVaults } from './useVaults';
import { useVaultMetrics } from './useVaultMetrics';

// Types for user's vault position
export interface VaultPosition {
  vaultAddress: Address;
  vaultName: string;
  vaultSymbol: string;
  asset: Address;
  assetSymbol: string;
  assetDecimals: number;
  balance: bigint;         // User's share balance
  value: bigint;           // Value in underlying asset
  pricePerShare: bigint;   // Price per share in underlying asset
  apy: number;             // Current APY for the vault
  pnl: number;            // Profit and Loss percentage
  lastUpdated: number;     // Timestamp of last update
}

type UseVaultPositionsProps = {
  refreshInterval?: number; // in milliseconds
};

export function useVaultPositions({
  refreshInterval = 30000, // 30 seconds
}: UseVaultPositionsProps = {}) {
  const { address } = useAccount();
  const { userVaults, allVaults, getUserVaultBalance } = useVaults();
  const [positions, setPositions] = useState<VaultPosition[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalValue, setTotalValue] = useState<bigint>(BigInt(0));

  // Fetch user's positions across all vaults
  const fetchPositions = useCallback(async () => {
    if (!address) {
      setPositions([]);
      setTotalValue(BigInt(0));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all vaults that the user has a position in
      const userVaultAddresses = userVaults.map(vault => vault.address);
      
      // Fetch positions for each vault
      const positionsPromises = userVaultAddresses.map(async (vaultAddress) => {
        try {
          // Get the vault details
          const vault = allVaults.find(v => v.address.toLowerCase() === vaultAddress.toLowerCase());
          if (!vault) return null;

          // Get user's balance in the vault
          const balance = await getUserVaultBalance(vaultAddress);
          
          // Skip if balance is zero
          if (balance <= 0) return null;
          
          // Get vault metrics
          const { metrics } = useVaultMetrics({ vaultAddress });
          
          // Calculate position value
          const value = (balance * metrics.pricePerShare) / BigInt(10 ** metrics.assetDecimals);
          
          return {
            vaultAddress,
            vaultName: vault.name,
            vaultSymbol: vault.symbol,
            asset: vault.asset,
            assetSymbol: metrics.assetSymbol,
            assetDecimals: metrics.assetDecimals,
            balance,
            value,
            pricePerShare: metrics.pricePerShare,
            apy: metrics.apy,
            pnl: 0, // This would be calculated based on user's cost basis
            lastUpdated: Date.now(),
          } as VaultPosition;
        } catch (err) {
          console.error(`Error fetching position for vault ${vaultAddress}:`, err);
          return null;
        }
      });

      // Wait for all positions to be fetched
      const fetchedPositions = (await Promise.all(positionsPromises)).filter(
        (position): position is VaultPosition => position !== null
      );

      // Calculate total value across all positions
      const total = fetchedPositions.reduce(
        (sum, position) => sum + position.value,
        BigInt(0)
      );

      setPositions(fetchedPositions);
      setTotalValue(total);
    } catch (err) {
      console.error('Failed to fetch vault positions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch vault positions'));
    } finally {
      setLoading(false);
    }
  }, [address, userVaults, allVaults, getUserVaultBalance]);

  // Set up polling for positions
  useEffect(() => {
    if (!address) return;
    
    // Initial fetch
    fetchPositions();
    
    // Set up interval for polling
    const intervalId = setInterval(fetchPositions, refreshInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [address, fetchPositions, refreshInterval]);

  // Get a specific position by vault address
  const getPosition = useCallback((vaultAddress: Address) => {
    return positions.find(p => p.vaultAddress.toLowerCase() === vaultAddress.toLowerCase()) || null;
  }, [positions]);

  return {
    positions,
    totalValue,
    loading,
    error,
    getPosition,
    refresh: fetchPositions,
  };
}
