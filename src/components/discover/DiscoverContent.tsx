'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, PieChart, LineChart, Zap, ArrowDown, ArrowUp, RefreshCw, Wallet } from 'lucide-react';
import { useVaultsData } from '@/hooks/useVaultsData';
import { formatEther } from 'viem';
import { chains } from '@/config/chains';

// Format a number with commas and 2 decimal places
const formatNumber = (value: bigint | number, decimals = 2): string => {
  const num = typeof value === 'bigint' ? Number(value) : value;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Get chain name by ID
const getChainName = (chainId: number): string => {
  return chains.find(c => c.id === chainId)?.name || `Chain ${chainId}`;
};

// Get color based on action
const getActionColor = (action: string) => {
  switch (action) {
    case 'deposit':
      return 'text-green-500';
    case 'withdraw':
      return 'text-red-500';
    default:
      return 'text-yellow-500';
  }
};

// Performance metrics component
const PerformanceMetrics = ({ vaults }: { vaults: any[] }) => {
  const totalValue = vaults.reduce((sum, vault) => {
    const value = (Number(vault.userBalance) / 1e18) * (Number(vault.tvl) / 1e18);
    return sum + value;
  }, 0);

  const totalApy = vaults.length > 0 
    ? vaults.reduce((sum, vault) => sum + (vault.apy || 0), 0) / vaults.length 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${formatNumber(totalValue)}</div>
          <p className="text-xs text-muted-foreground">Across all vaults</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. APY</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalApy)}%</div>
          <p className="text-xs text-muted-foreground">Average across all vaults</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Vaults</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{vaults.length}</div>
          <p className="text-xs text-muted-foreground">Across all chains</p>
        </CardContent>
      </Card>
    </div>
  );
};

// Vault table component
const VaultsTable = ({ vaults }: { vaults: any[] }) => (
  <div className="rounded-md border">
    <div className="relative w-full overflow-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vault</th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Balance</th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Value</th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">APY</th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Chain</th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {vaults.map((vault) => {
            const value = (Number(vault.userBalance) / 1e18) * (Number(vault.tvl) / 1e18);
            return (
              <tr key={vault.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-4 align-middle font-medium">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {vault.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{vault.name}</div>
                      <div className="text-sm text-muted-foreground">{vault.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-right align-middle">
                  {formatNumber(Number(formatEther(vault.userBalance || '0')), 4)}
                </td>
                <td className="p-4 text-right align-middle">
                  ${formatNumber(value)}
                </td>
                <td className="p-4 text-right align-middle">
                  <div className="flex items-center justify-end">
                    {vault.apy > 0 ? (
                      <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    {formatNumber(vault.apy || 0)}%
                  </div>
                </td>
                <td className="p-4 text-right align-middle">
                  {getChainName(vault.chainId)}
                </td>
                <td className="p-4 text-right align-middle">
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

// AI Recommendations component
const AIRecommendations = ({ recommendations }: { recommendations: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>AI Strategy Recommendations</CardTitle>
      <CardDescription>Optimize your positions based on market conditions</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <div key={rec.vaultId} className="flex items-start pb-4 last:pb-0">
              <div className="space-y-1">
                <div className="flex items-center">
                  <span className={`font-medium ${getActionColor(rec.action)}`}>
                    {rec.action.charAt(0).toUpperCase() + rec.action.slice(1)}
                  </span>
                  <span className="mx-2 text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    Confidence: {Math.round(rec.confidence * 100)}%
                  </span>
                </div>
                <p className="text-sm">{rec.reason}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No recommendations available at this time.</p>
        )}
      </div>
    </CardContent>
  </Card>
);

export function DiscoverContent() {
  const { vaults, vaultsByChain, recommendations, loading, error, refresh } = useVaultsData();
  
  // Group vaults by chain for the chain filter
  const chainFilters = useMemo(() => {
    const chains = new Set<number>();
    vaults.forEach(vault => chains.add(vault.chainId));
    return Array.from(chains).map(chainId => ({
      id: chainId,
      name: getChainName(chainId),
      count: vaults.filter(v => v.chainId === chainId).length
    }));
  }, [vaults]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading vault data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h3 className="text-sm font-medium text-red-800">Error loading vault data</h3>
        <p className="mt-1 text-sm text-red-700">{error.message}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={refresh}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Discover Vaults</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Explore and manage your DeFi vaults across multiple chains
          </p>
        </div>
        <Button 
          onClick={refresh} 
          className="w-full sm:w-auto justify-center"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <div className="space-y-8">
        <PerformanceMetrics vaults={vaults} />

        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <TabsList className="w-full sm:w-auto overflow-x-auto">
              <TabsTrigger value="all" className="whitespace-nowrap">All Vaults</TabsTrigger>
              {chainFilters.map(chain => (
                <TabsTrigger 
                  key={chain.id} 
                  value={`chain-${chain.id}`}
                  className="whitespace-nowrap"
                >
                  {chain.name} ({chain.count})
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-6">
            <VaultsTable vaults={vaults} />
            
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Portfolio Performance</CardTitle>
                    <CardDescription>Your vault performance over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center rounded-lg bg-muted/30">
                      <p className="text-muted-foreground">Performance chart coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div>
                <AIRecommendations recommendations={recommendations} />
              </div>
            </div>
          </TabsContent>

          {chainFilters.map(chain => (
            <TabsContent key={chain.id} value={`chain-${chain.id}`} className="space-y-6">
              <VaultsTable vaults={vaults.filter(v => v.chainId === chain.id)} />
              
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Portfolio Performance - {chain.name}</CardTitle>
                      <CardDescription>Your {chain.name} vault performance over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] flex items-center justify-center rounded-lg bg-muted/30">
                        <p className="text-muted-foreground">Performance chart coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <AIRecommendations 
                    recommendations={recommendations.filter(r => 
                      vaults.some(v => v.chainId === chain.id && v.id === r.vaultId)
                    )} 
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
