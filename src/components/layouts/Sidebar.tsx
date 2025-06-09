"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  HomeIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  DocumentDuplicateIcon,
  ArrowsRightLeftIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  WalletIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useDisconnect } from 'wagmi';

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Portfolio', href: '/portfolio', icon: WalletIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Liquidity', href: '/liquidity', icon: BanknotesIcon },
];

const rwaNavigation = [
  { name: 'RWA Management', href: '/rwa', icon: DocumentTextIcon },
  { name: 'Tokenize', href: '/rwa/tokenize', icon: DocumentDuplicateIcon },
  { name: 'Bridge', href: '/rwa/bridge', icon: ArrowsRightLeftIcon },
  { name: 'Collateral', href: '/rwa/collateral', icon: CurrencyDollarIcon },
  { name: 'Fractionalize', href: '/rwa/fractionalize', icon: ShieldCheckIcon },
];

const settingsNavigation = [
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  { name: 'Team', href: '/team', icon: UserGroupIcon },
  { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: () => void;
  onClose?: () => void;
}

export function Sidebar({ collapsed = false, onCollapse, onClose }: SidebarProps) {
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
    <div className="fixed top-16 left-0 bottom-0 z-40 flex w-64 flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r border-border/40">
      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-2 py-4 space-y-6">
        {/* Main Navigation */}
        <div>
          <div className="px-3 mb-2">
            {!collapsed && (
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Main
              </h2>
            )}
          </div>
          <ul className="space-y-1">
            {mainNavigation.map((item) => (
              <li key={item.name}>
                <NavItem item={item} />
              </li>
            ))}
          </ul>
        </div>

        {/* RWA Navigation */}
        <div>
          <div className="px-3 mb-2">
            {!collapsed && (
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                RWA
              </h2>
            )}
          </div>
          <ul className="space-y-1">
            {rwaNavigation.map((item) => (
              <li key={item.name}>
                <NavItem item={item} />
              </li>
            ))}
          </ul>
        </div>

        {/* Settings Navigation */}
        <div>
          <div className="px-3 mb-2">
            {!collapsed && (
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Settings
              </h2>
            )}
          </div>
          <ul className="space-y-1">
            {settingsNavigation.map((item) => (
              <li key={item.name}>
                <NavItem item={item} />
              </li>
            ))}
          </ul>
        </div>

        {/* Disconnect Button */}
        <div className="mt-auto pt-4 border-t border-border/40">
          <Button
            variant="ghost"
            className="w-full justify-start gap-x-3 text-muted-foreground hover:text-foreground hover:bg-accent/50"
            onClick={() => disconnect()}
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
            {!collapsed && 'Disconnect'}
          </Button>
        </div>
      </nav>
    </div>
  );
}
