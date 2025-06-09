'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  ChartBarIcon,
  ArrowPathIcon,
  PauseCircleIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { useAccount, useBalance, useWriteContract } from 'wagmi';

// Mock data for demonstration
const MOCK_PERFORMANCE = {
  currentApy: 12.5,
  dailyChange: 0.8,
  weeklyChange: 2.3,
  monthlyChange: 5.7,
  totalValue: 15000,
  allocation: {
    'Aave': 35,
    'Compound': 25,
    'Yearn': 40
  },
  riskFactors: [
    { level: 'low', message: 'Protocol health stable' },
    { level: 'medium', message: 'Market volatility increasing' }
  ]
};

const COOLDOWN_PERIOD = 24; // hours

export function StrategyMonitorModal({ 
  isOpen, 
  onClose,
  strategy,
  onPause,
  onWithdraw,
  onSwitch
}: { 
  isOpen: boolean;
  onClose: () => void;
  strategy: any;
  onPause: () => void;
  onWithdraw: () => void;
  onSwitch: () => void;
}) {
  const { theme } = useTheme();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleWithdraw = () => {
    setIsWithdrawing(true);
    // Implement withdrawal logic
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
                    Strategy Monitor
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

                {/* Performance Overview */}
                <div className="mb-8">
                  <h3 className={`text-lg font-medium mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Performance Overview
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>Current APY</p>
                      <p className={`text-xl font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{MOCK_PERFORMANCE.currentApy}%</p>
                    </div>
                    <div className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>24h Change</p>
                      <p className={`text-xl font-semibold ${
                        MOCK_PERFORMANCE.dailyChange >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>{MOCK_PERFORMANCE.dailyChange}%</p>
                    </div>
                    <div className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>7d Change</p>
                      <p className={`text-xl font-semibold ${
                        MOCK_PERFORMANCE.weeklyChange >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>{MOCK_PERFORMANCE.weeklyChange}%</p>
                    </div>
                    <div className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>Total Value</p>
                      <p className={`text-xl font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>${MOCK_PERFORMANCE.totalValue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Portfolio Allocation */}
                <div className="mb-8">
                  <h3 className={`text-lg font-medium mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Portfolio Allocation
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(MOCK_PERFORMANCE.allocation).map(([protocol, percentage]) => (
                      <div key={protocol} className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className={`ml-4 min-w-[100px] ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {protocol}: {percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Factors */}
                <div className="mb-8">
                  <h3 className={`text-lg font-medium mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Risk Factors
                  </h3>
                  <div className="space-y-3">
                    {MOCK_PERFORMANCE.riskFactors.map((factor, index) => (
                      <div
                        key={index}
                        className={`flex items-center p-3 rounded-lg ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                        }`}
                      >
                        <ExclamationTriangleIcon className={`h-5 w-5 mr-3 ${
                          factor.level === 'high' ? 'text-red-500' :
                          factor.level === 'medium' ? 'text-yellow-500' :
                          'text-green-500'
                        }`} />
                        <span className={`${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {factor.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="outline"
                    onClick={onPause}
                    className="flex items-center"
                  >
                    <PauseCircleIcon className="h-5 w-5 mr-2" />
                    Pause Strategy
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirm(true)}
                    className="flex items-center"
                  >
                    <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                    Withdraw
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onSwitch}
                    className="flex items-center"
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Switch Strategy
                  </Button>
                </div>

                {/* Withdrawal Confirmation Modal */}
                {showConfirm && (
                  <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50`}>
                    <div className={`p-6 rounded-lg max-w-md w-full ${
                      theme === 'dark' ? 'bg-gray-900' : 'bg-white'
                    }`}>
                      <h3 className={`text-lg font-medium mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Confirm Withdrawal
                      </h3>
                      <p className={`mb-4 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Please note that withdrawals are subject to a {COOLDOWN_PERIOD}-hour cooldown period
                        and require Chainlink Proof of Reserve verification.
                      </p>
                      <div className="flex justify-end gap-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowConfirm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleWithdraw}
                          disabled={isWithdrawing}
                        >
                          {isWithdrawing ? 'Processing...' : 'Confirm Withdrawal'}
                        </Button>
                      </div>
                    </div>
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