"use client";

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

// Dynamically import client-side only components with proper typing
const Sidebar = dynamic<{ collapsed: boolean; onCollapse: () => void; onClose?: () => void }>(
  () => import('./Sidebar').then((mod) => mod.Sidebar),
  { ssr: false }
);

const Topbar = dynamic<{ onMenuClick: () => void; sidebarCollapsed: boolean }>(
  () => import('./Topbar').then((mod) => mod.Topbar),
  { ssr: false }
);

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Don't render anything until component is mounted on the client
  if (!mounted) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen w-full bg-background text-foreground">
      {/* Mobile sidebar overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          'bg-background/80 backdrop-blur-sm',
          'transition-opacity duration-300 ease-in-out',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:hidden',
          'bg-card border-r border-border shadow-lg',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'flex flex-col'
        )}
      >
        <Sidebar 
          collapsed={false}
          onCollapse={toggleCollapse}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Desktop sidebar */}
      <aside 
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col',
          'transition-all duration-300 ease-in-out',
          'bg-card border-r border-border',
          'h-screen',
          sidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <Sidebar 
          collapsed={sidebarCollapsed}
          onCollapse={toggleCollapse}
        />
      </aside>

      {/* Main content wrapper */}
      <div className={cn(
        'flex flex-col flex-1 w-full',
        'transition-all duration-300 ease-in-out',
        'lg:ml-0', // Start with no margin
        {
          'lg:ml-20': sidebarCollapsed,
          'lg:ml-64': !sidebarCollapsed
        }
      )}>
        <Topbar 
          onMenuClick={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto w-full max-w-7xl p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
