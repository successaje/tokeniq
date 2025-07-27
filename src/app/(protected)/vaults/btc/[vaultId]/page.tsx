'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, ArrowUpRight, ExternalLink } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useWeb3Modal } from '@web3modal/ethers/react';
import { chains } from '@/config/chains';
import { useToast } from '@/components/ui/use-toast';

const VAULT_DETAILS = {
  'btc-yield': {
    name: 'BTC Yield Vault',
    description: 'Stake native BTC or wBTC for AI-optimized yield strategies',
    apy: '8-15%',
    risk: 'low',
    chainId: 1,
    tvl: '$4.2M',
    minDeposit: '0.01 BTC',
    maxApy: '15%',
    strategy: 'AI-optimized yield farming across DeFi protocols',
    token: 'vBTC',
    features: [
      'Accepts both native BTC (via Core Chain bridge) and wBTC',
      'AI-optimized yield strategies',
      'Auto-rebalancing portfolio',
      'Low risk profile',
      'Daily compounding',
      'Withdraw anytime'
    ]
  },
  'btc-compounding': {
    name: 'BTC Auto-Compounding Vault',
    description: 'Automatically compound your BTC yield for maximum returns',
    apy: '12-18%',
    risk: 'medium',
    chainId: 1,
    tvl: '$2.8M',
    minDeposit: '0.05 BTC',
    maxApy: '18%',
    strategy: 'Auto-compounding yield optimizer for BTC',
    token: 'acBTC',
    features: [
      'Auto-compounding of rewards',
      'Gas optimization for cost efficiency',
      'Daily performance updates',
      'Medium risk profile',
      'Weekly compounding',
      '7-day cooldown period'
    ]
  },
  'btc-borrowing': {
    name: 'BTC Borrowing Vault',
    description: 'Borrow against your BTC with flexible loan-to-value ratios',
    apy: '5-25%',
    risk: 'variable',
    chainId: 1,
    tvl: '$6.1M',
    minDeposit: '0.1 BTC',
    maxApy: '25%',
    strategy: 'Collateralized debt positions with BTC',
    token: 'bBTC',
    features: [
      'Borrow stablecoins or other assets using BTC as collateral',
      'Competitive interest rates',
      'Liquidation protection',
      'Variable risk based on LTV',
      'Adjustable collateral ratio',
      'Instant liquidity'
    ]
  }
};

export default function BtcVaultPage() {
  const router = useRouter();
  const { vaultId } = useParams();
  const { open } = useWeb3Modal();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [vault, setVault] = useState<any>(null);

  useEffect(() => {
    if (vaultId && typeof vaultId === 'string' && VAULT_DETAILS[vaultId as keyof typeof VAULT_DETAILS]) {
      setVault(VAULT_DETAILS[vaultId as keyof typeof VAULT_DETAILS]);
    } else {
      router.push('/vaults');
    }
  }, [vaultId, router]);

  const handleAction = async (action: 'deposit' | 'withdraw') => {
    try {
      setIsLoading(true);
      
      if (!isConnected) {
        open();
        return;
      }

      if (vault.chainId && chainId !== vault.chainId) {
        try {
          await switchChain({ chainId: vault.chainId });
        } catch (error) {
          throw new Error('Failed to switch network. Please switch to the correct network in your wallet');
        }
      }

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Success',
        description: `${action === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${amount} ${vault.token} completed successfully!`,
      });
      
      // Reset form
      setAmount('');
      
    } catch (error) {
      console.error(`Error during ${action}:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to process ${action}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!vault) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <Button 
        variant="ghost" 
        className="px-0" 
        onClick={() => router.push('/vaults')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Vaults
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Vault Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{vault.name}</h1>
              <p className="text-muted-foreground mt-1">{vault.description}</p>
            </div>
            <Badge variant={vault.risk === 'low' ? 'default' : vault.risk === 'medium' ? 'secondary' : 'destructive'}>
              {vault.risk.charAt(0).toUpperCase() + vault.risk.slice(1)} Risk
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">APY</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vault.apy}</div>
                <p className="text-xs text-muted-foreground">Current APY</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">TVL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vault.tvl}</div>
                <p className="text-xs text-muted-foreground">Total Value Locked</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Min. Deposit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vault.minDeposit}</div>
                <p className="text-xs text-muted-foreground">Minimum amount</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Vault Token</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vault.token}</div>
                <p className="text-xs text-muted-foreground">Receipt token</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Strategy</CardTitle>
              <CardDescription>{vault.strategy}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="font-medium">Features:</h3>
                <ul className="space-y-2">
                  {vault.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Vault Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="deposit">Deposit</TabsTrigger>
                  <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                </TabsList>
                <TabsContent value="deposit" className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="deposit-amount">Amount to deposit</Label>
                      <span className="text-xs text-muted-foreground">
                        Balance: 0.0 {vault.token}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="deposit-amount"
                        type="number"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pr-16 text-lg h-14"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={() => setAmount('0.1')}
                        >
                          10%
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={() => setAmount('0.5')}
                        >
                          50%
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={() => setAmount('1')}
                        >
                          MAX
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground flex justify-between">
                      <span>~$0.00</span>
                      <span>Min: {vault.minDeposit}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Est. APY</span>
                      <span className="font-medium">{vault.apy}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">You will receive</span>
                      <span className="font-medium">~{amount || '0'} {vault.token}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4 h-12"
                    size="lg"
                    onClick={() => handleAction('deposit')}
                    disabled={!amount || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Deposit'
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="withdraw" className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="withdraw-amount">Amount to withdraw</Label>
                      <span className="text-xs text-muted-foreground">
                        Balance: 0.0 {vault.token}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pr-16 text-lg h-14"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-xs"
                          onClick={() => setAmount('1')}
                        >
                          MAX
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ~$0.00
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">You will receive</span>
                      <span className="font-medium">~{amount || '0'} BTC</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4 h-12"
                    variant="outline"
                    size="lg"
                    onClick={() => handleAction('withdraw')}
                    disabled={!amount || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Withdraw'
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vault Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Token Information</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vault Token</span>
                    <span>{vault.token}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Underlying Asset</span>
                    <span>BTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network</span>
                    <div className="flex items-center">
                      <span>Core</span>
                      <ExternalLink className="h-3 w-3 ml-1 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="font-medium">Risk Information</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level</span>
                    <span className="capitalize">{vault.risk} Risk</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Audit Status</span>
                    <span className="text-green-500">Audited</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start space-y-2">
              <Button variant="link" className="h-auto p-0 text-muted-foreground">
                View on Explorer <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
              <Button variant="link" className="h-auto p-0 text-muted-foreground">
                View Contract <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
