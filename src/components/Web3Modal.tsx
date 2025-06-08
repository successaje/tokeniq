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

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface ConnectButtonProps {
  className?: string;
  showFullAddress?: boolean;
}

export function ConnectButton({ 
  className = '',
  showFullAddress = false 
}: ConnectButtonProps) {
  const [mounted, setMounted] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const { open } = useWeb3Modal()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      await open()
    } catch (error) {
      console.error('Failed to open wallet modal:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  if (!mounted) {
    return null
  }

  if (isConnected && address) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          type="button"
          className="relative rounded-full p-2 text-foreground/70 hover:text-foreground focus:outline-none"
        >
          <span className="sr-only">View notifications</span>
          <BellIcon className="h-5 w-5" aria-hidden="true" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>
        
        <ThemeToggle />
        
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center space-x-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent/50">
            <UserCircleIcon className="h-5 w-5" />
            <span className="hidden sm:inline">
              {showFullAddress 
                ? address 
                : `${address.slice(0, 6)}...${address.slice(-4)}`
              }
            </span>
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
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-background border border-border shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => router.push('/settings')}
                      className={cn(
                        active ? 'bg-accent text-accent-foreground' : 'text-foreground',
                        'block w-full px-4 py-2 text-left text-sm'
                      )}
                    >
                      Settings
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => disconnect()}
                      className={cn(
                        active ? 'bg-accent text-accent-foreground' : 'text-foreground',
                        'block w-full px-4 py-2 text-left text-sm'
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
      </div>
    )
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className={cn(
        'h-9 px-4 py-2',
        'bg-primary hover:bg-primary/90',
        'text-primary-foreground',
        'rounded-md',
        'transition-colors duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  )
}

// This component is no longer needed as we're using the Web3ModalProvider from @web3modal/ethers
// The Web3ModalProvider is already set up in the ClientProviders component
export function Web3Modal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
