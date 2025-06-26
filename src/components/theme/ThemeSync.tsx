'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type ThemeSyncProps = {
  /**
   * The key used to store the theme preference in localStorage.
   * @default 'tokeniq-theme'
   */
  storageKey?: string;

  /**
   * Whether to enable system color scheme detection.
   * @default true
   */
  enableSystem?: boolean;

  /**
   * The default theme to use if no theme is set in localStorage.
   * @default 'system'
   */
  defaultTheme?: 'light' | 'dark' | 'system';

  /**
   * The attribute name to use for the theme class.
   * @default 'data-theme'
   */
  attribute?: string | 'class';

  /**
   * Whether to disable transitions when changing themes.
   * @default true
   */
  disableTransitionOnChange?: boolean;
};

/**
 * ThemeSync component that handles theme synchronization between localStorage and the DOM.
 * This component should be rendered once at the root of your application.
 */
export function ThemeSync({
  storageKey = 'tokeniq-theme',
  enableSystem = true,
  defaultTheme = 'system',
  attribute = 'data-theme',
  disableTransitionOnChange = true,
}: ThemeSyncProps) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Set mounted state after initial render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme class to document element
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const root = window.document.documentElement;
    
    // Remove any existing theme classes
    root.classList.remove('light', 'dark');
    
    // Set the theme attribute on the root element
    if (attribute === 'class') {
      const currentTheme = theme === 'system' ? systemTheme : theme;
      if (currentTheme) {
        root.classList.add(currentTheme);
      }
    } else if (attribute) {
      const currentTheme = theme === 'system' ? systemTheme : theme;
      if (currentTheme) {
        root.setAttribute(attribute, currentTheme);
      } else {
        root.removeAttribute(attribute);
      }
    }

    // Disable transitions during theme change if specified
    if (disableTransitionOnChange) {
      const css = document.createElement('style');
      css.type = 'text/css';
      css.appendChild(
        document.createTextNode(
          `* {
             transition: none !important;
             -webkit-transition: none !important;
             -moz-transition: none !important;
             -ms-transition: none !important;
             -o-transition: none !important;
           }`
        )
      );
      document.head.appendChild(css);

      // Force a reflow
      const _ = window.getComputedStyle(css).opacity;
      document.head.removeChild(css);
    }

    // Initialize theme from localStorage or system preference
    if (mounted) {
      const storedTheme = localStorage.getItem(storageKey);
      if (!storedTheme && defaultTheme) {
        setTheme(defaultTheme);
      }
    }
  }, [theme, systemTheme, attribute, disableTransitionOnChange, storageKey, setTheme, defaultTheme, mounted]);
  
  // Don't render anything on the server
  return null;

  // Listen for system theme changes
  useEffect(() => {
    if (!enableSystem || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        setTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, setTheme, enableSystem]);

  return null;
}
