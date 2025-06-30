'use client';

import { useTheme } from '@/hooks/use-theme';

export function ThemeInitializer() {
  // This component ensures the theme is properly initialized
  // by mounting the useTheme hook at the root level
  useTheme();
  return null;
}
