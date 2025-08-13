'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTokenization } from '@/hooks/useTokenization';
import { 
  AlertCircle, 
  CheckCircle2, 
  Database,
  File, 
  FileCheck, 
  FileText, 
  Link2, 
  Loader2, 
  RefreshCw, 
  Shield, 
  ShieldCheck, 
  Upload, 
  X 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useIPFSUpload } from '@/hooks/useIPFSUpload';
import { UploadProgress } from '@/components/UploadProgress';

// Types
type AssetType = 'invoice' | 'real-estate' | 'carbon-credit' | 'other' | '';
type TokenStandard = 'ERC-20' | 'ERC-721' | 'ERC-1155';
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
type VerificationType = 'none' | 'kyc' | 'chainlink';

interface VerificationOption {
  id: VerificationType;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  recommended?: boolean;
}

interface AssetMetadata {
  name: string;
  description: string;
  tokenStandard: TokenStandard;
  value: string;
  symbol: string;
  supply?: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  type: string;
  size: string;
  status: UploadStatus;
  error?: string;
  ipfsHash?: string;
}

interface TokenMetadata {
  name: string;
  description: string;
  tokenStandard: TokenStandard;
  supply: string;
  value: string;
  currency: string;
  symbol: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  ipfsHash?: string;
  verificationType?: VerificationType;
}

export default function TokenizeForm() {
  const { toast } = useToast();
  // Form state
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationType, setVerificationType] = useState<VerificationType>('none');
  const [verificationStep, setVerificationStep] = useState<'idle' | 'uploading' | 'verifying' | 'verified' | 'error'>('idle');
  const [verificationEndTime, setVerificationEndTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [assetType, setAssetType] = useState<AssetType>('real-estate');
  const [metadata, setMetadata] = useState<TokenMetadata>({
    name: '',
    description: '',
    tokenStandard: 'ERC-20',
    supply: '1000',
    value: '',
    currency: 'USD',
    symbol: '', // Adding missing symbol field
    issuer: '', // Adding missing issuer field
    issueDate: '', // Adding missing issueDate field
    expiryDate: '', // Adding missing expiryDate field
  });

  // Countdown timer effect
  useEffect(() => {
    if (!verificationEndTime) return;
    
    // Initial calculation
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const difference = verificationEndTime - now;
      
      if (difference <= 0) {
        setVerificationStep('verified');
        setTimeLeft('');
        return true; // Indicates timer is done
      }
      
      const minutes = Math.floor((difference % 3600) / 60);
      const seconds = difference % 60;
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      return false;
    };
    
    // Initial update
    const isDone = updateTimer();
    if (isDone) return;
    
    // Set up interval for updates
    const timer = setInterval(() => {
      const isDone = updateTimer();
      if (isDone) clearInterval(timer);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [verificationEndTime]);

  const { uploadToIPFS, uploadJSONToIPFS, progress: ipfsProgress } = useIPFSUpload();

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'document',
      size: formatFileSize(file.size),
      status: 'idle' as UploadStatus,
    })); 
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Remove file
  const removeFile = (index: number) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      const [removed] = newFiles.splice(index, 1);
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return newFiles;
    });
  };

  // Verification options with their respective perks
  const verificationOptions: VerificationOption[] = [
    {
      id: 'none',
      name: 'No Verification',
      description: 'Basic listing with minimal verification',
      icon: <FileText className="h-5 w-5" />,
      features: [
        'Basic asset listing',
        'Standard discoverability',
        'No verification badge'
      ]
    },
    {
      id: 'kyc',
      name: 'KYC Verification',
      description: 'Identity verification for trusted listings',
      icon: <ShieldCheck className="h-5 w-5" />,
      features: [
        'KYC verification badge',
        'Higher trust score',
        'Priority in search results',
        'Basic fraud protection'
      ],
      recommended: true
    },
    {
      id: 'chainlink',
      name: 'Chainlink Proof of Reserve',
      description: 'Full asset verification with on-chain validation',
      icon: <Link2 className="h-5 w-5" />,
      features: [
        'Chainlink PoR verification',
        'Highest trust score',
        'Featured in marketplace',
        'Full fraud protection',
        'Real-time asset monitoring'
      ]
    }
  ];

  // Start verification process
  const startVerification = async () => {
    console.log('Start verification clicked');
    console.log('Environment Variables:', {
      hasApiKey: !!process.env.NEXT_PUBLIC_PINATA_API_KEY,
      hasSecretKey: !!process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY,
    });
    
    if (files.length === 0) {
      console.log('No files selected');
      toast({
        title: 'No files selected',
        description: 'Please upload at least one file for verification',
        variant: 'destructive',
      });
      return;
    }

    // Check for required fields
    const requiredFields = {
      name: 'Asset Name',
      description: 'Asset Description',
      value: 'Asset Value',
      symbol: 'Token Symbol',
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !metadata[key as keyof typeof metadata])
      .map(([_, label]) => label);
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      toast({
        title: 'Missing required fields',
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Starting verification process...');
      setVerificationStep('uploading');
      setIsUploading(true);
      
      // Prepare asset metadata
      const assetMetadata = {
        name: metadata.name,
        description: metadata.description,
        value: metadata.value,
        currency: metadata.currency,
        tokenStandard: metadata.tokenStandard,
        verificationType,
        timestamp: new Date().toISOString(),
      };
      
      console.log('Prepared metadata:', assetMetadata);
      
      // Upload metadata and files to IPFS
      console.log('Starting IPFS upload...');
      const cids: string[] = [];
      
      // 1. Upload metadata
      console.log('Uploading metadata to IPFS...');
      const metadataCid = await uploadJSONToIPFS(assetMetadata);
      if (metadataCid) {
        cids.push(metadataCid);
        console.log('Metadata uploaded. CID:', metadataCid);
      }
      
      // 2. Upload files (if any)
      if (files.length > 0) {
        console.log('Uploading files to IPFS...');
        const fileObjects = files.map(f => f.file);
        const fileCids = await uploadToIPFS(fileObjects);
        cids.push(...fileCids);
        console.log('Files uploaded. CIDs:', fileCids);
      }
      
      console.log('All uploads completed. Total CIDs:', cids);
      
      if (cids.length === 0) {
        throw new Error('No files were uploaded to IPFS');
      }
      
      // Get the metadata CID (should be the first one we uploaded)
      const uploadedMetadataCid = cids[0];
      console.log('Using metadata CID:', uploadedMetadataCid);
      
      // Update the metadata with the IPFS hash
      setMetadata(prev => ({
        ...prev,
        ipfsHash: uploadedMetadataCid,
      }));
      
      // Update verification step based on verification type
      if (verificationType === 'none') {
        console.log('No verification required, marking as verified');
        setVerificationStep('verified');
        toast({
          title: 'Upload complete',
          description: 'Your asset details and files have been uploaded to IPFS.',
        });
      } else {
        console.log('Starting verification process for type:', verificationType);
        setVerificationStep('verifying');
        setVerificationEndTime(Math.floor(Date.now() / 1000) + 300);
        toast({
          title: 'Verification in progress',
          description: verificationType === 'kyc' 
            ? 'Your KYC verification is being processed.'
            : 'Your asset is being verified with Chainlink Proof of Reserve.',
        });
      }
    } catch (error) {
      console.error('Error during verification:', error);
      setVerificationStep('error');
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Initialize tokenization hook
  const { tokenizeAsset, isLoading: isTokenizing, error: tokenizationError } = useTokenization();

  // Handle form submission (minting)
  const handleMint = async () => {
    try {
      console.log('Starting tokenization with metadata:', metadata);
      setVerificationStep('minting');
      
      // Map token standard to asset type
      const assetType = metadata.tokenStandard === 'ERC20' ? 'ERC20' : 
                       metadata.tokenStandard === 'ERC721' ? 'ERC721' : 'ERC1155';
      
      // Common tokenization params
      const tokenizationParams = {
        name: metadata.name,
        symbol: metadata.symbol,
        assetType,
        description: metadata.description,
      };
      
      // Token standard specific params
      if (assetType === 'ERC20') {
        // For ERC20 Vault Token
        Object.assign(tokenizationParams, {
          underlyingToken: '0x...', // TODO: Get actual underlying token address
          depositFeeBasisPoints: 10, // 0.1%
          withdrawalFeeBasisPoints: 5, // 0.05%
          performanceFeeBasisPoints: 200, // 2%
        });
      } else if (assetType === 'ERC721') {
        // For ERC721 NFT
        Object.assign(tokenizationParams, {
          baseURI: `ipfs://${metadata.ipfsHash}/`,
        });
      } else {
        // For ERC1155 Hybrid Asset
        Object.assign(tokenizationParams, {
          tokenURI: `ipfs://${metadata.ipfsHash}/metadata.json`,
          initialSupply: BigInt(metadata.supply || '1000000'),
        });
      }
      
      console.log('Tokenization params:', tokenizationParams);
      
      // Call the tokenization function
      const result = await tokenizeAsset(tokenizationParams);
      
      console.log('Tokenization successful!', result);
      
      toast({
        title: 'Tokenization Successful!',
        description: `Your ${assetType} token has been created at ${result.address}`,
      });
      
      // Update verification step
      setVerificationStep('completed');
      
      // Reset form after a delay
      setTimeout(() => {
        setVerificationStep('idle');
        setVerificationEndTime(null);
        // Reset other form states as needed
      }, 3000);
      
    } catch (error: any) {
      console.error('Tokenization error:', error);
      setVerificationStep('error');
      
      const errorMessage = error?.message || 'There was an error tokenizing your asset';
      toast({
        title: 'Tokenization Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <form onSubmit={(e) => { e.preventDefault(); }} className="lg:col-span-2 space-y-6">
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
                <select
                  id="assetType"
                  name="assetType"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as AssetType)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select asset type</option>
                  <option value="invoice">Invoice</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="carbon-credit">Carbon Credit</option>
                  <option value="other">Other Asset</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tokenStandard">Token Standard</Label>
                <select
                  id="tokenStandard"
                  name="tokenStandard"
                  value={metadata.tokenStandard}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="ERC-20">ERC-20 (Fungible Tokens)</option>
                  <option value="ERC-721">ERC-721 (Unique Assets)</option>
                  <option value="ERC-1155">ERC-1155 (Semi-Fungible)</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assetName">Asset Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={metadata.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Downtown Office Building"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assetSymbol">Token Symbol *</Label>
                <Input
                  id="symbol"
                  name="symbol"
                  value={metadata.symbol}
                  onChange={handleInputChange}
                  placeholder="e.g., DTO"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="assetValue">Asset Value</Label>
                  <span className="text-xs text-muted-foreground">
                    Required for verification
                  </span>
                </div>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Input
                      id="value"
                      name="value"
                      type="number"
                      value={metadata.value}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="pr-20"
                      required
                    />
                    <select
                      value={metadata.currency || 'USD'}
                      onChange={(e) => setMetadata({...metadata, currency: e.target.value})}
                      className="absolute right-2 top-0 h-full bg-transparent text-sm text-muted-foreground focus:outline-none"
                    >
                      <option value="USD">USD</option>
                      <option value="ETH">NGN</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                      <option value="ETH">ETH</option>
                      <option value="BTC">BTC</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  The current market value of your asset in the selected currency.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  name="issueDate"
                  type="date"
                  value={metadata.issueDate || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              {metadata.tokenStandard === 'ERC-20' && (
                <div className="space-y-2">
                  <Label htmlFor="assetSupply">Total Supply</Label>
                  <Input
                    id="supply"
                    name="supply"
                    type="number"
                    value={metadata.supply}
                    onChange={handleInputChange}
                    placeholder="1000"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  value={metadata.expiryDate || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Asset Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={metadata.description || ''}
                  onChange={handleInputChange}
                  placeholder="Detailed description of the asset, including key features and characteristics"
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer Name *</Label>
                <Input
                  id="issuer"
                  name="issuer"
                  value={metadata.issuer || ''}
                  onChange={handleInputChange}
                  placeholder="Name of the asset issuer or company"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Asset Documents *</Label>
                <div 
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors ${
                    isDragActive ? 'border-primary bg-accent/30' : 'border-muted-foreground/25'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isDragActive 
                        ? 'Drop the files here...' 
                        : 'Drag & drop files here, or click to select files'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPG, PNG, PDF, DOC, DOCX (max 10MB)
                    </p>
                  </div>
                </div>
                
                {files.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-sm font-medium">Selected files ({files.length})</p>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-md bg-card"
                        >
                          <div className="flex items-center space-x-3">
                            <File className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{file.file.name}</p>
                              <p className="text-xs text-muted-foreground">{file.size}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {file.status === 'uploading' && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {file.status === 'success' && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            {file.status === 'error' && (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-2">
                {verificationStep === 'verified' ? (
                  <Button 
                    type="button"
                    onClick={handleMint}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Mint Token
                  </Button>
                ) : verificationStep === 'verifying' ? (
                  <Button 
                    type="button"
                    disabled
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying... {timeLeft && `(${timeLeft})`}
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    onClick={startVerification}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : 'Start Verification'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset Verification</CardTitle>
            <CardDescription>
              Verification and Proof of Reserve status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Verification Status */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center">
                <ShieldCheck className="h-4 w-4 mr-2 text-blue-500" />
                Verification Type
              </h4>
              
              <div className="grid gap-3">
                {verificationOptions.map((option) => (
                  <div 
                    key={option.id}
                    className={`relative p-4 border rounded-lg cursor-pointer transition-colors ${
                      verificationType === option.id 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:border-blue-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setVerificationType(option.id)}
                  >
                    {option.recommended && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                        Recommended
                      </div>
                    )}
                    <div className="flex items-start space-x-3">
                      <div className={`p-1.5 rounded-full ${
                        verificationType === option.id 
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-800/50' 
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{option.name}</h5>
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            verificationType === option.id 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {verificationType === option.id && (
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {option.features.map((feature, i) => (
                            <li key={i} className="flex items-start">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Verification Status</h4>
                <div className="p-3 bg-muted/30 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-full ${
                      verificationStep === 'verifying' 
                        ? 'bg-blue-100 text-blue-600' 
                        : verificationStep === 'verified' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {verificationStep === 'verifying' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : verificationStep === 'verified' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {verificationStep === 'verifying' 
                          ? 'Verification in Progress' 
                          : verificationStep === 'verified' 
                            ? 'Verification Complete' 
                            : 'Ready for Verification'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {verificationStep === 'verifying' 
                          ? `Estimated time remaining: ${timeLeft}`
                          : verificationStep === 'verified'
                            ? 'Your asset is ready to be tokenized'
                            : `Selected: ${verificationOptions.find(o => o.id === verificationType)?.name}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chainlink Proof of Reserve Section */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center">
                <Link2 className="h-4 w-4 mr-2 text-blue-500" />
                Chainlink Proof of Reserve
              </h4>
              <div className="space-y-3">
                <div className="p-3 border rounded-md bg-muted/30">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-1">Reserve Asset</p>
                      <p className="text-sm text-muted-foreground">
                        {metadata.tokenStandard === 'ERC-20' ? 'Fiat-backed Stablecoin' : 'Real World Asset'}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                      <span className="ml-2 text-xs">Verification Pending</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Last Verified</span>
                    <span className="text-muted-foreground">—</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Next Verification</span>
                    <span className="text-muted-foreground">After submission</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Verification Interval</span>
                    <span className="text-muted-foreground">24 hours</span>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="w-full" disabled>
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Request Manual Verification
                </Button>
                
                <div className="text-xs text-muted-foreground">
                  <p>Chainlink PoR ensures the actual reserve assets back this token 1:1.</p>
                  <p>Verification happens automatically on a schedule.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Required Documents</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  {files.length > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30"></div>
                  )}
                  <span>Asset documents</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30"></div>
                  <span>Ownership proof</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30"></div>
                  <span>Valuation report</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3 pt-2">
              <h4 className="font-medium flex items-center">
                <Database className="h-4 w-4 mr-2 text-blue-500" />
                IPFS Status
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Status</div>
                  <div className="text-right font-medium">
                    {ipfsProgress.progress === 0 && !ipfsProgress.error && 'Ready'}
                    {ipfsProgress.progress > 0 && ipfsProgress.progress < 100 && 'Uploading...'}
                    {ipfsProgress.step === 'completed' && 'Upload Complete'}
                    {ipfsProgress.error && 'Error'}
                  </div>
                  
                  {ipfsProgress.progress > 0 && (
                    <>
                      <div className="text-muted-foreground">Progress</div>
                      <div className="text-right font-mono">{Math.round(ipfsProgress.progress)}%</div>
                      <div className="col-span-2">
                        <Progress 
                          value={ipfsProgress.progress} 
                          className="h-2 bg-muted"
                          indicatorClassName="bg-blue-500"
                        />
                      </div>
                    </>
                  )}
                  
                  {ipfsProgress.step === 'completed' && files[0]?.ipfsHash && (
                    <>
                      <div className="text-muted-foreground">IPFS Hash</div>
                      <div className="text-right font-mono text-xs truncate">
                        {files[0].ipfsHash}
                      </div>
                      <div className="text-muted-foreground">Files</div>
                      <div className="text-right">
                        {files.length} {files.length === 1 ? 'file' : 'files'}
                      </div>
                    </>
                  )}
                </div>
                
                {ipfsProgress.error && (
                  <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Upload failed</p>
                      <p className="text-xs">{ipfsProgress.error}</p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 mt-1 text-destructive"
                        onClick={() => window.location.reload()}
                      >
                        Try again
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  <p>Files are stored on IPFS for decentralized access and verification.</p>
                  {files.some(f => f.ipfsHash) && (
                    <p className="mt-1">
                      View on IPFS:{' '}
                      <a 
                        href={`https://ipfs.io/ipfs/${files[0].ipfsHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Open in IPFS Explorer
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Token Details</CardTitle>
            <CardDescription>Preview of your token</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Token Name</p>
              <p className="text-sm text-muted-foreground">{metadata.name || '—'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Token Symbol</p>
              <p className="text-sm text-muted-foreground">{metadata.symbol || '—'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Token Standard</p>
              <p className="text-sm text-muted-foreground">{metadata.tokenStandard || '—'}</p>
            </div>
            {metadata.tokenStandard === 'ERC-20' && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Total Supply</p>
                <p className="text-sm text-muted-foreground">{metadata.supply || '—'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
