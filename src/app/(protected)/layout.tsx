'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ElizaProvider } from '@/providers/ElizaProvider';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary/50"></div>
      </div>
    );
  }

  return (
    <ElizaProvider>
      <DashboardLayout>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </DashboardLayout>
    </ElizaProvider>
  );
}
