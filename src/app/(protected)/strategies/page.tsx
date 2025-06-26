'use client';

import { useState } from 'react';
import { StrategyCard } from './components/strategy-card';
import { StrategyPreviewModal } from './components/strategy-preview-modal';
import { ScheduleStrategyModal } from './components/schedule-strategy-modal';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data for strategies
const strategies = [
  {
    id: '1',
    title: 'Stable Yield',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>,
    allocation: 35,
    summary: 'Low-risk strategy focusing on stablecoin yield farming across DeFi protocols.'
  },
  {
    id: '2',
    title: 'DeFi Blue Chips',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>,
    allocation: 25,
    summary: 'Invest in top DeFi tokens with balanced risk and reward profile.'
  },
  {
    id: '3',
    title: 'Liquidity Mining',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>,
    allocation: 20,
    summary: 'Provide liquidity to top DEXes and earn trading fees and rewards.'
  },
  {
    id: '4',
    title: 'Staking Pool',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>,
    allocation: 15,
    summary: 'Stake native tokens to secure networks and earn staking rewards.'
  },
  {
    id: '5',
    title: 'Yield Aggregator',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>,
    allocation: 5,
    summary: 'Automatically move funds between protocols to maximize yield.'
  }
];

export default function StrategiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<typeof strategies[0] | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const filteredStrategies = strategies.filter(strategy =>
    strategy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    strategy.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePreview = (strategy: typeof strategies[0]) => {
    setSelectedStrategy(strategy);
    setIsPreviewOpen(true);
  };

  const handleSchedule = (strategy: typeof strategies[0]) => {
    setSelectedStrategy(strategy);
    setIsScheduleOpen(true);
  };

  const handleScheduleSubmit = (date: Date, amount: string) => {
    // Handle the scheduling logic here
    console.log(`Scheduled ${amount} USDC for ${selectedStrategy?.title} on ${date}`);
    // You would typically make an API call here
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Investment Strategies</h1>
            <p className="text-muted-foreground">
              Browse and manage your investment strategies
            </p>
          </div>
          <Button>Create New Strategy</Button>
        </div>

        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search strategies..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2
          ">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>
                  All Strategies
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>
                  Active
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>
                  Inactive
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Sort by: A-Z</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>
                  A-Z
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>
                  Allocation
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>
                  Risk Level
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStrategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              title={strategy.title}
              icon={strategy.icon}
              allocation={strategy.allocation}
              summary={strategy.summary}
              onPreview={() => handlePreview(strategy)}
              onSchedule={() => handleSchedule(strategy)}
            />
          ))}
        </div>

        {filteredStrategies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium text-muted-foreground">No strategies found</p>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
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
