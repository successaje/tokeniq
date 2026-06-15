import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

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
      <div className="text-center py-12 border border-dashed border-border/50 rounded-xl bg-card/10">
        <p className="text-muted-foreground text-sm">No assets found. Add your first asset to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden bg-card/30">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Asset Name</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Type</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Chain</TableHead>
            <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Value</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset, i) => (
            <motion.tr 
              key={asset.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              <TableCell className="font-medium text-sm">{asset.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize text-xs">
                  {asset.type}
                </Badge>
              </TableCell>
              <TableCell className="text-sm font-medium">{asset.chain}</TableCell>
              <TableCell className="text-right font-mono text-sm">${asset.value.toLocaleString()}</TableCell>
              <TableCell>
                <Badge 
                  variant={getStatusVariant(asset.status)}
                  className={asset.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : ''}
                >
                  {asset.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More</span>
                </Button>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
