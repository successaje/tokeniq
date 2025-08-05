'use client';

import { useState, useCallback, useEffect } from 'react';
import { uploadFiles, uploadMetadata } from '@/utils/ipfs';
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
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  File, 
  X, 
  Image as FileImage, 
  FileText as FileTextIcon,
  UserCheck,
  ShieldCheck,
  BrainCircuit,
  Info
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

// Custom Radio Group Component
const RadioGroup = ({ 
  value, 
  onChange, 
  children 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  children: React.ReactNode 
}) => {
  return (
    <div className="space-y-2">
      {children}
    </div>
  );
};

const RadioGroupItem = ({ 
  value, 
  checked, 
  onChange, 
  children 
}: { 
  value: string; 
  checked: boolean; 
  onChange: (value: string) => void; 
  children: React.ReactNode 
}) => {
  return (
    <div 
      className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${
        checked ? 'bg-primary/10' : 'hover:bg-muted/50'
      }`}
      onClick={() => onChange(value)}
    >
      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
        checked ? 'border-primary' : 'border-muted-foreground'
      }`}>
        {checked && <div className="h-2 w-2 rounded-full bg-primary" />}
      </div>
      <label className="cursor-pointer">{children}</label>
    </div>
  );
};

type AssetType = 'invoice' | 'real-estate' | 'carbon-credit' | 'other' | '';
type TokenStandard = 'ERC-721' | 'ERC-1155' | 'ERC-20';
type VerificationMethod = 'self-attestation' | 'oracle' | 'verified-kyc' | 'ai-verification';
type UploadedFile = {
  file: File;
  preview: string;
  type: 'image' | 'pdf' | 'document' | 'other';
  size: string;
  ipfsHash?: string;
  status: 'uploading' | 'uploaded' | 'failed';
};

interface AssetMetadata {
  // Basic Information
  name: string;
  description: string;
  value: string;
  currency: string;
  tokenStandard: TokenStandard;
  
  // Asset Details
  issuer: string;
  issueDate: string;
  maturityDate?: string;
  
  // BTC Collateral
  useBTCCollateral: boolean;
  collateralAmount: string;
  collateralRatio: number;
  
  // Verification
  verificationMethod: VerificationMethod;
  isVerified: boolean;
  verificationTimestamp?: string;
  
  // Asset Type Specific Fields
  invoiceNumber?: string;
  dueDate?: string;
  propertyType?: string;
  address?: string;
  vintageYear?: string;
  certification?: string;
  
  // Token Metadata
  tokenSymbol?: string;
  tokenDecimals?: number;
  
  // IPFS References
  documentHashes: string[];
  verificationData?: string; // IPFS hash of verification data
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
    tokenStandard: 'ERC-721',
    issuer: '',
    issueDate: new Date().toISOString().split('T')[0],
    useBTCCollateral: true,
    collateralAmount: '',
    collateralRatio: 1.5, // Default 150% collateralization
    verificationMethod: 'self-attestation',
    isVerified: false,
    documentHashes: [],
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
    setUploadedFiles(prev => 
      prev.map(file => ({
        ...file,
        status: 'uploading' as const
      }))
    );

    try {
      // Upload files to IPFS
      const fileObjects = files.map(file => file.file);
      const ipfsUris = await uploadFiles(fileObjects);
      
      // Update state with IPFS hashes
      setUploadedFiles(prev => 
        prev.map((file, index) => ({
          ...file,
          status: 'uploaded' as const,
          ipfsHash: ipfsUris[index]
        }))
      );
    } catch (error) {
      console.error('Error uploading files to IPFS:', error);
      setUploadedFiles(prev => 
        prev.map(file => ({
          ...file,
          status: 'failed' as const
        }))
      );
    }
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
    
    // Validate BTC collateral if required
    if (metadata.useBTCCollateral && (!metadata.collateralAmount || parseFloat(metadata.collateralAmount) <= 0)) {
      setMintError('Please enter a valid BTC collateral amount');
      return;
    }
    
    // Validate token standard specific fields
    if (metadata.tokenStandard === 'ERC-20' && (!metadata.tokenSymbol || !metadata.tokenDecimals)) {
      setMintError('Please provide token symbol and decimals for ERC-20 tokens');
      return;
    }

    setIsMinting(true);
    setMintError('');
    setProgress(0);

    try {
      // Prepare final metadata with IPFS hashes and verification data
      const documentHashes = uploadedFiles.map(file => file.ipfsHash || '');
      
      const assetMetadata = {
        ...metadata,
        documentHashes,
        // Add current timestamp for verification
        verificationTimestamp: new Date().toISOString(),
        // In a real implementation, this would be set by the verification service
        isVerified: metadata.verificationMethod !== 'self-attestation' ? false : true,
        // Add token metadata if ERC-20
        ...(metadata.tokenStandard === 'ERC-20' && {
          tokenSymbol: metadata.tokenSymbol || '',
          tokenDecimals: metadata.tokenDecimals || 18
        })
      };
      
      // Upload metadata to IPFS
      const metadataUri = await uploadMetadata(assetMetadata);
      console.log('Metadata uploaded to IPFS:', metadataUri);
      
      // Call smart contract to mint tokens with the metadata URI
      // TODO: Implement contract interaction
      console.log('Minting token with metadata URI:', metadataUri);
      
      // Simulate verification process if not self-attestation
      if (metadata.verificationMethod !== 'self-attestation') {
        setMintStatus('verifying');
        // In a real implementation, this would call a verification service
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
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
                <p className="text-xs text-muted-foreground">
                  {metadata.tokenStandard === 'ERC-721' ? 'Best for unique assets like real estate or invoices' : 
                   metadata.tokenStandard === 'ERC-1155' ? 'Ideal for batches of similar items like carbon credits' :
                   'For fungible tokens representing divisible assets'}
                </p>
              </div>
              
              {metadata.tokenStandard === 'ERC-20' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tokenSymbol">Token Symbol</Label>
                    <Input
                      id="tokenSymbol"
                      value={metadata.tokenSymbol || ''}
                      onChange={(e) => setMetadata({...metadata, tokenSymbol: e.target.value})}
                      placeholder="e.g., SOLAR"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenDecimals">Decimals</Label>
                    <Input
                      id="tokenDecimals"
                      type="number"
                      value={metadata.tokenDecimals || ''}
                      onChange={(e) => setMetadata({...metadata, tokenDecimals: parseInt(e.target.value)})}
                      placeholder="e.g., 18"
                    />
                  </div>
                </div>
              )}
            </div>

            {assetType && (
              <div className="space-y-6">
                <div className="space-y-4">
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
                      <Label htmlFor="value">Asset Value</Label>
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="issuer">Issuer</Label>
                    <Input
                      id="issuer"
                      name="issuer"
                      value={metadata.issuer}
                      onChange={handleInputChange}
                      placeholder="Issuer name or wallet address"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="maturityDate">Maturity Date (Optional)</Label>
                      <Input
                        id="maturityDate"
                        name="maturityDate"
                        type="date"
                        value={metadata.maturityDate || ''}
                        onChange={(e) => setMetadata({...metadata, maturityDate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                {/* BTC Collateral Section */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">BTC Collateral</h3>
                      <p className="text-sm text-muted-foreground">
                        Secure your tokenized asset with BTC collateral for better liquidity and trust
                      </p>
                    </div>
                    <Switch
                      checked={metadata.useBTCCollateral}
                      onCheckedChange={(checked) => 
                        setMetadata({...metadata, useBTCCollateral: checked})
                      }
                    />
                  </div>
                  
                  {metadata.useBTCCollateral && (
                    <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="collateralAmount">BTC Amount</Label>
                          <div className="relative">
                            <Input
                              id="collateralAmount"
                              type="number"
                              value={metadata.collateralAmount}
                              onChange={(e) => 
                                setMetadata({...metadata, collateralAmount: e.target.value})
                              }
                              placeholder="0.00"
                              className="pl-8"
                            />
                            <span className="absolute left-3 top-2.5 text-muted-foreground">₿</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Minimum: {metadata.value ? (parseFloat(metadata.value) * 1.5).toFixed(8) : '0.00'} BTC
                            (150% of asset value)
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Collateral Ratio</Label>
                          <Select
                            value={metadata.collateralRatio.toString()}
                            onValueChange={(value) => 
                              setMetadata({...metadata, collateralRatio: parseFloat(value)})
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1.25">125% (Low Risk)</SelectItem>
                              <SelectItem value="1.5">150% (Standard)</SelectItem>
                              <SelectItem value="2">200% (High Security)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Higher ratio = Lower liquidation risk
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-muted/20 rounded-md text-sm">
                        <div className="flex items-start space-x-2">
                          <Info className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                          <div>
                            <p className="font-medium">How BTC Collateral Works</p>
                            <p className="text-muted-foreground text-xs mt-1">
                              Your BTC is locked in a non-custodial smart contract. 
                              It will be returned when the asset matures or you repay any loans. 
                              If the asset value drops significantly, you may need to add more collateral 
                              or risk liquidation.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Verification Method Section */}
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <h3 className="font-medium">Verification Method</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose how this asset should be verified on-chain
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Self-Attestation (clickable) */}
                    <div className={`rounded-lg border p-4 ${metadata.verificationMethod === 'self-attestation' ? 'border-primary/50 ring-1 ring-primary/30' : ''}`}>
                      <RadioGroupItem 
                        value="self-attestation"
                        checked={metadata.verificationMethod === 'self-attestation'}
                        onChange={() => setMetadata(prev => ({...prev, verificationMethod: 'self-attestation'}))}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`relative p-1.5 rounded-full ${metadata.verificationMethod === 'self-attestation' ? 'bg-primary/10' : 'bg-muted'}`}>
                            <UserCheck className="h-4 w-4" />
                            {metadata.verificationMethod === 'self-attestation' && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium flex items-center justify-between">
                              <span>Self-Attestation</span>
                              {metadata.verificationMethod === 'self-attestation' && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Selected</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              You verify the authenticity of this asset. Lower trust, no additional fees.
                            </p>
                          </div>
                        </div>
                      </RadioGroupItem>
                    </div>
                    
                    {/* KYC Verification (disabled) */}
                    <div className="rounded-lg border p-4 opacity-50 cursor-not-allowed">
                      <div className="flex items-start space-x-3">
                        <div className="p-1.5 rounded-full bg-muted">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">KYC Verification</div>
                          <p className="text-sm text-muted-foreground">
                            Coming soon. Verified by KYC provider. Higher trust, small verification fee applies.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* AI + Oracle Verification (disabled) */}
                    <div className="rounded-lg border p-4 opacity-50 cursor-not-allowed">
                      <div className="flex items-start space-x-3">
                        <div className="p-1.5 rounded-full bg-muted">
                          <BrainCircuit className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">AI + Oracle Verification</div>
                          <p className="text-sm text-muted-foreground">
                            Coming soon. AI analyzes documents + Chainlink Oracle verification. Highest trust, moderate fee.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {renderAssetSpecificFields()}
              </div>
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
