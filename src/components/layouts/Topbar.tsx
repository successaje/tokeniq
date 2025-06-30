"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Menu } from '@headlessui/react';
import { CustomConnectButton } from '@/components/Web3Modal';
import { cn } from '@/lib/utils';
import { Menu as MenuIcon, Sun, Moon, ChevronDownIcon } from 'lucide-react';
import { useAccount, useChainId, useConfig } from 'wagmi';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Liquidity', href: '/liquidity' },
];

export function Topbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const chainId = useChainId();
  const config = useConfig();
  const { isConnected } = useAccount();

  const currentChain = config.chains.find(chain => chain.id === chainId);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full bg-background/40 backdrop-blur-lg border-b border-border/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative h-10 w-10">
                <Image
                  src="/tokeniq-darkmode-logo.png"
                  alt="TokenIQ Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                TokenIQ
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex md:gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === item.href 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Network Selector */}
            {isConnected && (
              <Menu as="div" className="relative">
                <Menu.Button className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent/50">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="hidden sm:inline-block">
                      {currentChain?.name || 'Select Network'}
                    </span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </div>
                </Menu.Button>
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-background/95 backdrop-blur shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    {config.chains.map((chain) => (
                      <Menu.Item key={chain.id}>
                        {({ active }) => (
                          <button
                            onClick={() => config.switchChain?.({ chainId: chain.id })}
                            className={cn(
                              active ? 'bg-accent text-accent-foreground' : 'text-foreground',
                              'flex w-full items-center px-4 py-2 text-sm'
                            )}
                          >
                            {chain.name}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Menu>
            )}

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent/50"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </button>
            )}

            {/* Connect Button */}
            <div className="hidden sm:block">
              <CustomConnectButton />
            </div>

            {/* Mobile Menu */}
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent/50 md:hidden">
              <MenuIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
