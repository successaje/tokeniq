'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { VAULT_TYPES, VAULT_TYPE_IDS } from '@/config/vaults';
import { VaultCard } from '@/components/vaults/VaultCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVaultBalances } from '@/hooks/useVaultBalances';

export function VaultList() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('all');
  const { balances, loading, refresh } = useVaultBalances();

  const filteredVaults = VAULT_TYPE_IDS.filter(vaultId => {
    if (activeTab === 'all') return true;
    if (activeTab === 'my-vaults') return balances[vaultId]?.userShares > 0n;
    return activeTab === vaultId;
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">All Vaults</TabsTrigger>
          <TabsTrigger value="my-vaults">My Vaults</TabsTrigger>
          {VAULT_TYPE_IDS.map((vaultId) => (
            <TabsTrigger key={vaultId} value={vaultId}>
              {VAULT_TYPES[vaultId].name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredVaults.map((vaultId) => {
          const vault = VAULT_TYPES[vaultId];
          const vaultBalance = balances[vaultId] || { userShares: 0n, totalValue: 0n };
          
          return (
            <VaultCard
              key={vaultId}
              vault={{
                ...vault,
                vaultAddress: vault.vaultAddress || `0x${vaultId}`, // Fallback for demo
                tvl: vaultBalance.totalValue,
              }}
              userShares={vaultBalance.userShares}
              onActionSuccess={refresh}
            />
          );
        })}
      </div>

      {filteredVaults.length === 0 && (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">
            {activeTab === 'my-vaults' 
              ? 'You have no active vaults. Deposit into a vault to get started.'
              : 'No vaults match the current filter.'}
          </p>
        </div>
      )}
    </div>
  );
}
