'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon, 
  ShieldCheckIcon, 
  ChartBarIcon, 
  BoltIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { useAccount, useBalance, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';

// Mock token list - in production, this would come from your token list or API
const SUPPORTED_TOKENS = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    logo: 'Ξ',
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    logo: '$',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    logo: '$',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
];

// Mock vault contract address - replace with your actual vault contract
const VAULT_CONTRACT = '0x...';

// ERC20 ABI for approve function
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

// Vault ABI for deposit function
const VAULT_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'strategy', type: 'bytes32' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

const STRATEGIES = [
  {
    id: 'conservative',
    name: 'Conservative Yield',
    description: 'Low risk, stable protocols',
    icon: ShieldCheckIcon,
    apy: '4-6%',
    protocols: ['Aave', 'Compound', 'Lido'],
    riskScore: 1,
    color: 'text-green-500',
  },
  {
    id: 'balanced',
    name: 'Balanced Growth',
    description: 'Moderate risk, dynamic yield rotation',
    icon: ChartBarIcon,
    apy: '8-12%',
    protocols: ['Yearn', 'Curve', 'Convex'],
    riskScore: 2,
    color: 'text-yellow-500',
  },
  {
    id: 'aggressive',
    name: 'Aggressive Alpha',
    description: 'High volatility with reward potential',
    icon: BoltIcon,
    apy: '15-25%',
    protocols: ['GMX', 'dYdX', 'Ribbon'],
    riskScore: 3,
    color: 'text-red-500',
  },
];

export function DepositModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { resolvedTheme } = useTheme();
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]);
  const [amount, setAmount] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState(STRATEGIES[0]);
  const [step, setStep] = useState<'token' | 'strategy'>('token');
  const { address } = useAccount();
  
  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
    watch: true,
  });

  // Get token balance for ERC20 tokens
  const { data: tokenBalance } = useBalance({
    address,
    token: selectedToken.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' 
      ? undefined 
      : selectedToken.address as `0x${string}`,
    watch: true,
  });

  const { writeContract } = useWriteContract();

  const handleDeposit = async () => {
    if (!amount || !address) return;

    try {
      if (selectedToken.address !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        // For ERC20 tokens, approve first
        await writeContract({
          address: selectedToken.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [VAULT_CONTRACT, BigInt(amount) * BigInt(1e18)],
        });
      }

      // Then deposit with strategy
      await writeContract({
        address: VAULT_CONTRACT,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [
          selectedToken.address, 
          BigInt(amount) * BigInt(1e18),
          selectedStrategy.id
        ],
        value: selectedToken.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' 
          ? BigInt(amount) * BigInt(1e18) 
          : undefined,
      });

      onClose();
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  // Get the appropriate balance based on selected token
  const displayBalance = selectedToken.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    ? ethBalance?.formatted
    : tokenBalance?.formatted;

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
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />
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
              <Dialog.Panel className={`w-full max-w-md transform overflow-hidden rounded-2xl p-6 shadow-2xl transition-all ${
                resolvedTheme === 'dark' 
                  ? 'bg-gray-900 border border-gray-800' 
                  : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className={`text-lg font-semibold ${
                    resolvedTheme === 'dark' ? 'text-gray-50' : 'text-gray-900'
                  }`}>
                    {step === 'token' ? 'Select Token' : 'Select Strategy'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className={`rounded-full p-1 ${
                      resolvedTheme === 'dark'
                        ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {step === 'token' ? (
                  <>
                    {/* Token Selection */}
                    <div className="mb-6">
                      <label className={`block text-sm font-medium mb-2 ${
                        resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        Select Token
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {SUPPORTED_TOKENS.map((token) => (
                          <button
                            key={token.address}
                            onClick={() => setSelectedToken(token)}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                              selectedToken.address === token.address
                                ? 'border-primary bg-primary/10 text-primary'
                                : resolvedTheme === 'dark'
                                  ? 'border-gray-800 hover:border-primary/50 text-gray-200 bg-gray-900'
                                  : 'border-gray-200 hover:border-primary/50 text-gray-700 bg-white'
                            }`}
                          >
                            <span className="text-xl">{token.logo}</span>
                            <span>{token.symbol}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="mb-6">
                      <label className={`block text-sm font-medium mb-2 ${
                        resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        Amount
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className={`w-full p-3 rounded-lg border ${
                            resolvedTheme === 'dark'
                              ? 'border-gray-800 bg-gray-900 text-gray-50 placeholder-gray-400'
                              : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
                          } focus:outline-none focus:ring-2 focus:ring-primary/50`}
                        />
                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
                          resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Balance: {displayBalance || '0'} {selectedToken.symbol}
                        </div>
                      </div>
                    </div>

                    {/* Next Button */}
                    <Button
                      onClick={() => setStep('strategy')}
                      disabled={!amount}
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                    >
                      Next: Select Strategy
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Strategy Selection */}
                    <div className="space-y-4">
                      {STRATEGIES.map((strategy) => (
                        <button
                          key={strategy.id}
                          onClick={() => setSelectedStrategy(strategy)}
                          className={`w-full p-4 rounded-lg border transition-colors ${
                            selectedStrategy.id === strategy.id
                              ? 'border-primary bg-primary/10'
                              : resolvedTheme === 'dark'
                                ? 'border-gray-800 hover:border-primary/50 bg-gray-900'
                                : 'border-gray-200 hover:border-primary/50 bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${
                              resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                            }`}>
                              <strategy.icon className={`h-6 w-6 ${strategy.color}`} />
                            </div>
                            <div className="flex-1 text-left">
                              <h4 className={`font-semibold ${
                                resolvedTheme === 'dark' ? 'text-gray-50' : 'text-gray-900'
                              }`}>
                                {strategy.name}
                              </h4>
                              <p className={`text-sm ${
                                resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {strategy.description}
                              </p>
                              <div className="mt-2 flex items-center gap-4 text-sm">
                                <span className={`font-medium ${strategy.color}`}>
                                  APY: {strategy.apy}
                                </span>
                                <span className={`${
                                  resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  Risk: {'⭐'.repeat(strategy.riskScore)}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {strategy.protocols.map((protocol) => (
                                  <span
                                    key={protocol}
                                    className={`px-2 py-1 rounded-full text-xs ${
                                      resolvedTheme === 'dark'
                                        ? 'bg-gray-800 text-gray-300'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {protocol}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                      <Button
                        onClick={() => setStep('token')}
                        variant="outline"
                        className={`flex-1 ${
                          resolvedTheme === 'dark'
                            ? 'border-gray-800 text-gray-200 hover:bg-gray-800'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleDeposit}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                        Deposit
                      </Button>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 