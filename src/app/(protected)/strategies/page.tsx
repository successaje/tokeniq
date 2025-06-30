'use client';

import { useState, useEffect } from 'react';
import { StrategyCard } from './components/strategy-card';
import { StrategyCardSkeleton } from './components/strategy-card-skeleton';
import { StrategyPreviewModal } from './components/strategy-preview-modal';
import { ScheduleStrategyModal } from './components/schedule-strategy-modal';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data for strategies
const strategiesData: Strategy[] = [
  {
    id: '1',
    title: 'Stable Yield',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    allocation: 35,
    apy: 5.2,
    riskLevel: 'Low',
    lastExecuted: '2h ago',
    summary: 'Low-risk strategy focusing on stablecoin yield farming across DeFi protocols.'
  },
  {
    id: '2',
    title: 'DeFi Blue Chips',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    allocation: 25,
    apy: 8.7,
    riskLevel: 'Medium',
    lastExecuted: '5h ago',
    summary: 'Invest in top DeFi tokens with balanced risk and reward profile.'
  },
  {
    id: '3',
    title: 'Liquidity Mining',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    allocation: 20,
    apy: 12.3,
    riskLevel: 'High',
    lastExecuted: '1d ago',
    summary: 'Provide liquidity to top DEXes and earn trading fees and rewards.'
  },
  {
    id: '4',
    title: 'Staking Pool',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    allocation: 15,
    apy: 4.5,
    riskLevel: 'Low',
    lastExecuted: '3h ago',
    summary: 'Stake native tokens to secure networks and earn staking rewards.'
  },
  {
    id: '5',
    title: 'Yield Aggregator',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    allocation: 5,
    apy: 9.1,
    riskLevel: 'Medium',
    lastExecuted: '6h ago',
    summary: 'Automatically move funds between protocols to maximize yield.'
  }
];

// Types for our strategy
type Strategy = {
  id: string;
  title: string;
  icon: React.ReactNode;
  allocation: number;
  summary: string;
  apy?: number;
  riskLevel?: 'Low' | 'Medium' | 'High';
  lastExecuted?: string;
};

export default function StrategiesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState<'a-z' | 'allocation' | 'risk'>('a-z');
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setStrategies(strategiesData);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      toast.success('Strategies refreshed');
      setIsLoading(false);
    }, 800);
  };

  // Handle strategy scheduling
  const handleScheduleSubmit = (date: Date, amount: string) => {
    if (!selectedStrategy) return;
    
    // In a real app, this would be an API call
    console.log(`Scheduled ${amount} USDC for ${selectedStrategy.title} on ${date}`);
    
    // Show success toast
    toast.success(`Scheduled ${selectedStrategy.title} strategy`, {
      description: `Will execute on ${date.toLocaleDateString()} with ${amount} USDC`
    });
    
    setIsScheduleOpen(false);
  };

  const filteredStrategies = strategies
    .filter(strategy => {
      const matchesSearch = 
        strategy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        strategy.summary.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeTab === 'all') return matchesSearch;
      if (activeTab === 'active') return matchesSearch && strategy.allocation > 0;
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'a-z') return a.title.localeCompare(b.title);
      if (sortBy === 'allocation') return b.allocation - a.allocation;
      // Sort by risk (Low < Medium < High)
      const riskOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
      return (riskOrder[a.riskLevel || 'Medium'] || 0) - (riskOrder[b.riskLevel || 'Medium'] || 0);
    });

  const handlePreview = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setIsPreviewOpen(true);
  };

  const handleSchedule = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setIsScheduleOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  Investment Strategies
                  <div className="mt-1 h-1 w-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                </h1>
                <p className="mt-2 text-gray-500">
                  Browse and manage your investment strategies
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRefresh}
                disabled={isLoading}
                className={isLoading ? 'cursor-not-allowed' : ''}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          </div>
          <Button 
            className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm transition-all hover:shadow-md hover:shadow-blue-500/30"
            onClick={() => {
              // In a real app, this would open a form to create a new strategy
              toast.info('Create new strategy form would open here');
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="relative z-10">New Strategy</span>
            <span className="absolute inset-0 -z-0 bg-gradient-to-r from-blue-400/0 via-white/30 to-blue-400/0 opacity-0 transition-opacity group-hover:opacity-100"></span>
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full md:w-auto"
            >
              <TabsList className="bg-gray-100 p-1 h-auto">
                <TabsTrigger 
                  value="all" 
                  className="px-4 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
                >
                  All Strategies
                </TabsTrigger>
                <TabsTrigger 
                  value="active" 
                  className="px-4 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
                >
                  Active
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex space-x-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search strategies..."
                  className="pl-9 border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    disabled={isLoading}
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 border-gray-200 bg-white shadow-lg">
                  <DropdownMenuLabel className="text-gray-700">Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuCheckboxItem 
                    checked={sortBy === 'a-z'} 
                    onCheckedChange={() => setSortBy('a-z')}
                    className="text-gray-700 focus:bg-blue-50 focus:text-blue-600"
                  >
                    A-Z
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem 
                    checked={sortBy === 'allocation'}
                    onCheckedChange={() => setSortBy('allocation')}
                    className="text-gray-700 focus:bg-blue-50 focus:text-blue-600"
                  >
                    Allocation
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem 
                    checked={sortBy === 'risk'}
                    onCheckedChange={() => setSortBy('risk')}
                    className="text-gray-700 focus:bg-blue-50 focus:text-blue-600"
                  >
                    Risk Level
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <StrategyCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {filteredStrategies.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredStrategies.map((strategy) => {
                    const { id, title, icon, allocation, apy, riskLevel, summary, lastExecuted } = strategy;
                    return (
                      <div 
                        key={id}
                        className="relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <StrategyCard
                          title={title}
                          icon={icon}
                          allocation={allocation}
                          apy={apy}
                          riskLevel={riskLevel}
                          lastExecuted={lastExecuted}
                          summary={summary}
                          onPreview={() => handlePreview(strategy)}
                          onSchedule={() => handleSchedule(strategy)}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 p-3 text-blue-600">
                    <Search className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No strategies found</h3>
                  <p className="mt-2 text-gray-500">
                    {searchTerm 
                      ? 'No strategies match your search. Try adjusting your filters.'
                      : activeTab === 'active' 
                        ? 'You don\'t have any active strategies yet.'
                        : 'No strategies available.'}
                  </p>
                  <div className="mt-6 flex justify-center space-x-3">
                    {searchTerm && (
                      <Button 
                        variant="outline" 
                        onClick={() => setSearchTerm('')}
                        className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      >
                        Clear search
                      </Button>
                    )}
                    <Button 
                      variant="default"
                      onClick={() => {
                        // In a real app, this would open a form to create a new strategy
                        toast.info('Create new strategy form would open here');
                      }}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Strategy
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedStrategy && (
        <>
          <StrategyPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            strategy={{
              title: selectedStrategy.title,
              description: selectedStrategy.summary,
              allocation: selectedStrategy.allocation,
              riskLevel: 'Medium',
              apy: 5.8,
              tvl: '$12.5M',
              minLockPeriod: '30 days',
            }}
          />
          
          <ScheduleStrategyModal
            isOpen={isScheduleOpen}
            onClose={() => setIsScheduleOpen(false)}
            strategyName={selectedStrategy.title}
            onSchedule={handleScheduleSubmit}
          />
        </>
      )}
    </div>
  );
}
