"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Compass, 
  Wallet, 
  Layers, 
  Zap, 
  LineChart,
  Settings, 
  HelpCircle, 
  FileText, 
  Plus,
  PieChart,
  BarChart2,
  Activity,
  TrendingUp,
  Link as LinkIcon,
  Layers as LayersIcon
} from 'lucide-react';

const mainNavigation = [
  { 
    name: 'Discover', 
    href: '/discover', 
    icon: Compass,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    hoverColor: 'hover:bg-blue-500/20'
  },
  { 
    name: 'Portfolio', 
    href: '/portfolio', 
    icon: Wallet,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    hoverColor: 'hover:bg-emerald-500/20'
  },
  { 
    name: 'Strategies', 
    href: '/strategies', 
    icon: PieChart,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    hoverColor: 'hover:bg-purple-500/20',
    isNew: true
  },
  { 
    name: 'Crosschain', 
    href: '/crosschain', 
    icon: LinkIcon,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    hoverColor: 'hover:bg-indigo-500/20'
  },
  { 
    name: 'Vaults', 
    href: '/vaults', 
    icon: LayersIcon,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    hoverColor: 'hover:bg-cyan-500/20'
  },
  { 
    name: 'Tokenize', 
    href: '/tokenize', 
    icon: FileText,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    hoverColor: 'hover:bg-pink-500/20',
    isNew: true
  },
  { 
    name: 'Assets', 
    href: '/assets', 
    icon: Layers,
    isNew: true,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    hoverColor: 'hover:bg-amber-500/20'
  },
  { 
    name: 'Liquidity', 
    href: '/liquidity', 
    icon: Zap,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    hoverColor: 'hover:bg-purple-500/20'
  },
  { 
    name: 'Insight Panel', 
    href: '/insights', 
    icon: LineChart,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    hoverColor: 'hover:bg-rose-500/20',
    isNew: true
  }
];

const settingsNavigation = [
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    hoverColor: 'hover:bg-gray-500/20'
  },
  { 
    name: 'Documentation', 
    href: '/docs', 
    icon: FileText,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    hoverColor: 'hover:bg-blue-400/20'
  },
  { 
    name: 'Help & Support', 
    href: '/help', 
    icon: HelpCircle,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    hoverColor: 'hover:bg-emerald-400/20'
  }
];

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isNew?: boolean;
  color: string;
  bgColor: string;
  hoverColor: string;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ isOpen = true, onClose, className = '' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const NavItem = React.memo(({ item, onClose }: { item: NavigationItem; onClose?: () => void }) => {
    const isActive = React.useMemo(() => 
      pathname === item.href || 
      (item.href !== '/' && pathname.startsWith(item.href) && 
      (pathname[item.href.length] === '/' || pathname.length === item.href.length || 
      (item.href === '/vaults' && pathname.startsWith('/vaults/')))),
      [pathname, item.href]
    );
    
    const Icon = item.icon;
    const [isNavigating, setIsNavigating] = React.useState(false);

    const handleClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (isActive || isNavigating) return;
      
      try {
        setIsNavigating(true);
        
        // Close the sidebar first if it's open
        if (onClose) {
          onClose();
          // Small delay to allow the sidebar to close before navigation
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Use router.push with error handling
        await router.push(item.href);
      } catch (error) {
        console.error('Navigation error:', error);
        // Optionally show error toast here
      } finally {
        setIsNavigating(false);
      }
    };

    return (
      <motion.div 
        key={item.href}
        className={cn(
          'relative mx-2 my-1 rounded-xl transition-all duration-200',
          isActive 
            ? 'bg-background/80 border border-border/50 shadow-sm' 
            : 'hover:bg-background/60',
          item.hoverColor,
          isNavigating && 'opacity-70'
        )}
        whileTap={{ scale: 0.98 }}
      >
        <button
          onClick={handleClick}
          disabled={isActive || isNavigating}
          className={cn(
            'group flex items-center w-full px-4 py-3 text-sm font-medium',
            'transition-all duration-200 relative',
            isActive 
              ? 'text-foreground font-medium' 
              : 'text-muted-foreground hover:text-foreground',
            'disabled:opacity-100 disabled:cursor-default'
          )}
        >
          <div className="relative">
            {isActive && (
              <span 
                className={cn(
                  'absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full',
                  item.bgColor.replace('/10', '')
                )}
              />
            )}
            <span className={cn(
              'flex items-center justify-center p-1.5 rounded-lg transition-all',
              isActive ? item.bgColor : 'bg-background/50',
              'mr-3'
            )}>
              <Icon className={cn(
                'h-5 w-5', 
                isActive 
                  ? item.color 
                  : 'text-muted-foreground group-hover:text-foreground'
              )} />
            </span>
          </div>
          <span className={cn(isActive ? 'text-foreground' : 'group-hover:text-foreground')}>
            {item.name}
          </span>
          {item.isNew && (
            <motion.span 
              className="ml-auto px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: 'spring',
                stiffness: 500,
                damping: 20
              }}
            >
              New
            </motion.span>
          )}
        </button>
      </motion.div>
    );
  });

  return (
    <div className={cn("fixed inset-0 z-40 pointer-events-none", className)}>
      <aside
        className={cn(
          'fixed left-6 top-1/2 -translate-y-1/2 flex flex-col w-64',
          'bg-background/95 backdrop-blur-sm rounded-2xl',
          'transition-all duration-200 ease-in-out transform',
          'border border-border/20 shadow-xl shadow-foreground/5',
          'hover:shadow-2xl hover:shadow-foreground/10',
          'overflow-hidden h-[75vh]',
          !isOpen ? '-translate-x-full' : 'translate-x-0',
          'pointer-events-auto'
        )}
      >
        <div className="pt-6"></div>
      
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <div className="space-y-1">
            {mainNavigation.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-border/20">
            <h3 className="px-4 mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Settings
            </h3>
            <div className="space-y-1">
              {settingsNavigation.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>
        </nav>
        
        <div className="px-4 pb-5 pt-3 mt-auto border-t border-border/20 bg-background/50">
          <Button 
            className="w-full group bg-background/80 hover:bg-background/90 border border-border/30 shadow-sm h-12" 
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2 text-muted-foreground group-hover:text-foreground" />
            <span className="text-sm font-medium">Create New</span>
          </Button>
        </div>
      </aside>
    </div>
  );
}
