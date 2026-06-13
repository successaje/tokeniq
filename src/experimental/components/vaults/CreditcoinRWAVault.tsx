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
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditcoinRWAVaultProps {
  vaultType: 'general' | 'real-estate' | 'invoice' | 'commodity';
  className?: string;
}

export function CreditcoinRWAVault({ vaultType, className }: CreditcoinRWAVaultProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const vaultConfig = {
    general: {
      title: 'Creditcoin RWA Vault',
      description: 'Tokenized real-world assets with credit scoring and compliance automation',
      apy: 11.2,
      tvl: 7500000,
      risk: 'medium',
      features: ['Credit Scoring', 'Compliance Automation', 'Cross-Chain Native'],
      assets: [
        { name: 'Commercial Real Estate', percentage: 35, value: 2625000 },
        { name: 'Invoice Factoring', percentage: 25, value: 1875000 },
        { name: 'Commodity Tokens', percentage: 20, value: 1500000 },
        { name: 'Government Bonds', percentage: 15, value: 1125000 },
        { name: 'Cash & Equivalents', percentage: 5, value: 375000 }
      ]
    },
    'real-estate': {
      title: 'Real Estate RWA Vault',
      description: 'Tokenized commercial and residential real estate with automated valuation',
      apy: 8.5,
      tvl: 12000000,
      risk: 'low',
      features: ['Property Valuation', 'Rental Income', 'Appreciation Tracking'],
      assets: [
        { name: 'Commercial Properties', percentage: 45, value: 5400000 },
        { name: 'Residential Properties', percentage: 35, value: 4200000 },
        { name: 'REITs', percentage: 15, value: 1800000 },
        { name: 'Property Development', percentage: 5, value: 600000 }
      ]
    },
    invoice: {
      title: 'Invoice Factoring Vault',
      description: 'Tokenized invoices with automated credit scoring and payment tracking',
      apy: 15.3,
      tvl: 4500000,
      risk: 'high',
      features: ['Credit Scoring', 'Payment Tracking', 'Risk Assessment'],
      assets: [
        { name: 'Manufacturing Invoices', percentage: 40, value: 1800000 },
        { name: 'Service Invoices', percentage: 30, value: 1350000 },
        { name: 'Export/Import', percentage: 20, value: 900000 },
        { name: 'Government Contracts', percentage: 10, value: 450000 }
      ]
    },
    commodity: {
      title: 'Commodity RWA Vault',
      description: 'Tokenized commodities with price oracles and storage verification',
      apy: 9.7,
      tvl: 6000000,
      risk: 'medium',
      features: ['Price Oracles', 'Storage Verification', 'Quality Assurance'],
      assets: [
        { name: 'Precious Metals', percentage: 35, value: 2100000 },
        { name: 'Agricultural Products', percentage: 25, value: 1500000 },
        { name: 'Energy Commodities', percentage: 20, value: 1200000 },
        { name: 'Industrial Metals', percentage: 20, value: 1200000 }
      ]
    }
  };

  const config = vaultConfig[vaultType];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'Credit Scoring': return <CreditCard className="h-4 w-4" />;
      case 'Compliance Automation': return <Shield className="h-4 w-4" />;
      case 'Cross-Chain Native': return <Globe className="h-4 w-4" />;
      case 'Property Valuation': return <Building2 className="h-4 w-4" />;
      case 'Rental Income': return <DollarSign className="h-4 w-4" />;
      case 'Appreciation Tracking': return <TrendingUp className="h-4 w-4" />;
      case 'Payment Tracking': return <FileText className="h-4 w-4" />;
      case 'Risk Assessment': return <AlertTriangle className="h-4 w-4" />;
      case 'Price Oracles': return <BarChart3 className="h-4 w-4" />;
      case 'Storage Verification': return <CheckCircle className="h-4 w-4" />;
      case 'Quality Assurance': return <Info className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("w-full max-w-4xl mx-auto", className)}>
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600 font-bold text-lg">🟣</span>
            </div>
            <div>
              <CardTitle className="text-xl text-purple-800">{config.title}</CardTitle>
              <p className="text-purple-600 text-sm mt-1">{config.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-800">{config.apy}% APY</div>
            <div className="text-sm text-purple-600">${(config.tvl / 1000000).toFixed(1)}M TVL</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assets">Asset Allocation</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Vault Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">APY</span>
                    <span className="font-semibold text-green-600">{config.apy}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">TVL</span>
                    <span className="font-semibold">${(config.tvl / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Risk Level</span>
                    <Badge className={getRiskColor(config.risk)}>{config.risk}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Chain</span>
                    <span className="font-semibold text-purple-600">Creditcoin</span>
                  </div>
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
                    <span className="text-sm">Regulatory Compliance</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Cross-Chain Native</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Real-Time Valuation</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">30d Return</span>
                    <span className="font-semibold text-green-600">+2.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">90d Return</span>
                    <span className="font-semibold text-green-600">+7.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sharpe Ratio</span>
                    <span className="font-semibold">1.42</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Max Drawdown</span>
                    <span className="font-semibold text-red-600">-3.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Asset Allocation</h3>
              <div className="space-y-4">
                {config.assets.map((asset, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{asset.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{asset.percentage}%</span>
                        <span className="text-sm font-semibold">${(asset.value / 1000000).toFixed(1)}M</span>
                      </div>
                    </div>
                    <Progress value={asset.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Creditcoin RWA Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {getFeatureIcon(feature)}
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Creditcoin Integration Benefits</h4>
              <ul className="space-y-2 text-sm text-purple-700">
                <li>• Automated credit scoring for all tokenized assets</li>
                <li>• Built-in regulatory compliance (KYC/AML, SEC ready)</li>
                <li>• Cross-chain native capabilities without bridges</li>
                <li>• Real-time asset valuation and risk assessment</li>
                <li>• Transparent and auditable asset backing</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Deposit</h3>
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Minimum Deposit</span>
                      <span className="text-sm text-gray-600">
                        {vaultType === 'real-estate' ? '5,000 CTC' : 
                         vaultType === 'invoice' ? '500 CTC' :
                         vaultType === 'commodity' ? '2,000 CTC' : '1,000 CTC'}
                      </span>
                    </div>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      Deposit CTC
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Withdraw</h3>
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Available Balance</span>
                      <span className="text-sm text-gray-600">0.00 CTC</span>
                    </div>
                    <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-100">
                      Withdraw
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Important Notice</span>
              </div>
              <p className="text-sm text-yellow-700">
                This vault is designed for Creditcoin's RWA tokenization. Ensure you understand the risks 
                associated with real-world asset tokenization and have completed KYC/AML verification.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

