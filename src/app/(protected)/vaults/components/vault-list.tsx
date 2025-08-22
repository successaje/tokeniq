'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useContracts } from '@/contexts/ContractContext';
import { formatEther } from 'viem';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

// Dynamically import dialogs with no SSR to avoid hydration issues
const VaultDepositDialog = dynamic(
  () => import('./vault-deposit-dialog').then(mod => mod.VaultDepositDialog),
  { ssr: false }
);

const VaultWithdrawDialog = dynamic(
  () => import('./vault-withdraw-dialog').then(mod => mod.VaultWithdrawDialog),
  { ssr: false }
);

import { VaultInfo } from '@/types/contracts';

interface Vault extends Omit<VaultInfo, 'symbol' | 'asset' | 'totalAssets' | 'totalSupply' | 'chainId'> {
  risk: 'low' | 'medium' | 'high';
  strategy: string; // For display purposes only
  description: string;
  apy: number;
  tvl: bigint;
  tokenSymbol: string;
  tokenDecimals: number;
  tokenAddress: Address;
  tags: string[];
  available: boolean;
  minDeposit: bigint;
  chain: string;
  symbol?: string; // Keep optional for compatibility
  asset?: Address; // Keep optional for compatibility
  totalAssets?: bigint; // Keep optional for compatibility
  totalSupply?: bigint; // Keep optional for compatibility
  chainId?: number; // Keep optional for compatibility
}

export function VaultList() {
  const { allVaults = [], isLoading = false, error = null, refreshVaults = () => {} } = useContracts();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [action, setAction] = useState<'deposit' | 'withdraw' | null>(null);
  
  // Add default values to prevent destructuring errors
  const safeAllVaults = allVaults || [];

  // Transform contract vaults to UI format
  useEffect(() => {
    // Add Yei Finance vaults from config
    const yeiVaults: Vault[] = [
      {
        id: 'btc-fi-vault',
        name: 'BTCFi Yield Vault',
        description: '60% Yei Lending Pool + 40% Yei Staking Pool',
        chain: 'Ethereum',
        available: true,
        apy: 12.8,
        tvl: 5000000n * 10n**18n, // $5M TVL in wei
        minDeposit: 1000000000n, // 0.01 WBTC in wei (8 decimals)
        tokenDecimals: 8,
        tokenSymbol: 'WBTC',
        tokenAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        address: '0x0000000000000000000000000000000000000001', // YEI_LENDING_POOL
        risk: 'medium',
        strategy: 'Yei Finance BTCFi Strategy',
        tags: ['Bitcoin', 'Yield', 'Lending', 'Staking'],
        totalAssets: 0n,
        totalSupply: 0n,
        chainId: 1
      },
      {
        id: 'stablecoin-vault',
        name: 'Stablecoin Yield Vault',
        description: 'Yield optimized stablecoin strategy via Yei money market',
        chain: 'Ethereum',
        available: true,
        apy: 8.9,
        tvl: 3000000n * 10n**18n, // $3M TVL in wei
        minDeposit: 100000000n, // 100 USDC in wei (6 decimals)
        tokenDecimals: 6,
        tokenSymbol: 'USDC',
        tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        address: '0x0000000000000000000000000000000000000002', // YEI_MONEY_MARKET
        risk: 'low',
        strategy: 'Yei Finance Money Market',
        tags: ['Stablecoin', 'Yield', 'Money Market'],
        totalAssets: 0n,
        totalSupply: 0n,
        chainId: 1
      }
    ] as Vault[];

    try {
      const formattedVaults = [
        ...(safeAllVaults?.map((vault) => ({
          ...vault,
          id: vault.address,
          name: vault.name,
          risk: 'medium' as const,
          strategy: 'Yield Strategy',
          description: '',
          chain: 'Ethereum',
          available: true,
          apy: vault.apy || 0,
          tvl: vault.totalAssets || 0n,
          minDeposit: 0n,
          tokenDecimals: 18,
          tokenSymbol: 'TOKEN',
          tokenAddress: vault.asset || '0x0',
          tags: []
        })) || []),
        ...yeiVaults
      ] as Vault[];
      
      setVaults(formattedVaults);
    } catch (err) {
      console.error('Error formatting vaults:', err);
      setVaults([]);
    }
  }, [safeAllVaults]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Available Vaults</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 text-center py-8">
        <h2 className="text-2xl font-bold">Error loading vaults</h2>
        <p className="text-destructive">{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
        <Button onClick={() => refreshVaults()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {vaults.length > 0 ? 'Available Vaults' : 'No Vaults Found'}
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Aave Vault Card */}
        <Card className="flex flex-col border-2 border-violet-500/20 hover:border-violet-500/40 transition-colors mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-violet-500" />
                Aave Vault
              </CardTitle>
              <Badge className="bg-violet-100 text-violet-800">Low Risk</Badge>
            </div>
            <div className="text-sm text-muted-foreground">Aave Lending Strategy</div>
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">APY</span>
              <span className="font-medium">3.25%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">TVL</span>
              <span className="font-medium">$1.2M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Asset</span>
              <span className="font-medium">USDC, DAI, USDT</span>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/vaults/aave-vault" className="w-full">
              <Button className="w-full bg-violet-600 hover:bg-violet-700">
                View Vault
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* All Vaults */}
        {vaults.map((vault) => (
            <Card key={vault.id} className="flex flex-col border-2 border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    {vault.name}
                  </CardTitle>
                  <Badge className={getRiskColor(vault.risk)}>{vault.risk} Risk</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{vault.description || vault.strategy}</div>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">APY</span>
                  <span className="font-medium">
                    {vault.apy ? `${vault.apy.toFixed(2)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">TVL</span>
                  <span className="font-medium">
                    {vault.tvl ? (
                      `$${(Number(vault.tvl) / 10**18).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}`
                    ) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Asset</span>
                  <span className="font-medium truncate max-w-[120px]">
                    {vault.tokenSymbol || 'N/A'}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex space-x-2">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700" 
                  onClick={() => {
                    setSelectedVault(vault);
                    setAction('deposit');
                  }}
                >
                  Deposit
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedVault(vault);
                    setAction('withdraw');
                  }}
                >
                  Withdraw
                </Button>
              </CardFooter>
            </Card>
        ))}
      </div>
      {vaults.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No vaults available</p>
        </div>
      )}

      <VaultDepositDialog
        open={action === 'deposit'}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
            setSelectedVault(null);
          }
        }}
        vault={selectedVault}
      />

      <VaultWithdrawDialog
        open={action === 'withdraw'}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
            setSelectedVault(null);
          }
        }}
        vault={selectedVault}
      />
    </div>
  );
}
