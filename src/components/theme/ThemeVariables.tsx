'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Applies theme-specific CSS variables to the document root.
 * This component should be used in your root layout to ensure theme variables
 * are properly set on the HTML element.
 */
export function ThemeVariables() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const root = window.document.documentElement;
    
    // Set data-theme attribute for CSS variable theming
    if (resolvedTheme) {
      root.setAttribute('data-theme', resolvedTheme);
      // Set color-scheme CSS property for better native element theming
      root.style.colorScheme = resolvedTheme;
    }
    
    return () => {
      root.removeAttribute('data-theme');
      root.style.colorScheme = '';
    };
  }, [resolvedTheme]);

  // Don't render anything on the server
  if (!mounted) return null;
  
  return null;
}

/**
 * Type-safe theme color variables for consistent theming throughout the app.
 * These should match your CSS variables defined in globals.css
 */
export const themeColors = {
  light: {
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    primary: 'hsl(var(--primary))',
    'primary-foreground': 'hsl(var(--primary-foreground))',
    secondary: 'hsl(var(--secondary))',
    'secondary-foreground': 'hsl(var(--secondary-foreground))',
    destructive: 'hsl(var(--destructive))',
    'destructive-foreground': 'hsl(var(--destructive-foreground))',
    muted: 'hsl(var(--muted))',
    'muted-foreground': 'hsl(var(--muted-foreground))',
    accent: 'hsl(var(--accent))',
    'accent-foreground': 'hsl(var(--accent-foreground))',
    popover: 'hsl(var(--popover))',
    'popover-foreground': 'hsl(var(--popover-foreground))',
    card: 'hsl(var(--card))',
    'card-foreground': 'hsl(var(--card-foreground))',
    border: 'hsl(var(--border))',
    input: 'hsl(var(--input))',
    ring: 'hsl(var(--ring))',
  },
  dark: {
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    primary: 'hsl(var(--primary))',
    'primary-foreground': 'hsl(var(--primary-foreground))',
    secondary: 'hsl(var(--secondary))',
    'secondary-foreground': 'hsl(var(--secondary-foreground))',
    destructive: 'hsl(var(--destructive))',
    'destructive-foreground': 'hsl(var(--destructive-foreground))',
    muted: 'hsl(var(--muted))',
    'muted-foreground': 'hsl(var(--muted-foreground))',
    accent: 'hsl(var(--accent))',
    'accent-foreground': 'hsl(var(--accent-foreground))',
    popover: 'hsl(var(--popover))',
    'popover-foreground': 'hsl(var(--popover-foreground))',
    card: 'hsl(var(--card))',
    'card-foreground': 'hsl(var(--card-foreground))',
    border: 'hsl(var(--border))',
    input: 'hsl(var(--input))',
    ring: 'hsl(var(--ring))',
  },
} as const;

/**
 * Utility hook to get theme colors based on the current theme
 */
export function useThemeColors() {
  const { resolvedTheme } = useTheme();
  return themeColors[resolvedTheme === 'dark' ? 'dark' : 'light'];
}
