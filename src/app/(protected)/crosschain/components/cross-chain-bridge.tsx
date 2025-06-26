'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits, parseUnits, parseEther } from 'viem';
import { useContractInstances } from '@/hooks/useContractInstances';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, RefreshCw, ArrowDown, ArrowRight, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Chain, Transaction, NetworkType } from '../types';
import { useToast } from '@/components/ui/use-toast';

// Helper function to get chains based on network type
const getChains = (networkType: NetworkType = 'testnet'): Chain[] => {
  const chains: Record<NetworkType, Chain[]> = {
    testnet: [
      {
        id: '11155111',
        name: 'Sepolia',
        icon: 'eth.svg',
        color: '#38bdf8',
        component: undefined,
        chainId: 11155111,
        chainSelector: 'sepolia',
        isTestnet: true,
        symbol: 'ETH'
      },
      {
        id: '5',
        name: 'Goerli',
        icon: 'eth.svg',
        color: '#38bdf8',
        component: undefined,
        chainId: 5,
        chainSelector: 'goerli',
        isTestnet: true,
        symbol: 'ETH'
      },
      {
        id: '421613',
        name: 'Arbitrum Nova Testnet',
        icon: 'arbitrum.svg',
        color: '#000000',
        component: undefined,
        chainId: 421613,
        chainSelector: 'arbitrum-nova',
        isTestnet: true,
        symbol: 'ETH'
      },
    ],
    mainnet: [
      {
        id: '1',
        name: 'Ethereum',
        icon: 'eth.svg',
        color: '#38bdf8',
        component: undefined,
        chainId: 1,
        chainSelector: 'ethereum',
        isTestnet: false,
        symbol: 'ETH'
      },
      {
        id: '137',
        name: 'Polygon',
        icon: 'polygon.svg',
        color: '#8247E5',
        component: undefined,
        chainId: 137,
        chainSelector: 'polygon',
        isTestnet: false,
        symbol: 'MATIC'
      },
      {
        id: '8453',
        name: 'Base',
        icon: 'base.svg',
        color: '#000000',
        component: undefined,
        chainId: 8453,
        chainSelector: 'base',
        isTestnet: false,
        symbol: 'ETH'
      },
    ],
  } as const;

  return chains[networkType] || chains.testnet;
};

type TokenAddresses = {
  [key: string]: Record<ChainId, `0x${string}`>;
};

const TOKEN_ADDRESSES: TokenAddresses = {
  USDC: {
    // Testnet
    11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
    43113: '0x5425890298aed601595a70AB815c96711a31Bc65', // Fuji
    80001: '0x9999f7fea5938fd3b1e26a12c3f2fb024e194f97', // Mumbai
    84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
    // Mainnet
    1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum
    137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  },
  Native: {
    // Native token addresses (0x0 for native tokens)
    1: '0x0000000000000000000000000000000000000000', // ETH
    11155111: '0x0000000000000000000000000000000000000000', // ETH Sepolia
    137: '0x0000000000000000000000000000000000000000', // MATIC
    80001: '0x0000000000000000000000000000000000000000', // MATIC Mumbai
    8453: '0x0000000000000000000000000000000000000000', // ETH Base
    84532: '0x0000000000000000000000000000000000000000', // ETH Base Sepolia
    43113: '0x0000000000000000000000000000000000000000', // AVAX Fuji
    [80001]: '0x0000000000000000000000000000000000000000' as const, // Native MATIC
    [84532]: '0x0000000000000000000000000000000000000000' as const, // Native ETH on Base
  },
} as const;

// Token interface with proper typing
namespace Token {
  export interface LocalToken {
    id: string;
    symbol: string;
    name: string;
    icon: string;
    color: string;
    component?: React.ComponentType<{ className?: string }>;
    decimals: number;
    addresses: Record<ChainId, `0x${string}`>;
  }
}

const TOKENS: Token[] = [
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    icon: 'usdc.png',
    color: 'text-blue-500',
    component: undefined,
    decimals: 6,
    addresses: TOKEN_ADDRESSES.USDC,
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'ethereum.png',
    color: 'text-blue-400',
    component: undefined,
    decimals: 18,
    addresses: TOKEN_ADDRESSES.Native,
  },
];

// Chain and token icon component
interface ChainIconProps {
  icon: {
    component?: React.ComponentType<{ className?: string }>;
    color: string;
    icon?: string;
    id?: string;
    symbol?: string;
    name?: string;
  } | string;
  className?: string;
  size?: number;
  isToken?: boolean;
}

const ChainIcon = ({
  icon,
  className = '',
  size = 6,
  isToken = false,
}: ChainIconProps) => {
  const sizeClassMap = {
    4: 'h-4 w-4',
    6: 'h-6 w-6',
    8: 'h-8 w-8',
  } as const;

  const sizeClass = sizeClassMap[size as keyof typeof sizeClassMap] || 'h-6 w-6';

  if (typeof icon === 'string') {
    return (
      <div className={cn('flex items-center justify-center rounded-full bg-muted', sizeClass, className)}>
        <span className="text-xs font-medium">{icon}</span>
      </div>
    );
  }

  if ('icon' in icon && icon.icon) {
    const iconPath = icon.icon.startsWith('http') ? icon.icon : `/icons/${isToken ? 'tokens' : 'chains'}/${icon.icon.replace(/\.svg$/, '.png')}`;
    return (
      <div className={cn('flex items-center justify-center rounded-full', icon.color, sizeClass, className)}>
        <img
          src={iconPath}
          alt={icon.name || icon.symbol || 'Token icon'}
          width={size * 4}
          height={size * 4}
          className={cn('rounded-full', isToken ? 'h-4 w-4' : 'h-5 w-5')}
          priority="true"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = '/icons/tokens/default.png'; // Fallback to default icon
          }}
        />
      </div>
    );
  }
};

const CrossChainBridge: React.FC<{
  onFromChainChange?: (chain: Chain) => void;
  onToChainChange?: (chain: Chain) => void;
  onAmountChange?: (amount: number) => void;
}> = ({
  onFromChainChange = () => {},
  onToChainChange = () => {},
  onAmountChange = () => {},
}) => {
  const { address } = useAccount();
  const { toast } = useToast();
  const contracts = useContractInstances();
  const { 
    sendCrossChainTokens, 
    getTokenBalances, 
    getNativeBalance, 
    getTransactionHistory 
  } = contracts?.crossChainRouter || {};

  // State variables
  const [networkType, setNetworkType] = useState<NetworkType>('testnet');
  const [selectedFromChain, setSelectedFromChain] = useState<Chain | null>(null);
  const [selectedToChain, setSelectedToChain] = useState<Chain | null>(null);
  const [selectedToken, setSelectedToken] = useState<LocalToken | null>(null);
  const [inputAmount, setInputAmount] = useState('');
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [chainSelectorType, setChainSelectorType] = useState<'from' | 'to'>('from');
// ...
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Get available chains based on network type
  const availableChains = useMemo(() => getChains(networkType), [networkType]);

  // Initialize with default chains
  useEffect(() => {
    if (availableChains.length >= 2) {
      setSelectedFromChain(availableChains[0]);
      setSelectedToChain(availableChains[1]);
    }
  }, [availableChains]);

  // Toggle between testnet and mainnet
  const toggleNetwork = () => {
    const newNetworkType = networkType === 'testnet' ? 'mainnet' : 'testnet';
    setNetworkType(newNetworkType);
    setSelectedFromChain(null);
    setSelectedToChain(null);
    setSelectedToken(null);
    setTokenBalance(0n);
    setInputAmount('');
    
    toast({
      title: `Switched to ${newNetworkType.toUpperCase()}`,
      description: `Now using ${newNetworkType} networks`,
    });
  };

  // Fetch token balance
  const fetchTokenBalance = useCallback(async () => {
    if (!address || !selectedToken || !selectedFromChain) return;
    
    setFetchingBalance(true);
    try {
      const balance = await getTokenBalances(address, selectedToken.addresses[selectedFromChain.chainId]);
      setTokenBalance(balance);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      setTokenBalance(0n);
    } finally {
      setFetchingBalance(false);
    }
  }, [address, selectedToken, selectedFromChain, getTokenBalances]);

  // Handle chain selection
  const handleChainSelect = useCallback((chain: Chain, type: 'from' | 'to') => {
    if (type === 'from') {
      setSelectedFromChain(chain);
      onFromChainChange(chain);
    } else {
      setSelectedToChain(chain);
      onToChainChange(chain);
    }
    setShowChainSelector(false);
  }, [onFromChainChange, onToChainChange]);

  // Format balance for display
  // Format balance for display
  const formattedBalance = useMemo(() => {
    if (!selectedToken || !tokenBalance) return '0';
    return formatUnits(tokenBalance, selectedToken.decimals);
  }, [selectedToken, tokenBalance]);

  // Handle token selection
  const handleTokenSelect = useCallback((token: Token) => {
    setSelectedToken(token);
    onAmountChange(0);
    fetchTokenBalance();
  }, [fetchTokenBalance, onAmountChange]);

  // Handle amount change
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const amount = parseFloat(value);
    setInputAmount(value);
    onAmountChange(amount);
  }, [onAmountChange]);

  // Handle max amount button click
  const handleMaxAmount = useCallback(() => {
    if (tokenBalance > 0n && selectedToken) {
      try {
        const maxAmount = formatUnits(tokenBalance, selectedToken.decimals);
        setInputAmount(maxAmount);
      } catch (error) {
        console.error('Error setting max amount:', error);
        toast({
          title: 'Error',
          description: 'Failed to set maximum amount',
          variant: 'destructive',
        });
      }
    }
  }, [tokenBalance, selectedToken, toast]);

  // Initialize transaction history on mount
  useEffect(() => {
    if (address && getTransactionHistory) {
      const loadHistory = async () => {
        try {
          const history = await getTransactionHistory(address);
          if (history && Array.isArray(history)) {
            // Transform TransactionHistory[] to Transaction[]
            const formattedTransactions = history.map(tx => ({
              id: tx.txHash || `tx-${Math.random().toString(36).substr(2, 9)}`,
              fromChain: tx.sourceChainId,
              toChain: tx.destinationChainId,
              token: tx.tokenSymbol || 'USDC', // Store token symbol instead of token object
              amount: tx.amount,
              status: tx.status as 'pending' | 'completed' | 'failed',
              timestamp: tx.timestamp || Date.now(),
              txHash: tx.txHash
            }));
            setTransactions(formattedTransactions);
          }
        } catch (error) {
          console.error('Error loading transaction history:', error);
        }
      };
      loadHistory();
    }
  }, [address, getTransactionHistory, TOKENS]);

  // Handle chain swap
  const handleSwapChains = useCallback(() => {
    if (selectedFromChain && selectedToChain) {
      const tempChain = selectedFromChain;
      setSelectedFromChain(selectedToChain);
      setSelectedToChain(tempChain);
    }
  }, [selectedFromChain, selectedToChain]);

  // Handle refresh button click
  const handleRefresh = useCallback(async () => {
    await fetchTokenBalance();
    if (getTransactionHistory && address) {
      try {
        const history = await getTransactionHistory(address);
        if (history && Array.isArray(history)) {
          const formattedTransactions = history.map(tx => ({
            id: tx.txHash || `tx-${Math.random().toString(36).substr(2, 9)}`,
            fromChain: tx.sourceChainId,
            toChain: tx.destinationChainId,
            token: tx.tokenSymbol || TOKENS[0].symbol,
            amount: tx.amount,
            status: tx.status as 'pending' | 'completed' | 'failed',
            timestamp: tx.timestamp || Date.now(),
            txHash: tx.txHash
          }));
          setTransactions(formattedTransactions);
        }
      } catch (error) {
        console.error('Error refreshing transaction history:', error);
      }
    }
  }, [fetchTokenBalance, getTransactionHistory, address, TOKENS]);

  // Handle form submission
  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!address || !selectedToken || !selectedFromChain || !selectedToChain) return;
    
    setLoading(true);
    try {
      const amountInWei = parseUnits(inputAmount, selectedToken.decimals);
      const success = await sendCrossChainTokens(
        selectedToChain.chainId,
        selectedToken.addresses[selectedFromChain.chainId],
        amountInWei
      );
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Tokens sent successfully!',
        });
        setInputAmount('');
        await fetchTokenBalance();
        await getTransactionHistory(address);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error sending tokens:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send tokens',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [address, inputAmount, selectedToken, selectedFromChain, selectedToChain, sendCrossChainTokens, fetchTokenBalance, getTransactionHistory, toast]);

  // Fetch balance when token or chain changes
  useEffect(() => {
    if (address && selectedToken && selectedFromChain) {
      fetchTokenBalance();
    }
  }, [address, selectedToken, selectedFromChain, fetchTokenBalance]);

  // Initialize with default token when chains are set
  useEffect(() => {
    if (selectedFromChain && !selectedToken && TOKENS.length > 0) {
      const defaultToken = TOKENS.find(t => t.addresses[selectedFromChain.chainId]);
      if (defaultToken) {
        setSelectedToken(defaultToken);
      }
    }
  }, [selectedFromChain, selectedToken]);

  // Render chain selector button
  const renderChainButton = useCallback((chain: Chain | null, type: 'from' | 'to') => {
    return (
      <button
        type="button"
        onClick={() => {
          setShowChainSelector(true);
          setChainSelectorType(type);
        }}
        className="flex items-center space-x-2 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors w-full text-left"
      >
        {chain ? (
          <>
            <ChainIcon icon={chain} />
            <span className="font-medium">{chain.name}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Select {type} chain</span>
        )}
        <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
      </button>
    );
  }, [setShowChainSelector, setChainSelectorType]);

  // Render token selector button
  const renderTokenButton = useCallback(() => {
    return (
      <button
        type="button"
        onClick={() => setShowTokenSelector(true)}
        className="flex items-center space-x-2 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors w-full text-left"
      >
        {selectedToken ? (
          <>
            <ChainIcon icon={selectedToken} isToken />
            <span className="font-medium">{selectedToken.symbol}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Select token</span>
        )}
        <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
      </button>
    );
  }, [selectedToken, setShowTokenSelector]);

  // Render amount input
  const renderAmountInput = useCallback(() => {
    return (
      <div className="relative">
        <Input
          type="text"
          value={inputAmount}
          onChange={handleAmountChange}
          placeholder="0.0"
          className="pr-14"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleMaxAmount}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedToken || tokenBalance === 0n}
          >
            MAX
          </button>
          <span className="text-sm text-muted-foreground">
            {selectedToken?.symbol || 'TOKEN'}
          </span>
        </div>
      </div>
    );
  }, [inputAmount, handleAmountChange, handleMaxAmount, selectedToken, tokenBalance]);

  // Render balance
  const renderBalance = useCallback(() => (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>Balance: {fetchingBalance ? '...' : formattedBalance}</span>
      {fetchingBalance && <RefreshCw className="h-3 w-3 animate-spin" />}
    </div>
  ), [fetchingBalance, formattedBalance]);

  // Render submit button
  const renderSubmitButton = useCallback(() => {
    const isDisabled = !inputAmount || 
      parseFloat(inputAmount) <= 0 || 
      !address || 
      fetchingBalance || 
      loading ||
      !selectedToken ||
      !selectedFromChain ||
      !selectedToChain;

    return (
      <Button
        type="submit"
        className="w-full py-6 text-base font-medium"
        disabled={isDisabled}
        onClick={handleSubmit}
      >
        {loading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : !address ? (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </>
        ) : (
          <>
            <ArrowRight className="mr-2 h-4 w-4" />
            Bridge Tokens
          </>
        )}
      </Button>
    );
  }, [inputAmount, address, fetchingBalance, loading, selectedToken, selectedFromChain, selectedToChain, handleSubmit]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {showChainSelector && selectedFromChain && selectedToChain && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Select {chainSelectorType === 'from' ? 'Source' : 'Destination'} Chain</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableChains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => handleChainSelect(chain, chainSelectorType)}
                  className="w-full flex items-center p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <ChainIcon icon={chain} />
                  <span className="font-medium">{chain.name}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowChainSelector(false)}
              className="mt-4 w-full py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {showTokenSelector && selectedFromChain && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Select Token</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {TOKENS
                .filter((token) => token.addresses[selectedFromChain.chainId])
                .map(token => (
                  <button
                    key={token.id}
                    onClick={() => handleTokenSelect(token)}
                    className="w-full flex items-center p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ChainIcon icon={token} isToken />
                    <span className="font-medium">{token.symbol}</span>
                  </button>
                ))}
            </div>
            <button 
              onClick={() => setShowTokenSelector(false)}
              className="mt-4 w-full py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cross-Chain Bridge</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleNetwork}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <span>{networkType === 'testnet' ? 'Testnet' : 'Mainnet'}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      <div className="w-full">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Cross-Chain Bridge</h2>
            <div className="flex items-center space-x-2">
              <button 
                type="button"
                onClick={() => fetchTokenBalance()}
                disabled={fetchingBalance}
                className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="Refresh balance"
              >
                <RefreshCw className={`h-4 w-4 ${fetchingBalance ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        
          {/* Chain Selection */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">From</Label>
              <Label className="text-sm font-medium text-muted-foreground">To</Label>
            </div>
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 relative">
                {renderChainButton(selectedFromChain, 'from')}
              </div>
              
              <button
                type="button"
                onClick={handleSwapChains}
                disabled={loading}
                className="p-2.5 rounded-full bg-muted/50 hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Swap chains"
              >
                <ArrowDown className="h-6 w-6 transition-transform group-hover:rotate-180" />
              </button>
              
              <div className="flex-1 relative">
                {renderChainButton(selectedToChain, 'to')}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">Token & Amount</Label>
              <div className="flex items-center space-x-1">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {address ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative w-full">
                {renderTokenButton()}
              </div>
              <div className="relative w-full">
                {renderAmountInput()}
              </div>
            </div>

            <div className="mt-6">
              {renderSubmitButton()}
            </div>
          </div>
        </form>
      </div>
      {renderBalance()}
    </div>
  );
};

export default CrossChainBridge;
