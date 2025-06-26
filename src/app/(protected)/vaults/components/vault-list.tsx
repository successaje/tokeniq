'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useContracts } from '@/contexts/ContractContext';
import { formatEther } from 'viem';
import dynamic from 'next/dynamic';

// Dynamically import dialogs with no SSR to avoid hydration issues
const VaultDepositDialog = dynamic(
  () => import('./vault-deposit-dialog').then(mod => mod.VaultDepositDialog),
  { ssr: false }
);

const VaultWithdrawDialog = dynamic(
  () => import('./vault-withdraw-dialog').then(mod => mod.VaultWithdrawDialog),
  { ssr: false }
);

import { VaultInfo } from '@/types/contracts';

interface Vault extends VaultInfo {
  risk: 'low' | 'medium' | 'high';
  strategy: string; // For display purposes only
}

export function VaultList() {
  const { allVaults = [], isLoading = false, error = null, refreshVaults = () => {} } = useContracts();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [action, setAction] = useState<'deposit' | 'withdraw' | null>(null);
  
  // Add default values to prevent destructuring errors
  const safeAllVaults = allVaults || [];

  // Transform contract vaults to UI format
  useEffect(() => {
    if (safeAllVaults && safeAllVaults.length > 0) {
      try {
        const formattedVaults: Vault[] = safeAllVaults.map((vault, index) => ({
          ...vault,
          id: vault.address || `vault-${index}`,
          name: vault.name || 'Unnamed Vault',
          risk: 'medium' as const, // Default risk level
          strategy: 'Yield Strategy', // Default strategy name
        }));
        setVaults(formattedVaults);
      } catch (err) {
        console.error('Error formatting vaults:', err);
        setVaults([]);
      }
    } else {
      setVaults([]);
    }
  }, [safeAllVaults]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Available Vaults</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 text-center py-8">
        <h2 className="text-2xl font-bold">Error loading vaults</h2>
        <p className="text-destructive">{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
        <Button onClick={() => refreshVaults()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {vaults.length > 0 ? 'Available Vaults' : 'No Vaults Found'}
        </h2>
      </div>

      {vaults.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vaults.map((vault) => (
            <Card key={vault.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{vault.name}</CardTitle>
                  <Badge className={getRiskColor(vault.risk)}>{vault.risk}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{vault.strategy}</div>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">APY</span>
                  <span className="font-medium">{vault.apy.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">TVL</span>
                  <span className="font-medium">
                    {vault.totalAssets ? (
                      `${parseFloat(formatEther(vault.totalAssets)).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} ETH`
                    ) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Asset</span>
                  <span className="font-medium truncate max-w-[120px]">
                    {vault.asset}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex space-x-2">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    setSelectedVault(vault);
                    setAction('deposit');
                  }}
                >
                  Deposit
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedVault(vault);
                    setAction('withdraw');
                  }}
                >
                  Withdraw
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No vaults available</p>
        </div>
      )}

      <VaultDepositDialog
        open={action === 'deposit'}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
            setSelectedVault(null);
          }
        }}
        vault={selectedVault}
      />

      <VaultWithdrawDialog
        open={action === 'withdraw'}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
            setSelectedVault(null);
          }
        }}
        vault={selectedVault}
      />
    </div>
  );
}
