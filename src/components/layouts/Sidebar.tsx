"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  ChartPieIcon, 
  CubeIcon, 
  CogIcon, 
  QuestionMarkCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onCollapse: () => void;
  onClose?: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Vaults', href: '/vaults', icon: BanknotesIcon },
  { name: 'Deposit', href: '/deposit', icon: ArrowDownTrayIcon },
  { name: 'Withdraw', href: '/withdraw', icon: ArrowUpTrayIcon },
  { name: 'Swap', href: '/swap', icon: ArrowsRightLeftIcon },
  { name: 'Stake', href: '/stake', icon: ChartBarIcon },
  { name: 'Governance', href: '/governance', icon: UserGroupIcon },
  { name: 'Docs', href: '/docs', icon: DocumentTextIcon },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: CogIcon },
  { name: 'Help', href: '/help', icon: QuestionMarkCircleIcon },
];

export function Sidebar({ collapsed, onCollapse, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleItemClick = () => {
    if (onClose) {
      onClose();
    }
  };

  // Check if any parent route is active
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <aside
        className={cn(
          'flex flex-col h-full',
          'transition-all duration-300 ease-in-out',
          'bg-card text-card-foreground',
          'border-r border-border',
          collapsed ? 'lg:w-20' : 'lg:w-56',
          onClose ? 'w-72' : 'w-full'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Navigation */}
        <nav className="flex-1 flex flex-col overflow-y-auto py-4">
          <div className="space-y-1 px-2">
            {navigation.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleItemClick}
                  className={cn(
                    'group flex items-center px-4 py-3 rounded-lg transition-colors',
                    'text-sm font-medium',
                    active
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    (collapsed && !isHovered) ? 'justify-center' : ''
                  )}
                >
                  <Icon 
                    className={cn('w-5 h-5 flex-shrink-0', {
                      'mx-auto': collapsed && !isHovered,
                      'mr-3': !collapsed || isHovered
                    })} 
                  />
                  {(!collapsed || isHovered) && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 px-4 mb-4">
            {(!collapsed || isHovered) ? (
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Resources
              </div>
            ) : (
              <div className="h-px bg-border my-2" />
            )}
            <div className="space-y-1">
              {secondaryNavigation.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleItemClick}
                    className={cn(
                      'group flex items-center px-4 py-2.5 rounded-lg transition-colors',
                      'text-sm font-medium',
                      active
                        ? 'text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                      (collapsed && !isHovered) ? 'justify-center' : ''
                    )}
                  >
                    <Icon 
                      className={cn('w-5 h-5 flex-shrink-0', {
                        'mx-auto': collapsed && !isHovered,
                        'mr-3': !collapsed || isHovered
                      })} 
                    />
                    {(!collapsed || isHovered) && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Collapse button */}
        <div className="p-2 border-t border-border">
          <button
            onClick={onCollapse}
            className={cn(
              'w-full flex items-center justify-center p-2 rounded-lg',
              'text-muted-foreground hover:bg-muted hover:text-foreground',
              'transition-colors duration-200',
              (collapsed && !isHovered) ? 'justify-center' : 'px-3'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRightIcon className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
