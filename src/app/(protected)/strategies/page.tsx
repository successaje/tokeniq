'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Search, Filter, Plus, ShieldAlert, ArrowUpRight, Zap, Target, SlidersHorizontal, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Mock data for strategies
const STRATEGIES = [
  {
    id: '1',
    title: 'Arbitrum Delta-Neutral',
    protocol: 'Aave V3 + Uniswap V3',
    allocation: 350000,
    apy: 12.4,
    risk: 'Low',
    tvl: '$45.2M',
    status: 'active'
  },
  {
    id: '2',
    title: 'ETH LST Compounding',
    protocol: 'Lido + Curve',
    allocation: 1250000,
    apy: 8.7,
    risk: 'Medium',
    tvl: '$120.5M',
    status: 'active'
  },
  {
    id: '3',
    title: 'USDC Yield Optimizer',
    protocol: 'Compound V3',
    allocation: 0,
    apy: 6.2,
    risk: 'Low',
    tvl: '$250.1M',
    status: 'available'
  },
  {
    id: '4',
    title: 'Base Liquidity Mining',
    protocol: 'Aerodrome',
    allocation: 50000,
    apy: 24.5,
    risk: 'High',
    tvl: '$18.4M',
    status: 'active'
  }
];

export default function StrategiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active'>('all');

  const filteredStrategies = STRATEGIES.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || s.status === 'active';
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Execution Strategies</h1>
          <p className="text-muted-foreground text-sm">
            Manage active vaults and deploy capital to AI-optimized strategies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-9 gap-2">
            <SlidersHorizontal className="h-4 w-4" /> Parameters
          </Button>
          <Button className="h-9 gap-2">
            <Plus className="h-4 w-4" /> Create Custom
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex bg-muted/30 p-1 rounded-md border border-border/50">
          <button 
            onClick={() => setActiveFilter('all')}
            className={cn(
              "text-xs px-4 py-1.5 rounded-sm font-medium transition-colors",
              activeFilter === 'all' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            All Vaults
          </button>
          <button 
            onClick={() => setActiveFilter('active')}
            className={cn(
              "text-xs px-4 py-1.5 rounded-sm font-medium transition-colors flex items-center gap-1.5",
              activeFilter === 'active' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active Only
          </button>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by protocol or strategy..." 
            className="pl-9 h-9 bg-card/30 border-border/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {filteredStrategies.map((strategy, i) => (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="flex flex-col border-border/50 bg-card/30 hover:bg-card/50 transition-colors overflow-hidden h-full">
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{strategy.title}</h3>
                        {strategy.status === 'active' && (
                          <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-500 text-[10px] uppercase font-bold tracking-wider">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{strategy.protocol}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-emerald-500">{strategy.apy}%</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Projected APY</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Your Allocation</div>
                      <div className="font-medium text-sm">${strategy.allocation.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        Risk <ShieldAlert className="h-3 w-3" />
                      </div>
                      <div className={cn(
                        "font-medium text-sm",
                        strategy.risk === 'Low' ? "text-emerald-500" :
                        strategy.risk === 'Medium' ? "text-amber-500" : "text-destructive"
                      )}>{strategy.risk}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Global TVL</div>
                      <div className="font-medium text-sm">{strategy.tvl}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <Button className="flex-1 h-9 text-xs font-semibold gap-1.5" variant={strategy.status === 'active' ? "default" : "secondary"}>
                    {strategy.status === 'active' ? 'Manage Position' : 'Deploy Capital'}
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <LineChart className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-border to-border/30" />
            </Card>
          </motion.div>
        ))}

        {filteredStrategies.length === 0 && (
          <div className="col-span-1 lg:col-span-2 py-12 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl bg-card/10">
            <Target className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <h3 className="font-medium text-foreground">No Strategies Found</h3>
            <p className="text-sm text-muted-foreground">Adjust your filters or search term to discover new vaults.</p>
          </div>
        )}
      </div>

    </div>
  );
}
