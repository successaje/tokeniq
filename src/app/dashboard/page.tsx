import React from 'react';
import { 
  ArrowDownTrayIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  ChartBarIcon,
  CubeIcon,
  SparklesIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import TokenChart from '../../components/TokenChart';
import TokenAllocationChart from '../../components/TokenAllocationChart';

// Mock data for treasury strategies
const treasuryStrategies = [
  {
    id: 1,
    name: 'Stablecoin Yield',
    apy: '5.8%',
    tvl: '$8.4M',
    change: '+1.2%',
    isPositive: true,
    strategy: 'Money Market',
    chain: 'Ethereum',
    risk: 'Low',
    icon: '🏦'
  },
  {
    id: 2,
    name: 'Treasury Bonds',
    apy: '4.2%',
    tvl: '$15.2M',
    change: '+0.5%',
    isPositive: true,
    strategy: 'Fixed Income',
    chain: 'Arbitrum',
    risk: 'Low',
    icon: '📈'
  },
  {
    id: 3,
    name: 'LST Yield',
    apy: '7.1%',
    tvl: '$22.6M',
    change: '-0.8%',
    isPositive: false,
    strategy: 'Liquid Staking',
    chain: 'Ethereum',
    risk: 'Medium',
    icon: '🔄'
  },
];

// Mock data for treasury allocation
const treasuryAllocation = [
  { name: 'Cash & Equivalents', value: 40, color: 'bg-blue-500' },
  { name: 'Fixed Income', value: 30, color: 'bg-green-500' },
  { name: 'Growth Assets', value: 20, color: 'bg-purple-500' },
  { name: 'Alternative Investments', value: 10, color: 'bg-orange-500' },
];

export default function DashboardPage() {
  // Mock chart data
  const chartData = [
    { date: 'Jan', value: 100 },
    { date: 'Feb', value: 200 },
    { date: 'Mar', value: 150 },
    { date: 'Apr', value: 300 },
    { date: 'May', value: 250 },
    { date: 'Jun', value: 400 },
  ];

  // Mock treasury activity data
  const recentActivity = [
    { id: 1, type: 'Deposit', amount: '1,000,000', token: 'USDC', time: '2 min ago' },
    { id: 2, type: 'Strategy Execution', amount: '500,000', token: 'USDT', strategy: 'Money Market', time: '1 hour ago' },
    { id: 3, type: 'Rebalance', amount: '250,000', token: 'ETH', from: 'Stablecoin', to: 'LST', time: '3 hours ago' },
  ];

  return (
    <>
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Treasury Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              AI-optimized treasury management across multiple chains
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2">
              <ArrowDownTrayIcon className="h-4 w-4" />
              Deposit
            </Button>
            <Button className="gap-2">
              <SparklesIcon className="h-4 w-4" />
              Create Vault
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Treasury Value</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">$24,567,890</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <BanknotesIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">+5.67%</span>
              <span className="text-muted-foreground ml-1">vs last 24h</span>
            </div>
          </Card>

          <Card className="p-4 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">30-Day Yield</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">5.42%</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <ChartBarIcon className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">+1.2%</span>
              <span className="text-muted-foreground ml-1">vs last week</span>
            </div>
          </Card>

          <Card className="p-4 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">3.2/10</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CubeIcon className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <span className="text-muted-foreground">Across 3 chains</span>
            </div>
          </Card>

          <Card className="p-4 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Strategies</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">6</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <ArrowsRightLeftIcon className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-500 font-medium">+12.3%</span>
              <span className="text-muted-foreground ml-1">vs yesterday</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Value Chart */}
          <Card className="bg-card">
            <div className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-foreground">Treasury Performance</h3>
                  <p className="text-sm text-muted-foreground">Last 90 days</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">1M</Button>
                  <Button variant="outline" size="sm">3M</Button>
                  <Button variant="primary" size="sm">1Y</Button>
                  <Button variant="outline" size="sm">All</Button>
                </div>
              </div>
              <div className="h-80 mt-4">
                <TokenChart data={chartData} />
              </div>
            </div>
          </Card>

          {/* Active Strategies */}
          <Card className="bg-card">
            <div className="p-4">
              <h3 className="text-lg font-medium text-foreground mb-4">Active Strategies</h3>
              <div className="space-y-4">
                {treasuryStrategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{strategy.icon}</div>
                      <div>
                        <h4 className="font-medium text-foreground">{strategy.name}</h4>
                        <p className="text-sm text-muted-foreground">{strategy.strategy} • {strategy.chain}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{strategy.tvl}</p>
                      <p className="text-sm text-muted-foreground">APY: {strategy.apy}</p>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        strategy.isPositive ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {strategy.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Treasury Allocation */}
          <Card className="bg-card">
            <div className="p-4">
              <h3 className="text-lg font-medium text-foreground mb-4">Treasury Allocation</h3>
              <TokenAllocationChart />
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card">
            <div className="p-4">
              <h3 className="text-lg font-medium text-foreground mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                  >
                    <div>
                      <p className="font-medium text-foreground">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{activity.amount} {activity.token}</p>
                      {activity.strategy && (
                        <p className="text-sm text-muted-foreground">{activity.strategy}</p>
                      )}
                      {activity.from && (
                        <p className="text-sm text-muted-foreground">
                          {activity.from} → {activity.to}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
