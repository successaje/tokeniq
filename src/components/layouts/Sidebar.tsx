"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Wallet,
  BrainCircuit,
  LineChart,
  Network,
  Activity,
  Settings,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useDisconnect } from 'wagmi';
import { Logo } from '@/components/Logo';

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Portfolio', href: '/portfolio', icon: Wallet },
  { name: 'Treasury Copilot', href: '/copilot', icon: BrainCircuit, badge: 'AI' },
  { name: 'Strategies', href: '/strategies', icon: LineChart },
  { name: 'Cross-Chain', href: '/crosschain', icon: Network },
  { name: 'Analytics', href: '/analytics', icon: Activity },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Documentation', href: 'https://tokeniq.gitbook.io', icon: BookOpen, external: true },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: () => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function Sidebar({ 
  isOpen = true, 
  onClose, 
  collapsed = false,
  onCollapse
}: SidebarProps) {
  const pathname = usePathname();
  const { disconnect } = useDisconnect();

  const NavItem = ({ item }: { item: any }) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    
    const content = (
      <>
        <item.icon className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )} />
        {!collapsed && (
          <div className="flex flex-1 items-center justify-between ml-3">
            <span className="truncate">{item.name}</span>
            {item.badge && (
              <span className="rounded-sm bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </>
    );

    const className = cn(
      'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    );

    if (item.external) {
      return (
        <a href={item.href} target="_blank" rel="noreferrer" className={className}>
          {content}
        </a>
      );
    }

    return (
      <Link href={item.href} className={className}>
        {content}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64',
        !isOpen && '-translate-x-full lg:translate-x-0'
      )}>
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <Logo className="h-6 w-6 shrink-0 text-primary" />
            {!collapsed && <span className="text-sm font-bold tracking-tight text-foreground truncate">TokenIQ</span>}
          </Link>
        </div>

        {/* Main Nav */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-none">
          <nav className="space-y-6 px-2">
            <div className="space-y-1">
              {mainNavigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </div>

            <div className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  System
                </div>
              )}
              {secondaryNavigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </div>
          </nav>
        </div>

        {/* Footer / User Area */}
        <div className="border-t border-border p-2">
          <div className={cn(
            "flex items-center gap-2 rounded-md p-2 hover:bg-muted transition-colors cursor-pointer",
            collapsed ? "justify-center" : "justify-between"
          )}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                <span className="text-xs font-medium">TX</span>
              </div>
              {!collapsed && (
                <div className="flex flex-col truncate">
                  <span className="text-sm font-medium text-foreground">Treasury Admin</span>
                  <span className="text-xs text-muted-foreground truncate">Connected</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-2 flex items-center justify-between px-2 pb-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onCollapse}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            
            {!collapsed && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => disconnect()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
