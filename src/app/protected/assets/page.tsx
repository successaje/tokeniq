'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetsTable } from '@/components/assets/AssetsTable';
import { AssetModal } from '@/components/assets/AssetModal';

type Asset = {
  id: string;
  name: string;
  type: 'Invoice' | 'Bond' | 'NFT' | string;
  chain: string;
  value: number;
  status: 'Active' | 'Pending' | 'Inactive';
};

export default function AssetsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);

  const handleAddAsset = (newAsset: Omit<Asset, 'id'>) => {
    setAssets([...assets, { ...newAsset, id: Date.now().toString() }]);
    setIsModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">
            Manage your tokenized real-world assets
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Asset
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetsTable assets={assets} />
        </CardContent>
      </Card>

      <AssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddAsset}
      />
    </div>
  );
}
