'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Asset } from '../page';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssetModal } from './asset-modal';

export const columns: ColumnDef<Asset>[] = [
  {
    accessorKey: 'name',
    header: 'Asset Name',
    cell: function NameCell({ row }) {
      return <div className="font-medium">{row.getValue('name')}</div>;
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: function TypeCell({ row }) {
      const type = row.getValue('type') as string;
      const typeVariants = {
        Invoice: 'bg-blue-100 text-blue-800',
        Bond: 'bg-green-100 text-green-800',
        NFT: 'bg-purple-100 text-purple-800',
        'Real Estate': 'bg-amber-100 text-amber-800',
        Commodity: 'bg-emerald-100 text-emerald-800',
        Other: 'bg-gray-100 text-gray-800',
      };
      
      return (
        <Badge className={typeVariants[type as keyof typeof typeVariants] || 'bg-gray-100'}>
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'chain',
    header: 'Chain',
    cell: function ChainCell({ row }) {
      return <div className="capitalize">{row.getValue('chain')}</div>;
    },
  },
  {
    accessorKey: 'value',
    header: function ValueHeader({ column }) {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="px-0"
        >
          Value (USD)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: function ValueCell({ row }) {
      const amount = parseFloat(row.getValue('value'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: function StatusCell({ row }) {
      const status = row.getValue('status') as string;
      const statusVariants = {
        Active: 'bg-green-100 text-green-800',
        Pending: 'bg-yellow-100 text-yellow-800',
        Inactive: 'bg-gray-100 text-gray-800',
        Settled: 'bg-blue-100 text-blue-800',
      };

      return (
        <Badge className={statusVariants[status as keyof typeof statusVariants] || 'bg-gray-100'}>
          {status}
        </Badge>
      );
    },
    filterFn: function statusFilter(row, id, value) {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'actions',
    cell: function ActionsCell({ row }) {
      const asset = row.original;
      return (
        <div className="flex space-x-2">
          <AssetModal asset={asset}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </AssetModal>
        </div>
      );
    },
  },
];
