"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  HomeIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  DocumentDuplicateIcon,
  ArrowsRightLeftIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  BriefcaseIcon,
  WalletIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useDisconnect } from 'wagmi';
import { X } from 'lucide-react';
import { Logo } from '@/components/Logo';

const mainNavigation = [
  { name: 'Dashboard', href: '/protected/dashboard', icon: HomeIcon },
  { name: 'Portfolio', href: '/protected/portfolio', icon: WalletIcon },
  { name: 'Assets', href: '/protected/assets', icon: BriefcaseIcon },
  { name: 'Analytics', href: '/protected/analytics', icon: ChartBarIcon },
  { name: 'Strategies', href: '/protected/strategies', icon: BanknotesIcon },
  { name: 'Payments', href: '/protected/payments', icon: CurrencyDollarIcon },
];

const rwaNavigation = [
  { name: 'RWA Management', href: '/protected/rwa', icon: DocumentTextIcon },
  { name: 'Tokenize', href: '/protected/rwa/tokenize', icon: DocumentDuplicateIcon },
  { name: 'Bridge', href: '/protected/bridge', icon: ArrowsRightLeftIcon },
  { name: 'Collateral', href: '/protected/rwa/collateral', icon: CurrencyDollarIcon },
];

const settingsNavigation = [
  { name: 'Settings', href: '/protected/settings', icon: Cog6ToothIcon },
  { name: 'Team', href: '/protected/team', icon: UserGroupIcon },
  { name: 'Reports', href: '/protected/reports', icon: DocumentChartBarIcon },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: () => void;
  onClose?: () => void;
  isOpen?: boolean;
  className?: string;
}

export function Sidebar({ 
  isOpen = true, 
  onClose, 
  className = '',
  collapsed = false,
  onCollapse
}: SidebarProps) {
  const pathname = usePathname();
  const { disconnect } = useDisconnect();
  const [isRwaExpanded, setIsRwaExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const NavItem = ({ item, isSubItem = false }: { item: any; isSubItem?: boolean }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={cn(
          'group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
          isSubItem && 'ml-2'
        )}
      >
        <item.icon className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground"
        )} />
        {!collapsed && (
          <span className="flex-1">{item.name}</span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      <div className={cn(
        'fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col border-r bg-background transition-all duration-300',
        !isOpen && '-translate-x-full',
        className
      )}>
        {/* Mobile header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="h-8 w-8" />
            {!collapsed && <span className="text-xl font-bold">TokenIQ</span>}
          </Link>
          <div className="flex items-center">
            <button
              onClick={onClose}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="space-y-1 p-2">
            {!collapsed && (
              <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Main
              </h2>
            )}
            <ul className="space-y-1">
              {mainNavigation.map((item) => (
                <li key={item.name}>
                  <NavItem item={item} />
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1 p-2">
            <div className="flex items-center justify-between">
              {!collapsed && (
                <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  RWA
                </h2>
              )}
            </div>
            <button
              onClick={() => setIsRwaExpanded(!isRwaExpanded)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
            >
              <div className="flex items-center gap-x-3">
                <DocumentTextIcon className="h-5 w-5" />
                {!collapsed && <span>Real World Assets</span>}
              </div>
              {!collapsed && (
                <svg
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isRwaExpanded ? 'rotate-180' : ''
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>

            {isRwaExpanded && (
              <div className="mt-1 space-y-1 pl-4">
                {rwaNavigation.map((item) => (
                  <NavItem key={item.name} item={item} isSubItem />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border/40 p-2">
            {!collapsed && (
              <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Settings
              </h2>
            )}
            <ul className="space-y-1">
              {settingsNavigation.map((item) => (
                <li key={item.name}>
                  <NavItem item={item} />
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Bottom section */}
        <div className="mt-auto border-t border-border/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircleIcon className="h-5 w-5 text-primary" />
              </div>
              {!collapsed && (
                <div>
                  <p className="text-sm font-medium">User Name</p>
                  <p className="text-xs text-muted-foreground">user@example.com</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => disconnect()}
              className="text-muted-foreground hover:text-foreground"
              title="Sign out"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
