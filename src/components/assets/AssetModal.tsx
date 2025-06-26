import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Asset = {
  name: string;
  type: string;
  chain: string;
  value: string;
};

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (asset: Omit<Asset, 'id'>) => void;
}

export function AssetModal({ isOpen, onClose, onSubmit }: AssetModalProps) {
  const [formData, setFormData] = useState<Omit<Asset, 'id'>>({
    name: '',
    type: '',
    chain: '',
    value: '',
  });

  const handleChange = (field: keyof Asset, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      value: formData.value,
    });
    setFormData({
      name: '',
      type: '',
      chain: '',
      value: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg w-full max-w-md relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Asset</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Asset Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Invoice #1234"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Asset Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleChange('type', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Invoice">Invoice</SelectItem>
                <SelectItem value="Bond">Bond</SelectItem>
                <SelectItem value="NFT">NFT</SelectItem>
                <SelectItem value="Token">Token</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="chain">Blockchain</Label>
            <Select 
              value={formData.chain}
              onValueChange={(value) => handleChange('chain', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select blockchain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ethereum">Ethereum</SelectItem>
                <SelectItem value="Polygon">Polygon</SelectItem>
                <SelectItem value="Arbitrum">Arbitrum</SelectItem>
                <SelectItem value="Solana">Solana</SelectItem>
                <SelectItem value="Avalanche">Avalanche</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value">Value (USD)</Label>
            <Input
              id="value"
              type="number"
              value={formData.value}
              onChange={(e) => handleChange('value', e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Asset
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
