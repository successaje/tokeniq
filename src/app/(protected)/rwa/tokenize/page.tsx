'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  BuildingOfficeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

const assetTypes = [
  { id: 'real-estate', name: 'Real Estate', icon: BuildingOfficeIcon },
  { id: 'fixed-income', name: 'Fixed Income', icon: DocumentTextIcon },
  { id: 'equities', name: 'Equities', icon: ChartBarIcon },
  { id: 'commodities', name: 'Commodities', icon: CurrencyDollarIcon },
];

export default function TokenizePage() {
  const { isConnected } = useAccount();
  const [selectedAssetType, setSelectedAssetType] = useState('');
  const [formData, setFormData] = useState({
    assetName: '',
    description: '',
    value: '',
    location: '',
    documents: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement tokenization logic
  };

  if (!isConnected) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md p-6 text-center">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Connect Your Wallet</h2>
          <p className="mt-2 text-muted-foreground">
            Please connect your wallet to start tokenizing your assets
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Tokenize Asset</h1>
        <p className="text-muted-foreground">
          Convert your real-world assets into digital tokens
        </p>
      </div>

      {/* Asset Type Selection */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {assetTypes.map((type) => (
          <Card
            key={type.id}
            className={cn(
              "p-6 cursor-pointer transition-colors hover:bg-accent/50",
              selectedAssetType === type.id && "border-primary bg-accent/50"
            )}
            onClick={() => setSelectedAssetType(type.id)}
          >
            <type.icon className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold">{type.name}</h3>
          </Card>
        ))}
      </div>

      {/* Tokenization Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assetName">Asset Name</Label>
              <Input
                id="assetName"
                placeholder="Enter asset name"
                value={formData.assetName}
                onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Asset Value (USD)</Label>
              <Input
                id="value"
                type="number"
                placeholder="Enter asset value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Enter asset location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documents">Supporting Documents</Label>
              <Input
                id="documents"
                type="file"
                multiple
                onChange={(e) => setFormData({ ...formData, documents: e.target.files })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Asset Description</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about the asset"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button">
              Save Draft
            </Button>
            <Button type="submit">
              Start Tokenization
            </Button>
          </div>
        </form>
      </Card>

      {/* Tokenization Process */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Tokenization Process</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-2">
              <DocumentDuplicateIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Document Verification</h3>
              <p className="text-sm text-muted-foreground">
                Submit all required documentation for asset verification
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-2">
              <ShieldCheckIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Legal Compliance</h3>
              <p className="text-sm text-muted-foreground">
                Ensure all regulatory requirements are met
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-2">
              <ArrowUpIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Token Generation</h3>
              <p className="text-sm text-muted-foreground">
                Create digital tokens representing your asset
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-2">
              <ArrowDownIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Distribution</h3>
              <p className="text-sm text-muted-foreground">
                Distribute tokens to investors or holders
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 