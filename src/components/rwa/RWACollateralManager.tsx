'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  FileText, 
  TrendingUp, 
  Shield, 
  Users, 
  DollarSign,
  BarChart3,
  CreditCard,
  Globe,
  CheckCircle,
  AlertTriangle,
  Info,
  Lock,
  Unlock,
  Calculator,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RWACollateralManagerProps {
  className?: string;
}

interface CollateralAsset {
  id: string;
  name: string;
  type: 'real-estate' | 'invoice' | 'commodity' | 'equity';
  value: number;
  collateralValue: number;
  creditScore: number;
  status: 'active' | 'pending' | 'liquidated';
  chain: string;
  tokenId: string;
  utilizationRate: number;
  lastValuation: string;
}

const mockCollateralAssets: CollateralAsset[] = [
  {
    id: '1',
    name: 'Commercial Office Building',
    type: 'real-estate',
    value: 5000000,
    collateralValue: 3500000,
    creditScore: 920,
    status: 'active',
    chain: 'Creditcoin',
    tokenId: '0x1234...5678',
    utilizationRate: 70,
    lastValuation: '2024-01-15'
  },
  {
    id: '2',
    name: 'Manufacturing Invoice #1234',
    type: 'invoice',
    value: 250000,
    collateralValue: 200000,
    creditScore: 850,
    status: 'active',
    chain: 'Creditcoin',
    tokenId: '0x8765...4321',
    utilizationRate: 80,
    lastValuation: '2024-01-10'
  },
  {
    id: '3',
    name: 'Gold Commodity Token',
    type: 'commodity',
    value: 1000000,
    collateralValue: 800000,
    creditScore: 780,
    status: 'active',
    chain: 'Creditcoin',
    tokenId: '0x9876...5432',
    utilizationRate: 80,
    lastValuation: '2024-01-12'
  },
  {
    id: '4',
    name: 'Tech Company Equity',
    type: 'equity',
    value: 750000,
    collateralValue: 450000,
    creditScore: 720,
    status: 'pending',
    chain: 'Creditcoin',
    tokenId: '0xabcd...efgh',
    utilizationRate: 60,
    lastValuation: '2024-01-08'
  }
];

export function RWACollateralManager({ className }: RWACollateralManagerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAsset, setSelectedAsset] = useState<CollateralAsset | null>(null);

  const totalCollateralValue = mockCollateralAssets.reduce((sum, asset) => sum + asset.collateralValue, 0);
  const totalAssetValue = mockCollateralAssets.reduce((sum, asset) => sum + asset.value, 0);
  const averageCreditScore = Math.round(mockCollateralAssets.reduce((sum, asset) => sum + asset.creditScore, 0) / mockCollateralAssets.length);

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'real-estate': return <Building2 className="h-5 w-5" />;
      case 'invoice': return <FileText className="h-5 w-5" />;
      case 'commodity': return <BarChart3 className="h-5 w-5" />;
      case 'equity': return <TrendingUp className="h-5 w-5" />;
      default: return <DollarSign className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'liquidated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 850) return 'text-green-600';
    if (score >= 700) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Collateral Value</p>
                <p className="text-2xl font-bold text-purple-800">${(totalCollateralValue / 1000000).toFixed(1)}M</p>
              </div>
              <Lock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Asset Value</p>
                <p className="text-2xl font-bold">${(totalAssetValue / 1000000).toFixed(1)}M</p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Credit Score</p>
                <p className={cn("text-2xl font-bold", getCreditScoreColor(averageCreditScore))}>{averageCreditScore}</p>
              </div>
              <CreditCard className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Assets</p>
                <p className="text-2xl font-bold">{mockCollateralAssets.filter(a => a.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600 font-bold text-lg">🟣</span>
            </div>
            <div>
              <CardTitle className="text-xl text-purple-800">RWA Collateral Manager</CardTitle>
              <p className="text-purple-600 text-sm mt-1">Manage your tokenized real-world assets as collateral</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assets">Collateral Assets</TabsTrigger>
              <TabsTrigger value="liquidity">Liquidity Pools</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Collateral Utilization</h3>
                  <div className="space-y-4">
                    {mockCollateralAssets.map((asset) => (
                      <div key={asset.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{asset.name}</span>
                          <span className="text-sm text-gray-600">{asset.utilizationRate}%</span>
                        </div>
                        <Progress value={asset.utilizationRate} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Creditcoin Benefits</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Automated Credit Scoring</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Real-Time Valuation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Cross-Chain Liquidity</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Automated Risk Management</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assets" className="space-y-6">
              <div className="space-y-4">
                {mockCollateralAssets.map((asset) => (
                  <Card key={asset.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getAssetIcon(asset.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{asset.name}</h3>
                            <p className="text-sm text-gray-600">{asset.tokenId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={getStatusColor(asset.status)}>{asset.status}</Badge>
                            <Badge variant="outline">{asset.chain}</Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            Credit Score: <span className={cn("font-semibold", getCreditScoreColor(asset.creditScore))}>{asset.creditScore}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-600">Asset Value</p>
                          <p className="font-semibold">${(asset.value / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Collateral Value</p>
                          <p className="font-semibold">${(asset.collateralValue / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Utilization</p>
                          <div className="flex items-center space-x-2">
                            <Progress value={asset.utilizationRate} className="h-2 flex-1" />
                            <span className="text-sm font-semibold">{asset.utilizationRate}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="liquidity" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <span className="text-purple-600 font-bold">🟣</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-purple-800">Creditcoin RWA Pool</h3>
                        <p className="text-purple-600 text-sm">Cross-chain liquidity for RWA tokens</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Liquidity</span>
                        <span className="font-semibold">$12.5M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">APY</span>
                        <span className="font-semibold text-green-600">8.7%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Volume (24h)</span>
                        <span className="font-semibold">$2.3M</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                      Provide Liquidity
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Globe className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Cross-Chain Bridge</h3>
                        <p className="text-gray-600 text-sm">Move RWA tokens across chains</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Supported Chains</span>
                        <span className="font-semibold">5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Bridge Fee</span>
                        <span className="font-semibold">0.1%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Bridge Time</span>
                        <span className="font-semibold">~2 min</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      Bridge Assets
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Use as Collateral</h3>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Available Assets</span>
                          <span className="text-sm text-gray-600">{mockCollateralAssets.length}</span>
                        </div>
                        <Button className="w-full">
                          <Lock className="h-4 w-4 mr-2" />
                          Lock as Collateral
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Borrow Against Collateral</h3>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Borrowing Power</span>
                          <span className="text-sm text-gray-600">${(totalCollateralValue * 0.7 / 1000).toFixed(0)}K</span>
                        </div>
                        <Button variant="outline" className="w-full">
                          <Calculator className="h-4 w-4 mr-2" />
                          Calculate Loan
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Risk Notice</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Using RWA tokens as collateral involves risks including liquidation if the collateral value 
                  falls below the required threshold. Ensure you understand the terms and maintain adequate 
                  collateralization ratios.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

