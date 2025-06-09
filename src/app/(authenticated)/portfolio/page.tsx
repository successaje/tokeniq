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
  HomeIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Mock data for portfolio performance
const PERFORMANCE_DATA = [
  { date: '2024-01', value: 100000 },
  { date: '2024-02', value: 105000 },
  { date: '2024-03', value: 110000 },
  { date: '2024-04', value: 115000 },
  { date: '2024-05', value: 120000 },
  { date: '2024-06', value: 125000 },
  { date: '2024-07', value: 130000 },
  { date: '2024-08', value: 135000 },
  { date: '2024-09', value: 140000 },
  { date: '2024-10', value: 145000 },
  { date: '2024-11', value: 150000 },
  { date: '2024-12', value: 155000 }
];

// Mock data for asset allocation
const ALLOCATION_DATA = [
  { name: 'Real Estate', value: 35, color: '#3B82F6' },
  { name: 'Fixed Income', value: 25, color: '#10B981' },
  { name: 'Equities', value: 20, color: '#F59E0B' },
  { name: 'Cash', value: 20, color: '#6366F1' }
];

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
            <div className="flex items-center text-emerald-500 text-sm">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              +2.2% (24h)
            </div>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Total Return</h2>
            <p className="text-3xl font-bold text-foreground">$22,000</p>
            <div className="flex items-center text-emerald-500 text-sm">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              +11.0% (YTD)
            </div>
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

      {/* Portfolio Performance */}
      <Card className="bg-card hover:bg-accent/50 transition-colors mb-8">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-card-foreground">Portfolio Performance</h2>
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
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PERFORMANCE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#F3F4F6'
                  }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Asset Allocation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-card-foreground">Asset Allocation</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ALLOCATION_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ALLOCATION_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#F3F4F6'
                    }}
                    formatter={(value) => [`${value}%`, 'Allocation']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {ALLOCATION_DATA.map((asset) => (
                <div key={asset.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: asset.color }}
                  />
                  <span className="text-sm text-muted-foreground">{asset.name}</span>
                  <span className="text-sm font-medium text-foreground">{asset.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-card-foreground">Holdings</h2>
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
                    <div className={cn(
                      "text-sm flex items-center justify-end",
                      asset.change24h.startsWith('+') ? "text-emerald-500" : "text-red-500"
                    )}>
                      {asset.change24h.startsWith('+') ? (
                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {asset.change24h}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

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