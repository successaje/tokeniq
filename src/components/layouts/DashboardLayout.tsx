"use client";

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

// Dynamically import client-side only components
const DynamicSidebar = dynamic(() => import('./Sidebar').then(mod => mod.Sidebar), {
  ssr: false,
});

const DynamicTopbar = dynamic(() => import('./Topbar').then(mod => mod.Topbar), {
  ssr: false,
});

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Close sidebar on pathname change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className={cn(
        "fixed top-16 left-0 bottom-0 z-40 w-64 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <DynamicSidebar
          collapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className={cn(
        "flex min-h-screen flex-col transition-all duration-200 ease-in-out",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        <DynamicTopbar
          onMenuClick={() => setSidebarOpen(true)}
          onCollapseClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
