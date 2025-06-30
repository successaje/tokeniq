'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { 
  LayoutDashboard, 
  BarChart2, 
  Zap, 
  BarChart, 
  Link as LinkIcon, 
  FileStack, 
  Wallet,
  ChevronDown,
  ChevronUp,
  Layers,
  Settings,
  HelpCircle,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  name: string;
  href: string;
  sectionId: string;
  icon: React.ReactNode;
  isActive: boolean;
  isNew?: boolean;
  isDisabled?: boolean;
  children?: NavItem[];
}

interface DiscoverSidebarProps {
  className?: string;
  activeSection: string;
  isCollapsed?: boolean;
}

export function DiscoverSidebar({ className, activeSection, isCollapsed = false }: DiscoverSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const controls = useAnimation();
  const activeIndicator = useRef<HTMLDivElement>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Initialize expanded state based on active section
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    navItems.forEach(item => {
      if (item.children) {
        initialExpanded[item.sectionId] = item.children.some(
          child => isItemActive(child)
        ) || isItemActive(item);
      }
    });
    setExpandedItems(initialExpanded);
  }, [activeSection]);

  const toggleExpand = (sectionId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.href === pathname) return true;
    if (item.children) {
      return item.children.some(child => isItemActive(child));
    }
    return activeSection === item.sectionId.replace('-section', '');
  };

  const navItems: NavItem[] = [
    {
      name: 'Overview',
      href: '/discover',
      sectionId: 'overview-section',
      icon: <LayoutDashboard className="h-5 w-5" />,
      isActive: isItemActive({ name: '', href: '/discover', sectionId: 'overview-section', icon: null, isActive: false }),
    },
    {
      name: 'Assets',
      href: '/discover/assets',
      sectionId: 'assets-section',
      icon: <Wallet className="h-5 w-5" />,
      isActive: isItemActive({ name: '', href: '/discover/assets', sectionId: 'assets-section', icon: null, isActive: false }),
    },
    {
      name: 'Yield',
      href: '/discover/yield',
      sectionId: 'yield-section',
      icon: <BarChart2 className="h-5 w-5" />,
      isActive: isItemActive({ name: '', href: '/discover/yield', sectionId: 'yield-section', icon: null, isActive: false }),
    },
    {
      name: 'Liquidity',
      href: '/discover/liquidity',
      sectionId: 'liquidity-section',
      icon: <Zap className="h-5 w-5" />,
      isActive: isItemActive({ name: '', href: '/discover/liquidity', sectionId: 'liquidity-section', icon: null, isActive: false }),
    },
    {
      name: 'Analytics',
      href: '/discover/analytics',
      sectionId: 'analytics-section',
      icon: <BarChart className="h-5 w-5" />,
      isActive: isItemActive({ name: '', href: '/discover/analytics', sectionId: 'analytics-section', icon: null, isActive: false }),
      isDisabled: true,
    },
    {
      name: 'Cross Chain',
      href: '/crosschain',
      sectionId: 'crosschain-section',
      icon: <LinkIcon className="h-5 w-5" />,
      isActive: isItemActive({ name: '', href: '/crosschain', sectionId: 'crosschain-section', icon: null, isActive: false }),
    },
    {
      name: 'Vaults',
      href: '/vaults',
      sectionId: 'vaults-section',
      icon: <FileStack className="h-5 w-5" />,
      isActive: isItemActive({ name: '', href: '/vaults', sectionId: 'vaults-section', icon: null, isActive: false }),
    },
    {
      name: 'Tokenize',
      href: '/tokenize',
      sectionId: 'tokenize-section',
      icon: <Layers className="h-5 w-5" />,
      isActive: false,
    },
    {
      name: 'Settings',
      href: '/settings',
      sectionId: 'settings-section',
      icon: <Settings className="h-5 w-5" />,
      isActive: false,
    },
    {
      name: 'Help',
      href: '/help',
      sectionId: 'help-section',
      icon: <HelpCircle className="h-5 w-5" />,
      isActive: false,
    },
  ];

  // Update isActive based on activeSection
  const updatedNavItems = navItems.map(item => ({
    ...item,
    isActive: isItemActive(item)
  }));

  // Animate active indicator on route change
  useEffect(() => {
    controls.start({
      scale: [1, 1.05, 1],
      transition: { duration: 0.3 }
    });
  }, [pathname, controls]);

  return (
    <div className={cn('h-full flex flex-col transition-all duration-200', className)}>
      <nav className={cn("flex-1 space-y-1 py-4", isCollapsed ? 'px-2' : 'px-4')}>
        {!isCollapsed && (
          <h2 className="text-2xl font-semibold text-foreground/90 mb-4">
            Discover
          </h2>
        )}
        {updatedNavItems.map((item) => {
          const isActive = item.isActive;
          return (
            <div key={item.href} className="relative">
              <button
                onClick={() => {
                  if (item.isDisabled) return;
                  // Only scroll if we're already on the discover page
                  if (pathname === '/discover' || pathname.startsWith('/discover/')) {
                    scrollToSection(item.sectionId);
                  } else {
                    // If not on discover page, navigate first then scroll
                    router.push(`${item.href}#${item.sectionId}`);
                  }
                }}
                className={cn(
                  'relative flex items-center w-full px-5 py-4 rounded-xl text-[15px] font-medium',
                  'group hover:bg-accent/30 transition-all duration-200',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  item.isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                )}
                disabled={item.isDisabled}
              >
                {/* Active state indicator */}
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.span 
                      ref={activeIndicator}
                      layoutId="activeIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                      initial={{ opacity: 0, height: '60%' }}
                      animate={{ 
                        opacity: 1, 
                        height: '80%',
                        y: '10%',
                        transition: { 
                          type: 'spring', 
                          stiffness: 500, 
                          damping: 30 
                        }
                      }}
                      exit={{ opacity: 0, height: '60%' }}
                    />
                  )}
                </AnimatePresence>

                <motion.span 
                  className={cn(
                    'relative z-10 flex items-center w-full',
                    isActive && 'pl-1.5', // Add padding when active to account for indicator
                    'transition-all duration-200'
                  )}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ x: 4 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 400, 
                    damping: 20,
                    restDelta: 0.01
                  }}
                  animate={isActive ? {
                    x: 2,
                    transition: {
                      type: 'spring',
                      stiffness: 500,
                      damping: 30
                    }
                  } : {}}
                >
                  <motion.span 
                    className={cn(
                      'mr-5',
                      isActive 
                        ? 'text-primary' 
                        : 'text-muted-foreground/80 group-hover:text-foreground',
                      'flex-shrink-0',
                      'text-[1.75rem]', // Even larger icons
                      'transition-all duration-200',
                      'w-7 h-7 flex items-center justify-center'
                    )}
                    animate={isActive ? {
                      scale: [1, 1.1, 1],
                      transition: { duration: 0.3 }
                    } : {}}
                  >
                    {item.icon}
                  </motion.span>
                  <span className="truncate text-base">{item.name}</span>
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
                </motion.span>
              </button>
            </div>
          );
        })}
      </nav>
      
      <div className={cn("pt-4 pb-5 border-t border-border/20 px-4", isCollapsed ? 'px-2' : 'px-4')}>
        <Button 
          className={cn(
            "w-full group bg-background/80 hover:bg-background/90 border border-border/30 shadow-sm h-14",
            isCollapsed ? 'px-2 justify-center' : 'px-4'
          )} 
          size="lg"
        >
          <Plus className={cn("h-6 w-6 text-muted-foreground group-hover:text-foreground", isCollapsed ? 'mx-auto' : 'mr-3')} />
          {!isCollapsed && <span className="text-[15px] font-medium">Create New</span>}
        </Button>
      </div>
    </div>
  );
}
