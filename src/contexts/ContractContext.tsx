'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { useContractInstances } from '@/hooks/useContracts';
import { Address, Hash, Hex, Chain, formatEther, parseEther, zeroAddress } from 'viem';
import { useToast } from '@/components/ui/use-toast';
import { decodeEventLog } from 'viem/utils';
import { VaultType, VaultInfo } from '@/types/vault';
import { TokenBalance, TransactionHistory } from '@/types/tokens';
import { FeeEstimate } from '@/types/fees';
import ERC20_ABI from '@/abis/ERC20.json';

// Define ChainConfig locally to avoid import conflicts
interface ChainConfig {
  id: number;
  name: string;
  chainSelector: bigint;
  routerAddress: Address;
  nativeToken: string;
  explorerUrl: string;
  icon?: string;
  logo?: string;
}

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  11155111: { // Ethereum Sepolia
    id: 11155111,
    name: 'Ethereum Sepolia',
    chainSelector: 16015286609057818161n,
    routerAddress: '0xD1d6EE0c5309A09Df9ca4c2936956A49cca9eb71',
    nativeToken: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io',
    logo: '/icons/chains/ethereum.png',
    icon: '🔷'
  },
  43113: { // Avalanche Fuji
    id: 43113,
    name: 'Avalanche Fuji',
    chainSelector: 14767482510784806043n,
    routerAddress: '0x6444f16e29Bf33a8C9da2B89E472b58Bafe41b9c',
    nativeToken: 'AVAX',
    explorerUrl: 'https://testnet.snowtrace.io',
    logo: '/icons/chains/avalanche.png',
    icon: '⛓️'
  },
  84532: { // Base Sepolia
    id: 84532,
    name: 'Base Sepolia',
    chainSelector: 10344971235874465080n,
    routerAddress: '0x7CC324d15E5fF17c43188fB63b462B9a79dA68f6',
    nativeToken: 'ETH',
    explorerUrl: 'https://sepolia.basescan.org',
    logo: '/icons/chains/base.png',
    icon: '🟦'
  }
};

interface ChainConfig {
  id: number;
  name: string;
  chainSelector: bigint;
  routerAddress: Address;
  nativeToken: string;
  explorerUrl: string;
  logo?: string;
};

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
  address: `0x${string}`;
  abi: any[];
  read: {
    getTotalValue: () => Promise<bigint>;
    totalAssets: () => Promise<bigint>;
    getCurrentAllocation: () => Promise<bigint>;
    getTotalDeposits: () => Promise<bigint>;
    getTotalWithdrawals: () => Promise<bigint>;
    UNDERLYING_TOKEN: () => Promise<`0x${string}`>;
    ATOKEN: () => Promise<`0x${string}`>;
    POOL: () => Promise<`0x${string}`>;
    paused: () => Promise<boolean>;
    owner: () => Promise<`0x${string}`>;
    requiresOwner: () => Promise<boolean>;
  };
  write: {
    deposit: (args: [bigint]) => Promise<`0x${string}`>;
  };
  // Add direct method access for backward compatibility
  getTotalValue?: () => Promise<bigint>;
  totalAssets?: () => Promise<bigint>;
  getCurrentAllocation?: () => Promise<bigint>;
  getTotalDeposits?: () => Promise<bigint>;
  getTotalWithdrawals?: () => Promise<bigint>;
  UNDERLYING_TOKEN?: () => Promise<`0x${string}`>;
  ATOKEN?: () => Promise<`0x${string}`>;
  POOL?: () => Promise<`0x${string}`>;
  paused?: () => Promise<boolean>;
  owner?: () => Promise<`0x${string}`>;
  requiresOwner?: () => Promise<boolean>;
  deposit?: (amount: bigint) => Promise<`0x${string}`>;
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

type ContractContextType = {
  contracts: {
    vaultFactory: VaultFactoryContract | null;
    vaultManager: VaultManagerContract | null;
    aaveVault: AaveVaultContract | null;
    crossChainRouter: CrossChainRouterContract | null;
    treasuryAIManager: TreasuryAIManagerContract | null;
  };
  publicClient: any;
  walletClient: any;
  isLoading: boolean;
  error: Error | null;
  userVaults: VaultInfo[];
  allVaults: VaultInfo[];
  refreshVaults: () => Promise<void>;
  createVault: (params: { vaultType: VaultType; name: string; symbol: string; asset: Address }) => Promise<Address | null>;
  depositToVault: (vaultAddress: Address, amount: bigint) => Promise<boolean>;
  withdrawFromVault: (vaultAddress: Address, amount: bigint) => Promise<boolean>;
  getUserInfo: (vaultAddress: Address) => Promise<{ amount: bigint } | null>;
  getTokenBalances: (tokens: { address: Address; symbol: string; decimals: number }[]) => Promise<TokenBalance[]>;
  getNativeBalance: (address: Address) => Promise<bigint>;
  fetchTokenBalances: (tokens: { address: Address; symbol: string; decimals: number }[]) => Promise<TokenBalance[]>;
  getTransactionHistory: (address: Address, limit?: number) => Promise<TransactionHistory[]>;
  fetchTransactionHistory: (address: Address, limit?: number) => Promise<TransactionHistory[]>;
  estimateCrossChainFees: (fromChainId: number, toChainId: number, token: Address, amount: bigint) => Promise<FeeEstimate>;
  aaveDeposit: (amount: bigint, tokenAddress: Address) => Promise<boolean>;
  aaveWithdraw: (amount: bigint) => Promise<boolean>;
  aaveRebalance: () => Promise<boolean>;
  getAaveTotalValue: () => Promise<bigint | null>;
  sendCrossChainTokens: (destinationChainId: number, token: Address, amount: bigint) => Promise<boolean>;
  processTreasuryDecision: (decisionId: string, strategy: Address, allocation: bigint, reason: string) => Promise<boolean>;
  performTreasuryUpkeep: (performData: string) => Promise<boolean>;
  supportedChains: Record<number, ChainConfig>;
  estimateCrossChainFee: (destinationChainId: number, token: Address, amount: bigint) => Promise<bigint>;
  estimateCrossChainFee: (
    destinationChainId: number,
    token: Address,
    amount: bigint
  ) => Promise<bigint>;
  sendCrossChainTokens: (
    destinationChainId: number,
    token: Address,
    amount: bigint
  ) => Promise<boolean>;
  getChainConfig: (chainId: number) => ChainConfig | undefined;

}

const defaultContext: ContractContextType = {
  contracts: {
    vaultFactory: null,
    vaultManager: null,
    aaveVault: null,
    crossChainRouter: null,
    treasuryAIManager: null,
  },
  publicClient: null as any, // TODO: Initialize with proper public client
  walletClient: null as any, // TODO: Initialize with proper wallet client
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
  const { toast } = useToast();

  // Add your contract instances and state here
  const contracts = useContractInstances();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [userVaults, setUserVaults] = useState<VaultInfo[]>([]);
  const [allVaults, setAllVaults] = useState<VaultInfo[]>([]);
  const [tokenBalances, setTokenBalances] = useState<Record<string, TokenBalance>>({});
  const [transactionHistory, setTransactionHistory] = useState<Record<string, TransactionHistory[]>>({});
  const [feeEstimates, setFeeEstimates] = useState<Record<string, FeeEstimate>>({});
  
  // Memoize contract instances
  const { vaultFactory, vaultManager, aaveVault, crossChainRouter, treasuryAIManager } = useMemo(() => ({
    vaultFactory: contracts?.vaultFactory as VaultFactoryContract | undefined,
    vaultManager: contracts?.vaultManager as VaultManagerContract | undefined,
    aaveVault: contracts?.aaveVault as AaveVaultContract | undefined,
    crossChainRouter: contracts?.crossChainRouter as CrossChainRouterContract | undefined,
    treasuryAIManager: contracts?.treasuryAIManager as TreasuryAIManagerContract | undefined,
  }), [contracts]);

  // Set isMounted after component mounts
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Token Balance Functions
  const getTokenBalances = useCallback(async (tokens: { address: Address; symbol: string; decimals: number }[]): Promise<TokenBalance[]> => {
    if (!publicClient || !address || !isMounted) return [];
    
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

  // Fetch all vaults from the contract
  const fetchAllVaults = useCallback(async () => {
    if (!vaultFactory) return [];
    
    try {
      const vaultAddresses = await vaultFactory.read.getAllVaults();
      const vaults = await Promise.all(
        vaultAddresses.map(async (address: Address) => {
          try {
            const [name, symbol, asset, totalAssets, totalSupply, owner] = await Promise.all([
              vaultFactory.read.name([address]),
              vaultFactory.read.symbol([address]),
              vaultFactory.read.asset([address]),
              vaultFactory.read.totalAssets([address]),
              vaultFactory.read.totalSupply([address]),
              vaultFactory.read.owner([address])
            ]);

            return {
              id: address,
              address,
              name,
              symbol,
              asset,
              totalAssets: totalAssets.toString(),
              totalSupply: totalSupply.toString(),
              owner,
              type: VaultType.STANDARD, // Default type, can be updated based on vault data
            };
          } catch (error) {
            console.error(`Error fetching vault ${address}:`, error);
            return null;
          }
        })
      );

      return vaults.filter((vault): vault is VaultInfo => vault !== null);
    } catch (error) {
      console.error('Error fetching vaults:', error);
      return [];
    }
  }, [vaultFactory]);

  // Refresh both user and all vaults
  const refreshVaults = useCallback(async () => {
    if (!isMounted) return;
    
    try {
      setIsLoading(true);
      resetError();
      
      // Fetch all vaults
      const allVaults = await fetchAllVaults();
      
      // Update state with the new vaults
      if (isMounted) {
        setAllVaults(allVaults);
        
        // Filter user's vaults if address is available
        if (address) {
          const userVaults = allVaults.filter(
            vault => vault.owner.toLowerCase() === address.toLowerCase()
          );
          setUserVaults(userVaults);
        }
      }
    } catch (error) {
      handleError(error, 'Failed to refresh vaults');
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [address, fetchAllVaults, isMounted, resetError, handleError]);

  // Fetch all vaults and update state
  const fetchVaults = useCallback(async () => {
    if (!vaultFactory || !vaultManager || !address || !isMounted) return;
    
    const loadVaults = async () => {
      try {
        // Get all vaults
        const vaultAddresses = await vaultFactory.read.getAllVaults();
        
        // Get vault details for each vault
        const vaultsPromises = vaultAddresses.map(async (vaultAddress) => {
          try {
            const [name, symbol, asset, totalAssets, totalSupply] = await Promise.all([
              vaultFactory.read.name([vaultAddress]),
              vaultFactory.read.symbol([vaultAddress]),
              vaultFactory.read.asset([vaultAddress]),
              vaultFactory.read.totalAssets([vaultAddress]),
              vaultFactory.read.totalSupply([vaultAddress])
            ]);
            
            return {
              address: vaultAddress,
              name,
              symbol,
              asset,
              totalAssets: totalAssets.toString(),
              totalSupply: totalSupply.toString(),
            } as VaultInfo;
          } catch (err) {
            console.error(`Error fetching vault ${vaultAddress}:`, err);
            return null;
          }
        });
        
        const allVaults = (await Promise.all(vaultsPromises)).filter(Boolean) as VaultInfo[];
        
        // Get user's vaults
        const userVaultsPromises = allVaults.map(async (vault) => {
          try {
            const userInfo = await vaultManager.read.userInfo([vault.address, address]);
            return userInfo.amount > 0n ? vault : null;
          } catch (err) {
            console.error(`Error fetching user info for vault ${vault.address}:`, err);
            return null;
          }
        });
        
        const userVaults = (await Promise.all(userVaultsPromises)).filter(Boolean) as VaultInfo[];
        
        if (isMounted) {
          setAllVaults(allVaults);
          setUserVaults(userVaults);
        }
      } catch (err) {
        console.error('Error refreshing vaults:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to refresh vaults'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Set loading state and start loading
    setIsLoading(true);
    loadVaults();
  }, [vaultFactory, vaultManager, address, isMounted]);

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
  const aaveDeposit = useCallback(async (amount: bigint, tokenAddress: string | Address): Promise<boolean> => {
    if (!walletClient?.account?.address || !publicClient || !aaveVault?.address) {
      const error = new Error('Missing required dependencies');
      console.error('Aave deposit error - missing dependencies');
      handleError?.(error, 'Initialization error');
      return false;
    }

    try {
      setIsLoading?.(true);
      resetError?.();
      
      // Implementation for aaveWithdraw
      const estimateCrossChainFee = useCallback(async (
    destinationChainId: number,
    token: Address,
    amount: bigint
  ): Promise<bigint> => {
    if (!contracts.crossChainRouter?.read) {
      throw new Error('CrossChainRouter not available');
    }

    const destinationChain = SUPPORTED_CHAINS[destinationChainId];
    if (!destinationChain) {
      throw new Error(`Unsupported destination chain: ${destinationChainId}`);
    }

    try {
      return await publicClient.readContract({
        address: contracts.crossChainRouter.address,
        abi: contracts.crossChainRouter.abi,
        functionName: 'getFee',
        args: [destinationChain.chainSelector, token, amount]
      }) as bigint;
    } catch (error) {
      console.error('Error estimating cross-chain fee:', error);
      throw new Error('Failed to estimate cross-chain fee');
    }
  }, [contracts.crossChainRouter, publicClient]);

  const sendCrossChainTokens = useCallback(async (
    destinationChainId: number,
    token: Address,
    amount: bigint
  ): Promise<boolean> => {
    if (!contracts.crossChainRouter?.write || !walletClient?.account?.address) {
      throw new Error('CrossChainRouter or wallet client not available');
    }

    const destinationChain = SUPPORTED_CHAINS[destinationChainId];
    if (!destinationChain) {
      throw new Error(`Unsupported destination chain: ${destinationChainId}`);
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Initiating cross-chain token transfer...', {
        destinationChain: destinationChain.name,
        token,
        amount: amount.toString(),
        from: walletClient.account.address
      });

      // 1. Approve token transfer if needed
      const tokenContract = {
        address: token,
        abi: [
          {
            constant: false,
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            name: 'approve',
            outputs: [{ type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function'
          },
          {
            constant: true,
            inputs: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' }
            ],
            name: 'allowance',
            outputs: [{ type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function'
          }
        ] as const,
      };

      const allowance = await publicClient.readContract({
        ...tokenContract,
        functionName: 'allowance',
        args: [walletClient.account.address, contracts.crossChainRouter.address],
      });

      if (allowance < amount) {
        console.log('Approving token spend...');
        const approveTx = await walletClient.writeContract({
          ...tokenContract,
          functionName: 'approve',
          args: [contracts.crossChainRouter.address, amount],
          account: walletClient.account.address,
        });
        
        console.log('Waiting for approval transaction...', { txHash: approveTx });
        await publicClient.waitForTransactionReceipt({
          hash: approveTx,
        });
        console.log('Approval transaction confirmed');
      }

      // 2. Get fee estimate
      const fee = await estimateCrossChainFee(destinationChainId, token, amount);
      console.log('Estimated fee:', fee.toString());

      // 3. Send cross-chain transfer
      console.log('Sending cross-chain transfer...');
      const txHash = await walletClient.writeContract({
        address: contracts.crossChainRouter.address,
        abi: contracts.crossChainRouter.abi,
        functionName: 'sendTokens',
        args: [destinationChain.chainSelector, token, amount],
        account: walletClient.account.address,
        value: fee,
        gas: 500000n, // Adjust gas limit as needed
      });

      console.log('Cross-chain transfer transaction hash:', txHash);
      
      // Wait for the transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status === 'success') {
        console.log('Cross-chain transfer successful');
        toast({
          title: 'Transfer Successful',
          description: 'Your cross-chain transfer has been initiated.',
        });
        return true;
      } else {
        throw new Error('Transaction reverted');
      }
    } catch (error: unknown) {
      console.error('Cross-chain transfer error:', error);
      
      // Try to extract revert reason
      let errorMessage = 'Failed to send cross-chain tokens';
      const err = error as any;
      
      if (err?.cause?.data?.errorName) {
        errorMessage = `Revert: ${err.cause.data.errorName} - ${err.cause.data.errorArgs?.join(', ')}`;
      } else if (err?.message?.includes('revert')) {
        errorMessage = err.message;
      } else if (err?.shortMessage) {
        errorMessage = err.shortMessage;
      }
      
      const errorObj = new Error(errorMessage);
      setError(errorObj);
      toast({
        title: 'Transfer Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [contracts.crossChainRouter, walletClient, publicClient, isMounted, toast, estimateCrossChainFee]);

  const getChainConfig = useCallback((chainId: number): ChainConfig | undefined => {
    return SUPPORTED_CHAINS[chainId];
  }, []);   
      return true;
    } catch (error) {
      console.error('Aave withdraw error:', error);
      handleError?.(error as Error, 'Failed to withdraw from Aave vault');
      return false;
    } finally {
      if (isMounted) {
        setIsLoading?.(false);
      }
    }
  }, [aaveVault, walletClient, isMounted, setIsLoading, resetError, handleError]);

  const aaveWithdraw = useCallback(async (amount: bigint): Promise<boolean> => {
    if (!aaveVault?.write || !walletClient?.account?.address) return false;
    
    try {
      setIsLoading?.(true);
      resetError?.();
      
      // Implementation for aaveWithdraw
      // Add your withdraw logic here
      
      return true;
    } catch (error) {
      console.error('Aave withdraw error:', error);
      handleError?.(error as Error, 'Failed to withdraw from Aave vault');
      return false;
    } finally {
      if (isMounted) {
        setIsLoading?.(false);
      }
    }
  }, [aaveVault, walletClient, isMounted, setIsLoading, resetError, handleError]);

  const aaveRebalance = useCallback(async (): Promise<boolean> => {
    if (!aaveVault?.write || !walletClient?.account?.address) return false;
    
    try {
      setIsLoading?.(true);
      resetError?.();
      
      // Implementation for aaveRebalance
      // Add your rebalance logic here
      
      return true;
    } catch (error) {
      console.error('Aave rebalance error:', error);
      handleError?.(error as Error, 'Failed to rebalance Aave vault');
      return false;
    } finally {
      if (isMounted) {
        setIsLoading?.(false);
      }
    }
  }, [aaveVault, walletClient, isMounted, setIsLoading, resetError, handleError]);

  const getAaveTotalValue = useCallback(async (): Promise<bigint | null> => {
    if (!aaveVault?.read || !aaveVault?.address) {
      console.log('AaveVault not available');
      return null;
    }
    
    try {
      // First check if the functions exist on the contract instance
      const hasGetTotalValue = typeof aaveVault.read.getTotalValue === 'function';
      const hasTotalAssets = typeof aaveVault.read.totalAssets === 'function';

      if (hasGetTotalValue) {
        try {
          return await aaveVault.read.getTotalValue();
        } catch (err) {
          console.warn('Error calling getTotalValue, falling back to totalAssets:', err);
        }
      }

      if (hasTotalAssets) {
        try {
          return await aaveVault.read.totalAssets();
        } catch (err) {
          console.warn('Error calling totalAssets:', err);
        }
      }
      
      console.warn('No valid total value function found on AaveVault at', aaveVault.address);
      return 0n; // Return 0 instead of null to prevent UI issues
    } catch (error) {
      console.error('Error getting Aave total value:', error);
      return 0n; // Return 0 instead of null to prevent UI issues
    }
  }, [aaveVault]);

  const sendCrossChainTokens = useCallback(async (
    destinationChainSelector: bigint, 
    token: Address, 
    amount: bigint
  ): Promise<boolean> => {
    if (!crossChainRouter?.write || !walletClient?.account?.address) {
      console.error('CrossChainRouter or wallet client not available');
      return false;
    }
    
    try {
      setIsLoading?.(true);
      resetError?.();
      
      console.log('Initiating cross-chain token transfer...', {
        destinationChainSelector: destinationChainSelector.toString(),
        token,
        amount: amount.toString(),
        from: walletClient.account.address
      });

      // Check token allowance and approve if needed
      const tokenContract = {
        address: token,
        abi: ERC20_ABI,
      };

      const allowance = await publicClient.readContract({
        ...tokenContract,
        functionName: 'allowance',
        args: [walletClient.account.address, crossChainRouter.address],
      });

      if (allowance < amount) {
        console.log('Approving token spend...');
        const approveTx = await walletClient.writeContract({
          ...tokenContract,
          functionName: 'approve',
          args: [crossChainRouter.address, amount],
          account: walletClient.account.address,
        });
        
        console.log('Waiting for approval transaction...', { txHash: approveTx });
        await publicClient.waitForTransactionReceipt({
          hash: approveTx,
        });
        console.log('Approval transaction confirmed');
      }

      // Prepare the cross-chain transfer
      console.log('Sending cross-chain transfer...');
      const txHash = await walletClient.writeContract({
        address: crossChainRouter.address,
        abi: crossChainRouter.abi,
        functionName: 'sendTokens',
        args: [destinationChainSelector, token, amount],
        account: walletClient.account.address,
        gas: 500000n, // Adjust gas limit as needed
      });

      console.log('Cross-chain transfer transaction hash:', txHash);
      
      // Wait for the transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status === 'success') {
        console.log('Cross-chain transfer successful');
        return true;
      } else {
        throw new Error('Transaction reverted');
      }
    } catch (error: unknown) {
      console.error('Cross-chain transfer error:', error);
      
      // Try to extract revert reason
      let errorMessage = 'Failed to send cross-chain tokens';
      const err = error as any;
      
      if (err?.cause?.data?.errorName) {
        errorMessage = `Revert: ${err.cause.data.errorName} - ${err.cause.data.errorArgs?.join(', ')}`;
      } else if (err?.message?.includes('revert')) {
        errorMessage = err.message;
      } else if (err?.shortMessage) {
        errorMessage = err.shortMessage;
      }
      
      handleError?.(new Error(errorMessage), 'Failed to send cross-chain tokens');
      return false;
    } finally {
      if (isMounted) {
        setIsLoading?.(false);
      }
    }
  }, [crossChainRouter, walletClient, isMounted, setIsLoading, resetError, handleError]);

  const processTreasuryDecision = useCallback(async (
    decisionId: string, 
    strategy: Address, 
    allocation: bigint, 
    reason: string
  ): Promise<boolean> => {
    if (!treasuryAIManager?.write || !walletClient?.account?.address) return false;
    
    try {
      setIsLoading?.(true);
      resetError?.();
      
      // Implementation for processTreasuryDecision
      // Add your treasury decision processing logic here
      
      return true;
    } catch (error) {
      console.error('Treasury decision processing error:', error);
      handleError?.(error as Error, 'Failed to process treasury decision');
      return false;
    } finally {
      if (isMounted) {
        setIsLoading?.(false);
      }
    }
  }, [treasuryAIManager, walletClient, isMounted, setIsLoading, resetError, handleError]);

  const performTreasuryUpkeep = useCallback(async (performData: string): Promise<boolean> => {
    if (!treasuryAIManager?.write || !walletClient?.account?.address) return false;
    
    try {
      setIsLoading?.(true);
      resetError?.();
      
      // Implementation for performTreasuryUpkeep
      // Add your treasury upkeep logic here
      
      return true;
    } catch (error) {
      console.error('Treasury upkeep error:', error);
      handleError?.(error as Error, 'Failed to perform treasury upkeep');
      return false;
    } finally {
      if (isMounted) {
        setIsLoading?.(false);
      }
    }
  }, [treasuryAIManager, walletClient, isMounted, setIsLoading, resetError, handleError]);

  const contextValue: ContractContextType = useMemo(() => ({
    contracts: {
      vaultFactory: vaultFactory ?? null,
      vaultManager: vaultManager ?? null,
      aaveVault: aaveVault ?? null,
      crossChainRouter: crossChainRouter ?? null,
      treasuryAIManager: treasuryAIManager ?? null,
    },
    isLoading: isLoading ?? false,
    error: error ?? null,
    userVaults: userVaults ?? [],
    allVaults: allVaults ?? [],
    refreshVaults: fetchAllVaults,
    createVault: createVault ?? (() => Promise.resolve(null)),
    depositToVault: depositToVault ?? (() => Promise.resolve(false)),
    withdrawFromVault: withdrawFromVault ?? (() => Promise.resolve(false)),
    getUserInfo: getUserInfo ?? (() => Promise.resolve(null)),
    getTokenBalances: getTokenBalances ?? (() => Promise.resolve([])),
    getNativeBalance: getNativeBalance ?? (() => Promise.resolve(0n)),
    getTransactionHistory: getTransactionHistory ?? (() => Promise.resolve([])),
    estimateCrossChainFees: estimateCrossChainFees ?? (() => Promise.resolve({ total: 0, breakdown: [] })),
    aaveDeposit: aaveDeposit ?? (() => Promise.resolve(false)),
    aaveWithdraw: aaveWithdraw ?? (() => Promise.resolve(false)),
    aaveRebalance: aaveRebalance ?? (() => Promise.resolve(false)),
    getAaveTotalValue: getAaveTotalValue ?? (() => Promise.resolve(null)),
    sendCrossChainTokens: sendCrossChainTokens ?? (() => Promise.resolve(false)),
    processTreasuryDecision: processTreasuryDecision ?? (() => Promise.resolve(false)),
    performTreasuryUpkeep: performTreasuryUpkeep ?? (() => Promise.resolve(false)),
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
    getAaveTotalValue,
    sendCrossChainTokens,
    processTreasuryDecision,
    performTreasuryUpkeep
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
