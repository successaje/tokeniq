'use client';

import { VaultList } from './components/vault-list';
import { VaultStats } from './components/vault-stats';
import { BtcVaultsSection } from './components/btc-vaults-section';
import { RWAVaultsSection } from './components/rwa-vaults-section';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, TrendingUp, Shield, Coins } from 'lucide-react';
import { SEI_BRANDING, MOCK_DATA } from '@/config/sei-branding';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function VaultsPage() {
  return (
    <div className="flex-1 p-4 md:p-6 max-w-[2000px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Sei Network Vaults
          </h1>
          <p className="text-muted-foreground mt-1">
            High-performance yield strategies powered by Sei's parallelized execution and ultra-low fees
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            <Sparkles className="h-3 w-3 mr-1" />
            {SEI_BRANDING.badges.intelligenceLayer}
          </Badge>
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
            Sei Network
          </Badge>
        </div>
      </div>

      {/* Sei Network Advantages Banner */}
      <Card className="bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-purple-500/10 border-purple-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5 opacity-50" />
        <CardContent className="p-6 relative">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg bg-purple-500/20 p-2">
                  <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold">Why Sei Network Vaults?</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Ultra-Low Fees</p>
                    <p className="text-muted-foreground">Micro-optimizations profitable with Sei's minimal transaction costs</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Fast Finality</p>
                    <p className="text-muted-foreground">&lt;100ms confirmation times for instant yield updates</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Coins className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div>
                    <p className="font-medium">High Throughput</p>
                    <p className="text-muted-foreground">20,000+ TPS enables real-time portfolio rebalancing</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Parallel Execution</p>
                    <p className="text-muted-foreground">Sei's parallelized order book optimizes yield strategies</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4 mb-4">
                <div className="text-sm text-muted-foreground mb-1">Total Sei Network TVL</div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  ${(MOCK_DATA.vaults.totalTVL / 1000000).toFixed(1)}M
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-background/50 border p-3">
                  <div className="text-xs text-muted-foreground mb-1">Active Vaults</div>
                  <div className="text-xl font-bold">{MOCK_DATA.vaults.activeVaults}</div>
                </div>
                <div className="rounded-lg bg-background/50 border p-3">
                  <div className="text-xs text-muted-foreground mb-1">Avg APY</div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {MOCK_DATA.vaults.averageAPY}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sei Network Featured Vaults */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-2xl font-bold">Featured Sei Network Vaults</h2>
          </div>
          <Badge variant="outline" className="text-sm">
            Highest Yields
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {MOCK_DATA.vaults.seiVaults.map((vault) => (
            <Card 
              key={vault.id} 
              className={cn(
                "border-2 border-purple-500/20 hover:border-purple-500/40 transition-all",
                "bg-gradient-to-br from-purple-500/5 to-indigo-500/5"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{vault.name}</h3>
                    <p className="text-sm text-muted-foreground">{vault.strategy}</p>
                  </div>
                  <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                    Sei
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">APY</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {vault.apy}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">TVL</span>
                    <span className="font-medium">
                      ${(vault.tvl / 1000).toLocaleString()}k
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Risk</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        vault.risk === 'Low' && 'border-green-500 text-green-500',
                        vault.risk === 'Medium' && 'border-yellow-500 text-yellow-500',
                        vault.risk === 'High' && 'border-red-500 text-red-500'
                      )}
                    >
                      {vault.risk}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <VaultStats />
      <div className="mt-6">
        <VaultList />
      </div>
      <RWAVaultsSection />
      <BtcVaultsSection />
    </div>
  );
}
