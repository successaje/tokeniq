import { useState } from 'react';
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { useContractInstances } from './useContractInstances';
import { VAULT_TYPES } from '@/config/vaults';

type VaultAction = 'deposit' | 'withdraw' | 'rebalance';

export function useVaultActions() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { getContractInstance } = useContractInstances();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Error | null>(null);

  const executeAction = async (
    action: VaultAction,
    vaultAddress: string,
    amount: string = '0',
    decimals: number = 18
  ) => {
    if (!address) throw new Error('Wallet not connected');
    if (!walletClient) throw new Error('Wallet client not available');

    const actionKey = `${action}-${vaultAddress}`;
    setLoading(prev => ({ ...prev, [actionKey]: true }));
    setError(null);

    try {
      const vaultManager = getContractInstance(
        process.env.NEXT_PUBLIC_VAULT_MANAGER_ADDRESS as `0x${string}`,
        'VaultManager'
      );

      let txHash: `0x${string}` | undefined;

      switch (action) {
        case 'deposit':
          const depositAmount = parseUnits(amount, decimals);
          txHash = await walletClient.writeContract({
            ...vaultManager,
            functionName: 'deposit',
            args: [vaultAddress, depositAmount],
          });
          break;

        case 'withdraw':
          const withdrawAmount = parseUnits(amount, decimals);
          txHash = await walletClient.writeContract({
            ...vaultManager,
            functionName: 'withdraw',
            args: [vaultAddress, withdrawAmount],
          });
          break;

        case 'rebalance':
          const vault = getContractInstance(vaultAddress, 'AaveVault');
          txHash = await walletClient.writeContract({
            ...vault,
            functionName: 'rebalance',
          });
          break;
      }

      if (txHash) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      return txHash;
    } catch (err) {
      console.error(`Error in ${action}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  return {
    executeAction,
    loading,
    error,
  };
}
