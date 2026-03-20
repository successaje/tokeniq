'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletModal } from '@/components/ui/wallet-modal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Info,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUp,
  ArrowDown,
  PieChart as LucidePieChart,
  LineChart,
  RefreshCw,
  Wallet,
  BarChart2,
  TrendingUp,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useVaultsData } from '@/hooks/useVaultsData';
import { formatEther } from 'viem';
import { chains } from '@/config/chains';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Format a number with commas and 2 decimal places
const formatNumber = (value: bigint | number, decimals = 2): string => {
  const num = typeof value === 'bigint' ? Number(value) : value;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Get chain name by ID
const getChainName = (chainId: number): string => {
  return chains.find(c => c.id === chainId)?.name || `Chain ${chainId}`;
};

// Get color based on action
const getActionColor = (action: string) => {
  switch (action) {
    case 'deposit':
      return 'text-green-500';
    case 'withdraw':
      return 'text-red-500';
    default:
      return 'text-yellow-500';
  }
};

// Mock performance data for charts
const generatePerformanceData = (days = 30) => {
  const data = [];
  let value = 10000;
  
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.45) * 3; // Random change between -1.35% and +1.65%
    value = value * (1 + change / 100);
    
    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(value * 100) / 100,
      change: change
    });
  }
  
  return data;
};

// Sei Network Section Component
const SeiNetworkSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [allocationComplete, setAllocationComplete] = useState(false);
  const [allocationProgress, setAllocationProgress] = useState(0);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock data for Spending vs Savings chart
  const spendingVsSavingsData = [
    { name: 'Jan', spending: 12000, savings: 8000 },
    { name: 'Feb', spending: 15000, savings: 10000 },
    { name: 'Mar', spending: 18000, savings: 12000 },
    { name: 'Apr', spending: 14000, savings: 15000 },
    { name: 'May', spending: 16000, savings: 18000 },
    { name: 'Jun', spending: 20000, savings: 22000 },
  ];

  const handleActivate = () => {
    // Open wallet modal first
    setWalletModalOpen(true);
  };

  const handleWalletConfirm = () => {
    // After wallet confirmation, start allocation
    setIsActivating(true);
    setAllocationProgress(0);
    setAllocationComplete(false);

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Simulate allocation progress
    const interval = setInterval(() => {
      setAllocationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setAllocationComplete(true);
          setTimeout(() => {
            setIsActivating(false);
          }, 2000);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Store interval reference
    intervalRef.current = interval;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Mock allocation data for animation
  const allocationItems = [
    { name: 'Sei', amount: 18000, percentage: 40, color: '#8B5CF6' },
    { name: 'USDC', amount: 15000, percentage: 33.3, color: '#2775CA' },
    { name: 'Bitcoin', amount: 12000, percentage: 26.7, color: '#F7931A' },
  ];

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-50" />
      
      <CardHeader className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <CardTitle className="text-2xl">AI-Powered Capital Optimization</CardTitle>
              <CardDescription>Click to expand and view analysis</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              Powered by AI
            </Badge>
            <ChevronDown 
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-200",
                isExpanded && "transform rotate-180"
              )} 
            />
          </div>
        </button>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="relative space-y-6">
        {/* Chart Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Spending vs. Savings</h3>
            <Badge variant="outline" className="text-xs">
              AI Analysis
            </Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={spendingVsSavingsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{payload[0].payload.name}</p>
                          <p className="text-sm text-blue-500">
                            Spending: ${payload[0].value?.toLocaleString()}
                          </p>
                          <p className="text-sm text-green-500">
                            Savings: ${payload[1].value?.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="spending" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="savings" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Legend />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Idle Capital Detection */}
        <div className="rounded-lg border-2 border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Idle Capital Detected
                </p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  $45,000
                </p>
              </div>
            </div>
            <Button
              onClick={handleActivate}
              disabled={isActivating}
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
            >
              {isActivating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : allocationComplete ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Activated
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Activate TokenIQ Intelligence
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Wallet Modal */}
        <WalletModal
          open={walletModalOpen}
          onOpenChange={setWalletModalOpen}
          title="Activate TokenIQ Intelligence"
          description="Confirm the transaction to activate AI-powered capital optimization"
          onConfirm={handleWalletConfirm}
          transactionType="activation"
        />

        {/* AI Allocation Animation */}
        <AnimatePresence>
          {isActivating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 rounded-lg border bg-muted/50 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  <h3 className="text-lg font-semibold">Allocating funds to Sei yield pools...</h3>
                </div>
                <span className="text-sm font-medium text-primary">{allocationProgress}%</span>
              </div>
              
              <Progress value={allocationProgress} className="h-2" />
              
              {allocationProgress === 100 && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Done!</span>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                {allocationItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: allocationProgress >= (index + 1) * 33 ? 1 : 0.5,
                      y: allocationProgress >= (index + 1) * 33 ? 0 : 20,
                    }}
                    transition={{ delay: index * 0.2 }}
                    className="rounded-lg border bg-background p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {allocationProgress >= (index + 1) * 33 && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-medium">${item.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Allocation</span>
                        <span className="font-medium">{item.percentage}%</span>
                      </div>
                      <div className="mt-2">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ 
                              width: allocationProgress >= (index + 1) * 33 ? `${item.percentage}%` : '0%' 
                            }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {allocationComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg bg-green-500/10 border border-green-500/30 p-4 text-center"
                >
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    Allocation Complete!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your capital has been optimized across multiple assets
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

// Performance metrics component
const PerformanceMetrics = ({ vaults }: { vaults: any[] }) => {
  const [timeframe, setTimeframe] = useState('30d');
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Simulate data loading
    const timer = setTimeout(() => {
      setPerformanceData(generatePerformanceData(timeframe === '7d' ? 7 : 30));
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [timeframe]);

  const totalValue = vaults.reduce((sum, vault) => {
    const value = (Number(vault.userBalance) / 1e18) * (Number(vault.tvl) / 1e18);
    return sum + value;
  }, 0);

  const totalApy = vaults.length > 0 
    ? vaults.reduce((sum, vault) => sum + (vault.apy || 0), 0) / vaults.length 
    : 0;

  const totalDeposits = vaults.reduce((sum, vault) => sum + (Number(vault.userBalance) / 1e18), 0);
  const totalEarnings = totalValue - totalDeposits;
  const isPositive = totalEarnings >= 0;

  const assetAllocation = [
    { name: 'Stablecoins', value: 35, color: '#10B981' },
    { name: 'Ethereum', value: 30, color: '#6366F1' },
    { name: 'LSDs', value: 20, color: '#8B5CF6' },
    { name: 'Yield Tokens', value: 15, color: '#EC4899' },
  ];

  // Calculate 24h change from performance data
  const calculate24hChange = () => {
    if (performanceData.length < 2) return 0;
    const today = performanceData[performanceData.length - 1].value;
    const yesterday = performanceData[performanceData.length - 2].value;
    return ((today - yesterday) / yesterday) * 100;
  };

  const twentyFourHourChange = calculate24hChange();
  const is24hPositive = twentyFourHourChange >= 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 opacity-20" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <p className="text-xs text-muted-foreground">Total across all vaults</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">${formatNumber(totalValue)}</div>
            <div className="mt-1 flex items-center text-sm">
              <TrendingUp className={`h-4 w-4 mr-1 ${is24hPositive ? 'text-green-500' : 'text-red-500 rotate-180'}`} />
              <span className={is24hPositive ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(twentyFourHourChange).toFixed(2)}% (24h)
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>24h change in portfolio value</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Total Yield</CardTitle>
              <p className="text-xs text-muted-foreground">Earnings to date</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatNumber(totalEarnings)}</div>
            <div className="mt-1 flex items-center text-sm">
              <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                {isPositive ? '+' : ''}{((totalEarnings / totalDeposits) * 100).toFixed(2)}% all time
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Avg. APY</CardTitle>
              <p className="text-xs text-muted-foreground">Weighted average</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <BarChart2 className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApy.toFixed(2)}%</div>
            <div className="mt-1 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 mr-1 text-emerald-500" />
              <span className="text-emerald-500">+2.4% (30d)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Active Vaults</CardTitle>
              <p className="text-xs text-muted-foreground">Across all chains</p>
            </div>
            <div className="rounded-lg bg-violet-500/10 p-2">
              <PieChart className="h-5 w-5 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vaults.length}</div>
            <div className="mt-1 flex items-center text-sm">
              <span className="text-muted-foreground">
                {vaults.filter(v => Number(v.userBalance) > 0).length} with balance
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Portfolio Performance</CardTitle>
              <CardDescription>Historical value of your portfolio</CardDescription>
            </div>
            <div className="inline-flex items-center rounded-lg bg-muted p-1">
              <Button
                variant="ghost"
                size="sm"
                className={`px-3 text-xs ${timeframe === '7d' ? 'bg-background shadow' : ''}`}
                onClick={() => setTimeframe('7d')}
              >
                7D
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`px-3 text-xs ${timeframe === '30d' ? 'bg-background shadow' : ''}`}
                onClick={() => setTimeframe('30d')}
              >
                30D
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                  minTickGap={20}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                  width={60}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <RechartsTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium">${payload[0].value?.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {payload[0].payload.date}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Asset Allocation */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>Distribution of your portfolio assets</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {assetAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: data.color }}
                            />
                            <p className="font-medium">{data.name}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {data.value}% of portfolio
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chain Distribution</CardTitle>
            <CardDescription>Assets by blockchain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chains.map((chain, index) => {
              const chainVaults = vaults.filter(v => v.chainId === chain.id);
              const chainValue = chainVaults.reduce((sum, vault) => {
                return sum + ((Number(vault.userBalance) / 1e18) * (Number(vault.tvl) / 1e18));
              }, 0);
              const percentage = totalValue > 0 ? (chainValue / totalValue) * 100 : 0;
              
              return (
                <div key={`${chain.id}-${index}`} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="relative h-4 w-4 mr-2 flex-shrink-0">
                        <img 
                          src={chain.icon} 
                          alt={chain.name} 
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://ui-avatars.com/api/?name=${chain.name}&background=${chain.color?.replace('#', '') || '666'}&color=fff`;
                          }}
                        />
                      </div>
                      <span className="truncate">{chain.name}</span>
                    </div>
                    <span className="font-medium ml-2">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full rounded-full" 
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: chain.color || '#666666',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Vault table component
const VaultsTable = ({ vaults }: { vaults: any[] }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'value', 
    direction: 'desc' 
  });

  const sortedVaults = useMemo(() => {
    const sortableVaults = [...vaults];
    if (!sortConfig.key) return sortableVaults;

    sortableVaults.sort((a, b) => {
      let aValue, bValue;
      
      if (sortConfig.key === 'value') {
        aValue = (Number(a.userBalance) / 1e18) * (Number(a.tvl) / 1e18);
        bValue = (Number(b.userBalance) / 1e18) * (Number(b.tvl) / 1e18);
      } else if (sortConfig.key === 'apy') {
        aValue = a.apy || 0;
        bValue = b.apy || 0;
      } else if (sortConfig.key === 'balance') {
        aValue = Number(a.userBalance) / 1e18;
        bValue = Number(b.userBalance) / 1e18;
      } else {
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sortableVaults;
  }, [vaults, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortableHeader = ({ columnKey, children }: { columnKey: string; children: React.ReactNode }) => (
    <th 
      className="h-12 px-4 text-right align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
      onClick={() => requestSort(columnKey)}
    >
      <div className="flex items-center justify-end">
        {children}
        {sortConfig.key === columnKey && (
          <span className="ml-1">
            {sortConfig.direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vaults</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vault</th>
                <SortableHeader columnKey="balance">Balance</SortableHeader>
                <SortableHeader columnKey="value">Value</SortableHeader>
                <SortableHeader columnKey="apy">APY</SortableHeader>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Chain</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {sortedVaults.map((vault) => {
                const value = (Number(vault.userBalance) / 1e18) * (Number(vault.tvl) / 1e18);
                const balance = Number(vault.userBalance) / 1e18;
                const apy = vault.apy || 0;
                const isPositiveApy = apy >= 0;
                
                return (
                  <tr key={vault.id} className="border-b transition-colors hover:bg-muted/5">
                    <td className="p-4 align-middle">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-primary">
                          {vault.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium flex items-center">
                            {vault.name}
                            {vault.isNew && (
                              <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            {vault.symbol}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 ml-1.5 opacity-60 hover:opacity-100 transition-opacity" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Strategy: {vault.strategy || 'Active Yield'}</p>
                                <p>TVL: ${(Number(vault.tvl) / 1e18).toLocaleString()}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right align-middle font-mono">
                      {balance.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                    </td>
                    <td className="p-4 text-right align-middle font-mono">
                      ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right align-middle">
                      <div className={`flex items-center justify-end ${isPositiveApy ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositiveApy ? (
                          <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 mr-1" />
                        )}
                        {apy.toFixed(2)}%
                      </div>
                    </td>
                    <td className="p-4 text-right align-middle">
                      <div className="flex items-center justify-end">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {getChainName(Number(vault.chainId))}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right align-middle">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" className="h-8">
                          <span>Deposit</span>
                          <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8">
                          <span>Withdraw</span>
                          <ArrowDownRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// AI Recommendations component
const AIRecommendations = ({ recommendations }: { recommendations: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>AI Strategy Recommendations</CardTitle>
      <CardDescription>Optimize your positions based on market conditions</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <div key={rec.vaultId} className="flex items-start pb-4 last:pb-0">
              <div className="space-y-1">
                <div className="flex items-center">
                  <span className={`font-medium ${getActionColor(rec.action)}`}>
                    {rec.action.charAt(0).toUpperCase() + rec.action.slice(1)}
                  </span>
                  <span className="mx-2 text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    Confidence: {Math.round(rec.confidence * 100)}%
                  </span>
                </div>
                <p className="text-sm">{rec.reason}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No recommendations available at this time.</p>
        )}
      </div>
    </CardContent>
  </Card>
);

export function DiscoverContent() {
  const { vaults, vaultsByChain, recommendations, loading, error, refresh } = useVaultsData();
  
  // Group vaults by chain for the chain filter
  const chainFilters = useMemo(() => {
    const chains = new Set<number>();
    vaults.forEach(vault => chains.add(vault.chainId));
    return Array.from(chains).map(chainId => ({
      id: chainId,
      name: getChainName(chainId),
      count: vaults.filter(v => v.chainId === chainId).length
    }));
  }, [vaults]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading vault data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h3 className="text-sm font-medium text-red-800">Error loading vault data</h3>
        <p className="mt-1 text-sm text-red-700">{error.message}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={refresh}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Discover Vaults
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Explore and manage your DeFi vaults on Sei Network
            </p>
          </div>
          <Button 
            onClick={refresh} 
            className="w-full sm:w-auto justify-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        <div className="space-y-8">
          {/* Sei Network Section */}
          <SeiNetworkSection />
          
          <PerformanceMetrics vaults={vaults} />

          <Tabs defaultValue="all" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <TabsList className="w-full sm:w-auto overflow-x-auto">
                <TabsTrigger value="all" className="whitespace-nowrap">All Vaults</TabsTrigger>
                {chainFilters.map(chain => (
                  <TabsTrigger 
                    key={chain.id} 
                    value={`chain-${chain.id}`}
                    className="whitespace-nowrap"
                  >
                    {chain.name} ({chain.count})
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-6">
              <VaultsTable vaults={vaults} />
              
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Portfolio Performance</CardTitle>
                      <CardDescription>Your vault performance over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] flex items-center justify-center rounded-lg bg-muted/30">
                        <p className="text-muted-foreground">Performance chart coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <AIRecommendations recommendations={recommendations} />
                </div>
              </div>
            </TabsContent>

            {chainFilters.map(chain => (
              <TabsContent key={chain.id} value={`chain-${chain.id}`} className="space-y-6">
                <VaultsTable vaults={vaults.filter(v => v.chainId === chain.id)} />
                
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle>Portfolio Performance - {chain.name}</CardTitle>
                        <CardDescription>Your {chain.name} vault performance over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] flex items-center justify-center rounded-lg bg-muted/30">
                          <p className="text-muted-foreground">Performance chart coming soon</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div>
                    <AIRecommendations 
                      recommendations={recommendations.filter(r => 
                        vaults.some(v => v.chainId === chain.id && v.id === r.vaultId)
                      )} 
                    />
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}
