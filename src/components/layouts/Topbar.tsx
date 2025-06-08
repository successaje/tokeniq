"use client";

import { Fragment, useState, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  Bars3Icon, 
  MagnifyingGlassIcon, 
  BellIcon, 
  QuestionMarkCircleIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { ConnectButton } from '../Web3Modal';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TopbarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export function Topbar({ onMenuClick, sidebarCollapsed }: TopbarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Only run on client side
  useEffect(() => {
    setMounted(true);
    
    return () => {
      setMounted(false);
    };
  }, []);

  // Don't render anything during SSR or before mount
  if (typeof window === 'undefined' || !mounted) {
    return (
      <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/95 backdrop-blur h-16" />
    );
  }
  
  return (
    <header className={cn(
      'sticky top-0 z-30 w-full border-b border-border/40',
      'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      'transition-all duration-300 ease-in-out',
      'h-16 flex items-center'
    )}>
      {/* Mobile search bar - only shows on small screens */}
      <div className="md:hidden px-4 py-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
            placeholder="Search vaults, tokens..."
          />
        </div>
      </div>
      
      {/* Top bar */}
      <div className="flex w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left section */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground lg:hidden"
            onClick={onMenuClick}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Logo */}
          <div className="ml-4 flex items-center">
            <Link href="/" className="text-xl font-bold flex items-center">
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                TokenIQ X
              </span>
            </Link>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Desktop search */}
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-64 pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              placeholder="Search vaults, tokens..."
            />
          </div>

          {/* Notification button */}
          <button
            type="button"
            className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Help button */}
          <button
            type="button"
            className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <span className="sr-only">Help</span>
            <QuestionMarkCircleIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Network selector */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-x-1.5 rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary/50">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span>Ethereum</span>
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
                        className={cn(
                          'block w-full px-4 py-2 text-left text-sm',
                          active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        Ethereum Mainnet
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={cn(
                          'block w-full px-4 py-2 text-left text-sm',
                          active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        Arbitrum One
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={cn(
                          'block w-full px-4 py-2 text-left text-sm',
                          active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        Polygon
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Wallet connection */}
          <div className="ml-2">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
