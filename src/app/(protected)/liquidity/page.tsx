'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  CurrencyDollarIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  HomeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BanknotesIcon,
  CreditCardIcon,
  LockClosedIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Mock data for lending pools
const LENDING_POOLS = [
  {
    id: 1,
    name: 'Real Estate Pool',
    apy: '8.5%',
    tvl: 2500000,
    available: 750000,
    minDeposit: 1000,
    maxDeposit: 100000,
    icon: BuildingOfficeIcon
  },
  {
    id: 2,
    name: 'Corporate Bonds Pool',
    apy: '6.2%',
    tvl: 1800000,
    available: 450000,
    minDeposit: 500,
    maxDeposit: 50000,
    icon: BriefcaseIcon
  },
  {
    id: 3,
    name: 'Residential Property Pool',
    apy: '7.8%',
    tvl: 3200000,
    available: 950000,
    minDeposit: 2000,
    maxDeposit: 200000,
    icon: HomeIcon
  }
];

// Mock data for loan quotes
const LOAN_QUOTES = [
  {
    id: 1,
    provider: 'Aave',
    rate: '5.2%',
    term: '12 months',
    maxAmount: 100000,
    collateral: 'Real Estate Token',
    icon: BanknotesIcon
  },
  {
    id: 2,
    provider: 'Compound',
    rate: '4.8%',
    term: '24 months',
    maxAmount: 150000,
    collateral: 'Corporate Bonds',
    icon: CreditCardIcon
  },
  {
    id: 3,
    provider: 'MakerDAO',
    rate: '3.9%',
    term: '36 months',
    maxAmount: 200000,
    collateral: 'Residential Property',
    icon: LockClosedIcon
  }
];

export default function LiquidityPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('lend');

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Please connect your wallet</h1>
        <p className="text-muted-foreground">
          Connect your wallet to access liquidity features
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liquidity</h1>
          <p className="text-muted-foreground">
            Access borrowing, lending, and liquidity features
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex items-center"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BanknotesIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Borrow</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Get instant loans using your tokenized assets as collateral
            </p>
            <Button className="w-full">
              Get Loan Quote
            </Button>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Lend</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Earn interest by providing liquidity to our lending pools
            </p>
            <Button className="w-full">
              View Pools
            </Button>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <LockClosedIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Lock Assets</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Lock your assets to receive instant capital
            </p>
            <Button className="w-full">
              Lock Assets
            </Button>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Lending Pools */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">Lending Pools</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">All Pools</Button>
              <Button variant="outline" size="sm">My Positions</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LENDING_POOLS.map((pool) => (
              <Card key={pool.id} className="bg-card hover:bg-accent/50 transition-colors">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <pool.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">{pool.name}</h3>
                      <p className="text-sm text-muted-foreground">TVL: ${(pool.tvl / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">APY</span>
                      <span className="font-medium text-foreground">{pool.apy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Available</span>
                      <span className="font-medium text-foreground">${(pool.available / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Min Deposit</span>
                      <span className="font-medium text-foreground">${pool.minDeposit.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button className="w-full">
                    Provide Liquidity
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Loan Quotes */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">Available Loan Quotes</h2>
            <Button variant="outline" size="sm">Refresh Quotes</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LOAN_QUOTES.map((quote) => (
              <Card key={quote.id} className="bg-card hover:bg-accent/50 transition-colors">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <quote.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">{quote.provider}</h3>
                      <p className="text-sm text-muted-foreground">{quote.collateral}</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Interest Rate</span>
                      <span className="font-medium text-foreground">{quote.rate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Term</span>
                      <span className="font-medium text-foreground">{quote.term}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Max Amount</span>
                      <span className="font-medium text-foreground">${(quote.maxAmount / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                  <Button className="w-full">
                    Apply for Loan
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Active Positions */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-6">Your Active Positions</h2>
          <Card className="bg-card">
            <div className="p-6">
              <div className="text-center py-8">
                <CurrencyDollarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Active Positions</h3>
                <p className="text-muted-foreground mb-4">
                  Start by providing liquidity to a pool or taking out a loan
                </p>
                <Button>Explore Options</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
} 