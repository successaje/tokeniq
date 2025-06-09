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
  ArrowDownIcon,
  UsersIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data for TVL growth
const TVL_DATA = [
  { date: '2024-01', value: 1000000 },
  { date: '2024-02', value: 1200000 },
  { date: '2024-03', value: 1500000 },
  { date: '2024-04', value: 1800000 },
  { date: '2024-05', value: 2200000 },
  { date: '2024-06', value: 2500000 },
  { date: '2024-07', value: 2800000 },
  { date: '2024-08', value: 3200000 },
  { date: '2024-09', value: 3500000 },
  { date: '2024-10', value: 3800000 },
  { date: '2024-11', value: 4200000 },
  { date: '2024-12', value: 4500000 }
];

// Mock data for asset distribution
const ASSET_DISTRIBUTION = [
  { name: 'Real Estate', value: 45, color: '#3B82F6' },
  { name: 'Fixed Income', value: 25, color: '#10B981' },
  { name: 'Equities', value: 20, color: '#F59E0B' },
  { name: 'Cash', value: 10, color: '#6366F1' }
];

// Mock data for user growth
const USER_GROWTH = [
  { date: '2024-01', users: 100 },
  { date: '2024-02', users: 150 },
  { date: '2024-03', users: 220 },
  { date: '2024-04', users: 300 },
  { date: '2024-05', users: 400 },
  { date: '2024-06', users: 520 },
  { date: '2024-07', users: 650 },
  { date: '2024-08', users: 800 },
  { date: '2024-09', users: 950 },
  { date: '2024-10', users: 1100 },
  { date: '2024-11', users: 1300 },
  { date: '2024-12', users: 1500 }
];

// Mock data for transaction volume
const TRANSACTION_VOLUME = [
  { month: 'Jan', volume: 250000 },
  { month: 'Feb', volume: 300000 },
  { month: 'Mar', volume: 350000 },
  { month: 'Apr', volume: 400000 },
  { month: 'May', volume: 450000 },
  { month: 'Jun', volume: 500000 }
];

export default function AnalyticsPage() {
  const { address, isConnected } = useAccount();
  const [timeRange, setTimeRange] = useState('1Y');

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Please connect your wallet</h1>
        <p className="text-muted-foreground">
          Connect your wallet to view analytics
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Platform performance and metrics
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Total Value Locked</h2>
            <p className="text-3xl font-bold text-foreground">$4.5M</p>
            <div className="flex items-center text-emerald-500 text-sm">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              +12.5% (30d)
            </div>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Active Users</h2>
            <p className="text-3xl font-bold text-foreground">1,500</p>
            <div className="flex items-center text-emerald-500 text-sm">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              +25.0% (30d)
            </div>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Transaction Volume</h2>
            <p className="text-3xl font-bold text-foreground">$500K</p>
            <div className="flex items-center text-emerald-500 text-sm">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              +15.0% (30d)
            </div>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Average APY</h2>
            <p className="text-3xl font-bold text-foreground">8.5%</p>
            <div className="flex items-center text-emerald-500 text-sm">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              +0.5% (30d)
            </div>
          </div>
        </Card>
      </div>

      {/* TVL Growth */}
      <Card className="bg-card hover:bg-accent/50 transition-colors mb-8">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-card-foreground">TVL Growth</h2>
            <div className="flex gap-2">
              {['1M', '3M', '6M', '1Y', 'ALL'].map((range) => (
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
              <AreaChart data={TVL_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#F3F4F6'
                  }}
                  formatter={(value) => [`$${(Number(value) / 1000000).toFixed(2)}M`, 'TVL']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  fill="#3B82F6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Asset Distribution and User Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-card-foreground">Asset Distribution</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ASSET_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ASSET_DISTRIBUTION.map((entry, index) => (
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
              {ASSET_DISTRIBUTION.map((asset) => (
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
            <h2 className="text-xl font-semibold mb-6 text-card-foreground">User Growth</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={USER_GROWTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#F3F4F6'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Transaction Volume */}
      <Card className="bg-card hover:bg-accent/50 transition-colors">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6 text-card-foreground">Transaction Volume</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TRANSACTION_VOLUME}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#F3F4F6'
                  }}
                  formatter={(value) => [`$${(Number(value) / 1000).toFixed(0)}K`, 'Volume']}
                />
                <Bar 
                  dataKey="volume" 
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </>
  );
} 