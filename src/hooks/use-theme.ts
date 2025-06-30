'use client';

import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Theme } from '@/lib/theme';

export function useTheme() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';
  const currentTheme = (theme === 'system' ? systemTheme : theme) as Theme;

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return {
    theme: currentTheme,
    setTheme: (theme: Theme) => setTheme(theme),
    toggleTheme,
    isDark,
    mounted,
  };
}
