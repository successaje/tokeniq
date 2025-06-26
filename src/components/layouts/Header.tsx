'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Discover', href: '/discover' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Liquidity', href: '/liquidity' },
];

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || 
           (path !== '/' && pathname.startsWith(path) && 
           (pathname[path.length] === '/' || pathname.length === path.length));
  };

  return (
    <header className="fixed top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 transition-colors duration-200">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/discover" className="text-lg font-medium flex items-center">
              <span className="text-foreground">Token</span>
              <span className="text-purple-500">IQ</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex md:gap-6 ml-10">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                    isActive(item.href) 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.name}
                  {isActive(item.href) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary mx-2"></span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:block">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 