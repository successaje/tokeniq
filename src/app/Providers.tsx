'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PublicLayout } from './_components/PublicLayout';
import { Providers } from '@/components/providers/Providers';
import { Toaster } from '@/components/ui/toaster';
import { ThemeVariables } from '@/components/theme/ThemeVariables';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const pathname = usePathname();
  const isPublicRoute = pathname === '/' || 
    (pathname?.startsWith('/(public)') ?? false) ||
    !pathname?.startsWith('/protected');

  return (
    <Providers>
      <ThemeVariables />
      {isPublicRoute ? (
        <PublicLayout>{children}</PublicLayout>
      ) : (
        <div className="flex min-h-screen flex-col">
          {children}
        </div>
      )}
      <Toaster />
    </Providers>
  );
}
