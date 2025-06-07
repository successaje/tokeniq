"use client";
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, WalletIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { ConnectButton } from '../Web3Modal';

const networks = [
  { id: 'ethereum', name: 'Ethereum', icon: '🔷' },
  { id: 'polygon', name: 'Polygon', icon: '💜' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔵' },
];

export function Topbar() {
  return (
    <div className="h-16 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-4">
          <ConnectButton />

          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center px-3 py-2 space-x-2 text-gray-300 rounded-lg hover:bg-gray-800">
              <span>🔷</span>
              <span>Ethereum</span>
              <ChevronDownIcon className="w-4 h-4" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 w-48 mt-2 origin-top-left bg-gray-900 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  {networks.map((network) => (
                    <Menu.Item key={network.id}>
                      {({ active }) => (
                        <button
                          className={clsx(
                            'flex items-center w-full px-4 py-2 text-sm space-x-2',
                            active ? 'bg-gray-800 text-white' : 'text-gray-300'
                          )}
                        >
                          <span>{network.icon}</span>
                          <span>{network.name}</span>
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-300 rounded-lg hover:bg-gray-800">
            <BellIcon className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary-500 rounded-full" />
          </button>

          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-3 text-gray-300 rounded-lg hover:bg-gray-800">
              <div className="w-8 h-8 rounded-full bg-primary-600" />
              <ChevronDownIcon className="w-4 h-4" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 w-48 mt-2 origin-top-right bg-gray-900 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={clsx(
                          'block px-4 py-2 text-sm',
                          active ? 'bg-gray-800 text-white' : 'text-gray-300'
                        )}
                      >
                        Your Profile
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={clsx(
                          'block px-4 py-2 text-sm',
                          active ? 'bg-gray-800 text-white' : 'text-gray-300'
                        )}
                      >
                        Settings
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={clsx(
                          'block px-4 py-2 text-sm',
                          active ? 'bg-gray-800 text-white' : 'text-gray-300'
                        )}
                      >
                        Sign out
                      </a>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
} 