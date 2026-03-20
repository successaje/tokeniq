'use client';

import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  Shield,
  BarChart3,
  Sparkles,
  Clock,
  Activity,
  DollarSign,
  PieChart,
} from 'lucide-react';
import Link from 'next/link';
import { SEI_BRANDING, MOCK_DATA } from '@/config/sei-branding';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

// Mock portfolio performance data
const portfolioPerformance = [
  { date: 'Jan', value: 28000 },
  { date: 'Feb', value: 29000 },
  { date: 'Mar', value: 28500 },
  { date: 'Apr', value: 29500 },
  { date: 'May', value: 30000 },
  { date: 'Jun', value: 30000 },
];

// Mock yield data
const yieldData = [
  { date: 'Jan', yield: 8.2 },
  { date: 'Feb', yield: 8.4 },
  { date: 'Mar', yield: 8.3 },
  { date: 'Apr', value: 8.5 },
  { date: 'May', yield: 8.5 },
  { date: 'Jun', yield: 8.5 },
];

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const portfolio = MOCK_DATA.portfolio;
  const portfolioChange = 2.45;
  const isPositive = portfolioChange >= 0;

  const quickActions = [
    {
      title: 'Discover Vaults',
      description: 'Explore Sei yield opportunities',
      icon: Zap,
      href: '/protected/discover',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'View Portfolio',
      description: 'Manage your assets',
      icon: Wallet,
      href: '/protected/portfolio',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'AI Insights',
      description: 'Get smart recommendations',
      icon: Sparkles,
      href: '/protected/insights',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      title: 'Analytics',
      description: 'Track performance',
      icon: BarChart3,
      href: '/protected/analytics',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  if (!isConnected) {
    return (
      <div className="flex-1 p-4 md:p-6 max-w-[2000px] mx-auto w-full">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Welcome to TokenIQ</h1>
            <p className="text-muted-foreground text-lg">
              Connect your wallet to get started with AI-powered DeFi on Sei Network
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              Powered by Sei Intelligence Layer
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 max-w-[2000px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Your DeFi command center on Sei Network
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

      {/* Portfolio Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-purple-500/10 to-indigo-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <div className="rounded-lg bg-primary/10 p-2">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={cn(
              "flex items-center text-xs mt-1",
              isPositive ? 'text-green-500' : 'text-red-500'
            )}>
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {isPositive ? '+' : ''}{portfolioChange}% (24h)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Annual Yield</CardTitle>
            <div className="rounded-lg bg-green-500/10 p-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              +${MOCK_DATA.portfolio.totalYield.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on current allocations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average APY</CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.apy}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all strategies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Strategies</CardTitle>
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">
              Conservative, Balanced, Growth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Portfolio Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
            <p className="text-sm text-muted-foreground">Last 6 months</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioPerformance}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    fill="url(#portfolioGradient)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Yield Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Yield Performance</CardTitle>
            <p className="text-sm text-muted-foreground">APY over time</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yieldData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`${value}%`, 'APY']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="yield" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <p className="text-sm text-muted-foreground">Get started with TokenIQ</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className={cn("rounded-lg p-3 w-fit mb-4", action.bgColor)}>
                        <Icon className={cn("h-6 w-6", action.color)} />
                      </div>
                      <h3 className="font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Token Holdings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Token Holdings</CardTitle>
              <p className="text-sm text-muted-foreground">Your assets on Sei Network</p>
            </div>
            <Link href="/protected/portfolio">
              <Button variant="outline" size="sm">
                View All
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {portfolio.tokens.slice(0, 5).map((token) => {
              const percentage = (token.value / portfolio.totalValue) * 100;
              return (
                <div key={token.symbol} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{token.symbol[0]}</span>
                    </div>
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {token.balance.toLocaleString()} {token.symbol}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${token.value.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
