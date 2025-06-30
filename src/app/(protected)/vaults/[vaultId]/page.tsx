'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultDepositDialog } from '../components/vault-deposit-dialog';
import { VaultWithdrawDialog } from '../components/vault-withdraw-dialog';
import { VaultPerformanceChart } from '../components/vault-performance-chart';

// Mock data - in a real app, this would be fetched from an API
const VAULTS = [
  {
    id: 'aave-vault',
    name: 'Aave USDC Vault',
    apy: '5.2%',
    tvl: '$5.2M',
    strategy: 'Aave V3 Lending',
    asset: 'USDC',
    risk: 'low',
    description: 'Earn yield by supplying USDC to Aave V3. This strategy provides stable yields with low risk by leveraging Aave\'s battle-tested lending protocol.',
    performance: [
      { date: 'Jan', apy: 4.8 },
      { date: 'Feb', apy: 5.0 },
      { date: 'Mar', apy: 5.1 },
      { date: 'Apr', apy: 5.0 },
      { date: 'May', apy: 5.2 },
      { date: 'Jun', apy: 5.2 },
    ],
  },
  {
    id: 'rwa-vault',
    name: 'RWA Invoice Vault',
    apy: '12.5%',
    tvl: '$3.8M',
    strategy: 'Real World Assets',
    asset: 'USDC',
    risk: 'medium',
    description: 'Invest in tokenized real-world assets with higher yields. This vault provides exposure to real-world debt instruments with competitive returns.',
    performance: [
      { date: 'Jan', apy: 11.8 },
      { date: 'Feb', apy: 12.1 },
      { date: 'Mar', apy: 12.3 },
      { date: 'Apr', apy: 12.0 },
      { date: 'May', apy: 12.4 },
      { date: 'Jun', apy: 12.5 },
    ],
  },
  // Add other vaults...
];

export default function VaultDetailPage({ params }: { params: { vaultId: string } }) {
  const [action, setAction] = useState<'deposit' | 'withdraw' | null>(null);
  
  const vault = VAULTS.find((v) => v.id === params.vaultId);
  
  if (!vault) {
    notFound();
  }

  const handleRebalance = async () => {
    try {
      // TODO: Implement Chainlink Automation's performUpkeep call
      console.log('Triggering rebalance for vault:', vault.id);
      // This would typically be a smart contract interaction
      // await performUpkeep(vault.id);
      
      // Show success message
      // toast.success('Rebalance initiated successfully');
    } catch (error) {
      console.error('Rebalance failed:', error);
      // toast.error('Failed to initiate rebalance');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{vault.name}</h1>
            <p className="text-muted-foreground mt-2">{vault.strategy}</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setAction('withdraw')}
            >
              Withdraw
            </Button>
            <Button onClick={() => setAction('deposit')}>
              Deposit
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">APY</CardTitle>
              <CardTitle className="text-3xl">{vault.apy}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">TVL</CardTitle>
              <CardTitle className="text-3xl">{vault.tvl}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Risk</CardTitle>
              <CardTitle className="text-3xl capitalize">{vault.risk}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>About this vault</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{vault.description}</p>
                
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Asset Allocation</h3>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    100% {vault.asset}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Vault Actions</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRebalance}
                  >
                    Trigger Rebalance
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manually trigger a rebalance of the vault's assets
                </p>
              </CardHeader>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <VaultPerformanceChart data={vault.performance} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="strategy">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <h3>How it works</h3>
                  <p>
                    This vault uses a sophisticated strategy to maximize yields while managing risk. 
                    The assets are allocated according to the following principles:
                  </p>
                  <ul>
                    <li>Automated yield optimization across multiple protocols</li>
                    <li>Risk-managed position sizing</li>
                    <li>Regular rebalancing to maintain target allocations</li>
                    <li>Gas optimization for cost efficiency</li>
                  </ul>
                  
                  <h3>Risks</h3>
                  <p>
                    While we take measures to minimize risks, please be aware of the following:
                  </p>
                  <ul>
                    <li>Smart contract risk: The vault's contracts could contain bugs</li>
                    <li>Market risk: The value of assets can go down</li>
                    <li>Liquidity risk: Withdrawals may be delayed during high volatility</li>
                    <li>Protocol risk: Integrated protocols may experience issues</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <VaultDepositDialog
        vault={action === 'deposit' ? vault : null}
        open={action === 'deposit'}
        onOpenChange={(open) => setAction(open ? 'deposit' : null)}
      />

      <VaultWithdrawDialog
        vault={action === 'withdraw' ? vault : null}
        open={action === 'withdraw'}
        onOpenChange={(open) => setAction(open ? 'withdraw' : null)}
      />
    </div>
  );
}
