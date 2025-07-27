'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { chains } from '@/config/chains';

interface BtcVault {
  id: string;
  name: string;
  description: string;
  features: string[];
  apy: string;
  risk: 'low' | 'medium' | 'high' | 'variable';
  chainId?: number;
  requiresConnection?: boolean;
}

export function BtcVaultsSection() {
  const router = useRouter();
  const { toast } = useToast();
  const { open } = useWeb3Modal();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const [loadingVaults, setLoadingVaults] = useState<Record<string, boolean>>({});

  const btcVaults: BtcVault[] = [
    {
      id: 'btc-yield',
      name: 'BTC Yield Vault',
      description: 'Stake native BTC or wBTC for AI-optimized yield strategies',
      features: [
        'Accepts both native BTC (via Core Chain bridge) and wBTC',
        'AI-optimized yield strategies',
        'Auto-rebalancing portfolio',
        'Low risk profile'
      ],
      apy: '8-15%',
      risk: 'low',
      chainId: 1, // Core chain ID
      requiresConnection: true
    },
    {
      id: 'btc-compounding',
      name: 'BTC Auto-Compounding Vault',
      description: 'Automatically compound your BTC yield for maximum returns',
      features: [
        'Auto-compounding of rewards',
        'Gas optimization for cost efficiency',
        'Daily performance updates',
        'Medium risk profile'
      ],
      apy: '12-18%',
      risk: 'medium',
      chainId: 1, // Core chain ID
      requiresConnection: true
    },
    {
      id: 'btc-borrowing',
      name: 'BTC Borrowing Vault',
      description: 'Borrow against your BTC with flexible loan-to-value ratios',
      features: [
        'Borrow stablecoins or other assets using BTC as collateral',
        'Competitive interest rates',
        'Liquidation protection',
        'Variable risk based on LTV'
      ],
      apy: '5-25%',
      risk: 'variable',
      chainId: 1, // Core chain ID
      requiresConnection: true
    }
  ];

  const handleVaultAction = async (vault: BtcVault) => {
    try {
      setLoadingVaults(prev => ({ ...prev, [vault.id]: true }));
      
      // Check if wallet is connected
      if (!isConnected) {
        open();
        return;
      }

      // Check if we're on the correct network
      if (vault.chainId && chainId !== vault.chainId) {
        try {
          await switchChain({ chainId: vault.chainId });
        } catch (error) {
          throw new Error('Failed to switch network. Please switch to the correct network in your wallet');
        }
      }

      // Navigate to the vault details page or open deposit dialog
      router.push(`/vaults/btc/${vault.id}`);
      
    } catch (error) {
      console.error('Error handling vault action:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process vault action',
        variant: 'destructive',
      });
    } finally {
      setLoadingVaults(prev => ({ ...prev, [vault.id]: false }));
    }
  };

  const getRiskBadge = (risk: string) => {
    const riskMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'low': { label: 'Low Risk', variant: 'default' },
      'medium': { label: 'Medium Risk', variant: 'secondary' },
      'high': { label: 'High Risk', variant: 'destructive' },
      'variable': { label: 'Variable Risk', variant: 'outline' }
    };

    const { label, variant } = riskMap[risk] || { label: 'N/A', variant: 'outline' };
    return <Badge variant={variant} className="text-xs">{label}</Badge>;
  };

  const getChainName = (chainId?: number) => {
    if (!chainId) return '';
    return chains.find(c => c.id === chainId)?.name || `Chain ${chainId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">BTC Vaults</h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/discover?tab=btc')}
            className="flex items-center"
          >
            View all BTC strategies <ArrowRight className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {btcVaults.map((vault) => (
          <Card 
            key={vault.id} 
            className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleVaultAction(vault)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{vault.name}</CardTitle>
                <img 
                  src="/logos/bitcoin-btc-logo.png" 
                  alt="Bitcoin" 
                  className="h-8 w-8 rounded-full"
                />
              </div>
              <p className="text-sm text-muted-foreground">{vault.description}</p>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <span className="text-2xl font-bold text-primary">{vault.apy}</span>
                  <span className="text-sm text-muted-foreground ml-1">APY</span>
                </div>
                {getRiskBadge(vault.risk)}
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <ul className="space-y-2 text-sm">
                {vault.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <div className="p-4 pt-0">
              <Button 
                className="w-full" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVaultAction(vault);
                }}
                disabled={loadingVaults[vault.id]}
              >
                {loadingVaults[vault.id] ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Open Vault'
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
