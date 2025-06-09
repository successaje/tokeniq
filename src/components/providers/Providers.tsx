'use client';

import { ThemeProvider } from './ThemeProvider';
import { Web3Provider } from './Web3Provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Web3Provider>
        {children}
      </Web3Provider>
    </ThemeProvider>
  );
} 