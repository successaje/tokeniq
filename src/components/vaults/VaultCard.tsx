import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultInfo, VaultType } from '@/types/vault';
import { useVaultActions } from '@/hooks/useVaultActions';
import { formatEther, formatUnits, parseUnits, type Address } from 'viem';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface VaultCardProps {
  vault: VaultInfo;
  userShares?: bigint;
  onActionSuccess?: () => void;
  className?: string;
}

export function VaultCard({ vault, userShares = 0n, onActionSuccess, className = '' }: VaultCardProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const { executeAction, loading } = useVaultActions();

  // Fetch user's token balance for deposit
  const { data: tokenBalance } = useBalance({
    address: address,
    token: vault.tokenAddress as `0x${string}`,
    chainId: chainId,
  });
  
  // Fetch user's vault token balance (shares)
  const { data: vaultTokenBalance } = useBalance({
    address: address,
    token: vault.address as `0x${string}`,
    chainId: chainId,
  });
  
  // Calculate user's share of the vault
  const userSharePercentage = useMemo(() => {
    if (!vault.totalSupply || vault.totalSupply === '0' || !vaultTokenBalance) return 0;
    
    const supply = typeof vault.totalSupply === 'string' 
      ? BigInt(vault.totalSupply) 
      : vault.totalSupply;
    const balance = typeof vaultTokenBalance.value === 'string'
      ? BigInt(vaultTokenBalance.value)
      : vaultTokenBalance.value;
      
    return (Number(balance) / Number(supply)) * 100;
  }, [vault.totalSupply, vaultTokenBalance]);
  
  // Format APY with color coding based on value
  const formattedApy = useMemo(() => {
    if (!vault.apy) return 'N/A';
    const color = vault.apy > 10 ? 'text-green-500' : vault.apy > 5 ? 'text-yellow-500' : 'text-red-500';
    return <span className={`font-semibold ${color}`}>{vault.apy.toFixed(2)}%</span>;
  }, [vault.apy]);
  
  // Format TVL
  const formattedTvl = useMemo(() => {
    if (!vault.tvl) return '$0';
    const value = typeof vault.tvl === 'string' ? BigInt(vault.tvl) : vault.tvl;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value) / 1e18);
  }, [vault.tvl]);

  const handleAction = async (action: 'deposit' | 'withdraw' | 'rebalance') => {
    if (!vault.vaultAddress || !amount) return;
    
    try {
      setIsApproving(true);
      
      if (action === 'rebalance') {
        await executeAction('rebalance', vault.vaultAddress);
      } else {
        await executeAction(
          action, 
          vault.vaultAddress, 
          amount, 
          vault.tokenDecimals || 18,
          action === 'deposit' ? vault.tokenAddress : undefined
        );
      }
      
      setAmount('');
      onActionSuccess?.();
    } catch (error) {
      console.error(`Error in ${action}:`, error);
      // TODO: Add toast notification for error
    } finally {
      setIsApproving(false);
    }
  };
  
  // Set max amount for deposit/withdraw
  const setMaxAmount = () => {
    if (activeTab === 'deposit' && tokenBalance) {
      // Leave a small amount for gas
      const balance = tokenBalance.value - parseEther('0.01');
      if (balance > 0n) {
        setAmount(formatUnits(balance, tokenBalance.decimals));
      } else {
        setAmount('0');
      }
    } else if (activeTab === 'withdraw' && vaultTokenBalance) {
      setAmount(formatUnits(vaultTokenBalance.value, vaultTokenBalance.decimals));
    }
  };
  
  // Format risk level with color
  const getRiskBadge = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive">High Risk</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium Risk</Badge>;
      case 'low':
      default:
        return <Badge variant="success">Low Risk</Badge>;
    }
  };

  const setMaxAmount = () => {
    if (activeTab === 'deposit' && tokenBalance) {
      setAmount(formatUnits(tokenBalance.value, tokenBalance.decimals));
    } else if (activeTab === 'withdraw' && userShares) {
      setAmount(formatUnits(userShares, vault.tokenDecimals || 18));
    } else if (activeTab === 'withdraw' && userShares) {
      setAmount(formatEther(userShares));
    }
  };

  if (vault.availability === 'private') {
    return (
      <Card className="opacity-70">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{vault.name}</CardTitle>
              <CardDescription>{vault.description}</CardDescription>
            </div>
            <Badge variant="outline" className="text-muted-foreground">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">This vault is not yet available</p>
        </CardContent>
      </Card>
    );
  }

  // If vault is not available, show disabled state
  if (!vault.available) {
    return (
      <Card className={cn("opacity-70", className)}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{vault.name}</CardTitle>
            <Badge variant="outline">{vault.chain}</Badge>
          </div>
          <CardDescription>{vault.description}</CardDescription>
          <div className="flex gap-2 mt-2">
            {vault.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">This vault is not yet available</p>
        </CardContent>
      </Card>
    );
  }

  // If vault is not available, show disabled state
  if (!vault.available) {
    return (
      <Card className={cn("opacity-70", className)}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{vault.name}</CardTitle>
            <Badge variant="outline">{vault.chain}</Badge>
          </div>
          <CardDescription>{vault.description}</CardDescription>
          <div className="flex gap-2 mt-2">
            {vault.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">This vault is not yet available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-lg", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold">{vault.name}</CardTitle>
              {vault.isNew && (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  New
                </Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2">{vault.description}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="border-primary text-primary">
              {vault.chain}
            </Badge>
            {getRiskBadge(vault.risk)}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {vault.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">APY</p>
            <p className="text-lg font-semibold">{formattedApy}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">TVL</p>
            <p className="text-lg font-semibold">{formattedTvl}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Min. Deposit</p>
            <p className="text-lg font-semibold">
              {vault.minDeposit ? formatUnits(vault.minDeposit, vault.tokenDecimals) : '0'} {vault.tokenSymbol}
            </p>
          </div>
        </div>
        
        {vaultTokenBalance && vaultTokenBalance.value > 0n && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your position</span>
              <span className="font-medium">
                {formatUnits(vaultTokenBalance.value, vaultTokenBalance.decimals)} {vault.tokenSymbol}
              </span>
            </div>
            <Progress value={userSharePercentage} className="h-2" />
            <div className="text-xs text-right text-muted-foreground">
              {userSharePercentage.toFixed(2)}% of pool
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="text-center py-8">
        <p className="text-muted-foreground">This vault is not yet available</p>
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  min="0"
                  step="any"
                />
                <Button variant="outline" onClick={setMaxAmount}>Max</Button>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleAction('deposit')}
              disabled={!amount || parseFloat(amount) <= 0 || loading[`deposit-${vault.vaultAddress}`]}
            >
              {loading[`deposit-${vault.vaultAddress}`] ? 'Processing...' : 'Deposit'}
            </Button>
          </TabsContent>
          
          <TabsContent value="withdraw" className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="withdraw-amount">Amount (Shares)</Label>
                <span className="text-sm text-muted-foreground">
                  Your shares: {formatEther(userShares)}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  id="withdraw-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  min="0"
                  step="any"
                />
                <Button variant="outline" onClick={setMaxAmount}>Max</Button>
              </div>
            </div>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleAction('withdraw')}
              disabled={!amount || parseFloat(amount) <= 0 || loading[`withdraw-${vault.vaultAddress}`]}
            >
              {loading[`withdraw-${vault.vaultAddress}`] ? 'Processing...' : 'Withdraw'}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          Min. deposit: {vault.minDeposit ? formatEther(vault.minDeposit) : 'N/A'} {vault.tokenSymbol}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleAction('rebalance')}
          disabled={loading[`rebalance-${vault.vaultAddress}`]}
        >
          {loading[`rebalance-${vault.vaultAddress}`] ? 'Rebalancing...' : 'Rebalance'}
        </Button>
      </CardFooter>
    </Card>
  );
}
