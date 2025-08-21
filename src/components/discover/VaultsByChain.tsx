import { useState, useMemo } from 'react';
import { VaultInfo, VaultType } from '@/types/vault';
import { VaultCard } from '@/components/vaults/VaultCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatEther } from 'viem';
import { cn } from '@/lib/utils';

// Chain icons mapping
const CHAIN_ICONS: Record<string, string> = {
  'Ethereum': '🟣',
  'Avalanche': '🔴',
  'Core': '🔵',
  'Sei': '🔷',
  'Base': '🔵',
  'Arbitrum': '🔵',
  'Optimism': '🔴',
  'Polygon': '🟣',
  'BNB Chain': '🟡',
};

interface VaultsByChainProps {
  vaults: VaultInfo[];
}

export function VaultsByChain({ vaults }: VaultsByChainProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'tvl' | 'apy' | 'name'>('tvl');
  
  // Process and filter vaults
  const processedVaults = useMemo(() => {
    return vaults.filter(vault => {
      // Filter by search query
      const matchesSearch = 
        vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vault.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vault.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filter by risk
      const matchesRisk = riskFilter === 'all' || vault.risk === riskFilter;
      
      return matchesSearch && matchesRisk;
    });
  }, [vaults, searchQuery, riskFilter]);

  // Group vaults by chain
  const vaultsByChain = useMemo(() => {
    return processedVaults.reduce<Record<string, VaultInfo[]>>((acc, vault) => {
      if (!vault.chain) return acc;
      
      if (!acc[vault.chain]) {
        acc[vault.chain] = [];
      }
      acc[vault.chain].push(vault);
      return acc;
    }, {});
  }, [processedVaults]);

  // Sort chains by TVL (descending)
  const sortedChains = useMemo(() => {
    return Object.entries(vaultsByChain)
      .sort(([, aVaults], [, bVaults]) => {
        const aTvl = aVaults.reduce((sum, v) => {
          const tvl = typeof v.tvl === 'bigint' ? v.tvl : BigInt(v.tvl?.toString() || '0');
          return sum + tvl;
        }, 0n);
        
        const bTvl = bVaults.reduce((sum, v) => {
          const tvl = typeof v.tvl === 'bigint' ? v.tvl : BigInt(v.tvl?.toString() || '0');
          return sum + tvl;
        }, 0n);
        
        return aTvl > bTvl ? -1 : aTvl < bTvl ? 1 : 0;
      })
      .map(([chain]) => chain);
  }, [vaultsByChain]);
  
  // Sort vaults within each chain
  const sortedVaultsByChain = useMemo(() => {
    const result: Record<string, VaultInfo[]> = {};
    
    Object.entries(vaultsByChain).forEach(([chain, chainVaults]) => {
      result[chain] = [...chainVaults].sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (sortBy === 'apy') {
          return (b.apy || 0) - (a.apy || 0);
        } else {
          // Default: sort by TVL
          const aTvl = typeof a.tvl === 'bigint' ? a.tvl : BigInt(a.tvl?.toString() || '0');
          const bTvl = typeof b.tvl === 'bigint' ? b.tvl : BigInt(b.tvl?.toString() || '0');
          return bTvl > aTvl ? 1 : bTvl < aTvl ? -1 : 0;
        }
      });
    });
    
    return result;
  }, [vaultsByChain, sortBy]);

  // Format TVL for display
  const formatTvl = (value: bigint | string | undefined) => {
    const numValue = typeof value === 'bigint' ? value : BigInt(value?.toString() || '0');
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Number(numValue) / 1e18);
  };

  if (processedVaults.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Vaults Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">There are no vaults available at the moment. Please check back later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Available Vaults</CardTitle>
            <p className="text-sm text-muted-foreground">Earn yield across multiple chains</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Input
                placeholder="Search vaults..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risks</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(v: 'tvl' | 'apy' | 'name') => setSortBy(v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tvl">TVL</SelectItem>
                  <SelectItem value="apy">APY</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={sortedChains[0] || ''} className="w-full">
          <TabsList className="w-full flex overflow-x-auto pb-2 mb-2">
            <div className="flex space-x-2 px-1">
              {sortedChains.map((chain) => {
                const vaultCount = vaultsByChain[chain]?.length || 0;
                const totalTvl = vaultsByChain[chain]?.reduce((sum, v) => {
                  const tvl = v.tvl ? (typeof v.tvl === 'bigint' ? v.tvl : BigInt(v.tvl.toString())) : 0n;
                  return sum + tvl;
                }, 0n) || 0n;
                
                return (
                  <TabsTrigger 
                    key={chain} 
                    value={chain}
                    className={cn(
                      "relative flex flex-col items-start justify-start h-auto py-3 px-4 rounded-lg",
                      "border border-border bg-card hover:bg-accent/50 transition-colors",
                      "min-w-[140px] text-left"
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-lg">{CHAIN_ICONS[chain] || '🔗'}</span>
                      <span className="font-medium truncate">{chain}</span>
                      <Badge 
                        variant="secondary" 
                        className="ml-auto px-1.5 py-0.5 h-5 text-xs font-medium"
                      >
                        {vaultCount}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 truncate w-full">
                      {formatTvl(totalTvl)} TVL
                    </span>
                    <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary opacity-0 data-[state=active]:opacity-100 transition-opacity" />
                  </TabsTrigger>
                );
              })}
            </div>
          </TabsList>
          
          {sortedChains.map((chain) => (
            <TabsContent key={chain} value={chain} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <style jsx>{`
                  [data-state=active] {
                    --tw-bg-opacity: 0.1;
                    background-color: hsl(var(--primary) / var(--tw-bg-opacity));
                    border-color: hsl(var(--primary));
                    box-shadow: 0 0 0 1px hsl(var(--primary));
                  }
                `}</style>
                {sortedVaultsByChain[chain]?.map((vault) => (
                  <VaultCard 
                    key={vault.id} 
                    vault={vault} 
                    className="h-full transition-transform hover:scale-[1.02]"
                  />
                ))}
                {!sortedVaultsByChain[chain]?.length && (
                  <div className="col-span-full py-8 text-center">
                    <p className="text-muted-foreground">No vaults found matching your criteria.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
