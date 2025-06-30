import { useState, useEffect, useCallback } from 'react';
import { Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { getContract } from 'viem';
import VaultABI from '@/abis/Vault.json';
import VaultManagerABI from '@/abis/VaultManager.json';

// Types for vault strategies
export interface VaultStrategy {
  id: string;
  name: string;
  description: string;
  apy: number;
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
  minDeposit: bigint;
  maxDeposit: bigint;
  fee: number;
  isActive: boolean;
  allocation: number; // 0-100%
  lastHarvest: number; // Timestamp
  tvl: bigint; // Total Value Locked
  asset: Address;
  assetSymbol: string;
  assetDecimals: number;
}

type UseVaultStrategiesProps = {
  vaultAddress?: Address;
  refreshInterval?: number; // in milliseconds
};

// Default values for strategies
const DEFAULT_STRATEGIES: VaultStrategy[] = [
  {
    id: 'aave-v3',
    name: 'Aave V3 Lending',
    description: 'Earn yield by supplying assets to Aave V3 lending protocol',
    apy: 3.5,
    riskLevel: 'low',
    tags: ['lending', 'defi', 'aave'],
    minDeposit: parseEther('0.01'),
    maxDeposit: parseEther('1000000'),
    fee: 0.1, // 0.1%
    isActive: true,
    allocation: 100,
    lastHarvest: 0,
    tvl: BigInt(0),
    asset: '0x0000000000000000000000000000000000000000' as Address,
    assetSymbol: 'USDC',
    assetDecimals: 6,
  },
  {
    id: 'uniswap-v3',
    name: 'Uniswap V3 LP',
    description: 'Provide liquidity on Uniswap V3 with concentrated liquidity',
    apy: 15.2,
    riskLevel: 'medium',
    tags: ['amm', 'liquidity', 'defi'],
    minDeposit: parseEther('0.1'),
    maxDeposit: parseEther('100000'),
    fee: 0.3, // 0.3%
    isActive: true,
    allocation: 0,
    lastHarvest: 0,
    tvl: BigInt(0),
    asset: '0x0000000000000000000000000000000000000000' as Address,
    assetSymbol: 'ETH',
    assetDecimals: 18,
  },
  {
    id: 'aave-v3-high-yield',
    name: 'Aave V3 High Yield',
    description: 'Higher yield strategy using leverage on Aave V3',
    apy: 8.7,
    riskLevel: 'high',
    tags: ['lending', 'leverage', 'aave'],
    minDeposit: parseEther('1'),
    maxDeposit: parseEther('10000'),
    fee: 0.5, // 0.5%
    isActive: true,
    allocation: 0,
    lastHarvest: 0,
    tvl: BigInt(0),
    asset: '0x0000000000000000000000000000000000000000' as Address,
    assetSymbol: 'USDC',
    assetDecimals: 6,
  },
];

export function useVaultStrategies({
  vaultAddress,
  refreshInterval = 30000, // 30 seconds
}: UseVaultStrategiesProps = {}) {
  const publicClient = usePublicClient();
  const [strategies, setStrategies] = useState<VaultStrategy[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  // Fetch vault strategies
  const fetchStrategies = useCallback(async () => {
    if (!vaultAddress || !publicClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, we would fetch strategies from the VaultManager contract
      // For now, we'll use the default strategies
      const vaultContract = getContract({
        address: vaultAddress,
        abi: VaultABI,
        publicClient,
      });
      
      // Get vault details
      const [asset, assetSymbol, assetDecimals] = await Promise.all([
        vaultContract.read.asset().catch(() => '0x0000000000000000000000000000000000000000'),
        vaultContract.read.symbol().catch(() => 'ASSET'),
        vaultContract.read.decimals().catch(() => 18),
      ]);
      
      // Update strategies with vault asset info
      const updatedStrategies = DEFAULT_STRATEGIES.map(strategy => ({
        ...strategy,
        asset: asset as Address,
        assetSymbol: assetSymbol as string,
        assetDecimals: assetDecimals as number,
      }));
      
      setStrategies(updatedStrategies);
      
      // If no strategy is selected, select the first active one
      if (!selectedStrategy || !updatedStrategies.some(s => s.id === selectedStrategy)) {
        const firstActive = updatedStrategies.find(s => s.isActive);
        if (firstActive) {
          setSelectedStrategy(firstActive.id);
        }
      }
      
    } catch (err) {
      console.error('Failed to fetch vault strategies:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch strategies'));
    } finally {
      setLoading(false);
    }
  }, [vaultAddress, publicClient, selectedStrategy]);

  // Set up polling for strategies
  useEffect(() => {
    if (!vaultAddress) return;
    
    // Initial fetch
    fetchStrategies();
    
    // Set up interval for polling
    const intervalId = setInterval(fetchStrategies, refreshInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [vaultAddress, fetchStrategies, refreshInterval]);

  // Get a strategy by ID
  const getStrategy = useCallback((strategyId: string) => {
    return strategies.find(s => s.id === strategyId) || null;
  }, [strategies]);

  // Get the currently selected strategy
  const getSelectedStrategy = useCallback(() => {
    if (!selectedStrategy) return null;
    return getStrategy(selectedStrategy);
  }, [selectedStrategy, getStrategy]);

  // Update strategy allocation
  const updateStrategyAllocation = useCallback((strategyId: string, allocation: number) => {
    setStrategies(prev => 
      prev.map(strategy => 
        strategy.id === strategyId 
          ? { ...strategy, allocation }
          : strategy
      )
    );
  }, []);

  // Apply strategy allocation changes to the vault
  const applyStrategyChanges = useCallback(async (): Promise<boolean> => {
    if (!vaultAddress || !publicClient || !walletClient) return false;
    
    try {
      setLoading(true);
      
      // In a real implementation, we would call the VaultManager contract
      // to update the strategy allocations
      const vaultManager = getContract({
        address: CONTRACT_ADDRESSES.vaultManager,
        abi: VaultManagerABI,
        publicClient,
        walletClient,
      });
      
      // This is a placeholder - actual implementation would depend on the contract
      // const tx = await vaultManager.updateStrategyAllocations(vaultAddress, strategies);
      // await tx.wait();
      
      // For now, just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return true;
    } catch (err) {
      console.error('Failed to update strategy allocations:', err);
      setError(err instanceof Error ? err : new Error('Failed to update strategies'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [vaultAddress, strategies, publicClient]);

  return {
    // State
    strategies,
    selectedStrategy,
    loading,
    error,
    
    // Getters
    getStrategy,
    getSelectedStrategy,
    
    // Actions
    selectStrategy: setSelectedStrategy,
    updateStrategyAllocation,
    applyStrategyChanges,
    refresh: fetchStrategies,
  };
}
