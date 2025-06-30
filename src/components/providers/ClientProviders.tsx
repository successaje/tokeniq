"use client";

import { Web3Providers } from './Web3Providers';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <Web3Providers>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </Web3Providers>
  );
}
