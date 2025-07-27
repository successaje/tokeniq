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
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, CheckCircle2, AlertCircle, File, X, Image as FileImage, FileText as FileTextIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type AssetType = 'invoice' | 'real-estate' | 'carbon-credit' | '';
type UploadedFile = {
  file: File;
  preview: string;
  type: 'image' | 'pdf' | 'document' | 'other';
  size: string;
  ipfsHash?: string;
  status: 'uploading' | 'uploaded' | 'failed';
};

interface AssetMetadata {
  name: string;
  description: string;
  value: string;
  currency: string;
  // Common fields
  issuer: string;
  issueDate: string;
  // Invoice specific
  dueDate?: string;
  invoiceNumber?: string;
  // Real estate specific
  propertyType?: string;
  address?: string;
  // Carbon credit specific
  vintageYear?: string;
  certification?: string;
}

export function TokenizeForm() {
  const [assetType, setAssetType] = useState<AssetType>('');
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [mintError, setMintError] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [metadata, setMetadata] = useState<AssetMetadata>({
    name: '',
    description: '',
    value: '',
    currency: 'USD',
    issuer: '',
    issueDate: new Date().toISOString().split('T')[0],
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map(file => {
        const fileType = file.type.startsWith('image/') ? 'image' : 
                        file.type === 'application/pdf' ? 'pdf' : 
                        file.type.includes('document') ? 'document' : 'other';
                        
        return {
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
          type: fileType,
          size: formatFileSize(file.size),
          status: 'uploading' as const
        };
      });
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
      // Simulate IPFS upload
      uploadFilesToIPFS(newFiles);
    },
  });
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const uploadFilesToIPFS = async (files: UploadedFile[]) => {
    setIsUploading(true);
    
    // In a real implementation, you would upload to IPFS here
    // This is a simulation that updates the status after a delay
    const uploadPromises = files.map((file, index) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setUploadedFiles(prev => {
            const updated = [...prev];
            const fileIndex = updated.findIndex(f => f.file === file.file);
            if (fileIndex > -1) {
              updated[fileIndex] = {
                ...updated[fileIndex],
                status: 'uploaded',
                ipfsHash: `QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco_${Date.now()}`
              };
            }
            return updated;
          });
          resolve();
        }, 1000 + (index * 500)); // Staggered uploads
      });
    });
    
    await Promise.all(uploadPromises);
    setIsUploading(false);
  };
  
  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      const removed = newFiles.splice(index, 1);
      // Revoke the object URL to avoid memory leaks
      if (removed[0]?.preview) {
        URL.revokeObjectURL(removed[0].preview);
      }
      return newFiles;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMint = async () => {
    if (!assetType) {
      setMintError('Please select an asset type');
      return;
    }
    
    if (uploadedFiles.length === 0) {
      setMintError('Please upload at least one document for your asset');
      return;
    }
    
    // Check if all files are uploaded
    const notUploaded = uploadedFiles.some(file => file.status !== 'uploaded' || !file.ipfsHash);
    if (notUploaded) {
      setMintError('Please wait for all files to finish uploading');
      return;
    }

    setIsMinting(true);
    setMintError('');
    setProgress(0);

    try {
      // Prepare metadata with IPFS hashes
      const assetMetadata = {
        ...metadata,
        documents: uploadedFiles.map(file => ({
          name: file.file.name,
          type: file.file.type,
          size: file.file.size,
          ipfsHash: file.ipfsHash,
          url: `https://ipfs.io/ipfs/${file.ipfsHash}`
        }))
      };
      
      // In a real implementation, you would now send this metadata to your backend or smart contract
      console.log('Asset metadata with documents:', assetMetadata);
      // Simulate minting process with progress
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          setProgress((prev) => {
            const newProgress = prev + 10;
            if (newProgress >= 90) {
              clearInterval(interval);
              resolve();
              return 90;
            }
            return newProgress;
          });
        }, 300);
      });

      // Simulate blockchain interaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProgress(100);
      setMintSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setAssetType('');
        setMetadata({
          name: '',
          description: '',
          value: '',
          currency: 'USD',
          issuer: '',
          issueDate: new Date().toISOString().split('T')[0],
        });
        // Clean up object URLs
        uploadedFiles.forEach(file => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
        setUploadedFiles([]);
        setMintSuccess(false);
        setProgress(0);
      }, 3000);
    } catch (error) {
      console.error('Minting failed:', error);
      setMintError('Failed to mint token. Please try again.');
      setProgress(0);
    } finally {
      setIsMinting(false);
    }
  };

  const renderAssetSpecificFields = () => {
    switch (assetType) {
      case 'invoice':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  name="invoiceNumber"
                  value={metadata.invoiceNumber || ''}
                  onChange={handleInputChange}
                  placeholder="INV-2023-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={metadata.dueDate || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </>
        );
      case 'real-estate':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Input
                  id="propertyType"
                  name="propertyType"
                  value={metadata.propertyType || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Residential, Commercial"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={metadata.address || ''}
                  onChange={handleInputChange}
                  placeholder="Property address"
                />
              </div>
            </div>
          </>
        );
      case 'carbon-credit':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vintageYear">Vintage Year</Label>
                <Input
                  id="vintageYear"
                  name="vintageYear"
                  type="number"
                  value={metadata.vintageYear || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 2023"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certification">Certification</Label>
                <Input
                  id="certification"
                  name="certification"
                  value={metadata.certification || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., VCS, GS"
                />
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

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
          <CardContent className="space-y-4">
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
                </SelectContent>
              </Select>
            </div>

            {assetType && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Asset Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={metadata.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Commercial Property, Invoice #123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={metadata.description}
                    onChange={handleInputChange}
                    placeholder="Provide a detailed description of the asset"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="value">Value</Label>
                    <Input
                      id="value"
                      name="value"
                      type="number"
                      value={metadata.value}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={metadata.currency}
                      onValueChange={(value) =>
                        setMetadata({ ...metadata, currency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="NGN">NGN (₦)</SelectItem>
                        <SelectItem value="ETH">ETH (Ξ)</SelectItem>
                        <SelectItem value="BTC">BTC (₿)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issuer">Issuer</Label>
                    <Input
                      id="issuer"
                      name="issuer"
                      value={metadata.issuer}
                      onChange={handleInputChange}
                      placeholder="Issuer name or address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      name="issueDate"
                      type="date"
                      value={metadata.issueDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {renderAssetSpecificFields()}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Documentation</CardTitle>
            <CardDescription>
              Upload supporting documents for your asset (PDFs, images, contracts, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors ${
                isDragActive ? 'border-primary bg-muted/50' : 'border-border'
              }`}
            >
              <input {...getInputProps()} disabled={isUploading} />
              <div className="flex flex-col items-center justify-center space-y-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive
                    ? 'Drop the files here'
                    : 'Drag & drop files, or click to select'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PDFs, images, and documents (max 10MB each)
                </p>
              </div>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Uploaded Documents</h4>
                <div className="grid gap-2">
                  {uploadedFiles.map((file, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-md bg-primary/10">
                          {file.type === 'pdf' ? (
                            <FileText className="h-5 w-5 text-red-500" />
                          ) : file.type === 'image' ? (
                            <FileImage className="h-5 w-5 text-blue-500" />
                          ) : (
                            <FileTextIcon className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.size} • {file.type.charAt(0).toUpperCase() + file.type.slice(1)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.status === 'uploading' && (
                          <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                        )}
                        {file.status === 'uploaded' && file.ipfsHash && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove file</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              <p>Upload documents that verify the ownership and details of your asset. These will be stored securely on IPFS.</p>
              <p className="mt-1">Examples: Property deeds, invoices, certificates, contracts, etc.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mint Token</CardTitle>
            <CardDescription>
              Review and mint your tokenized asset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Asset Type</span>
                <span className="text-sm font-medium">
                  {assetType ? assetType.replace('-', ' ') : 'Not selected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">
                  {metadata.name || '—'}
                </span>
              </div>
              {metadata.value && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Value</span>
                  <span className="text-sm font-medium">
                    {metadata.value} {metadata.currency}
                  </span>
                </div>
              )}
            </div>

            {isMinting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Minting in progress</span>
                  <span className="text-sm text-muted-foreground">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {mintSuccess && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Token minted successfully!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {mintError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {mintError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleMint}
              disabled={isMinting || !assetType || !metadata.name}
            >
              {isMinting ? 'Minting...' : 'Mint Token'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proof of Reserve</CardTitle>
            <CardDescription>
              Verify the reserve status of your asset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
              </div>
              <div>
                <p className="text-sm font-medium">Verification Pending</p>
                <p className="text-xs text-muted-foreground">
                  This asset will be verified after minting
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                Tokenized assets are verified using Chainlink's Proof of Reserve
                to ensure 1:1 backing.
              </p>
              <p>
                Verification typically completes within 10 minutes after minting.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
