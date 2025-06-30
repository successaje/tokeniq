"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Asset } from '../page';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const assetFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  type: z.enum(['Invoice', 'Bond', 'NFT', 'Real Estate', 'Commodity', 'Other']),
  chain: z.string().min(1, {
    message: 'Please select a blockchain.',
  }),
  value: z.string().min(1, {
    message: 'Please enter a value.',
  }),
  status: z.enum(['Active', 'Pending', 'Inactive', 'Settled']),
  tokenId: z.string().optional(),
  contractAddress: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetModalProps {
  children: React.ReactNode;
  asset?: Asset;
}

export function AssetModal({ children, asset }: AssetModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const defaultValues: Partial<AssetFormValues> = {
    name: asset?.name || '',
    type: asset?.type || 'Other',
    chain: asset?.chain || '',
    value: asset?.value.toString() || '',
    status: asset?.status || 'Active',
    tokenId: asset?.tokenId || '',
    contractAddress: asset?.contractAddress || '',
  };

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues,
  });

  async function onSubmit(data: AssetFormValues) {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would make an API call here
      console.log('Submitting asset:', data);
      
      toast.success(asset ? 'Asset updated successfully' : 'Asset added successfully');
      setOpen(false);
      
      // Refresh the page or update the table data
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error submitting asset:', error);
      toast.error('Failed to save asset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent 
        className={cn(
          'sm:max-w-[600px] z-[99999] transition-all duration-200',
          isDropdownOpen && 'backdrop-blur-sm bg-opacity-80'
        )}
      >
        <DialogHeader>
          <DialogTitle>{asset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
          <DialogDescription>
            {asset ? 'Update the asset details below.' : 'Add a new asset to your portfolio.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tech Corp Invoice #123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type</FormLabel>
                    <div className="relative">
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        onOpenChange={setIsDropdownOpen}
                      >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Invoice">Invoice</SelectItem>
                        <SelectItem value="Bond">Bond</SelectItem>
                        <SelectItem value="NFT">NFT</SelectItem>
                        <SelectItem value="Real Estate">Real Estate</SelectItem>
                        <SelectItem value="Commodity">Commodity</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="chain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blockchain</FormLabel>
                    <div className="relative">
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        onOpenChange={setIsDropdownOpen}
                      >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select blockchain" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ethereum">Ethereum</SelectItem>
                        <SelectItem value="Polygon">Polygon</SelectItem>
                        <SelectItem value="Arbitrum">Arbitrum</SelectItem>
                        <SelectItem value="Optimism">Optimism</SelectItem>
                        <SelectItem value="Avalanche">Avalanche</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <div className="relative">
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        onOpenChange={setIsDropdownOpen}
                      >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Settled">Settled</SelectItem>
                      </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contractAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tokenId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 or 0x..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Asset'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
