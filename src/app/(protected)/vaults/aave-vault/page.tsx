'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAaveVault } from '@/hooks/useAaveVault';
import { FeatureGuard } from '@/components/FeatureGuard';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { AaveVaultInfo } from './components/AaveVaultInfo';
import Link from 'next/link';

// Token addresses and decimals for Sepolia testnet
const TOKENS = {
  // USDC on Sepolia (for AaveVault) - 6 decimals
  USDC: {
    address: '0x4B8eed87b61023F5BEcCeBd2868C058FEe6B7Ac7',
    decimals: 6
  },
  // Other tokens for reference
  DAI: {
    address: '0xFF34B3d4Aee8DdCd6F9AFFFB6Fe49bD371b8a357',
    decimals: 18
  },
  USDT: {
    address: '0x7169D38820dfd117C3FA1f22a697dBA64b56D3Dd',
    decimals: 6
  }
} as const;

// Default token to use for deposits (USDC on Sepolia)
const DEFAULT_TOKEN = TOKENS.USDC.address;
const DEFAULT_TOKEN_DECIMALS = TOKENS.USDC.decimals;

export default function AaveVaultPage() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('deposit');
  
  const {
    amount,
    totalValue,
    formattedTotalValue,
    isProcessing,
    isLoading,
    error,
    setAmount,
    deposit,
    withdraw,
    rebalance,
    fetchTotalValue,
  } = useAaveVault({
    onSuccess: () => {
      // Refresh data on success
      fetchTotalValue();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDeposit = async () => {
    if (!amount) {
      toast({
        title: 'Error',
        description: 'Please enter an amount to deposit',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await deposit(amount, DEFAULT_TOKEN, DEFAULT_TOKEN_DECIMALS);
      
      if (result?.success) {
        toast({
          title: 'Success',
          description: 'Successfully deposited to Aave vault',
        });
      } else {
        throw new Error('Deposit transaction failed');
      }
    } catch (error) {
      console.error('Deposit error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to deposit to Aave vault',
        variant: 'destructive',
      });
    }
  };

  const handleWithdraw = async () => {
    try {
      await withdraw(amount);
      toast({
        title: 'Success',
        description: 'Successfully withdrew from Aave vault',
      });
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  const handleRebalance = async () => {
    try {
      await rebalance();
      toast({
        title: 'Success',
        description: 'Successfully rebalanced Aave vault',
      });
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aave Vault</h1>
            <p className="text-muted-foreground">
              Deposit your assets to earn yield through Aave's lending protocol
            </p>
          </div>
          <NetworkSwitcher />
        </div>
        <div className="lg:col-span-1">
          <AaveVaultInfo />
        </div>
      </div>

      <FeatureGuard feature="aaveVault">
        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>
              This vault is deployed on Sepolia testnet. Please ensure you're connected to Sepolia to interact with it.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Value Locked
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    `$${formattedTotalValue}`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="px-6 pt-6">
                  <div className="flex justify-between items-center mb-8">
                    <TabsList className="bg-gray-50/50 dark:bg-gray-900/20 backdrop-blur-sm p-1.5 rounded-2xl gap-3 inline-flex items-center border border-gray-100 dark:border-gray-800 shadow-sm">
                      <TabsTrigger 
                        value="deposit"
                        className="relative px-12 py-3 w-56 text-center rounded-xl font-medium transition-all duration-300 group
                          bg-transparent hover:bg-white/80 dark:hover:bg-gray-800/80
                          text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400
                          data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
                          data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400
                          data-[state=active]:shadow-sm data-[state=active]:font-semibold
                          transform hover:scale-[1.02] active:scale-100
                          focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                          overflow-hidden
                          before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/0 before:to-blue-500/10
                          before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                          data-[state=active]:before:opacity-100"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Deposit
                        </span>
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="withdraw"
                        className="relative px-12 py-3 w-56 text-center rounded-xl font-medium transition-all duration-300 group
                          bg-transparent hover:bg-white/80 dark:hover:bg-gray-800/80
                          text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400
                          data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
                          data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400
                          data-[state=active]:shadow-sm data-[state=active]:font-semibold
                          transform hover:scale-[1.02] active:scale-100
                          focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2
                          overflow-hidden
                          before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-500/0 before:to-purple-500/10
                          before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                          data-[state=active]:before:opacity-100"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                          Withdraw
                        </span>
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="manage"
                        className="relative px-12 py-3 w-56 text-center rounded-xl font-medium transition-all duration-300 group
                          bg-transparent hover:bg-white/80 dark:hover:bg-gray-800/80
                          text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400
                          data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
                          data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400
                          data-[state=active]:shadow-sm data-[state=active]:font-semibold
                          transform hover:scale-[1.02] active:scale-100
                          focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2
                          overflow-hidden
                          before:absolute before:inset-0 before:bg-gradient-to-r before:from-green-500/0 before:to-green-500/10
                          before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                          data-[state=active]:before:opacity-100"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Manage
                        </span>
                      </TabsTrigger>
                      

                    </TabsList>
                    <div className="text-sm text-muted-foreground">
                      Connected to: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                    </div>
                  </div>
                </div>
                
                <TabsContent value="deposit" className="p-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="deposit-amount">Amount to Deposit</Label>
                      <Input
                        id="deposit-amount"
                        type="number"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white 
                        font-medium py-2 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 
                        transition-all duration-200 ease-in-out border-0 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-md"
                      onClick={handleDeposit}
                      disabled={isProcessing || !amount}
                    >
                      {isProcessing ? 'Processing...' : 'Deposit'}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="withdraw" className="p-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="withdraw-amount">Amount to Withdraw</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white 
                        font-medium py-2 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 
                        transition-all duration-200 ease-in-out border-0 focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-md"
                      onClick={handleWithdraw}
                      disabled={isProcessing || !amount}
                    >
                      {isProcessing ? 'Processing...' : 'Withdraw'}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="manage" className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Vault Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Rebalance the vault to optimize yields and manage risk
                    </p>
                  </div>
                  <div className="space-y-4">
                    <Button 
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white 
                        font-medium py-2 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 
                        transition-all duration-200 ease-in-out border-0 focus:ring-2 focus:ring-green-400 focus:ring-opacity-50
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-md"
                      onClick={handleRebalance}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Rebalance Vault'}
                    </Button>
                    
                    <Link href="/crosschain" className="block">
                      <Button 
                        type="button"
                        variant="outline"
                        className="w-full group flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <span>Convert or Bridge Tokens</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </TabsContent>
                

              </Tabs>
            </Card>
          </div>
        </div>
      </FeatureGuard>
    </div>
  );
}
