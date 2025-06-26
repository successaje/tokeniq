'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVaultBalances } from '@/hooks/useVaultBalances';
import { formatEther } from 'viem';
import { VAULT_TYPES, VAULT_TYPE_IDS } from '@/config/vaults';
import { Skeleton } from '@/components/ui/skeleton';

export function VaultStats() {
  const { balances, loading } = useVaultBalances();
  
  // Calculate total TVL and user portfolio value
  const stats = {
    tvl: VAULT_TYPE_IDS.reduce((sum, id) => {
      const vault = VAULT_TYPES[id];
      const balance = balances[id]?.totalValue || 0n;
      return sum + (vault.available ? balance : 0n);
    }, 0n),
    userPortfolio: VAULT_TYPE_IDS.reduce((sum, id) => {
      const vault = VAULT_TYPES[id];
      const balance = balances[id]?.userValue || 0n;
      return sum + (vault.available ? balance : 0n);
    }, 0n),
    totalVaults: VAULT_TYPE_IDS.filter(id => VAULT_TYPES[id].available).length,
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-32" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Value Locked
          </CardTitle>
          <div className="text-2xl font-bold">
            ${formatEther(stats.tvl)}
          </div>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Your Portfolio
          </CardTitle>
          <div className="text-2xl font-bold">
            ${formatEther(stats.userPortfolio)}
          </div>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Available Vaults
          </CardTitle>
          <div className="text-2xl font-bold">
            {stats.totalVaults}
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
