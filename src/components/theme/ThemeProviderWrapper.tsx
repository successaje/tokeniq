'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeSync } from './ThemeSync';

type ThemeProviderWrapperProps = {
  children: React.ReactNode;
  /** The attribute name to use for the theme class or data-theme attribute */
  attribute?: 'class' | 'data-theme';
  /** The default theme to use if no theme is set in localStorage */
  defaultTheme?: 'light' | 'dark' | 'system';
  /** Whether to enable system color scheme detection */
  enableSystem?: boolean;
  /** Whether to disable transitions when changing themes */
  disableTransitionOnChange?: boolean;
  /** The key used to store the theme preference in localStorage */
  storageKey?: string;
};

export function ThemeProviderWrapper({
  children,
  attribute = 'class',
  defaultTheme = 'dark',
  enableSystem = true,
  disableTransitionOnChange = true,
  storageKey = 'tokeniq-theme',
}: ThemeProviderWrapperProps) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      storageKey={storageKey}
    >
      <ThemeSync
        storageKey={storageKey}
        enableSystem={enableSystem}
        defaultTheme={defaultTheme}
        attribute={attribute}
        disableTransitionOnChange={disableTransitionOnChange}
      />
      {children}
    </NextThemesProvider>
  );
}
