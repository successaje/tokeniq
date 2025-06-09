'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Mock data for portfolio assets
const PORTFOLIO_ASSETS = [
  {
    id: 1,
    name: 'Real Estate Token',
    type: 'RWA',
    value: 75000,
    allocation: '35%',
    change24h: '+2.5%',
    icon: BuildingOfficeIcon
  },
  {
    id: 2,
    name: 'Corporate Bonds',
    type: 'Fixed Income',
    value: 45000,
    allocation: '25%',
    change24h: '+1.2%',
    icon: BriefcaseIcon
  },
  {
    id: 3,
    name: 'Residential Property',
    type: 'RWA',
    value: 60000,
    allocation: '20%',
    change24h: '+3.1%',
    icon: HomeIcon
  },
  {
    id: 4,
    name: 'Commercial Property',
    type: 'RWA',
    value: 40000,
    allocation: '20%',
    change24h: '+1.8%',
    icon: BuildingOfficeIcon
  }
];

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const [timeRange, setTimeRange] = useState('1M');

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Please connect your wallet</h1>
        <p className="text-muted-foreground">
          Connect your wallet to view your portfolio
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          <p className="text-muted-foreground">
            Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}
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
          <Button
            className="flex items-center"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Total Value</h2>
            <p className="text-3xl font-bold text-foreground">$220,000</p>
            <p className="text-emerald-500 text-sm">+2.2% (24h)</p>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Total Return</h2>
            <p className="text-3xl font-bold text-foreground">$22,000</p>
            <p className="text-emerald-500 text-sm">+11.0% (YTD)</p>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Asset Count</h2>
            <p className="text-3xl font-bold text-foreground">4</p>
            <p className="text-muted-foreground text-sm">3 RWA, 1 Fixed Income</p>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Risk Score</h2>
            <p className="text-3xl font-bold text-foreground">Medium</p>
            <p className="text-muted-foreground text-sm">Balanced Portfolio</p>
          </div>
        </Card>
      </div>

      {/* Portfolio Allocation */}
      <Card className="bg-card hover:bg-accent/50 transition-colors mb-8">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-card-foreground">Portfolio Allocation</h2>
            <div className="flex gap-2">
              {['1W', '1M', '3M', '1Y', 'ALL'].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart placeholder */}
            <div className="h-[300px] bg-accent/20 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            {/* Asset list */}
            <div className="space-y-4">
              {PORTFOLIO_ASSETS.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <asset.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{asset.name}</p>
                      <p className="text-sm text-muted-foreground">{asset.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">${asset.value.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{asset.allocation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Performance Metrics */}
      <Card className="bg-card hover:bg-accent/50 transition-colors">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6 text-card-foreground">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-accent/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-card-foreground">Total Return</h3>
              </div>
              <p className="text-2xl font-bold text-foreground">11.0%</p>
              <p className="text-sm text-muted-foreground">Year to Date</p>
            </div>
            <div className="p-4 bg-accent/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-card-foreground">Income Generated</h3>
              </div>
              <p className="text-2xl font-bold text-foreground">$8,500</p>
              <p className="text-sm text-muted-foreground">Last 12 months</p>
            </div>
            <div className="p-4 bg-accent/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ChartBarIcon className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-card-foreground">Risk-Adjusted Return</h3>
              </div>
              <p className="text-2xl font-bold text-foreground">1.8</p>
              <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
} 