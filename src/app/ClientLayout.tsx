'use client';

import { useEffect, useState } from 'react';
import { AppProviders } from './Providers';

export function ClientLayout({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string 
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render the content after mounting to avoid hydration mismatches
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppProviders>
      {children}
    </AppProviders>
  );
}
