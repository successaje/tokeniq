'use client';

import { Sidebar } from '@/components/layouts/Sidebar';
import { Header } from '@/components/layouts/Header';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedState = localStorage.getItem('sidebarCollapsed');
    if (storedState !== null) {
      setIsCollapsed(storedState === 'true');
    }
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 pt-16">
        <Sidebar onCollapse={setIsCollapsed} />
        <main
          className={cn(
            'flex-1 transition-all duration-300 ease-in-out',
            isCollapsed ? 'md:ml-20' : 'md:ml-64'
          )}
        >
          <div className="container mx-auto h-full max-w-7xl p-4 md:p-6">
            <div className="h-full rounded-xl border bg-card p-4 shadow-sm md:p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
