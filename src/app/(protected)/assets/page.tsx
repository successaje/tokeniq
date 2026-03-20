'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { AssetModal } from './components/asset-modal';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { SEI_BRANDING, MOCK_DATA } from '@/config/sei-branding';
import { cn } from '@/lib/utils';

export type Asset = {
  id: string;
  name: string;
  type: 'Token' | 'Vault' | 'NFT' | 'Stablecoin' | 'Liquidity' | 'Staking';
  chain: string;
  value: number;
  balance: number;
  price: number;
  change24h: number;
  status: 'Active' | 'Pending' | 'Inactive' | 'Staked';
  apy?: number;
  tokenId?: string;
  contractAddress?: string;
  addedDate: string;
};

const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'Sei (SEI)',
    type: 'Token',
    chain: 'Sei Network',
    value: 16000,
    balance: 25000,
    price: 0.64,
    change24h: 3.2,
    status: 'Active',
    apy: 12.8,
    addedDate: '2025-01-15',
  },
  {
    id: '2',
    name: 'USD Coin',
    type: 'Stablecoin',
    chain: 'Sei Network',
    value: 10000,
    balance: 10000,
    price: 1.0,
    change24h: 0.0,
    status: 'Active',
    apy: 9.5,
    addedDate: '2025-01-10',
  },
  {
    id: '3',
    name: 'Tether USD',
    type: 'Stablecoin',
    chain: 'Sei Network',
    value: 3000,
    balance: 3000,
    price: 1.0,
    change24h: 0.0,
    status: 'Active',
    addedDate: '2025-01-12',
  },
  {
    id: '4',
    name: 'Bitcoin',
    type: 'Token',
    chain: 'Sei Network',
    value: 3000,
    balance: 0.0285,
    price: 105340,
    change24h: -0.8,
    status: 'Staked',
    apy: 8.2,
    addedDate: '2025-01-08',
  },
  {
    id: '5',
    name: 'Ethereum',
    type: 'Token',
    chain: 'Sei Network',
    value: 2000,
    balance: 0.567,
    price: 3528,
    change24h: 1.2,
    status: 'Staked',
    apy: 7.8,
    addedDate: '2025-01-05',
  },
  {
    id: '6',
    name: 'Sei Yield Vault',
    type: 'Vault',
    chain: 'Sei Network',
    value: 12000,
    balance: 12000,
    price: 1.0,
    change24h: 0.0,
    status: 'Active',
    apy: 12.8,
    addedDate: '2025-01-01',
  },
];

export default function AssetsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredAssets = mockAssets.filter((asset) => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || asset.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalValue = mockAssets.reduce((sum, asset) => sum + asset.value, 0);

  return (
    <div className="flex-1 p-4 md:p-6 max-w-[2000px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground mt-1">
            Manage your digital assets on Sei Network
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            <Sparkles className="h-3 w-3 mr-1" />
            {SEI_BRANDING.badges.intelligenceLayer}
          </Badge>
          <AssetModal>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </AssetModal>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all assets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAssets.filter(a => a.status === 'Active' || a.status === 'Staked').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. APY</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {(
                mockAssets
                  .filter(a => a.apy)
                  .reduce((sum, a) => sum + (a.apy || 0), 0) /
                mockAssets.filter(a => a.apy).length
              ).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Yield across assets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sei Network</CardTitle>
            <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
              Sei
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAssets.filter(a => a.chain === 'Sei Network').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Assets on Sei
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'Token', 'Stablecoin', 'Vault', 'Staking'].map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {type === 'all' ? 'All' : type}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <DataTable 
              columns={columns} 
              data={filteredAssets.map(asset => ({
                ...asset,
                tokenId: asset.tokenId || `0x${asset.id}...${asset.id}`,
                contractAddress: asset.contractAddress || `0x${asset.id}...${asset.id}`,
              }))} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
