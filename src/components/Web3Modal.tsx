'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useState, useEffect, Fragment } from 'react'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from './theme-toggle'
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { Menu, Transition } from '@headlessui/react'
import { cn } from '@/lib/utils'
import { ConnectButton } from '@rainbow-me/rainbowkit'

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface CustomConnectButtonProps {
  className?: string;
  showFullAddress?: boolean;
}

export function CustomConnectButton({ 
  className = '',
  showFullAddress = false 
}: CustomConnectButtonProps) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (!isConnected) {
    return <ConnectButton />;
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button className={cn(
        "flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
        className
      )}>
        {showFullAddress ? address : `${address?.slice(0, 6)}...${address?.slice(-4)}`}
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
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-card shadow-lg ring-1 ring-border focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => disconnect()}
                  className={cn(
                    'flex w-full items-center px-4 py-2 text-sm',
                    active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                  )}
                >
                  Disconnect
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

// This component is no longer needed as we're using the Web3ModalProvider from @web3modal/ethers
// The Web3ModalProvider is already set up in the ClientProviders component
export function Web3Modal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export { ConnectButton };
