import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { AssetModal } from './components/asset-modal';

export const metadata: Metadata = {
  title: 'Assets',
  description: 'Manage your digital and real-world assets',
};

// Mock data - replace with actual data from your API
export type Asset = {
  id: string;
  name: string;
  type: 'Invoice' | 'Bond' | 'NFT' | 'Real Estate' | 'Commodity' | 'Other';
  chain: string;
  value: number;
  status: 'Active' | 'Pending' | 'Inactive' | 'Settled';
  tokenId?: string;
  contractAddress?: string;
  addedDate: string;
};

const mockData: Asset[] = [
  {
    id: '1',
    name: 'Tech Corp Invoice #123',
    type: 'Invoice',
    chain: 'Ethereum',
    value: 50000,
    status: 'Active',
    tokenId: '0x123...456',
    contractAddress: '0x789...012',
    addedDate: '2025-05-15',
  },
  {
    id: '2',
    name: 'US Treasury Bond 2025',
    type: 'Bond',
    chain: 'Polygon',
    value: 100000,
    status: 'Active',
    tokenId: '0x234...567',
    contractAddress: '0x890...123',
    addedDate: '2025-04-22',
  },
  {
    id: '3',
    name: 'Digital Art #456',
    type: 'NFT',
    chain: 'Ethereum',
    value: 2500,
    status: 'Inactive',
    tokenId: '0x345...678',
    contractAddress: '0x901...234',
    addedDate: '2025-06-10',
  },
];

export default function AssetsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">
            Manage your digital and real-world assets
          </p>
        </div>
        <AssetModal>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Asset
          </Button>
        </AssetModal>
      </div>
      
      <div className="rounded-md border">
        <DataTable columns={columns} data={mockData} />
      </div>
    </div>
  );
}
