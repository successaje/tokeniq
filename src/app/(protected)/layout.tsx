'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layouts/NewSidebar';
import { Header } from '@/components/layouts/Header';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header - Fixed at the top */}
      <Header />
      
      <div className="flex flex-1 pt-16 overflow-hidden">
        {/* Sidebar - Fixed on the left */}
        <Sidebar className="fixed inset-y-0 left-0 z-40 w-64 -translate-x-full md:translate-x-0" />
        
        {/* Main Content Area */}
        <main 
          className="flex-1 overflow-y-auto p-6 transition-all duration-200 ease-in-out md:ml-64"
        >
          <div className="mx-auto max-w-7xl min-h-[calc(100vh-8rem)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
