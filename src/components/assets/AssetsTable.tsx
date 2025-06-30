import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

type Asset = {
  id: string;
  name: string;
  type: 'Invoice' | 'Bond' | 'NFT' | string;
  chain: string;
  value: number;
  status: 'Active' | 'Pending' | 'Inactive';
};

interface AssetsTableProps {
  assets: Asset[];
}

export function AssetsTable({ assets }: AssetsTableProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Pending':
        return 'outline';
      case 'Inactive':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No assets found. Add your first asset to get started.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Chain</TableHead>
          <TableHead className="text-right">Value</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset.id}>
            <TableCell className="font-medium">{asset.name}</TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {asset.type}
              </Badge>
            </TableCell>
            <TableCell>{asset.chain}</TableCell>
            <TableCell className="text-right">${asset.value.toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(asset.status)}>
                {asset.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
