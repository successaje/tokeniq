'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProtocolHealthChart } from '@/components/ProtocolHealthChart';
import { YieldPerformanceChart } from '@/components/YieldPerformanceChart';
import { ArrowUpRight, Plus, Settings, Shield, Zap } from 'lucide-react';

export default function TreasuryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Treasury Management</h1>
          <p className="text-muted-foreground">Optimize your yield strategies</p>
        </div>
        <Button>
          New Strategy
          <Plus className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Strategy Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Strategies</p>
              <h2 className="text-2xl font-bold">8</h2>
            </div>
            <div className="rounded-full bg-primary/10 p-2">
              <Zap className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Across 5 protocols</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average APY</p>
              <h2 className="text-2xl font-bold">15.8%</h2>
            </div>
            <div className="rounded-full bg-green-500/10 p-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-green-500">+2.3% from last week</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
              <h2 className="text-2xl font-bold">Low</h2>
            </div>
            <div className="rounded-full bg-green-500/10 p-2">
              <Shield className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-green-500">Well diversified</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Yield</p>
              <h2 className="text-2xl font-bold">$45,200</h2>
            </div>
            <div className="rounded-full bg-green-500/10 p-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-green-500">This month</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold">Protocol Health</h3>
          <ProtocolHealthChart />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold">Yield Performance</h3>
          <YieldPerformanceChart />
        </Card>
      </div>

      {/* Active Strategies */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold">Active Strategies</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Aave USDC Lending</p>
                <p className="text-sm text-muted-foreground">$500,000 deployed</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-green-500">12.5% APY</p>
                <p className="text-sm text-muted-foreground">$5,200 monthly</p>
              </div>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Compound ETH Lending</p>
                <p className="text-sm text-muted-foreground">200 ETH deployed</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-green-500">8.2% APY</p>
                <p className="text-sm text-muted-foreground">1.4 ETH monthly</p>
              </div>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Curve USDC/USDT LP</p>
                <p className="text-sm text-muted-foreground">$300,000 deployed</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-green-500">18.5% APY</p>
                <p className="text-sm text-muted-foreground">$4,625 monthly</p>
              </div>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 