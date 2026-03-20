'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Shield } from 'lucide-react';
import { WalletModal } from '@/components/ui/wallet-modal';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

type StrategyType = 'conservative' | 'balanced' | 'growth';

interface StrategyCardProps {
  strategy: StrategyType;
  apy: number;
  risk: 'Low' | 'Medium' | 'High';
  platform: string;
  fundsAllocated: number;
  onEmergencyWithdraw?: () => void;
}

const strategyConfig = {
  conservative: {
    label: 'Conservative',
    color: '#10b981',
    bgColor: 'from-green-500/10 to-emerald-500/10',
    icon: Shield,
  },
  balanced: {
    label: 'Balanced',
    color: '#3b82f6',
    bgColor: 'from-blue-500/10 to-indigo-500/10',
    icon: TrendingUp,
  },
  growth: {
    label: 'Growth',
    color: '#f59e0b',
    bgColor: 'from-amber-500/10 to-orange-500/10',
    icon: TrendingUp,
  },
};

// Generate yield growth projection data
const generateYieldData = (strategy: StrategyType) => {
  const baseYield = strategy === 'conservative' ? 8.5 : strategy === 'balanced' ? 10 : 12;
  const data = [];
  let currentYield = baseYield;
  
  for (let i = 0; i < 12; i++) {
    const month = new Date();
    month.setMonth(month.getMonth() + i);
    const variation = (Math.random() - 0.4) * 0.5; // Small variation
    currentYield = Math.max(baseYield * 0.95, currentYield + variation);
    
    data.push({
      month: month.toLocaleDateString('en-US', { month: 'short' }),
      yield: Number(currentYield.toFixed(2)),
    });
  }
  
  return data;
};

export function StrategyCard({
  strategy,
  apy,
  risk,
  platform,
  fundsAllocated,
  onEmergencyWithdraw,
}: StrategyCardProps) {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [fundsWithdrawn, setFundsWithdrawn] = useState(false);
  const [currentFundsAllocated, setCurrentFundsAllocated] = useState(fundsAllocated);
  const config = strategyConfig[strategy];
  const Icon = config.icon;
  const yieldData = generateYieldData(strategy);

  const handleEmergencyWithdraw = () => {
    // Open wallet modal first
    setWalletModalOpen(true);
  };

  const handleWalletConfirm = () => {
    // After wallet confirmation, process withdrawal
    setIsWithdrawing(true);
    setCurrentFundsAllocated(0);
    setFundsWithdrawn(true);
    
    // Simulate withdrawal process
    setTimeout(() => {
      setIsWithdrawing(false);
      onEmergencyWithdraw?.();
    }, 1500);
  };

  return (
    <Card className={`relative overflow-hidden border-2 bg-gradient-to-br ${config.bgColor}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/80" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2`} style={{ backgroundColor: `${config.color}20` }}>
              <Icon className={`h-5 w-5`} style={{ color: config.color }} />
            </div>
            <div>
              <CardTitle className="text-lg">AI Strategy: {config.label}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  APY: {apy}%
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Risk: {risk}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Platform: {platform}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Wallet Modal */}
        <WalletModal
          open={walletModalOpen}
          onOpenChange={setWalletModalOpen}
          title="Emergency Withdrawal"
          description="Confirm the transaction to withdraw funds and restore them to your wallet"
          onConfirm={handleWalletConfirm}
          transactionType="withdrawal"
        />

        {/* Funds Allocated */}
        <div className="rounded-lg border bg-background/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {fundsWithdrawn ? 'Funds Status' : 'Funds Allocated'}
            </span>
            <span className={`text-2xl font-bold ${fundsWithdrawn ? 'text-green-600 dark:text-green-400' : ''}`}>
              {fundsWithdrawn ? 'Funds Restored' : `$${currentFundsAllocated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>

        {/* Yield Growth Projection Graph */}
        <div className="rounded-lg border bg-background/50 p-4">
          <h4 className="text-sm font-medium mb-4">Yield Growth Projection</h4>
          {fundsWithdrawn ? (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-muted-foreground">0%</div>
                <div className="text-sm text-muted-foreground">Funds Recalled</div>
              </div>
            </div>
          ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yieldData}>
                <defs>
                  <linearGradient id={`gradient-${strategy}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={config.color} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickMargin={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `${value}%`}
                  width={40}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-2">
                          <p className="font-medium text-sm">
                            {payload[0].value}% APY
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payload[0].payload.month}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="yield"
                  stroke={config.color}
                  fill={`url(#gradient-${strategy})`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          )}
        </div>

        {/* Emergency Withdraw Button */}
        <Button
          onClick={handleEmergencyWithdraw}
          disabled={isWithdrawing || fundsWithdrawn || currentFundsAllocated === 0}
          variant="destructive"
          size="lg"
          className="w-full font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {isWithdrawing ? (
            <>
              <AlertTriangle className="mr-2 h-5 w-5 animate-pulse" />
              Processing...
            </>
          ) : fundsWithdrawn ? (
            <>
              <AlertTriangle className="mr-2 h-5 w-5" />
              Funds Restored
            </>
          ) : (
            <>
              <AlertTriangle className="mr-2 h-5 w-5" />
              Emergency Withdraw
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

