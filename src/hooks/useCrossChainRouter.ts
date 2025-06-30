import { useState, useCallback, useEffect } from 'react';
import { Address, Chain, parseEther, formatEther } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { sepolia, avalancheFuji, baseSepolia } from 'wagmi/chains';
import { getContract } from 'viem';
import CrossChainRouterABI from '@/abis/CrossChainRouter.json';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

export type ChainId = typeof sepolia.id | typeof avalancheFuji.id | typeof baseSepolia.id;

export interface SupportedChain {
  id: ChainId;
  name: string;
  logo?: string;
  explorerUrl: string;
}

export const SUPPORTED_CHAINS: Record<number, SupportedChain> = {
  [sepolia.id]: {
    id: sepolia.id,
    name: 'Ethereum Sepolia',
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  [avalancheFuji.id]: {
    id: avalancheFuji.id,
    name: 'Avalanche Fuji',
    explorerUrl: 'https://testnet.snowtrace.io',
  },
  [baseSepolia.id]: {
    id: baseSepolia.id,
    name: 'Base Sepolia',
    explorerUrl: 'https://sepolia.basescan.org',
  },
};

export type TokenInfo = {
  address: Address;
  symbol: string;
  decimals: number;
  logo?: string;
};

export const SUPPORTED_TOKENS: Record<number, TokenInfo[]> = {
  [sepolia.id]: [
    {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC on Sepolia
      symbol: 'USDC',
      decimals: 6,
    },
  ],
  [avalancheFuji.id]: [
    {
      address: '0x5425890298aed601595a70AB815c96711a31Bc65', // USDC on Fuji
      symbol: 'USDC',
      decimals: 6,
    },
  ],
  [baseSepolia.id]: [
    {
      address: '0x036CbD53842b542BFa4B20E5D6dC935FDf9123A1', // USDC on Base Sepolia
      symbol: 'USDC',
      decimals: 6,
    },
  ],
};

export type CrossChainTransferStatus = 'idle' | 'approving' | 'sending' | 'pending' | 'completed' | 'failed';

export interface CrossChainTransfer {
  id: string;
  status: CrossChainTransferStatus;
  fromChain: ChainId;
  toChain: ChainId;
  token: Address;
  amount: string;
  txHash?: `0x${string}`;
  error?: string;
  timestamp: number;
}

export const useCrossChainRouter = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [transfers, setTransfers] = useState<CrossChainTransfer[]>([]);
  const [estimatedFee, setEstimatedFee] = useState<string>('0');
  const [estimatedTime, setEstimatedTime] = useState<number>(0);

  // Get the cross-chain router contract instance
  const getRouterContract = useCallback((chainId: ChainId) => {
    if (!publicClient || !walletClient) return null;
    
    const routerAddress = CONTRACT_ADDRESSES.crossChainRouter[chainId as keyof typeof CONTRACT_ADDRESSES.crossChainRouter];
    if (!routerAddress) return null;
    
    try {
      return getContract({
        address: routerAddress,
        abi: CrossChainRouterABI as any, // Type assertion to handle ABI type
        client: {
          public: publicClient,
          wallet: walletClient,
        },
      });
    } catch (error) {
      console.error('Error creating router contract:', error);
      return null;
    }
  }, [publicClient, walletClient]);

  // Estimate the fee for a cross-chain transfer
  const estimateTransferFee = useCallback(async (
    fromChain: ChainId,
    toChain: ChainId,
    token: Address,
    amount: string
  ): Promise<{
    fee: string;
    estimatedTime: number;
  }> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const router = getRouterContract(fromChain);
      if (!router) throw new Error('Router contract not found');
      
      // Get the fee for the transfer
      const feeResult = await router.read.estimateFee([
        toChain,
        token as `0x${string}`,
        parseEther(amount, 'wei'),
      ]);
      
      // Ensure fee is a bigint
      const fee = BigInt(feeResult?.toString() || '0');
      
      // Estimate time based on destination chain (in seconds)
      let time = 180; // Default 3 minutes
      if (toChain === avalancheFuji.id) time = 120; // 2 minutes for Avalanche
      if (toChain === baseSepolia.id) time = 60; // 1 minute for Base
      
      const feeFormatted = formatEther(fee);
      setEstimatedFee(feeFormatted);
      setEstimatedTime(time);
      
      return {
        fee: feeFormatted,
        estimatedTime: time,
      };
    } catch (err) {
      console.error('Error estimating fee:', err);
      setError(err instanceof Error ? err : new Error('Failed to estimate fee'));
      return {
        fee: '0',
        estimatedTime: 0,
      };
    } finally {
      setIsLoading(false);
    }
  }, [getRouterContract]);

  // Execute a cross-chain transfer
  const transfer = useCallback(async (
    fromChain: ChainId,
    toChain: ChainId,
    token: Address,
    amount: string,
    onSuccess?: (transfer: CrossChainTransfer) => void,
    onError?: (error: Error) => void
  ): Promise<CrossChainTransfer | undefined> => {
    if (!address) {
      const err = new Error('No connected wallet');
      setError(err);
      onError?.(err);
      return;
    }

    const transferId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transfer: CrossChainTransfer = {
      id: transferId,
      status: 'approving', // Start with approving status
      fromChain,
      toChain,
      token,
      amount,
      timestamp: Date.now(),
    };

    setTransfers(prev => [...prev, transfer]);
    setIsLoading(true);
    setError(null);

    try {
      const router = getRouterContract(fromChain);
      if (!router) throw new Error('Router contract not found');

      // Update status to sending
      transfer.status = 'sending';
      setTransfers(prev => prev.map(t => t.id === transferId ? { ...transfer } : t));

      // Execute the cross-chain transfer
      const txHash = await router.write.sendTokens([
        toChain,
        token as `0x${string}`,
        parseEther(amount, 'wei'),
        address, // Send to the same address on the destination chain
      ]);

      // Update with transaction hash
      transfer.txHash = txHash;
      transfer.status = 'pending';
      setTransfers(prev => prev.map(t => t.id === transferId ? { ...transfer } : t));

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      });

      if (receipt.status === 'success') {
        transfer.status = 'completed';
        setTransfers(prev => prev.map(t => t.id === transferId ? { ...transfer } : t));
        onSuccess?.(transfer);
        return transfer;
      } else {
        throw new Error('Transaction failed');
      }
    } catch (err) {
      console.error('Transfer error:', err);
      const error = err instanceof Error ? err : new Error('Transfer failed');
      transfer.status = 'failed';
      transfer.error = error.message;
      setTransfers(prev => prev.map(t => t.id === transferId ? { ...transfer } : t));
      setError(error);
      onError?.(error);
      return transfer;
    } finally {
      setIsLoading(false);
    }
  }, [address, getRouterContract, publicClient]);

  // Get supported tokens for a specific chain
  const getSupportedTokens = useCallback((chainId: ChainId): TokenInfo[] => {
    return SUPPORTED_TOKENS[chainId] || [];
  }, []);

  // Get transfer history for the current address
  const getTransferHistory = useCallback((): CrossChainTransfer[] => {
    if (!address) return [];
    return transfers.filter(t => t.status === 'completed' || t.status === 'failed');
  }, [address, transfers]);

  // Get pending transfers for the current address
  const getPendingTransfers = useCallback((): CrossChainTransfer[] => {
    if (!address) return [];
    return transfers.filter(t => t.status === 'pending' || t.status === 'sending' || t.status === 'approving');
  }, [address, transfers]);

  return {
    // State
    isLoading,
    error,
    transfers,
    estimatedFee,
    estimatedTime,
    
    // Methods
    estimateTransferFee,
    transfer,
    getSupportedTokens,
    getTransferHistory,
    getPendingTransfers,
    
    // Constants
    SUPPORTED_CHAINS,
  };
};

export default useCrossChainRouter;
