import { useState, useCallback, useEffect } from 'react';
import { Address, Chain, parseEther } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { useSwitchNetwork } from './useSwitchNetwork';
import { CONTRACT_ADDRESSES, ChainId, CHAINS } from '@/config/contracts';
import { getContract } from 'viem';
import CrossChainRouterABI from '@/abis/CrossChainRouter.json';

type CrossChainAction = 'deposit' | 'withdraw' | 'claim';
type CrossChainTxStatus = 'idle' | 'pending' | 'confirming' | 'completed' | 'failed';

type CrossChainTx = {
  action: CrossChainAction;
  status: CrossChainTxStatus;
  sourceChain: ChainId;
  targetChain: ChainId;
  txHash?: `0x${string}`;
  error?: string;
  timestamp: number;
  amount?: bigint;
  vaultAddress?: Address;
};

type UseCrossChainVaultProps = {
  vaultAddress?: Address;
  sourceChainId?: ChainId;
  targetChainId?: ChainId;
};

export function useCrossChainVault({
  vaultAddress,
  sourceChainId = ChainId.AVALANCHE_FUJI,
  targetChainId = ChainId.ETHEREUM_SEPOLIA,
}: UseCrossChainVaultProps = {}) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchNetwork } = useSwitchNetwork();
  
  const [crossChainTx, setCrossChainTx] = useState<CrossChainTx | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint>(BigInt(0));
  const [estimatedBridgeTime, setEstimatedBridgeTime] = useState<number>(0);

  // Get the cross-chain router contract
  const getCrossChainRouter = useCallback(() => {
    if (!publicClient || !walletClient) return null;
    
    const routerAddress = CONTRACT_ADDRESSES.crossChainRouter[sourceChainId];
    if (!routerAddress) return null;
    
    return getContract({
      address: routerAddress,
      abi: CrossChainRouterABI,
      publicClient,
      walletClient,
    });
  }, [sourceChainId, publicClient, walletClient]);

  // Estimate gas for cross-chain transaction
  const estimateGas = useCallback(async (
    action: CrossChainAction,
    amount: bigint,
    targetVault: Address
  ): Promise<bigint> => {
    try {
      const router = getCrossChainRouter();
      if (!router) throw new Error('Cross-chain router not available');
      
      // Estimate gas based on action
      switch (action) {
        case 'deposit':
          return await router.estimateGas.depositToVault([
            targetVault,
            amount,
            targetChainId
          ]);
        case 'withdraw':
          return await router.estimateGas.withdrawFromVault([
            targetVault,
            amount,
            targetChainId
          ]);
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (err) {
      console.error('Failed to estimate gas:', err);
      return BigInt(200000); // Default gas limit
    }
  }, [getCrossChainRouter, targetChainId]);

  // Get estimated bridge time
  const getEstimatedBridgeTime = useCallback((source: ChainId, target: ChainId): number => {
    // These are rough estimates - adjust based on your bridge implementation
    if (source === ChainId.AVALANCHE_FUJI && target === ChainId.ETHEREUM_SEPOLIA) {
      return 2 * 60 * 1000; // 2 minutes
    } else if (source === ChainId.ETHEREUM_SEPOLIA && target === ChainId.AVALANCHE_FUJI) {
      return 3 * 60 * 1000; // 3 minutes
    } else if (source === ChainId.BASE_SEPOLIA || target === ChainId.BASE_SEPOLIA) {
      return 1.5 * 60 * 1000; // 1.5 minutes
    }
    return 2 * 60 * 1000; // Default 2 minutes
  }, []);

  // Execute cross-chain transaction
  const executeCrossChainTx = useCallback(async (
    action: CrossChainAction,
    amount: bigint,
    targetVault: Address = vaultAddress as Address
  ): Promise<`0x${string}` | null> => {
    if (!targetVault) {
      throw new Error('Target vault address is required');
    }
    
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Switch to source chain if needed
      await switchNetwork(sourceChainId);
      
      const router = getCrossChainRouter();
      if (!router) {
        throw new Error('Cross-chain router not available');
      }
      
      // Create transaction object
      let txHash: `0x${string}`;
      const txData: any = {
        account: address,
        chain: CHAINS[sourceChainId],
      };
      
      // Update transaction status
      const updateTxStatus = (status: CrossChainTxStatus, txHash?: `0x${string}`, error?: string) => {
        setCrossChainTx({
          action,
          status,
          sourceChain: sourceChainId,
          targetChain: targetChainId,
          txHash,
          error,
          amount,
          vaultAddress: targetVault,
          timestamp: Date.now(),
        });
      };
      
      // Start transaction
      updateTxStatus('pending');
      
      // Execute the cross-chain action
      switch (action) {
        case 'deposit':
          txHash = await router.write.depositToVault([
            targetVault,
            amount,
            targetChainId
          ], txData);
          break;
          
        case 'withdraw':
          txHash = await router.write.withdrawFromVault([
            targetVault,
            amount,
            targetChainId
          ], txData);
          break;
          
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
      
      if (!txHash) {
        throw new Error('Transaction failed: No transaction hash returned');
      }
      
      // Wait for transaction confirmation
      updateTxStatus('confirming', txHash);
      
      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      
      if (receipt.status !== 'success') {
        throw new Error('Transaction reverted');
      }
      
      // Update status to completed
      updateTxStatus('completed', txHash);
      
      return txHash;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Cross-chain transaction failed');
      console.error('Cross-chain transaction error:', error);
      setError(error);
      updateTxStatus('failed', undefined, error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    vaultAddress, 
    walletClient, 
    sourceChainId, 
    targetChainId, 
    address, 
    publicClient, 
    switchNetwork, 
    getCrossChainRouter
  ]);

  // Deposit to vault on target chain
  const depositToVault = useCallback(async (
    amount: bigint,
    targetVault: Address = vaultAddress as Address
  ) => {
    return executeCrossChainTx('deposit', amount, targetVault);
  }, [executeCrossChainTx, vaultAddress]);

  // Withdraw from vault on target chain
  const withdrawFromVault = useCallback(async (
    amount: bigint,
    targetVault: Address = vaultAddress as Address
  ) => {
    return executeCrossChainTx('withdraw', amount, targetVault);
  }, [executeCrossChainTx, vaultAddress]);

  // Clear the current transaction
  const clearTransaction = useCallback(() => {
    setCrossChainTx(null);
  }, []);

  // Update estimated gas and bridge time when inputs change
  useEffect(() => {
    if (!vaultAddress) return;
    
    const updateEstimates = async () => {
      try {
        const gas = await estimateGas('deposit', BigInt(1e18), vaultAddress);
        setEstimatedGas(gas);
        
        const bridgeTime = getEstimatedBridgeTime(sourceChainId, targetChainId);
        setEstimatedBridgeTime(bridgeTime);
      } catch (err) {
        console.error('Failed to update estimates:', err);
      }
    };
    
    updateEstimates();
  }, [vaultAddress, sourceChainId, targetChainId, estimateGas, getEstimatedBridgeTime]);

  return {
    // State
    crossChainTx,
    isLoading,
    error,
    estimatedGas,
    estimatedBridgeTime,
    
    // Actions
    depositToVault,
    withdrawFromVault,
    clearTransaction,
    
    // Utilities
    getEstimatedBridgeTime,
  };
}
