import { useCallback, useEffect, useState, useMemo } from 'react';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { Address } from 'viem';
import { useContractInstances } from './useContractInstances';

type VaultData = {
  id: string;
  address: Address;
  name: string;
  symbol: string;
  tvl: bigint;
  userBalance: bigint;
  apy: number;
  chainId: number;
  strategy?: string;
  performance?: {
    day: number;
    week: number;
    month: number;
  };
};

type StrategyRecommendation = {
  vaultId: string;
  action: 'deposit' | 'withdraw' | 'hold';
  confidence: number;
  reason: string;
};

export function useVaultsData() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = useContractInstances();
  const publicClient = usePublicClient();
  
  const [vaultsData, setVaultsData] = useState<VaultData[]>([]);
  const [recommendations, setRecommendations] = useState<StrategyRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch user's balance for a specific vault
  const fetchUserVaultBalance = useCallback(async (vaultAddress: Address): Promise<bigint> => {
    if (!address || !contracts?.vaultManager) return BigInt(0);
    
    try {
      const balance = await contracts.vaultManager.read.userInfo([vaultAddress, address]);
      return balance || BigInt(0);
    } catch (err) {
      console.error(`Error fetching user balance for vault ${vaultAddress}:`, err);
      return BigInt(0);
    }
  }, [address, contracts?.vaultManager]);

  // Fetch TVL for a specific vault
  const fetchVaultTVL = useCallback(async (vaultAddress: Address): Promise<bigint> => {
    if (!contracts?.aaveVault) return BigInt(0);
    
    try {
      const tvl = await contracts.aaveVault.read.getTotalValue([vaultAddress]);
      return tvl || BigInt(0);
    } catch (err) {
      console.error(`Error fetching TVL for vault ${vaultAddress}:`, err);
      return BigInt(0);
    }
  }, [contracts?.aaveVault]);

  // Fetch AI strategy recommendations
  const fetchStrategyRecommendations = useCallback(async (vaultAddress: Address): Promise<StrategyRecommendation | null> => {
    if (!contracts?.treasuryAIManager) return null;
    
    try {
      const decision = await contracts.treasuryAIManager.read.getLatestDecision([vaultAddress]);
      return {
        vaultId: vaultAddress,
        action: decision.action, // 'deposit' | 'withdraw' | 'hold'
        confidence: Number(decision.confidence) / 100, // Assuming confidence is 0-100
        reason: decision.reason || 'No specific reason provided'
      };
    } catch (err) {
      console.error(`Error fetching AI recommendations for vault ${vaultAddress}:`, err);
      return null;
    }
  }, [contracts?.treasuryAIManager]);

  // Fetch all vault data
  const fetchAllVaultsData = useCallback(async () => {
    if (!contracts?.vaultFactory || !publicClient) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get all vaults (simplified - in reality you'd use the event-based approach from ContractContext)
      const vaults = []; // This should be populated with actual vault data
      
      const vaultsWithData = await Promise.all(
        vaults.map(async (vault) => {
          const [userBalance, tvl, recommendation] = await Promise.all([
            fetchUserVaultBalance(vault.address),
            fetchVaultTVL(vault.address),
            fetchStrategyRecommendations(vault.address)
          ]);
          
          return {
            ...vault,
            userBalance,
            tvl,
            apy: 0, // This would come from an external source or contract
            chainId,
            recommendation
          };
        })
      );
      
      setVaultsData(vaultsWithData);
      
      // Extract and set recommendations
      const validRecommendations = vaultsWithData
        .filter(v => v.recommendation)
        .map(v => v.recommendation);
      setRecommendations(validRecommendations);
      
    } catch (err) {
      console.error('Error fetching vaults data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch vaults data'));
    } finally {
      setLoading(false);
    }
  }, [contracts, publicClient, chainId, fetchUserVaultBalance, fetchVaultTVL, fetchStrategyRecommendations]);

  useEffect(() => {
    fetchAllVaultsData();
  }, [fetchAllVaultsData]);

  // Calculate total value across all chains
  const totalValue = useMemo(() => {
    return vaultsData.reduce((sum, vault) => {
      return sum + (vault.userBalance * vault.tvl) / (vault.tvl > 0 ? vault.tvl : 1n);
    }, 0n);
  }, [vaultsData]);

  // Group vaults by chain
  const vaultsByChain = useMemo(() => {
    return vaultsData.reduce((acc, vault) => {
      const chainId = vault.chainId.toString();
      if (!acc[chainId]) {
        acc[chainId] = [];
      }
      acc[chainId].push(vault);
      return acc;
    }, {} as Record<string, VaultData[]>);
  }, [vaultsData]);

  return {
    vaults: vaultsData,
    vaultsByChain,
    recommendations,
    totalValue,
    loading,
    error,
    refresh: fetchAllVaultsData,
  };
}
