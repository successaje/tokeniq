import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultType } from '@/config/vaults';
import { useVaultActions } from '@/hooks/useVaultActions';
import { formatEther, formatUnits, parseEther } from 'viem';
import { useAccount, useBalance } from 'wagmi';

interface VaultCardProps {
  vault: VaultType;
  userShares?: bigint;
  onActionSuccess?: () => void;
}

export function VaultCard({ vault, userShares = 0n, onActionSuccess }: VaultCardProps) {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const { executeAction, loading } = useVaultActions();

  const { data: tokenBalance } = useBalance({
    address,
    token: vault.tokenAddress,
    enabled: !!address && vault.available,
  });

  const handleAction = async (action: 'deposit' | 'withdraw' | 'rebalance') => {
    if (!vault.available) return;
    
    try {
      if (action === 'rebalance') {
        await executeAction('rebalance', vault.vaultAddress!);
      } else if (amount) {
        await executeAction(action, vault.vaultAddress!, amount, vault.tokenDecimals);
      }
      setAmount('');
      onActionSuccess?.();
    } catch (error) {
      console.error(`Error in ${action}:`, error);
    }
  };

  const setMaxAmount = () => {
    if (activeTab === 'deposit' && tokenBalance) {
      setAmount(formatUnits(tokenBalance.value, tokenBalance.decimals));
    } else if (activeTab === 'withdraw' && userShares) {
      setAmount(formatEther(userShares));
    }
  };

  if (!vault.available) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{vault.name}</CardTitle>
            <CardDescription>{vault.description}</CardDescription>
          </div>
          <Badge variant={vault.risk === 'high' ? 'destructive' : vault.risk === 'medium' ? 'warning' : 'success'}>
            {vault.risk} risk
          </Badge>
        </div>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary">APY: {vault.apy?.toFixed(2)}%</Badge>
          <Badge variant="secondary">TVL: {vault.tvl ? `$${formatEther(vault.tvl)}` : 'N/A'}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deposit" className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="deposit-amount">Amount ({vault.tokenSymbol})</Label>
                <span className="text-sm text-muted-foreground">
                  Balance: {tokenBalance ? formatUnits(tokenBalance.value, tokenBalance.decimals) : '0'}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  id="deposit-amount"
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
