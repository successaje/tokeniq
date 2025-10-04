'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditcoinRWAVault } from '@/components/vaults/CreditcoinRWAVault';
import { RWACollateralManager } from '@/components/rwa/RWACollateralManager';
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
  Target,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CreditcoinRWAPage() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isConnected) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md p-6 text-center">
          <div className="p-2 bg-purple-100 rounded-lg w-fit mx-auto mb-4">
            <span className="text-purple-600 font-bold text-2xl">🟣</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Please connect your wallet to access Creditcoin RWA features
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <span className="text-purple-600 font-bold text-3xl">🟣</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-purple-800">Creditcoin RWA Platform</h1>
            <p className="text-purple-600">Tokenized Real-World Assets with Credit Scoring & Compliance</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total RWA Value</p>
                <p className="text-2xl font-bold text-purple-800">$28.5M</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Vaults</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <Building2 className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average APY</p>
                <p className="text-2xl font-bold text-green-600">11.2%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credit Score</p>
                <p className="text-2xl font-bold text-blue-600">820</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vaults">RWA Vaults</TabsTrigger>
          <TabsTrigger value="collateral">Collateral</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-purple-600">🟣</span>
                  <span>Creditcoin RWA Benefits</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Automated Credit Scoring</h4>
                      <p className="text-sm text-gray-600">AI-powered credit assessment for all tokenized assets</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Compliance Automation</h4>
                      <p className="text-sm text-gray-600">Built-in KYC/AML and regulatory compliance</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Globe className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Cross-Chain Native</h4>
                      <p className="text-sm text-gray-600">Seamless asset movement without bridges</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <BarChart3 className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Real-Time Valuation</h4>
                      <p className="text-sm text-gray-600">Continuous asset valuation and risk assessment</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>RWA Asset Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">Real Estate</span>
                    </div>
                    <p className="text-sm text-gray-600">Commercial & residential properties</p>
                    <Badge variant="outline" className="mt-2">8.5% APY</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="font-semibold">Invoices</span>
                    </div>
                    <p className="text-sm text-gray-600">Business invoice factoring</p>
                    <Badge variant="outline" className="mt-2">15.3% APY</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold">Commodities</span>
                    </div>
                    <p className="text-sm text-gray-600">Precious metals & agricultural</p>
                    <Badge variant="outline" className="mt-2">9.7% APY</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold">Equity</span>
                    </div>
                    <p className="text-sm text-gray-600">Company shares & securities</p>
                    <Badge variant="outline" className="mt-2">11.2% APY</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vaults" className="space-y-6">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Creditcoin RWA Vaults</h2>
              <p className="text-gray-600">Choose from specialized vaults for different asset types</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CreditcoinRWAVault vaultType="general" />
              <CreditcoinRWAVault vaultType="real-estate" />
              <CreditcoinRWAVault vaultType="invoice" />
              <CreditcoinRWAVault vaultType="commodity" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="collateral" className="space-y-6">
          <RWACollateralManager />
        </TabsContent>

        <TabsContent value="liquidity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-purple-800">
                  <span className="text-purple-600">🟣</span>
                  <span>Creditcoin RWA Liquidity Pool</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fee</span>
                    <span className="font-semibold">0.3%</span>
                  </div>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Provide Liquidity
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span>Cross-Chain Bridge</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Security</span>
                    <span className="font-semibold text-green-600">Audited</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Bridge Assets
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Credit Scoring</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Automated credit assessment using AI and on-chain data for all tokenized assets.
                </p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• Real-time risk assessment</li>
                  <li>• Historical performance tracking</li>
                  <li>• Automated scoring updates</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Compliance</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Built-in regulatory compliance with KYC/AML automation and SEC-ready features.
                </p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• Automated KYC/AML checks</li>
                  <li>• Regulatory reporting</li>
                  <li>• Compliance monitoring</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Globe className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Cross-Chain</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Native cross-chain capabilities without bridges for seamless asset movement.
                </p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• No bridge required</li>
                  <li>• Instant transfers</li>
                  <li>• Multi-chain support</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold">Valuation</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Real-time asset valuation using oracles and market data for accurate pricing.
                </p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• Oracle-based pricing</li>
                  <li>• Market data integration</li>
                  <li>• Automated updates</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="font-semibold">Risk Management</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Automated risk assessment and management with liquidation protection.
                </p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• Risk monitoring</li>
                  <li>• Liquidation protection</li>
                  <li>• Automated alerts</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold">Governance</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Community governance for vault parameters and asset inclusion decisions.
                </p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• Community voting</li>
                  <li>• Parameter updates</li>
                  <li>• Asset approval</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

