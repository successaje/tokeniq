'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Shield, Zap, ArrowRight, Info, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Dynamically import components with no SSR
const CrossChainBridge = dynamic(
  () => import('./components/cross-chain-bridge'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
);

const TransactionsHistory = dynamic<{}>(
  () => import('./components/transactions-history').then(mod => mod.TransactionsHistory),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
);

const FeesEstimator = dynamic<{
  fromChain: string;
  toChain: string;
  token: string;
  amount: number;
  isLoading?: boolean;
}>(
  () => import('./components/fees-estimator').then(mod => mod.FeesEstimator),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
);

export default function CrossChainPage() {
  const [selectedFromChain, setSelectedFromChain] = useState('Avalanche Fuji');
  const [selectedToChain, setSelectedToChain] = useState('Avalanche Fuji');
  const [selectedToken, setSelectedToken] = useState('CCIP-BnM');
  const [amount, setAmount] = useState(0);
  const [isBridgeActive, setIsBridgeActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Mock CCIP status data
  const ccipStatus = {
    status: 'operational',
    lastUpdated: new Date(),
    supportedChains: ['Ethereum', 'Sei', 'Polygon', 'Core', 'Avalanche', 'Arbitrum', 'Optimism'],
    avgTransferTime: '2-5 minutes',
    securityScore: '99.9%'
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Loading bridge interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-8">
      {/* Header Section with CCIP Badge */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Cross-Chain Bridge
            </h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Shield className="w-3 h-3 mr-1.5" />
              Powered by Chainlink CCIP
            </span>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Seamlessly transfer assets between blockchains with enterprise-grade security and reliability powered by Chainlink CCIP.
          </p>
        </div>
        
        {/* Network Status */}
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
          <div className={`w-2.5 h-2.5 rounded-full ${ccipStatus.status === 'operational' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
          <span className="text-sm font-medium">
            {ccipStatus.status === 'operational' ? 'All Systems Operational' : 'Service Degraded'}
          </span>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Bridge Section */}
        <div className="lg:col-span-2">
          {/* Bridge Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                    Bridge Assets
                  </CardTitle>
                  <CardDescription className="mt-1 text-muted-foreground">
                    Transfer tokens across different blockchains with minimal fees and maximum security
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 dark:bg-muted/20 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>Powered by Chainlink CCIP</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-border/50 shadow-sm">
                <CrossChainBridge 
                  onFromChainChange={setSelectedFromChain}
                  onToChainChange={setSelectedToChain}
                  onTokenChange={setSelectedToken}
                  onAmountChange={setAmount}
                />
              </div>
            </CardContent>
          </Card>

          {/* CCIP Benefits */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Enterprise Security',
                description: 'Powered by Chainlink\'s battle-tested oracle network',
                icon: <Shield className="w-5 h-5 text-blue-500" />
              },
              {
                title: 'Fast Transfers',
                description: 'Cross-chain transfers in minutes, not hours',
                icon: <Zap className="w-5 h-5 text-purple-500" />
              },
              {
                title: 'Wide Support',
                description: 'Connect to all major EVM-compatible chains',
                icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
              }
            ].map((feature, index) => (
              <div key={index} className="p-4 bg-card rounded-lg border flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-medium">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your cross-chain transfer history</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionsHistory />
            </CardContent>
          </Card>
        </div>
        
        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* CCIP Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Chainlink CCIP Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Network Status</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${ccipStatus.status === 'operational' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  <span className="font-medium">
                    {ccipStatus.status === 'operational' ? 'Operational' : 'Degraded'}
                  </span>
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg. Transfer Time</span>
                  <span className="font-medium">{ccipStatus.avgTransferTime}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Security Score</span>
                  <span className="font-medium">{ccipStatus.securityScore}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-mono">
                    {ccipStatus.lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </div>
              
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  View Status Page
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Supported Chains */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Supported Chains</CardTitle>
              <CardDescription>Available networks for cross-chain transfers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ccipStatus.supportedChains.map((chain, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">{chain[0]}</span>
                      </div>
                      <span className="text-sm font-medium">{chain}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fee Estimator */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Fee Estimator</CardTitle>
              <CardDescription>Estimate your transfer costs</CardDescription>
            </CardHeader>
            <CardContent>
              <FeesEstimator 
                fromChain={selectedFromChain}
                toChain={selectedToChain}
                token={selectedToken}
                amount={amount}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          {/* CCIP Info */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm">About Chainlink CCIP</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Our bridge leverages Chainlink's Cross-Chain Interoperability Protocol (CCIP) for secure and reliable cross-chain messaging.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
