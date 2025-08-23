'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart2, RefreshCw, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther, formatUnits } from 'viem';
import { cn } from '@/lib/utils';
import { Address } from 'viem';
import { mainnet, sepolia, avalancheFuji } from 'viem/chains';
import { erc20Abi } from 'viem';
import { theme } from '../theme';

// Replace with actual contract addresses
const TOKEN_ADDRESSES = {
  ETH: '0x0000000000000000000000000000000000000000', // Native token
  USDC: {
    [mainnet.id]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    [avalancheFuji.id]: '0x5425890298aed601595a70AB815c96711a31Bc65',
    [sepolia.id]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  },
  WBTC: {
    [mainnet.id]: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    [avalancheFuji.id]: '0x1D308089Fc2F9838a7e745e6170b3Df4f5b6bb1B',
    [sepolia.id]: '0x29f2D40B0605204367AfE49a4Bd1a3A0aE9f3B0c'
  }
};

const CHAINS = [mainnet, avalancheFuji, sepolia];

interface BalanceInfo {
  chainId: number;
  native: string;
  tokens: {
    [symbol: string]: string;
  };
}

export function DeepAnalysis() {
  const { address } = useAccount();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [balances, setBalances] = useState<BalanceInfo[]>([]);
  
  // Fetch native token balance for each chain
  const { data: ethBalance, refetch: refetchEth } = useReadContract({
    chainId: mainnet.id,
    address: address as `0x${string}`,
    functionName: 'getBalance',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
      staleTime: 0, // Always refetch when needed
      gcTime: 0, // Don't cache the result
    },
  });

  // Fetch USDC balance
  const { data: usdcBalance, refetch: refetchUsdc } = useReadContract({
    chainId: mainnet.id,
    address: TOKEN_ADDRESSES.USDC[mainnet.id] as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
      staleTime: 0,
      gcTime: 0,
    },
  });

  // Fetch WBTC balance
  const { data: wbtcBalance, refetch: refetchWbtc } = useReadContract({
    chainId: mainnet.id,
    address: TOKEN_ADDRESSES.WBTC[mainnet.id] as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
      staleTime: 0,
      gcTime: 0,
    },
  });

  const fetchBalances = async () => {
    if (!address) return;
    
    setIsAnalyzing(true);
    
    try {
      // Force refetch all balances
      const [newEthBalance, newUsdcBalance, newWbtcBalance] = await Promise.all([
        refetchEth(),
        refetchUsdc(),
        refetchWbtc()
      ]);

      const newBalances: BalanceInfo[] = [{
        chainId: mainnet.id,
        native: newEthBalance.data ? formatEther(newEthBalance.data) : '0',
        tokens: {
          USDC: newUsdcBalance.data ? formatUnits(newUsdcBalance.data, 6) : '0',
          WBTC: newWbtcBalance.data ? formatUnits(newWbtcBalance.data, 8) : '0'
        }
      }];
      
      setBalances(newBalances);
      generateAnalysis(newBalances);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Initial fetch on mount and when address changes
  useEffect(() => {
    if (address) {
      fetchBalances();
    }
  }, [address]);

  const generateAnalysis = (balanceData: BalanceInfo[]) => {
    // Calculate total balances
    const totalUSDC = balanceData.reduce((sum, chain) => {
      return sum + parseFloat(chain.tokens.USDC || '0');
    }, 0);
    
    const totalWBTC = balanceData.reduce((sum, chain) => {
      return sum + parseFloat(chain.tokens.WBTC || '0');
    }, 0);
    
    const totalNative = balanceData.reduce((sum, chain) => {
      return sum + parseFloat(chain.native || '0');
    }, 0);
    
    // Generate basic analysis
    let analysisText = `# Portfolio Snapshot\n\n`;
    
    if (totalWBTC > 0) {
      analysisText += `- ${totalWBTC.toFixed(4)} WBTC ($${(totalWBTC * 50000).toFixed(2)})\n`;
    }
    
    if (totalUSDC > 0) {
      analysisText += `- ${totalUSDC.toFixed(2)} USDC\n`;
    }
    
    if (totalNative > 0) {
      analysisText += `- ${totalNative.toFixed(4)} ETH ($${(totalNative * 3000).toFixed(2)})\n`;
    }
    
    setAnalysis(analysisText);
    
    // Generate AI analysis
    generateAiAnalysis({
      wbtc: totalWBTC,
      usdc: totalUSDC,
      eth: totalNative
    });
  };
  
  const generateAiAnalysis = async (balances: { wbtc: number; usdc: number; eth: number }) => {
    if (!address || (balances.wbtc === 0 && balances.usdc === 0 && balances.eth === 0)) {
      setAiAnalysis('');
      return;
    }
    
    setIsAnalyzingAi(true);
    
    try {
      const response = await fetch('/api/analyze-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          balances: {
            wbtc: balances.wbtc,
            usdc: balances.usdc,
            eth: balances.eth
          },
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze portfolio');
      }
      
      const data = await response.json();
      setAiAnalysis(data.analysis || 'No analysis available');
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      setAiAnalysis('Error generating analysis. Please try again later.');
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchBalances();
    }
  }, [address]);

  return (
    <Card className={cn("w-full", theme.transitions.smooth)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            Portfolio Analysis
          </CardTitle>
          <motion.div
            initial={{ scale: 1 }}
            animate={isAnalyzing ? { rotate: 180 } : { rotate: 0 }}
            transition={{
              rotate: {
                duration: 0.5,
                repeat: isAnalyzing ? Infinity : 0,
                ease: "linear"
              }
            }}
          >
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchBalances}
              disabled={isAnalyzing}
              className="relative overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.span 
                    key="refreshing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refreshing...
                  </motion.span>
                ) : (
                  <motion.span 
                    key="refresh"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </motion.span>
                )}
              </AnimatePresence>
              
              {/* Animated progress indicator */}
              {isAnalyzing && (
                <motion.div 
                  className="absolute bottom-0 left-0 h-0.5 bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
                />
              )}
            </Button>
          </motion.div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAnalyzing ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : analysis ? (
          <>
            <div className="prose prose-sm max-w-none">
              {analysis.split('\n').map((line, i) => (
                <p key={i} className={line.startsWith('#') ? 'font-semibold text-lg' : ''}>
                  {line.replace(/^[#-]\s*/, '')}
                </p>
              ))}
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3 text-primary">
                <Sparkles className="h-4 w-4" />
                <h3 className="font-medium">AI Portfolio Analysis</h3>
                {isAnalyzingAi && <Loader2 className="h-3 w-3 animate-spin ml-2" />}
              </div>
              
              {aiAnalysis ? (
                <div className="prose prose-sm max-w-none bg-muted/30 p-4 rounded-lg">
                  {aiAnalysis.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0">
                      {line}
                      {line.trim().endsWith(':') && <br />}
                    </p>
                  ))}
                </div>
              ) : isAnalyzingAi ? (
                <div className="text-muted-foreground text-sm">Analyzing your portfolio...</div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  AI analysis will appear here after refreshing your balances.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2" />
            <p>Click "Refresh" to analyze your portfolio</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
