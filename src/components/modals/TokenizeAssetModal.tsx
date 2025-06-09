'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon,
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useTheme } from 'next-themes';
import { useAccount, useWriteContract } from 'wagmi';

const ASSET_TYPES = [
  {
    id: 'invoice',
    name: 'Invoice',
    description: 'Tokenize outstanding invoices for immediate liquidity',
    icon: DocumentTextIcon,
    requirements: ['Invoice PDF', 'Due date', 'Amount', 'Counterparty details'],
  },
  {
    id: 'equity',
    name: 'Equity/Share Units',
    description: 'Tokenize company shares or equity units',
    icon: ChartBarIcon,
    requirements: ['Share certificate', 'Valuation report', 'Legal documentation'],
  },
  {
    id: 'license',
    name: 'License/Carbon Credits',
    description: 'Tokenize licenses or carbon credits',
    icon: GlobeAltIcon,
    requirements: ['License documentation', 'Verification report', 'Expiry date'],
  },
];

const ERC3643_ABI = [
  {
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "amount", "type": "uint256" },
      { "name": "data", "type": "bytes" }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export function TokenizeAssetModal({ 
  isOpen, 
  onClose,
}: { 
  isOpen: boolean;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const { address } = useAccount();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'upload' | 'verify' | 'mint'>('select');
  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [verificationScore, setVerificationScore] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { writeContract } = useWriteContract();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const handleVerify = async () => {
    setIsProcessing(true);
    // Simulate AI verification
    await new Promise(resolve => setTimeout(resolve, 2000));
    setVerificationScore(85); // Mock score
    setIsProcessing(false);
    setStep('verify');
  };

  const handleMint = async () => {
    if (!address) return;
    
    try {
      // Mock minting process
      await writeContract({
        address: '0x...', // RWA Token contract address
        abi: ERC3643_ABI,
        functionName: 'mint',
        args: [address, 1000000, '0x'], // amount and data
      });
      
      setStep('mint');
    } catch (error) {
      console.error('Minting failed:', error);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full max-w-2xl transform overflow-hidden rounded-2xl p-6 shadow-xl transition-all ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className={`text-xl font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Tokenize Real-World Asset
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'
                    }`}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {step === 'select' && (
                  <div className="space-y-6">
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Select the type of asset you want to tokenize
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {ASSET_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => {
                            setSelectedType(type.id);
                            setStep('upload');
                          }}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            theme === 'dark' 
                              ? 'border-gray-700 hover:border-gray-600' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <type.icon className={`h-8 w-8 mb-2 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`} />
                          <h3 className={`font-medium mb-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {type.name}
                          </h3>
                          <p className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {type.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 'upload' && selectedType && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Upload Documentation
                      </h3>
                      <Button
                        variant="outline"
                        onClick={() => setStep('select')}
                      >
                        Back
                      </Button>
                    </div>
                    
                    <div className={`p-6 border-2 border-dashed rounded-lg ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                    }`}>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <DocumentArrowUpIcon className={`h-12 w-12 mb-2 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Click to upload or drag and drop
                        </span>
                        <span className={`text-xs mt-1 ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          PDF, DOC, or image files
                        </span>
                      </label>
                    </div>

                    {ASSET_TYPES.find(t => t.id === selectedType)?.requirements.map((req, index) => (
                      <div key={index} className="space-y-2">
                        <label className={`block text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {req}
                        </label>
                        <input
                          type="text"
                          onChange={(e) => handleMetadataChange(req, e.target.value)}
                          className={`w-full px-3 py-2 rounded-md border ${
                            theme === 'dark' 
                              ? 'bg-gray-800 border-gray-700 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                    ))}

                    <Button
                      onClick={handleVerify}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? 'Verifying...' : 'Verify & Score'}
                    </Button>
                  </div>
                )}

                {step === 'verify' && verificationScore !== null && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Verification Results
                      </h3>
                      <Button
                        variant="outline"
                        onClick={() => setStep('upload')}
                      >
                        Back
                      </Button>
                    </div>

                    <div className={`p-6 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <DocumentCheckIcon className={`h-6 w-6 mr-2 ${
                            verificationScore >= 80 ? 'text-green-500' : 'text-yellow-500'
                          }`} />
                          <span className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Verification Score
                          </span>
                        </div>
                        <span className={`text-2xl font-bold ${
                          verificationScore >= 80 ? 'text-green-500' : 'text-yellow-500'
                        }`}>
                          {verificationScore}%
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Document Authenticity
                          </span>
                          <span className="text-green-500">Verified</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Legal Compliance
                          </span>
                          <span className="text-green-500">Verified</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Value Assessment
                          </span>
                          <span className="text-yellow-500">Pending Review</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleMint}
                      className="w-full"
                    >
                      Mint RWA Token
                    </Button>
                  </div>
                )}

                {step === 'mint' && (
                  <div className="text-center py-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                      theme === 'dark' ? 'bg-green-900' : 'bg-green-100'
                    } mb-4`}>
                      <DocumentCheckIcon className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className={`text-xl font-medium mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Tokenization Complete
                    </h3>
                    <p className={`text-sm mb-6 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Your asset has been successfully tokenized and is now available in your RWA Dashboard.
                    </p>
                    <Button
                      onClick={onClose}
                      className="w-full"
                    >
                      View in Dashboard
                    </Button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 