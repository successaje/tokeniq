import { useCallback, useEffect, useState } from 'react';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { Address, formatEther, parseEther } from 'viem';
import { VAULT_TYPES, VAULT_TYPE_IDS } from '@/config/vaults';
import { useContractInstances } from './useContractInstances';

type VaultBalance = {
  userShares: bigint;
  userValue: bigint;
  totalValue: bigint;
  pricePerShare: bigint;
};

type VaultBalances = Record<string, VaultBalance>;

export function useVaultBalances() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { getContractInstance } = useContractInstances();
  
  const [balances, setBalances] = useState<VaultBalances>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVaultBalances = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);

    try {
      const vaultManager = getContractInstance(
        process.env.NEXT_PUBLIC_VAULT_MANAGER_ADDRESS as `0x${string}`,
        'VaultManager'
      );

      // Get all vaults for the current chain
      const vaultAddresses = await Promise.all(
        VAULT_TYPE_IDS.map(async (vaultId) => {
          const vaultType = VAULT_TYPES[vaultId];
          if (!vaultType.available) return null;
          
          try {
            const vaultAddress = await publicClient.readContract({
              ...vaultManager,
              functionName: 'getVaultsByType',
              args: [vaultId],
            }) as Address[];
            return vaultAddress[0]; // Get the first vault of this type
          } catch (error) {
            console.error(`Error fetching vault ${vaultId}:`, error);
            return null;
          }
        })
      );

      // Fetch balances for each vault
      const newBalances: VaultBalances = {};
      
      await Promise.all(
        VAULT_TYPE_IDS.map(async (vaultId, index) => {
          const vaultAddress = vaultAddresses[index];
          if (!vaultAddress) return;

          try {
            const vault = getContractInstance(vaultAddress, 'AaveVault');
            
            const [userInfo, totalAssets, totalSupply, pricePerShare] = await Promise.all([
              publicClient.readContract({
                ...vaultManager,
                functionName: 'userInfo',
                args: [vaultAddress, address],
              }) as Promise<{ amount: bigint }>,
              publicClient.readContract({
                ...vault,
                functionName: 'totalAssets',
              }) as Promise<bigint>,
              publicClient.readContract({
                ...vault,
                functionName: 'totalSupply',
              }) as Promise<bigint>,
              publicClient.readContract({
                ...vault,
                functionName: 'convertToAssets',
                args: [parseEther('1')],
              }) as Promise<bigint>,
            ]);

            const userShares = userInfo?.amount || 0n;
            const userValue = (userShares * pricePerShare) / parseEther('1');

            newBalances[vaultId] = {
              userShares,
              userValue,
              totalValue: totalAssets,
              pricePerShare,
            };
          } catch (error) {
            console.error(`Error fetching balance for ${vaultId}:`, error);
            newBalances[vaultId] = {
              userShares: 0n,
              userValue: 0n,
              totalValue: 0n,
              pricePerShare: parseEther('1'),
            };
          }
        })
      );

      setBalances(newBalances);
    } catch (error) {
      console.error('Error fetching vault balances:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch vault balances'));
    } finally {
      setLoading(false);
    }
  }, [address, chainId, publicClient, getContractInstance]);

  // Initial fetch
  useEffect(() => {
    fetchVaultBalances();
  }, [fetchVaultBalances]);

  return {
    balances,
    loading,
    error,
    refresh: fetchVaultBalances,
  };
}
