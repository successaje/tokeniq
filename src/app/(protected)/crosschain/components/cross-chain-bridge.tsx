"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useContracts, SUPPORTED_CHAINS } from '@/contexts/ContractContext';
import { formatUnits, parseUnits } from 'viem';
import { Loader2, RefreshCw, ChevronDown, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
type Chain = {
  id: string;
  name: string;
  chainId: number;
  icon: string;
  symbol: string;
  logo?: string;
};

type Token = {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  icon: string;
  addresses: Record<number, string>;
};

type ChainSelectorType = 'from' | 'to';

// Map SUPPORTED_CHAINS to the Chain type expected by the component
const CHAINS: Chain[] = Object.values(SUPPORTED_CHAINS).map(chain => ({
  id: chain.name.toLowerCase().replace(/\s+/g, '-'),
  name: chain.name,
  chainId: chain.id,
  icon: chain.logo,
  symbol: chain.nativeToken,
}));

const TOKENS: Token[] = [
  {
    id: 'ccip-bnm',
    name: 'CCIP-BnM',
    symbol: 'CCIP-BnM',
    decimals: 18,
    icon: '../icons/tokens/chainlink.png',
    addresses: {
      43113: '0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4', // Fuji Testnet
    },
  },
  {
    id: 'link',
    name: 'Chainlink Token',
    symbol: 'LINK',
    decimals: 18,

    icon: '../icons/tokens/chainlink.png',
    addresses: {
      43113: '0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846', // Fuji Testnet
    },
  },
];

const CrossChainBridge = () => {
  // Hooks
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const { estimateCrossChainFee, sendCrossChainTokens } = useContracts();

  // State
  const [selectedFromChain, setSelectedFromChain] = useState<Chain | null>(null);
  const [selectedToChain, setSelectedToChain] = useState<Chain | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputAmount, setInputAmount] = useState('');
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [chainSelectorType, setChainSelectorType] = useState<ChainSelectorType>('from');
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const [fetchingFee, setFetchingFee] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<bigint>(0n);
  const [isBridgeLoading, setIsBridgeLoading] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  // Fetch token balance when token or chain changes
  const fetchTokenBalance = useCallback(async () => {
    if (!address || !selectedToken || !selectedFromChain) {
      setTokenBalance('0');
      return;
    }

    const tokenAddress = selectedToken.addresses[selectedFromChain.chainId];
    if (!tokenAddress) {
      setTokenBalance('0');
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      setIsBalanceLoading(true);
      
      // Try with a simpler RPC call
      const balance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: [
          {
            constant: true,
            inputs: [{ name: '_owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: 'balance', type: 'uint256' }],
            type: 'function',
            stateMutability: 'view',
          },
        ],
        functionName: 'balanceOf',
        args: [address],
        blockTag: 'latest',
      });

      const formatted = formatUnits(balance as bigint, selectedToken.decimals);
      setTokenBalance(formatted);
    } catch (error) {
      console.warn('Error fetching token balance:', error);
      // Don't show error to user for balance fetches to avoid spamming
      // Just keep the previous balance or show 0 if not loaded yet
      if (tokenBalance === '0') {
        setTokenBalance('0');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsBalanceLoading(false);
    }
  }, [address, selectedToken, selectedFromChain, publicClient, tokenBalance]);

  // Initialize default chains on mount
  useEffect(() => {
    if (CHAINS.length >= 2) {
      setSelectedFromChain(CHAINS[0]);
      setSelectedToChain(CHAINS[1]);
    }
  }, []);

  // Fetch balance when token or chain changes
  useEffect(() => {
    fetchTokenBalance();
  }, [fetchTokenBalance]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !selectedToken || !selectedFromChain || !selectedToChain || !inputAmount) return;

    try {
      setIsLoading(true);
      
      const tokenAddress = selectedToken.addresses[selectedFromChain.chainId];
      if (!tokenAddress) {
        throw new Error('Token not supported on selected chain');
      }

      const amount = parseUnits(inputAmount, selectedToken.decimals);
      
      // Estimate gas fee
      await estimateCrossChainFee(
        selectedToChain.chainId,
        tokenAddress as `0x${string}`,
        amount
      );

      // Send tokens
      await sendCrossChainTokens(
        selectedToChain.chainId,
        tokenAddress as `0x${string}`,
        amount
      );

      toast({
        title: 'Success',
        description: 'Your cross-chain transfer has been initiated.',
      });
      setInputAmount('');
    } catch (error) {
      console.error('Error sending tokens:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send tokens',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render chain selection button
  const renderChainButton = useCallback((chain: Chain | null, type: ChainSelectorType) => {
    const isSource = type === 'from';
    const chainToShow = chain || (isSource ? selectedFromChain : selectedToChain);
    const isDisabled = isSource
      ? selectedToChain?.chainId === chainToShow?.chainId
      : selectedFromChain?.chainId === chainToShow?.chainId;

    const handleClick = () => {
      setChainSelectorType(type);
      setShowChainSelector(true);
    };

    if (!chainToShow) return <div>Select {type} chain</div>;

    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          'flex items-center justify-between w-full px-4 py-3 text-left rounded-lg border',
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
            {chainToShow.icon ? (
              <img 
                src={chainToShow.icon.startsWith('/') ? chainToShow.icon : `/${chainToShow.icon}`} 
                alt={chainToShow.name}
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  const chainConfig = Object.values(SUPPORTED_CHAINS).find(c => c.id === chainToShow.chainId);
                  if (chainConfig?.icon) {
                    target.src = chainConfig.icon;
                  } else {
                    target.src = '/icons/chains/default.svg';
                  }
                }}
              />
            ) : (
              <span className="text-xs">{chainToShow.symbol}</span>
            )}
          </div>
          <span>{chainToShow.name}</span>
        </div>
        <ChevronDown className="w-4 h-4 opacity-70" />
      </button>
    );
  }, [selectedFromChain, selectedToChain]);

  // Render token selection button
  const renderTokenButton = useCallback(() => {
    const handleTokenClick = () => {
      if (!selectedFromChain) return;
      setShowTokenSelector(true);
    };

    if (!selectedFromChain) {
      return (
        <Button 
          type="button" 
          variant="outline" 
          className="min-w-[120px] justify-between"
          disabled
        >
          Select Chain First
        </Button>
      );
    }

    return (
      <Button 
        type="button" 
        variant="outline" 
        onClick={handleTokenClick} 
        className="min-w-[120px] justify-between"
      >
        {selectedToken ? (
          <div className="flex items-center gap-2">
            <img 
              src={`/tokens/${selectedToken.icon}`} 
              alt={selectedToken.symbol} 
              className="w-5 h-5"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/icons/tokens/default.png';
              }} 
            />
            <span>{selectedToken.symbol}</span>
          </div>
        ) : (
          <span>Select Token</span>
        )}
        <ChevronDown className="ml-2 w-4 h-4 opacity-70" />
      </Button>
    );
  }, [selectedToken, selectedFromChain]);

  // Render amount input field
  const renderAmountInput = useCallback(() => (
    <div className="relative flex-1">
      <Input
        type="number"
        placeholder="0.0"
        value={inputAmount}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputAmount(e.target.value)}
        className="text-lg py-6"
        min="0"
        step="any"
        disabled={!selectedToken || !selectedFromChain || !selectedToChain}
      />

    </div>
  ), [inputAmount, selectedToken, selectedFromChain, selectedToChain]);

  // Loading overlay component
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h3 className="text-xl font-semibold">Processing Transaction</h3>
          <p className="text-muted-foreground text-center">
            {isBridgeLoading 
              ? 'Waiting for transaction confirmation...' 
              : 'Please confirm the transaction in your wallet'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-card rounded-xl shadow-sm relative">
      {(isLoading || isBridgeLoading) && <LoadingOverlay />}
      <h2 className="text-2xl font-bold mb-6">Cross-Chain Bridge</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* From Chain */}
        <div className="space-y-2">
          <Label>From Chain</Label>
          {renderChainButton(selectedFromChain, 'from')}
        </div>

        {/* Swap Chains Button */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => {
              if (selectedFromChain && selectedToChain) {
                setSelectedFromChain(selectedToChain);
                setSelectedToChain(selectedFromChain);
              }
            }}
            disabled={!selectedFromChain || !selectedToChain}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* To Chain */}
        <div className="space-y-2">
          <Label>To Chain</Label>
          {renderChainButton(selectedToChain, 'to')}
        </div>

        {/* Token & Amount */}
        <div className="space-y-2">
          <Label>Token & Amount</Label>
          <div className="flex flex-col space-y-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="token" className="text-sm font-medium">
                Select Token
              </Label>
              <span className="text-xs text-muted-foreground">
                {selectedFromChain?.name || 'Select source chain first'}
              </span>
            </div>
            {renderTokenButton()}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Amount
                </Label>
                <div className="flex items-center gap-2">
                  {isBalanceLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Balance: {Number(tokenBalance).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-primary hover:text-foreground"
                    onClick={() => setInputAmount(tokenBalance)}
                    disabled={isBalanceLoading || tokenBalance === '0'}
                  >
                    Max
                  </Button>
                </div>
              </div>
              {renderAmountInput()}
            </div>

          </div>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-12 text-base"
          disabled={isLoading || !address || !selectedToken || !inputAmount}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-5 w-5" />
              Bridge Tokens
            </>
          )}
        </Button>
      </form>

      {/* Chain Selector Modal */}
      {showChainSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Select {chainSelectorType === 'from' ? 'Source' : 'Destination'} Chain
            </h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {CHAINS.map((chain) => (
                <button
                  key={chain.chainId}
                  type="button"
                  onClick={() => {
                    if (chainSelectorType === 'from') {
                      setSelectedFromChain(chain);
                    } else {
                      setSelectedToChain(chain);
                    }
                    setShowChainSelector(false);
                  }}
                  disabled={
                    chainSelectorType === 'from'
                      ? selectedToChain?.chainId === chain.chainId
                      : selectedFromChain?.chainId === chain.chainId
                  }
                  className="w-full p-3 text-left rounded-lg flex items-center gap-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {chain.icon && (
                      <img 
                        src={`/icons/chains/${chain.icon}`} 
                        alt={chain.name}
                        className="w-6 h-6"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/icons/chains/default.svg';
                        }}
                      />
                    )}
                  </div>
                  <span>{chain.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="outline" onClick={() => setShowChainSelector(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Token Selector Modal */}
      {showTokenSelector && selectedFromChain && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Select Token</h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {TOKENS.filter((token) => token.addresses[selectedFromChain.chainId]).map((token) => (
                <button
                  key={`${token.id}-${selectedFromChain.chainId}`}
                  type="button"
                  onClick={() => {
                    setSelectedToken(token);
                    setShowTokenSelector(false);
                  }}
                  className="w-full p-3 text-left rounded-lg flex items-center gap-3 hover:bg-gray-50"
                >
                  <img
                    src={`/tokens/${token.icon}`}
                    alt={token.symbol}
                    className="w-6 h-6"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/icons/tokens/default.png';
                    }}
                  />
                  <span>{token.name}</span>
                  <span className="text-gray-500 ml-auto">{token.symbol}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="outline" onClick={() => setShowTokenSelector(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossChainBridge;
