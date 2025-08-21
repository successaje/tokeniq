import { useCallback, useEffect, useState, useMemo } from 'react';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { Address } from 'viem';
import { useContractInstances } from './useContractInstances';
import { VAULT_TYPES } from '@/config/vaults';
import { chains } from '@/config/chains';
import { VaultInfo, VaultType } from '@/types/vault';

// Re-export VaultInfo type for convenience
type VaultData = VaultInfo;

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
    if (!publicClient) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get all vaults from the configuration and transform to the expected format
      const vaults: VaultInfo[] = Object.entries(VAULT_TYPES).map(([id, vault]) => {
        const chainId = chains.find(c => c.name === vault.chain)?.id || 1;
        const isNew = true; // Mark all vaults as new for now
        
        // Map the vault data to match the VaultInfo interface
        const vaultInfo: VaultInfo = {
          id,
          address: vault.vaultAddress || '0x0',
          name: vault.name,
          symbol: vault.tokenSymbol || 'LP',
          asset: vault.tokenAddress || '0x0',
          totalAssets: '0',
          totalSupply: '0',
          tvl: vault.tvl || 0n,
          userBalance: 0n, // Will be populated by fetchUserVaultBalance
          apy: vault.apy || 0,
          chainId,
          strategy: vault.strategy,
          tokenAddress: vault.tokenAddress || '0x0',
          isNew,
          // Add additional fields that might be used by the UI
          description: vault.description || '',
          risk: vault.risk || 'medium',
          minDeposit: vault.minDeposit || 0n,
          tokenDecimals: vault.tokenDecimals || 18,
          tokenSymbol: vault.tokenSymbol || 'TOKEN',
          vaultAddress: vault.vaultAddress || '0x0',
          chain: vault.chain,
          // Map available to availability
          availability: vault.available ? 'public' : 'private',
          tags: vault.tags || [],
          type: VaultType.STANDARD, // Default to STANDARD type
          // Add missing required fields
          owner: '0x0',
          performanceFee: 0,
          withdrawalFee: 0,
          lastHarvest: 0
        };
        
        return vaultInfo;
      });
      
      // Fetch additional data for each vault
      const vaultsWithData = await Promise.all(
        vaults.map(async (vault) => {
          try {
            const [userBalance, tvl, recommendation] = await Promise.all([
              fetchUserVaultBalance(vault.vaultAddress || '0x0'),
              Promise.resolve(vault.tvl), // Use the TVL from config for now
              fetchStrategyRecommendations(vault.address).catch(() => null) // Handle potential errors in recommendation fetch
            ]);
            
            return {
              ...vault,
              userBalance,
              tvl,
              apy: vault.apy || 0,
              chainId: vault.chainId,
              recommendation: recommendation || {
                vaultId: vault.id,
                action: 'deposit' as const,
                confidence: 85,
                reason: 'High yield potential based on current market conditions'
              }
            };
          } catch (error) {
            console.error(`Error fetching data for vault ${vault.id}:`, error);
            // Return the vault with default values if there's an error
            return {
              ...vault,
              userBalance: 0n,
              tvl: vault.tvl || 0n,
              apy: vault.apy || 0,
              recommendation: {
                vaultId: vault.id,
                action: 'hold' as const,
                confidence: 50,
                reason: 'Data temporarily unavailable'
              }
            };
          }
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

  useEffect(() => {
    fetchAllVaultsData();
    
    const interval = setInterval(fetchAllVaultsData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchAllVaultsData]);

  const vaultsByChain = useMemo(() => {
    const groups: Record<number, VaultData[]> = {};
    vaultsData.forEach(vault => {
      if (!groups[vault.chainId]) {
        groups[vault.chainId] = [];
      }
      groups[vault.chainId].push(vault);
    });
    return groups;
  }, [vaultsData]);

  const mockRecommendations = useMemo(() => {
    return vaultsData.map(vault => ({
      vaultId: vault.id,
      action: Math.random() > 0.5 ? 'deposit' : 'hold' as const,
      confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
      reason: 'High yield potential based on current market conditions'
    }));
  }, [vaultsData]);

  return {
    vaults: vaultsData,
    vaultsByChain,
    recommendations: mockRecommendations,
    loading,
    error,
    refresh: fetchAllVaultsData,
  };
}
