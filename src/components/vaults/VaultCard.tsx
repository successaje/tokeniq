import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultInfo } from '@/types/vault';
import { useVaultActions } from '@/hooks/useVaultActions';
import { formatEther, formatUnits, parseUnits } from 'viem';
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
      
    return Number((balance * 10000n) / supply) / 100; // 2 decimal places
  }, [vault.totalSupply, vaultTokenBalance]);

  const handleAction = async (action: 'deposit' | 'withdraw' | 'harvest' | 'rebalance') => {
    if (!address || !amount) return;
    
    try {
      setIsApproving(true);
      await executeAction({
        action,
        vaultAddress: vault.address,
        amount: parseUnits(amount, vault.tokenDecimals),
        tokenAddress: vault.tokenAddress,
      });
      
      if (onActionSuccess) {
        onActionSuccess();
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setIsApproving(false);
    }
  };

  const getRiskBadge = (risk?: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return <Badge variant="outline" className="border-green-500 text-green-500">Low Risk</Badge>;
      case 'high':
        return <Badge variant="outline" className="border-red-500 text-red-500">High Risk</Badge>;
      case 'medium':
      default:
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Medium Risk</Badge>;
    }
  };

  if (!vault) {
    return (
      <Card className={cn("p-6 text-center", className)}>
        <div className="flex flex-col items-center justify-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading vault information...</p>
        </div>
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
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deposit" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="deposit-amount">Amount to deposit</Label>
                <div className="relative mt-1">
                  <Input
                    id="deposit-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`0.00 ${vault.tokenSymbol}`}
                    className="pr-16"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {vault.tokenSymbol}
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>Balance: {tokenBalance ? formatUnits(tokenBalance.value, tokenBalance.decimals) : '0.00'}</span>
                  <button 
                    type="button" 
                    className="text-primary hover:underline"
                    onClick={() => {
                      if (tokenBalance) {
                        setAmount(formatUnits(tokenBalance.value, tokenBalance.decimals));
                      }
                    }}
                  >
                    Max
                  </button>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => handleAction('deposit')}
                disabled={!amount || isApproving || loading[`deposit-${vault.address}`]}
              >
                {isApproving || loading[`deposit-${vault.address}`] ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Deposit'
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="withdraw" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="withdraw-amount">Amount to withdraw</Label>
                <div className="relative mt-1">
                  <Input
                    id="withdraw-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`0.00 ${vault.tokenSymbol}`}
                    className="pr-16"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {vault.tokenSymbol}
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>Balance: {vaultTokenBalance ? formatUnits(vaultTokenBalance.value, vaultTokenBalance.decimals) : '0.00'}</span>
                  <button 
                    type="button" 
                    className="text-primary hover:underline"
                    onClick={() => {
                      if (vaultTokenBalance) {
                        setAmount(formatUnits(vaultTokenBalance.value, vaultTokenBalance.decimals));
                      }
                    }}
                  >
                    Max
                  </button>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => handleAction('withdraw')}
                disabled={!amount || isApproving || loading[`withdraw-${vault.address}`]}
              >
                {isApproving || loading[`withdraw-${vault.address}`] ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Withdraw'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Vault stats */}
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">APY</span>
            <span className="font-medium">{vault.apy?.toFixed(2) ?? '0.00'}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your Share</span>
            <span className="font-medium">{userSharePercentage.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">TVL</span>
            <span className="font-medium">
              {vault.tvl ? `$${formatEther(typeof vault.tvl === 'string' ? BigInt(vault.tvl) : vault.tvl)}` : '$0.00'}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleAction('harvest')}
          disabled={loading[`harvest-${vault.address}`]}
        >
          {loading[`harvest-${vault.address}`] ? 'Harvesting...' : 'Harvest'}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleAction('rebalance')}
          disabled={loading[`rebalance-${vault.address}`]}
        >
          {loading[`rebalance-${vault.address}`] ? 'Rebalancing...' : 'Rebalance'}
        </Button>
      </CardFooter>
    </Card>
  );
}
