'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { Address, decodeEventLog, PublicClient, WalletClient } from 'viem';
import { useContractInstances } from '@/hooks/useContractInstances';
import { VaultInfo, VaultType } from '@/types/contracts';

type ContractInstances = ReturnType<typeof useContractInstances>;

interface VaultFactoryContract {
  address: Address;
  read: {
    name: (args: [Address]) => Promise<string>;
    symbol: (args: [Address]) => Promise<string>;
    asset: (args: [Address]) => Promise<Address>;
    totalAssets: (args: [Address]) => Promise<bigint>;
    totalSupply: (args: [Address]) => Promise<bigint>;
    owner: (args: [Address]) => Promise<Address>;
    getAllVaults: () => Promise<Address[]>;
  };
  write: {
    createVault: (vaultType: VaultType, name: string, symbol: string, asset: Address) => Promise<`0x${string}`>;
  };
  abi: any[];
}

interface VaultManagerContract {
  write: {
    deposit: (vaultAddress: Address, amount: bigint, user: Address) => Promise<`0x${string}`>;
    withdraw: (vaultAddress: Address, amount: bigint, user: Address, to: Address) => Promise<`0x${string}`>;
  };
  read: {
    userInfo: (args: [Address, Address]) => Promise<{ amount: bigint }>;
  };
}

interface AaveVaultContract {
  write: {
    deposit: (amount: bigint) => Promise<`0x${string}`>;
    withdraw: (amount: bigint) => Promise<`0x${string}`>;
    rebalance: () => Promise<`0x${string}`>;
  };
  read: {
    getTotalValue: () => Promise<bigint>;
  };
}

interface CrossChainRouterContract {
  write: {
    sendTokens: (destinationChainSelector: bigint, token: Address, amount: bigint) => Promise<`0x${string}`>;
  };
}

interface TreasuryAIManagerContract {
  write: {
    processDecision: (decisionId: string, strategy: Address, allocation: bigint, reason: string) => Promise<`0x${string}`>;
    performUpkeep: (performData: string) => Promise<`0x${string}`>;
  };
}

interface TokenBalance {
  token: Address;
  symbol: string;
  balance: bigint;
  decimals: number;
}

interface TransactionHistory {
  txHash: string;
  fromChain: string;
  toChain: string;
  token: string;
  tokenSymbol: string;
  amount: string;
  value: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
}

interface FeeEstimate {
  total: number;
  breakdown: { label: string; value: number }[];
}

interface ContractContextType {
  contracts: {
    vaultFactory: VaultFactoryContract | null;
    vaultManager: VaultManagerContract | null;
    aaveVault: AaveVaultContract | null;
    crossChainRouter: CrossChainRouterContract | null;
    treasuryAIManager: TreasuryAIManagerContract | null;
  };
  isLoading: boolean;
  error: Error | null;
  userVaults: VaultInfo[];
  allVaults: VaultInfo[];
  refreshVaults: () => Promise<void>;
  createVault: (params: {
    vaultType: VaultType;
    name: string;
    symbol: string;
    asset: Address;
  }) => Promise<Address | null>;
  depositToVault: (vaultAddress: Address, amount: bigint) => Promise<boolean>;
  withdrawFromVault: (vaultAddress: Address, amount: bigint) => Promise<boolean>;
  getUserInfo: (vaultAddress: Address) => Promise<{ amount: bigint } | null>;

  // Token Balances
  getTokenBalances: (tokens: { address: Address; symbol: string; decimals: number }[]) => Promise<TokenBalance[]>;
  getNativeBalance: (address: Address) => Promise<bigint>;
  fetchTokenBalances: (tokens: { address: Address; symbol: string; decimals: number }[]) => Promise<TokenBalance[]>;
  
  // Transaction History
  getTransactionHistory: (address: Address, limit?: number) => Promise<TransactionHistory[]>;
  fetchTransactionHistory: (address: Address, limit?: number) => Promise<TransactionHistory[]>;
  
  // Fee Estimation
  estimateCrossChainFees: (
    fromChainId: number,
    toChainId: number,
    token: Address,
    amount: bigint
  ) => Promise<FeeEstimate>;

  // AaveVault
  aaveDeposit: (amount: bigint) => Promise<boolean>;
  aaveWithdraw: (amount: bigint) => Promise<boolean>;
  aaveRebalance: () => Promise<boolean>;
  getAaveTotalValue: () => Promise<bigint | null>;

  // CrossChainRouter
  sendCrossChainTokens: (destinationChainSelector: bigint, token: Address, amount: bigint) => Promise<boolean>;

  // TreasuryAIManager
  processTreasuryDecision: (decisionId: string, strategy: Address, allocation: bigint, reason: string) => Promise<boolean>;
  performTreasuryUpkeep: (performData: string) => Promise<boolean>;
}

const defaultContext: ContractContextType = {
  contracts: {
    vaultFactory: null,
    vaultManager: null,
    aaveVault: null,
    crossChainRouter: null,
    treasuryAIManager: null,
  },
  isLoading: false,
  error: null,
  userVaults: [],
  allVaults: [],
  refreshVaults: async () => {},
  createVault: async () => null,
  depositToVault: async () => false,
  withdrawFromVault: async () => false,
  getUserInfo: async () => ({ amount: 0n }),
  getTokenBalances: async () => [],
  getNativeBalance: async () => 0n,
  fetchTokenBalances: async () => [],
  getTransactionHistory: async () => [],
  fetchTransactionHistory: async () => [],
  estimateCrossChainFees: async () => ({ total: 0, breakdown: [] }),
  aaveDeposit: async () => false,
  aaveWithdraw: async () => false,
  aaveRebalance: async () => false,
  getAaveTotalValue: async () => null,
  sendCrossChainTokens: async () => false,
  processTreasuryDecision: async () => false,
  performTreasuryUpkeep: async () => false,
};

const ContractContext = createContext<ContractContextType>(defaultContext);

export function ContractProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = useContractInstances();
  const publicClient = usePublicClient() as PublicClient;
  const { data: walletClient } = useWalletClient();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [userVaults, setUserVaults] = useState<VaultInfo[]>([]);
  const [allVaults, setAllVaults] = useState<VaultInfo[]>([]);
  
  // Cache for token balances and transaction history
  const [tokenBalances, setTokenBalances] = useState<Record<string, TokenBalance>>({});
  const [transactionHistory, setTransactionHistory] = useState<Record<string, TransactionHistory[]>>({});
  const [feeEstimates, setFeeEstimates] = useState<Record<string, FeeEstimate>>({});
  
  const vaultFactory = contracts?.vaultFactory as VaultFactoryContract | undefined;
  const vaultManager = contracts?.vaultManager as VaultManagerContract | undefined;
  const aaveVault = contracts?.aaveVault as AaveVaultContract | undefined;
  const crossChainRouter = contracts?.crossChainRouter as CrossChainRouterContract | undefined;
  const treasuryAIManager = contracts?.treasuryAIManager as TreasuryAIManagerContract | undefined;

  // Token Balance Functions
  const getTokenBalances = useCallback(async (tokens: { address: Address; symbol: string; decimals: number }[]): Promise<TokenBalance[]> => {
    if (!publicClient || !address) return [];
    
    try {
      const balancePromises = tokens.map(async (token) => {
        try {
          // For native token (e.g., ETH, MATIC)
          if (token.address === '0x0000000000000000000000000000000000000000') {
            const balance = await publicClient.getBalance({ address });
            return {
              token: token.address,
              symbol: token.symbol,
              balance,
              decimals: token.decimals,
            } as TokenBalance;
          }
          
          // For ERC20 tokens
          try {
            // First check if the contract exists by getting the bytecode
            const bytecode = await publicClient.getBytecode({ 
              address: token.address 
            });
            
            if (!bytecode || bytecode === '0x') {
              console.warn(`No contract found at address ${token.address} for token ${token.symbol}`);
              // Return zero balance for non-existent contracts
              return {
                token: token.address,
                symbol: token.symbol,
                balance: 0n,
                decimals: token.decimals,
              } as TokenBalance;
            }
            
            const balance = await publicClient.readContract({
              address: token.address,
              abi: [
                {
                  constant: true,
                  inputs: [{ name: '_owner', type: 'address' }],
                  name: 'balanceOf',
                  outputs: [{ name: 'balance', type: 'uint256' }],
                  type: 'function',
                },
              ],
              functionName: 'balanceOf',
              args: [address],
            });
            
            return {
              token: token.address,
              symbol: token.symbol,
              balance: balance as bigint,
              decimals: token.decimals,
            } as TokenBalance;
          } catch (error) {
            console.error(`Error fetching balance for token ${token.symbol}:`, error);
            // Return zero balance on error
            return {
              token: token.address,
              symbol: token.symbol,
              balance: 0n,
              decimals: token.decimals,
            } as TokenBalance;
          }
        } catch (error) {
          console.error(`Unexpected error processing token ${token.symbol}:`, error);
          return null;
        }
      });
      
      const balances = await Promise.all(balancePromises);
      
      // Filter out any null values and ensure we have TokenBalance[]
      const validBalances = balances.filter((b): b is TokenBalance => b !== null);
      
      // Update cache
      const newBalances = validBalances.reduce<Record<string, TokenBalance>>((acc, balance) => {
        acc[`${balance.token}_${address}`] = balance;
        return acc;
      }, {});
      
      setTokenBalances(prev => ({
        ...prev,
        ...newBalances,
      }));
      
      return validBalances;
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return [];
    }
  }, [publicClient, address]);
  
  // Alias for getTokenBalances for backward compatibility
  const fetchTokenBalances = getTokenBalances;
  
  const getNativeBalance = useCallback(async (address: Address) => {
    if (!publicClient) return 0n;
    return await publicClient.getBalance({ address });
  }, [publicClient]);
  
  // Transaction History
  const getTransactionHistory = useCallback(async (address: Address, limit = 10): Promise<TransactionHistory[]> => {
    if (!publicClient) return [];
    
    const cacheKey = `${address}_${limit}`;
    
    // Return cached data if available
    if (transactionHistory[cacheKey]) {
      return transactionHistory[cacheKey];
    }
    
    try {
      // In a real app, this would query a subgraph or indexer
      // For now, we'll return an empty array
      const history: TransactionHistory[] = [];
      
      // Update cache
      setTransactionHistory(prev => ({
        ...prev,
        [cacheKey]: history,
      }));
      
      return history;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }, [publicClient, transactionHistory]);
  
  // Alias for getTransactionHistory for backward compatibility
  const fetchTransactionHistory = getTransactionHistory;
  
  // Fee Estimation
  const estimateCrossChainFees = useCallback(async (
    fromChainId: number,
    toChainId: number,
    token: Address,
    amount: bigint
  ): Promise<FeeEstimate> => {
    const cacheKey = `${fromChainId}_${toChainId}_${token}_${amount}`;
    
    // Return cached estimate if available
    if (feeEstimates[cacheKey]) {
      return feeEstimates[cacheKey];
    }
    
    // In a real app, this would query the contract or an API for fee estimation
    // For now, we'll return a mock response
    const baseFee = 0.001; // Base fee in native token
    const amountFee = Number(amount) * 0.0001; // 0.01% of amount
    const total = baseFee + amountFee;
    
    const estimate = {
      total,
      breakdown: [
        { label: 'Base Fee', value: baseFee },
        { label: 'Amount Fee', value: amountFee },
      ],
    };
    
    // Update cache
    setFeeEstimates(prev => ({
      ...prev,
      [cacheKey]: estimate,
    }));
    
    return estimate;
  }, [feeEstimates]);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleError = useCallback((error: unknown, defaultMessage: string) => {
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    const errorObj = error instanceof Error ? error : new Error(defaultMessage);
    console.error(errorMessage, error);
    setError(errorObj);
    return errorObj;
  }, []);

  const resetError = useCallback(() => setError(null), []);

  const getDefaultVaultInfo = useCallback((vaultAddress: Address): VaultInfo => ({
    id: vaultAddress,
    address: vaultAddress,
    name: 'Vault',
    symbol: 'VLT',
    asset: '0x0000000000000000000000000000000000000000' as Address,
    totalAssets: BigInt(0),
    totalSupply: BigInt(0),
    owner: '0x0000000000000000000000000000000000000000' as Address,
    apy: 0,
    chainId: chainId || 1,
  }), [chainId]);

  const getVaultInfo = useCallback(async (vaultAddress: Address): Promise<VaultInfo> => {
    if (!vaultFactory || !publicClient || !chainId) {
      return getDefaultVaultInfo(vaultAddress);
    }

    try {
      const [name, symbol, asset, totalAssets, totalSupply, owner] = await Promise.all([
        vaultFactory.read.name([vaultAddress]).catch(() => 'Vault'),
        vaultFactory.read.symbol([vaultAddress]).catch(() => 'VLT'),
        vaultFactory.read.asset([vaultAddress]).catch(() => '0x0000000000000000000000000000000000000000' as Address),
        vaultFactory.read.totalAssets([vaultAddress]).catch(() => BigInt(0)),
        vaultFactory.read.totalSupply([vaultAddress]).catch(() => BigInt(0)),
        vaultFactory.read.owner([vaultAddress]).catch(() => '0x0000000000000000000000000000000000000000' as Address),
      ]);

      return {
        id: vaultAddress,
        address: vaultAddress,
        name: typeof name === 'string' ? name : 'Vault',
        symbol: typeof symbol === 'string' ? symbol : 'VLT',
        asset: typeof asset === 'string' ? asset as Address : '0x0000000000000000000000000000000000000000' as Address,
        totalAssets: typeof totalAssets === 'bigint' ? totalAssets : BigInt(0),
        totalSupply: typeof totalSupply === 'bigint' ? totalSupply : BigInt(0),
        owner: typeof owner === 'string' ? owner as Address : '0x0000000000000000000000000000000000000000' as Address,
        apy: 0, // TODO: Calculate APY based on historical performance
        chainId: chainId,
      };
    } catch (error) {
      handleError(error, `Failed to fetch info for vault ${vaultAddress}`);
      return getDefaultVaultInfo(vaultAddress);
    }
  }, [vaultFactory, publicClient, chainId, getDefaultVaultInfo, handleError]);

  // Fetch all vaults created by the factory
  const fetchAllVaults = useCallback(async () => {
    if (!vaultFactory || !publicClient || !isMounted) return [];

    try {
      setIsLoading(true);
      resetError();

      // Get vault count using the public client directly
      const vaultCount = await publicClient.readContract({
        address: vaultFactory.address,
        abi: Array.isArray(vaultFactory.abi) ? vaultFactory.abi : vaultFactory.abi.abi,
        functionName: 'getVaultCount',
        args: []
      }) as number;

      // Get all vault addresses using the public client
      const vaultAddresses: Address[] = [];
      const vaultABI = Array.isArray(vaultFactory.abi) ? vaultFactory.abi : vaultFactory.abi.abi;
      
      for (let i = 0; i < Number(vaultCount); i++) {
        try {
          const address = await publicClient.readContract({
            address: vaultFactory.address,
            abi: vaultABI,
            functionName: 'allVaults',
            args: [i]
          }) as Address;
          
          if (address && address !== '0x0000000000000000000000000000000000000000') {
            vaultAddresses.push(address);
          }
        } catch (error) {
          console.error(`Error fetching vault at index ${i}:`, error);
        }
      }

      // Process vaults in chunks to avoid RPC timeouts
      const CHUNK_SIZE = 5;
      let allVaults: VaultInfo[] = [];
      
      for (let i = 0; i < vaultAddresses.length; i += CHUNK_SIZE) {
        const chunk = vaultAddresses.slice(i, i + CHUNK_SIZE);
        const chunkPromises = chunk.map(address => 
          getVaultInfo(address).catch(error => {
            console.error(`Error fetching vault ${address}:`, error);
            return getDefaultVaultInfo(address);
          })
        );
        const chunkResults = await Promise.all(chunkPromises);
        allVaults = [...allVaults, ...chunkResults];
      }

      if (isMounted) {
        setAllVaults(allVaults);
        if (address) {
          const userVaults = allVaults.filter(vault => vault.owner === address);
          setUserVaults(userVaults);
        }
      }

      return allVaults;
    } catch (error) {
      console.error('Error fetching vaults:', error);
      handleError(error, 'Failed to fetch vaults');
      return [];
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [vaultFactory, publicClient, address, isMounted, getVaultInfo, getDefaultVaultInfo, resetError, handleError]);

  // Refresh vaults data
  const refreshVaults = useCallback(async () => {
    return fetchAllVaults();
  }, [fetchAllVaults]);

  // Vault actions
  const createVault = useCallback(async (params: {
    vaultType: VaultType;
    name: string;
    symbol: string;
    asset: Address;
  }): Promise<Address | null> => {
    if (!vaultFactory?.write || !walletClient?.account?.address || !publicClient) {
      handleError(new Error('Wallet not connected or missing required contracts'), 'Wallet connection error');
      return null;
    }

    try {
      setIsLoading(true);
      resetError();

      const { vaultType, name, symbol, asset } = params;
      const hash = await vaultFactory.write.createVault(
        vaultType,
        name,
        symbol,
        asset,
        { account: walletClient.account.address }
      );

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Find the VaultCreated event in the receipt
      const vaultCreatedEvent = receipt.logs.find(
        log => log.topics[0] === '0x...' // Replace with actual event signature
      );
      
      if (!vaultCreatedEvent) {
        throw new Error('Vault creation event not found');
      }

      // Decode the event to get the vault address
      const decodedEvent = decodeEventLog({
        abi: vaultFactory.abi,
        data: vaultCreatedEvent.data,
        topics: vaultCreatedEvent.topics as [string, string, string]
      });
      
      const vaultAddress = (decodedEvent as any).args?.vaultAddress as Address | undefined;
      
      if (!vaultAddress) {
        throw new Error('Vault address not found in event');
      }
      
      // Refresh the vaults list
      await refreshVaults();
      
      return vaultAddress;
    } catch (error) {
      handleError(error, 'Failed to create vault');
      return null;
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [vaultFactory, walletClient, publicClient, isMounted, handleError, resetError, refreshVaults]);

  const depositToVault = useCallback(async (
    vaultAddress: Address,
    amount: bigint
  ): Promise<boolean> => {
    if (!vaultManager?.write || !walletClient?.account?.address || !publicClient) {
      handleError(new Error('Wallet not connected or missing required contracts'), 'Wallet connection error');
      return false;
    }

    try {
      setIsLoading(true);
      resetError();

      const hash = await vaultManager.write.deposit(
        vaultAddress,
        amount,
        walletClient.account.address,
        { account: walletClient.account.address }
      );

      await publicClient.waitForTransactionReceipt({ hash });
      await refreshVaults();
      
      return true;
    } catch (error) {
      handleError(error, 'Failed to deposit to vault');
      return false;
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [vaultManager, walletClient, publicClient, isMounted, handleError, resetError, refreshVaults]);

  const withdrawFromVault = useCallback(async (
    vaultAddress: Address,
    amount: bigint
  ): Promise<boolean> => {
    if (!vaultManager?.write || !walletClient?.account?.address || !publicClient) {
      handleError(new Error('Wallet not connected or missing required contracts'), 'Wallet connection error');
      return false;
    }

    try {
      setIsLoading(true);
      resetError();

      const hash = await vaultManager.write.withdraw(
        vaultAddress,
        amount,
        walletClient.account.address,
        walletClient.account.address, // Withdraw to self
        { account: walletClient.account.address }
      );

      await publicClient.waitForTransactionReceipt({ hash });
      await refreshVaults();
      
      return true;
    } catch (error) {
      handleError(error, 'Failed to withdraw from vault');
      return false;
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [vaultManager, walletClient, publicClient, isMounted, handleError, resetError, refreshVaults]);

  const getUserInfo = useCallback(async (
    vaultAddress: Address
  ): Promise<{ amount: bigint } | null> => {
    if (!vaultManager?.read || !address) {
      handleError(new Error('Wallet not connected or missing required contracts'), 'Wallet connection error');
      return null;
    }

    try {
      resetError();
      const info = await vaultManager.read.userInfo([vaultAddress, address]);
      return info;
    } catch (error) {
      handleError(error, `Failed to get user info for vault ${vaultAddress}`);
      return null;
    }
  }, [vaultManager, address, handleError, resetError]);

  // AaveVault Actions
  const aaveDeposit = useCallback(async (amount: bigint): Promise<boolean> => {
    if (!aaveVault?.write || !walletClient?.account?.address || !publicClient) {
      handleError(new Error('Wallet not connected or missing AaveVault contract'), 'Wallet connection error');
      return false;
    }
    try {
      setIsLoading(true);
      resetError();
      const hash = await aaveVault.write.deposit(amount, { account: walletClient.account.address });
      await publicClient.waitForTransactionReceipt({ hash });
      await refreshVaults();
      return true;
    } catch (error) {
      handleError(error, 'Failed to deposit to Aave vault');
      return false;
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [aaveVault, walletClient, publicClient, isMounted, handleError, resetError, refreshVaults]);

  const aaveWithdraw = useCallback(async (amount: bigint): Promise<boolean> => {
    if (!aaveVault?.write || !walletClient?.account?.address || !publicClient) {
        handleError(new Error('Wallet not connected or missing AaveVault contract'), 'Wallet connection error');
        return false;
    }
    try {
        setIsLoading(true);
        resetError();
        const hash = await aaveVault.write.withdraw(amount, { account: walletClient.account.address });
        await publicClient.waitForTransactionReceipt({ hash });
        await refreshVaults();
        return true;
    } catch (error) {
        handleError(error, 'Failed to withdraw from Aave vault');
        return false;
    } finally {
        if (isMounted) {
            setIsLoading(false);
        }
    }
  }, [aaveVault, walletClient, publicClient, isMounted, handleError, resetError, refreshVaults]);

  const aaveRebalance = useCallback(async (): Promise<boolean> => {
    if (!aaveVault?.write || !walletClient?.account?.address || !publicClient) {
        handleError(new Error('Wallet not connected or missing AaveVault contract'), 'Wallet connection error');
        return false;
    }
    try {
        setIsLoading(true);
        resetError();
        const hash = await aaveVault.write.rebalance({ account: walletClient.account.address });
        await publicClient.waitForTransactionReceipt({ hash });
        return true;
    } catch (error) {
        handleError(error, 'Failed to rebalance Aave vault');
        return false;
    } finally {
        if (isMounted) {
            setIsLoading(false);
        }
    }
  }, [aaveVault?.write, publicClient, walletClient?.account?.address, handleError, isMounted]);

  const getAaveTotalValue = useCallback(async (): Promise<bigint | null> => {
    if (!aaveVault?.read) {
      handleError(new Error('AaveVault contract not available'), 'Contract error');
      return null;
    }
    try {
      const totalValue = await aaveVault.read.getTotalValue();
      return totalValue;
    } catch (error) {
      handleError(error, 'Failed to get Aave vault total value');
      return null;
    }
  }, [aaveVault?.read, handleError]);

  // CrossChainRouter Actions
  const sendCrossChainTokens = useCallback(async (destinationChainSelector: bigint, token: Address, amount: bigint): Promise<boolean> => {
    if (!crossChainRouter?.write || !walletClient?.account?.address || !publicClient) {
        handleError(new Error('Wallet not connected or missing CrossChainRouter contract'), 'Wallet connection error');
        return false;
    }
    try {
        setIsLoading(true);
        resetError();
        const hash = await crossChainRouter.write.send([destinationChainSelector, token, amount], { account: walletClient.account.address });
        await publicClient.waitForTransactionReceipt({ hash });
        return true;
    } catch (error) {
        handleError(error, 'Failed to send cross-chain tokens');
        return false;
    } finally {
        if (isMounted) {
            setIsLoading(false);
        }
    }
  }, [crossChainRouter, walletClient, publicClient, isMounted, handleError, resetError]);


  // TreasuryAIManager Actions
  const processTreasuryDecision = useCallback(async (decisionId: string, strategy: Address, allocation: bigint, reason: string): Promise<boolean> => {
    if (!treasuryAIManager?.write || !walletClient?.account?.address || !publicClient) {
        handleError(new Error('Wallet not connected or missing TreasuryAIManager contract'), 'Wallet connection error');
        return false;
    }
    try {
        setIsLoading(true);
        resetError();
        const hash = await treasuryAIManager.write.processDecision(decisionId, strategy, allocation, reason, { account: walletClient.account.address });
        await publicClient.waitForTransactionReceipt({ hash });
        return true;
    } catch (error) {
        handleError(error, 'Failed to process treasury decision');
        return false;
    } finally {
        if (isMounted) {
            setIsLoading(false);
        }
    }
  }, [treasuryAIManager, walletClient, publicClient, isMounted, handleError, resetError]);

  const performTreasuryUpkeep = useCallback(async (performData: string): Promise<boolean> => {
    if (!treasuryAIManager?.write || !walletClient?.account?.address || !publicClient) {
        handleError(new Error('Wallet not connected or missing TreasuryAIManager contract'), 'Wallet connection error');
        return false;
    }
    try {
        setIsLoading(true);
        resetError();
        const hash = await treasuryAIManager.write.performUpkeep(performData, { account: walletClient.account.address });
        await publicClient.waitForTransactionReceipt({ hash });
        return true;
    } catch (error) {
        handleError(error, 'Failed to perform treasury upkeep');
        return false;
    } finally {
        if (isMounted) {
            setIsLoading(false);
        }
    }
  }, [treasuryAIManager, walletClient, publicClient, isMounted, handleError, resetError]);

  // Initial fetch and setup effect
  useEffect(() => {
    let isActive = true;
    
    const init = async () => {
      if (!isActive || !isMounted) return;
      
      try {
        await fetchAllVaults();
      } catch (error) {
        if (isActive) {
          handleError(error, 'Failed to fetch vaults');
        }
      }
    };
    
    init();
    
    return () => {
      setIsMounted(false);
    };
  }, [fetchAllVaults, isMounted]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo((): ContractContextType => ({
    contracts: {
      vaultFactory: vaultFactory || null,
      vaultManager: vaultManager || null,
      aaveVault: aaveVault || null,
      crossChainRouter: crossChainRouter || null,
      treasuryAIManager: treasuryAIManager || null,
    },
    isLoading,
    error,
    userVaults,
    allVaults,
    refreshVaults: async () => {
      if (isMounted) {
        await fetchAllVaults();
      }
    },
    createVault: async (params) => {
      if (!vaultFactory?.write || !walletClient?.account?.address) return null;
      return createVault(params);
    },
    depositToVault: async (vaultAddress, amount) => {
      if (!vaultManager?.write || !walletClient?.account?.address) return false;
      return depositToVault(vaultAddress, amount);
    },
    withdrawFromVault: async (vaultAddress, amount) => {
      if (!vaultManager?.write || !walletClient?.account?.address) return false;
      return withdrawFromVault(vaultAddress, amount);
    },
    getUserInfo: async (vaultAddress) => {
      if (!vaultManager?.read || !walletClient?.account?.address) return { amount: 0n };
      return getUserInfo(vaultAddress);
    },
    getTokenBalances: async (tokens) => {
      if (!publicClient || !walletClient?.account?.address) return [];
      return getTokenBalances(tokens);
    },
    fetchTokenBalances: async (tokens) => {
      if (!publicClient || !walletClient?.account?.address) return [];
      return getTokenBalances(tokens);
    },
    getNativeBalance: async (address) => {
      if (!publicClient) return 0n;
      return getNativeBalance(address);
    },
    getTransactionHistory: async (address, limit = 10) => {
      if (!publicClient) return [];
      return getTransactionHistory(address, limit);
    },
    fetchTransactionHistory: async (address, limit = 10) => {
      if (!publicClient) return [];
      return getTransactionHistory(address, limit);
    },
    estimateCrossChainFees: async (fromChainId, toChainId, token, amount) => {
      return estimateCrossChainFees(fromChainId, toChainId, token, amount);
    },
    aaveDeposit: async (amount) => {
      if (!aaveVault?.write || !walletClient?.account?.address) return false;
      return aaveDeposit(amount);
    },
    aaveWithdraw: async (amount) => {
      if (!aaveVault?.write || !walletClient?.account?.address) return false;
      return aaveWithdraw(amount);
    },
    aaveRebalance: async () => {
      if (!aaveVault?.write || !walletClient?.account?.address) return false;
      return aaveRebalance();
    },
    getAaveTotalValue: async () => {
      if (!aaveVault?.read) return null;
      try {
        return await aaveVault.read.getTotalValue();
      } catch (error) {
        console.error('Error getting Aave total value:', error);
        return null;
      }
    },
    sendCrossChainTokens: async (destinationChainSelector, token, amount) => {
      if (!crossChainRouter?.write || !walletClient?.account?.address) return false;
      return sendCrossChainTokens(destinationChainSelector, token, amount);
    },
    processTreasuryDecision: async (decisionId, strategy, allocation, reason) => {
      if (!treasuryAIManager?.write || !walletClient?.account?.address) return false;
      return processTreasuryDecision(decisionId, strategy, allocation, reason);
    },
    performTreasuryUpkeep: async (performData) => {
      if (!treasuryAIManager?.write || !walletClient?.account?.address) return false;
      return performTreasuryUpkeep(performData);
    },
  }), [
    vaultFactory,
    vaultManager,
    aaveVault,
    crossChainRouter,
    treasuryAIManager,
    isLoading,
    error,
    userVaults,
    allVaults,
    fetchAllVaults,
    createVault,
    depositToVault,
    withdrawFromVault,
    getUserInfo,
    getTokenBalances,
    getNativeBalance,
    getTransactionHistory,
    estimateCrossChainFees,
    aaveDeposit,
    aaveWithdraw,
    aaveRebalance,
    sendCrossChainTokens,
    processTreasuryDecision,
    performTreasuryUpkeep,
    publicClient,
    walletClient?.account?.address,
    isMounted
  ]);

  return (
    <ContractContext.Provider value={contextValue}>
      {children}
    </ContractContext.Provider>
  );
}

// Define the hook
const useContracts = () => useContext(ContractContext);

// Export the hook as a named export
export { useContracts };

// Export the context as default
export default ContractContext;
