'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TokenizeAssetModal } from '@/components/modals/TokenizeAssetModal';
import { 
  DocumentTextIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Mock data for demonstration
const MOCK_RWA_ASSETS = [
  {
    id: '1',
    type: 'invoice',
    name: 'Invoice #1234',
    value: 50000,
    status: 'active',
    tokenId: '0x1234...5678',
    collateralized: true,
    chain: 'Ethereum',
  },
  {
    id: '2',
    type: 'equity',
    name: 'Company Shares',
    value: 100000,
    status: 'active',
    tokenId: '0x8765...4321',
    collateralized: false,
    chain: 'Polygon',
  },
  {
    id: '3',
    type: 'license',
    name: 'Carbon Credits',
    value: 25000,
    status: 'pending',
    tokenId: '0x9876...5432',
    collateralized: false,
    chain: 'Arbitrum',
  },
];

export default function RWADashboardPage() {
  const { address, isConnected } = useAccount();
  const [showTokenizeModal, setShowTokenizeModal] = useState(false);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Please connect your wallet</h1>
        <p className="text-muted-foreground">
          Connect your wallet to view your RWA Dashboard
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">RWA Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
        <Button
          onClick={() => setShowTokenizeModal(true)}
          className="flex items-center"
        >
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          Tokenize New Asset
        </Button>
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
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Active Assets</h2>
            <p className="text-3xl font-bold text-foreground">3</p>
            <p className="text-muted-foreground text-sm">2 Verified, 1 Pending</p>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Collateralized</h2>
            <p className="text-3xl font-bold text-foreground">$50,000</p>
            <p className="text-muted-foreground text-sm">1 Asset</p>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Available for Loan</h2>
            <p className="text-3xl font-bold text-foreground">$125,000</p>
            <p className="text-muted-foreground text-sm">2 Assets</p>
          </div>
        </Card>
      </div>

      {/* Asset List */}
      <Card className="bg-card hover:bg-accent/50 transition-colors mb-8">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-card-foreground">Your Tokenized Assets</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Asset</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Value</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Chain</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RWA_ASSETS.map((asset) => (
                  <tr key={asset.id} className="border-b border-border/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {asset.type === 'invoice' && <DocumentTextIcon className="h-5 w-5 mr-2 text-primary" />}
                        {asset.type === 'equity' && <ChartBarIcon className="h-5 w-5 mr-2 text-primary" />}
                        {asset.type === 'license' && <GlobeAltIcon className="h-5 w-5 mr-2 text-primary" />}
                        <div>
                          <p className="font-medium text-foreground">{asset.name}</p>
                          <p className="text-sm text-muted-foreground">{asset.tokenId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">${asset.value.toLocaleString()}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        asset.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-yellow-500/10 text-yellow-500'
                      )}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {asset.chain}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {!asset.collateralized && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center"
                          >
                            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                            Use as Collateral
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                        >
                          <ArrowsRightLeftIcon className="h-4 w-4 mr-1" />
                          Bridge
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Fractionalize
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <TokenizeAssetModal
        isOpen={showTokenizeModal}
        onClose={() => setShowTokenizeModal(false)}
      />
    </>
  );
} 