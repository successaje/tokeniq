'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useContracts } from '@/contexts/ContractContext';
import { formatEther } from 'viem';

export function VaultStats() {
  const { allVaults, isLoading, error } = useContracts();

  const stats = useMemo(() => {
    const safeVaults = allVaults || [];
    if (safeVaults.length === 0) {
      return [
        { name: 'Total Value Locked', value: '$0.00' },
        { name: 'Total Vaults', value: '0' },
        { name: 'Average APY', value: '0.00%' },
      ];
    }

    const totalValueLocked = safeVaults.reduce((acc, vault) => acc + (vault.totalAssets || 0n), 0n);
    const totalVaults = safeVaults.length;
    const averageApy = safeVaults.reduce((acc, vault) => acc + (vault.apy || 0), 0) / (totalVaults || 1);

    return [
      {
        name: 'Total Value Locked',
        value: `$${parseFloat(formatEther(totalValueLocked)).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      },
      { name: 'Total Vaults', value: totalVaults.toString() },
      { name: 'Average APY', value: `${averageApy.toFixed(2)}%` },
    ];
  }, [allVaults]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">Could not load vault statistics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
