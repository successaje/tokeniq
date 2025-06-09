'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DepositModal } from '@/components/modals/DepositModal';
import { StrategyMonitorModal } from '@/components/modals/StrategyMonitorModal';
import { 
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Mock data for treasury strategies
const treasuryStrategies = [
  {
    id: 1,
    name: 'Real Estate Tokenization',
    strategy: 'Tokenize real estate assets for fractional ownership and liquidity',
    apy: '8.5%',
    risk: 'Low',
    tvl: '$2.5M',
    chain: 'Ethereum,Polygon',
    icon: BuildingOfficeIcon
  },
  {
    id: 2,
    name: 'Commercial Property Fund',
    strategy: 'Pool of commercial properties generating rental income',
    apy: '12.2%',
    risk: 'Medium',
    tvl: '$1.8M',
    chain: 'Ethereum',
    icon: BuildingLibraryIcon
  },
  {
    id: 3,
    name: 'Residential Portfolio',
    strategy: 'Diversified residential properties across major cities',
    apy: '7.8%',
    risk: 'Low',
    tvl: '$3.2M',
    chain: 'Ethereum,Polygon,Arbitrum',
    icon: HomeIcon
  },
  {
    id: 4,
    name: 'Corporate Bonds',
    strategy: 'Tokenized corporate debt instruments',
    apy: '6.5%',
    risk: 'Low',
    tvl: '$4.1M',
    chain: 'Ethereum',
    icon: BriefcaseIcon
  }
];

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showMonitorModal, setShowMonitorModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Please connect your wallet</h1>
        <p className="text-muted-foreground">
          Connect your wallet to view your dashboard
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => setShowMonitorModal(true)}
            variant="outline"
            className="flex items-center"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Monitor Strategy
          </Button>
          <Button
            onClick={() => setShowDepositModal(true)}
            className="flex items-center"
          >
            <BanknotesIcon className="h-5 w-5 mr-2" />
            Deposit
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Total Value</h2>
            <p className="text-3xl font-bold text-foreground">$175,000</p>
            <p className="text-emerald-500 text-sm">+5.2% (24h)</p>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Active Strategies</h2>
            <p className="text-3xl font-bold text-foreground">3</p>
            <p className="text-muted-foreground text-sm">2 Optimized, 1 Pending</p>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Total Yield</h2>
            <p className="text-3xl font-bold text-foreground">$12,500</p>
            <p className="text-muted-foreground text-sm">Last 30 days</p>
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

      {/* Quick Access */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card hover:bg-accent/50 transition-colors cursor-pointer">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <DocumentTextIcon className="h-6 w-6 text-primary mr-3" />
                <h3 className="text-lg font-semibold text-card-foreground">RWA Management</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Manage your tokenized real-world assets and collateral
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">View Assets</Button>
                <Button variant="outline" size="sm">Tokenize New</Button>
              </div>
            </div>
          </Card>
          <Card className="bg-card hover:bg-accent/50 transition-colors cursor-pointer">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <ChartBarIcon className="h-6 w-6 text-primary mr-3" />
                <h3 className="text-lg font-semibold text-card-foreground">Strategy Analytics</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Monitor and analyze your strategy performance
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">View Analytics</Button>
                <Button variant="outline" size="sm">Generate Report</Button>
              </div>
            </div>
          </Card>
          <Card className="bg-card hover:bg-accent/50 transition-colors cursor-pointer">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <GlobeAltIcon className="h-6 w-6 text-primary mr-3" />
                <h3 className="text-lg font-semibold text-card-foreground">Cross-Chain Bridge</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Bridge assets between different blockchain networks
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Bridge Assets</Button>
                <Button variant="outline" size="sm">View History</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Active Strategies */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Active Strategies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {treasuryStrategies.map((strategy) => (
            <Card key={strategy.id} className="bg-card hover:bg-accent/50 transition-colors">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <strategy.icon className="h-6 w-6 text-primary mr-3" />
                  <h3 className="text-lg font-semibold text-card-foreground">{strategy.name}</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  {strategy.strategy}
                </p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">APY</div>
                    <div className="text-lg font-medium text-emerald-500">
                      {strategy.apy}
                    </div>
                  </div>
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Risk Level</div>
                    <div className="text-lg font-medium text-foreground">
                      {strategy.risk}
                    </div>
                  </div>
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">TVL</div>
                    <div className="text-lg font-medium text-foreground">
                      {strategy.tvl}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {strategy.chain.split(',').map((chain) => (
                      <span
                        key={chain}
                        className="px-2 py-1 text-xs font-medium bg-accent/50 text-accent-foreground rounded-lg"
                      >
                        {chain}
                      </span>
                    ))}
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showDepositModal && (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
        />
      )}
      {showMonitorModal && (
        <StrategyMonitorModal
          isOpen={showMonitorModal}
          onClose={() => setShowMonitorModal(false)}
        />
      )}
    </>
  );
}
