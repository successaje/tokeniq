"use client";

import { ThemeProvider } from '@/context/theme-context';
import { Web3Providers } from './Web3Providers';
import { Toaster } from '@/components/ui/Toaster';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Web3Providers>
        {children}
        <Toaster />
      </Web3Providers>
    </ThemeProvider>
  );
}
