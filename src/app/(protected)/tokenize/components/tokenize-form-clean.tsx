'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AssetType = 'invoice' | 'real-estate' | 'carbon-credit' | 'other' | '';
type TokenStandard = 'ERC-721' | 'ERC-1155' | 'ERC-20';

export default function TokenizeForm() {
  const [assetType, setAssetType] = useState<AssetType>('');
  const [metadata, setMetadata] = useState({
    name: '',
    description: '',
    tokenStandard: 'ERC-20' as TokenStandard,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
            <CardDescription>
              Fill in the details of the asset you want to tokenize
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assetType">Asset Type</Label>
                <Select
                  value={assetType}
                  onValueChange={(value: AssetType) => setAssetType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="carbon-credit">Carbon Credit</SelectItem>
                    <SelectItem value="other">Other Asset</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tokenStandard">Token Standard</Label>
                <Select
                  value={metadata.tokenStandard}
                  onValueChange={(value: TokenStandard) => 
                    setMetadata({...metadata, tokenStandard: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ERC-721">ERC-721 (Unique Assets)</SelectItem>
                    <SelectItem value="ERC-1155">ERC-1155 (Semi-Fungible)</SelectItem>
                    <SelectItem value="ERC-20">ERC-20 (Fungible Tokens)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assetName">Asset Name</Label>
                <Input
                  id="assetName"
                  value={metadata.name}
                  onChange={(e) => setMetadata({...metadata, name: e.target.value})}
                  placeholder="e.g., Downtown Office Building"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assetDescription">Description</Label>
                <Textarea
                  id="assetDescription"
                  value={metadata.description}
                  onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                  placeholder="Describe the asset in detail..."
                  rows={3}
                />
              </div>
              
              <Button className="w-full">
                Mint Token
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
