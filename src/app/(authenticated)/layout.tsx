'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { Sidebar } from '@/components/layouts/Sidebar';
import { cn } from '@/lib/utils';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Close sidebar when pathname changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar 
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <main className="pt-16">
        <div className="flex">
          <div className={cn(
            "flex-1 transition-all duration-300",
            sidebarCollapsed ? "ml-16" : "ml-64"
          )}>
            <div className="container mx-auto px-4 py-8">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 