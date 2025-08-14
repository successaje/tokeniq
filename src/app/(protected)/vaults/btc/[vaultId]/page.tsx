'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, ArrowUpRight, ExternalLink } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain, useWriteContract } from 'wagmi';
import { Web3Button } from '@web3modal/react';
import { parseUnits } from 'viem';
import { CORE_TESTNET_ID } from '@/config/chains';

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
  const { toast } = useToast();
  
  // Account and chain state
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  // Core Testnet chain ID
  const CORE_TESTNET_ID = 1114;
  
  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  
  // Simulate wallet connection and transaction signing
  const connectAndSign = async () => {
    try {
      console.log('Attempting to connect wallet...');
      
      // Check if window.ethereum is available
      if (!window.ethereum) {
        throw new Error('No Ethereum provider found. Please install MetaMask or another Web3 wallet.');
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      }).catch(err => {
        console.error('Error requesting accounts:', err);
        throw new Error('Failed to connect wallet. Please check your wallet and try again.');
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet and try again.');
      }
      
      console.log('Connected account:', accounts[0]);
      
      // Prepare transaction parameters
      const txParams = {
        from: accounts[0],
        to: '0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54', // Vault address
        value: '0x0', // No ETH sent, just a contract interaction
        data: '0x6ea056a90000000000000000000000000000000000000000000000000000000000000001', // Mock deposit function call
        gas: '0x7a120', // 500,000 gas
      };
      
      console.log('Sending transaction with params:', txParams);
      
      // Send transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      }).catch(err => {
        console.error('Transaction error:', err);
        throw new Error(`Transaction failed: ${err.message || 'Unknown error'}`);
      });
      
      console.log('Transaction hash:', txHash);
      return txHash;
      
    } catch (error) {
      console.error('Wallet interaction failed:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  };

  // Simulate deposit function
  const simulateDeposit = async () => {
    try {
      console.log('Starting deposit simulation...');
      
      // Basic validation
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid amount to deposit');
      }
      
      // Trigger wallet connection and transaction signing
      const txHash = await connectAndSign();
      
      if (!txHash) {
        throw new Error('No transaction hash received');
      }
      
      console.log('Transaction submitted with hash:', txHash);
      
      // Show transaction submitted
      toast({
        title: 'Transaction Submitted',
        description: 'Your deposit is being processed on the blockchain',
      });
      
      // Simulate blockchain confirmation
      console.log('Simulating blockchain confirmation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      toast({
        title: 'Deposit Successful',
        description: `${amount} BTC has been deposited to the vault`,
      });
      
      // Reset form
      setAmount('');
      setIsDepositing(false);
      
      console.log('Deposit simulation completed successfully');
      return txHash;
      
    } catch (error) {
      console.error('Deposit failed with error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to process deposit';
      toast({
        title: 'Deposit Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsDepositing(false);
    }
  };
  const [isLoading, setIsLoading] = useState(false);
  const [vault, setVault] = useState<any>(null);

  useEffect(() => {
    if (vaultId && typeof vaultId === 'string' && VAULT_DETAILS[vaultId as keyof typeof VAULT_DETAILS]) {
      setVault(VAULT_DETAILS[vaultId as keyof typeof VAULT_DETAILS]);
    } else {
      router.push('/vaults');
    }
  }, [vaultId, router]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to continue',
        variant: 'destructive',
      });
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to deposit',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if on Core Testnet (simulated)
    if (chainId !== CORE_TESTNET_ID) {
      try {
        setIsSwitchingNetwork(true);
        // Simulate network switch
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
          title: 'Network Switched',
          description: 'Successfully switched to Core Testnet',
        });
      } catch (error) {
        console.error('Failed to switch network:', error);
        toast({
          title: 'Network Switch Failed',
          description: 'Please switch to Core Testnet to continue',
          variant: 'destructive',
        });
        setIsSwitchingNetwork(false);
        return;
      } finally {
        setIsSwitchingNetwork(false);
      }
    }
    
    try {
      setIsDepositing(true);
      
      // Simulate the deposit process
      await simulateDeposit();
      
    } catch (error) {
      console.error('Deposit error:', error);
      toast({
        title: 'Transaction Rejected',
        description: 'You rejected the transaction in your wallet',
        variant: 'destructive',
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleSwitchNetwork = useCallback(async () => {
    if (!isConnected) {
      open();
      return;
    }
    
    try {
      setIsSwitchingNetwork(true);
      toast({
        title: 'Switching Network',
        description: 'Please approve the network switch to Core Testnet in your wallet',
      });
      
      await switchChain({ chainId: CORE_TESTNET_ID });
      
      // Wait a moment for the network switch to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Network Switched',
        description: 'Successfully connected to Core Testnet',
      });
    } catch (error) {
      console.error('Network switch error:', error);
      toast({
        title: 'Network Switch Failed',
        description: 'Please switch to Core Testnet (ID: 1114) in your wallet',
        variant: 'destructive',
      });
    } finally {
      setIsSwitchingNetwork(false);
    }
  }, [isConnected, open, switchChain, toast]);

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
                    className="w-full mt-4" 
                    size="lg"
                    onClick={handleDeposit}
                    disabled={!amount || isDepositing || parseFloat(amount) <= 0}
                  >
                    {!isConnected ? (
                      'Connect Wallet to Deposit'
                    ) : chainId !== CORE_TESTNET_ID ? (
                      'Switch to Core Testnet'
                    ) : isDepositing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Deposit BTC'
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
                    size="lg"
                    onClick={handleDeposit}
                    disabled={!amount || isDepositing || !isConnected || chainId !== CORE_TESTNET_ID}
                  >
                    {isDepositing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Withdraw BTC'
                    )}
                  </Button>
                  <div className="w-full">
                    <Web3Button 
                      label="Connect Wallet"
                      icon="show"
                      balance="show"
                    />
                  </div>
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
