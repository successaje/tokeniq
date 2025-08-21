'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, ArrowUpDown, ChevronDown, Plus, ArrowUpRight } from 'lucide-react';
import { VaultsByChain } from '@/components/discover/VaultsByChain';
import { VAULT_TYPES } from '@/config/vaults';
import { VaultType } from '@/types/vault';
import { Button } from '@/components/ui/button';
import { TreasuryOverview } from '@/components/discover/TreasuryOverview';
import { StrategyCard } from '@/components/discover/StrategyCard';
import { YieldHistory } from '@/components/discover/YieldHistory';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DiscoverOverviewPage() {
  // Sample data - replace with real data from your API
  const [activeTab, setActiveTab] = useState('overview');
  
  const assets = [
    { name: 'ETH', value: 1500000, color: '#627EEA' },
    { name: 'BTC', value: 1200000, color: '#F7931A' },
    { name: 'USDC', value: 800000, color: '#2775CA' },
    { name: 'Other', value: 500000, color: '#A0AEC0' },
  ];

  const chains = [
    { 
      name: 'Ethereum', 
      value: 2200000, 
      color: '#627EEA',
      logoUrl: '/logos/ethereum.png',
      fallbackUrl: '/logos/ethereum copy.png' // Fallback in case the first one doesn't exist
    },
    { 
      name: 'Arbitrum', 
      value: 800000, 
      color: '#28A0F0',
      logoUrl: '/logos/arbitrum-arb-logo.png',
      fallbackUrl: ''
    },
    { 
      name: 'Optimism', 
      value: 500000, 
      color: '#FF0420',
      logoUrl: '/logos/optimism.png',
      fallbackUrl: ''
    },
    { 
      name: 'Polygon', 
      value: 300000, 
      color: '#8247E5',
      logoUrl: '/logos/polygon-matic-logo.png',
      fallbackUrl: ''
    },
    { 
      name: 'Avalanche', 
      value: 250000, 
      color: '#E84142',
      logoUrl: '/logos/avalanche-avax-logo.png',
      fallbackUrl: ''
    },
    {
      name: 'Sei Network', 
      value: 400000, 
      color: '#00e6b8',
      logoUrl: '/logos/sei-logo.png',
      fallbackUrl: ''
    }
  ];

  const yieldHistoryData = [
    { month: 'Jan', yield: 3.2, change: 0 },
    { month: 'Feb', yield: 3.8, change: 0.6 },
    { month: 'Mar', yield: 4.2, change: 0.4 },
    { month: 'Apr', yield: 5.1, change: 0.9 },
    { month: 'May', yield: 5.7, change: 0.6 },
    { month: 'Jun', yield: 6.3, change: 0.6 },
    { month: 'Jul', yield: 7.1, change: 0.8 },
    { month: 'Aug', yield: 7.8, change: 0.7 },
    { month: 'Sep', yield: 8.2, change: 0.4 },
  ];

  const strategies = [
    {
      id: 1,
      title: 'Stablecoin Yield',
      description: 'Earn yield on stablecoins with minimal risk',
      apr: 8.2,
      risk: 'low',
      tvl: '$12.5M',
      chain: 'Ethereum',
    },
    {
      id: 2,
      title: 'ETH Staking',
      description: 'Stake ETH and earn staking rewards',
      apr: 12.5,
      risk: 'medium',
      tvl: '$8.7M',
      chain: 'Ethereum',
    },
    {
      id: 3,
      title: 'Liquidity Mining',
      description: 'Provide liquidity to top DEX pairs',
      apr: 15.8,
      risk: 'high',
      tvl: '$5.2M',
      chain: 'Arbitrum',
    },
  ];

  return (
    <div className="space-y-6">
      <TreasuryOverview 
        totalBalance="$4,000,000" 
        assets={assets}
        chains={chains}
      />
      
      <VaultsByChain 
        vaults={Object.values(VAULT_TYPES).map(vault => ({
          id: vault.id,
          address: vault.vaultAddress as `0x${string}`,
          name: vault.name,
          symbol: vault.tokenSymbol,
          asset: vault.tokenAddress,
          totalAssets: '0',
          totalSupply: '0',
          apy: vault.apy,
          chainId: 1, // This will be set by the useVaultsData hook
          type: VaultType.STANDARD,
          strategy: vault.strategy,
          tvl: vault.tvl?.toString() || '0',
          performanceFee: 0,
          withdrawalFee: 0,
          lastHarvest: 0,
          // Additional fields for UI
          description: vault.description,
          risk: vault.risk,
          minDeposit: vault.minDeposit,
          tokenDecimals: vault.tokenDecimals,
          tokenSymbol: vault.tokenSymbol,
          tokenAddress: vault.tokenAddress,
          vaultAddress: vault.vaultAddress,
          chain: vault.chain,
          availability: vault.available ? 'public' as const : 'private' as const,
          tags: vault.tags || [],
          isNew: true,
          userBalance: 0n,
          owner: '0x0' as `0x${string}`
        }))} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Portfolio Performance</h2>
            <div className="flex items-center space-x-1">
              {['24H', '7D', '30D', '90D', '1Y', 'ALL'].map((period) => (
                <Button 
                  key={period}
                  variant={period === '30D' ? 'default' : 'ghost'}
                  size="sm" 
                  className={`h-8 px-2 text-xs ${period === '30D' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 max-w-xs mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-muted/20 p-4 rounded-xl border transition-all hover:shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Value</div>
                      <div className="text-xs px-2 py-0.5 bg-muted/50 rounded-full text-muted-foreground">TVL</div>
                    </div>
                    <div className="text-2xl font-bold mt-1">$4.2M</div>
                    <div className="flex items-center text-sm text-green-500 mt-2">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      <span>+12.5% <span className="text-muted-foreground/70 text-xs">(30d)</span></span>
                    </div>
                  </div>
                  
                  <div className="bg-muted/20 p-4 rounded-xl border transition-all hover:shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">30d Yield</div>
                      <div className="text-xs px-2 py-0.5 bg-muted/50 rounded-full text-muted-foreground">Net</div>
                    </div>
                    <div className="text-2xl font-bold mt-1">$42,500</div>
                    <div className="flex items-center text-sm text-green-500 mt-2">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      <span>+2.3% <span className="text-muted-foreground/70 text-xs">(7d)</span></span>
                    </div>
                  </div>
                  
                  <div className="bg-muted/20 p-4 rounded-xl border transition-all hover:shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">APY</div>
                      <div className="text-xs px-2 py-0.5 bg-muted/50 rounded-full text-muted-foreground">Annualized</div>
                    </div>
                    <div className="text-2xl font-bold mt-1">12.8%</div>
                    <div className="flex items-center text-sm text-green-500 mt-2">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      <span>+1.6% <span className="text-muted-foreground/70 text-xs">vs benchmark</span></span>
                    </div>
                  </div>
                  
                  <div className="bg-muted/20 p-4 rounded-xl border transition-all hover:shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Risk Score</div>
                        <div className="flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm font-medium">Low Risk</span>
                        </div>
                      </div>
                      <div className="text-xs px-2.5 py-1 bg-green-500/10 text-green-500 rounded-full font-medium">3/10</div>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-2 mb-1.5">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-400" 
                        style={{ width: '30%' }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                      <span>Conservative</span>
                      <span>Aggressive</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Asset Allocation</h3>
                      <Button variant="ghost" size="sm" className="h-8 text-xs">View All</Button>
                    </div>
                    <div className="space-y-3">
                      {assets.map((asset) => (
                        <div key={asset.name} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: asset.color }}
                              />
                              <span>{asset.name}</span>
                            </div>
                            <span className="font-medium">
                              ${(asset.value / 1000000).toFixed(1)}M
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{
                                width: `${(asset.value / 4000000) * 100}%`,
                                backgroundColor: asset.color
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Chain Distribution</h3>
                      <Button variant="ghost" size="sm" className="h-8 text-xs">View All</Button>
                    </div>
                    <div className="space-y-3">
                      {chains.map((chain) => (
                        <div key={chain.name} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center">
                              <div className="w-5 h-5 rounded-full mr-2 overflow-hidden bg-muted flex items-center justify-center">
                                <img 
                                  src={chain.logoUrl} 
                                  alt={`${chain.name} logo`}
                                  className="w-4 h-4 object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    console.log(`Error loading ${chain.name} logo from ${target.src}`);
                                    if (target.src !== chain.fallbackUrl) {
                                      target.src = chain.fallbackUrl;
                                    } else {
                                      target.onerror = null;
                                      target.src = `https://ui-avatars.com/api/?name=${chain.name}&background=${chain.color.replace('#', '')}&color=fff`;
                                    }
                                  }}
                                />
                              </div>
                              <span>{chain.name}</span>
                            </div>
                            <span className="font-medium">
                              ${(chain.value / 1000000).toFixed(1)}M
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{
                                width: `${(chain.value / 4000000) * 100}%`,
                                backgroundColor: chain.color
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="performance">
              <div className="h-[300px]">
                <YieldHistory data={yieldHistoryData} />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                AI-Powered Strategies
              </h2>
              <p className="text-muted-foreground">
                Optimized yield strategies tailored to your risk profile
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="w-4 h-4" />
                Sort
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategies.map((strategy, index) => (
              <motion.div
                key={strategy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * (index + 1) }}
              >
                <StrategyCard
                  title={strategy.title}
                  description={strategy.description}
                  apr={strategy.apr}
                  risk={strategy.risk as 'low' | 'medium' | 'high'}
                  tvl={strategy.tvl}
                  chain={strategy.chain}
                  onSelect={() => console.log('Selected strategy:', strategy.id)}
                />
              </motion.div>
            ))}
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * (strategies.length + 1) }}
              className="relative group"
            >
              <Card className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors cursor-pointer bg-gradient-to-br from-background to-muted/20">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-medium mb-1 text-center">Create Custom Strategy</h3>
                <p className="text-sm text-muted-foreground text-center">Build your own strategy with our AI assistant</p>
              </Card>
            </motion.div>
          </div>
          
          <div className="flex justify-center mt-6">
            <Button variant="outline" className="gap-2">
              Load More Strategies
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
      
      <YieldHistory data={yieldHistoryData} className="mt-6" />
    </div>
  );
}
