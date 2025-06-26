import { useTheme } from 'next-themes';
import { useEffect } from 'react';

type HTMLElement = globalThis.HTMLElement;

type ColorMode = 'light' | 'dark' | 'system';
type ThemeColor = {
  light: string;
  dark: string;
};

/**
 * Get the current theme mode (light/dark) with system preference support
 */
export function useColorMode(): { colorMode: ColorMode; isDark: boolean } {
  const { theme, systemTheme } = useTheme();
  const isDark = theme === 'system' 
    ? systemTheme === 'dark' 
    : theme === 'dark';
    
  return {
    colorMode: (theme as ColorMode) || 'system',
    isDark,
  };
}

/**
 * Get a theme-aware color value
 */
export function useThemeColor(light: string, dark: string): string {
  const { isDark } = useColorMode();
  return isDark ? dark : light;
}

/**
 * Generate CSS variables for theme colors
 */
export function generateThemeVariables(colors: Record<string, ThemeColor>): string {
  return Object.entries(colors)
    .map(([key, { light, dark }]) => {
      return `
        --${key}-light: ${light};
        --${key}-dark: ${dark};
        --${key}: var(--${key}-${document.documentElement.classList.contains('dark') ? 'dark' : 'light'});
      `;
    })
    .join('\n');
}

/**
 * Apply theme colors to an element
 */
export function applyThemeColors(
  element: HTMLElement | null,
  colors: Record<string, ThemeColor>,
  prefix = ''
) {
  if (!element) return;
  Object.entries(colors).forEach(([key, { light, dark }]) => {
    const propName = prefix ? `${prefix}-${key}` : key;
    element.style.setProperty(`--${propName}-light`, light);
    element.style.setProperty(`--${propName}-dark`, dark);
    element.style.setProperty(
      `--${propName}`,
      `var(--${propName}-${document.documentElement.classList.contains('dark') ? 'dark' : 'light'})`
    );
  });
}

/**
 * Get the current theme's color value from CSS variables
 */
export function getThemeColor(
  colorName: string,
  element: HTLElement = document.documentElement
): string {
  const style = getComputedStyle(element);
  return style.getPropertyValue(`--${colorName}`).trim() || '';
}

/**
 * Toggle between light and dark theme
 */
export function useToggleTheme() {
  const { theme, setTheme } = useTheme();
  
  return () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
}

/**
 * Watch for system color scheme changes
 */
export function useSystemColorScheme(
  callback: (isDark: boolean) => void
) {
  const { theme, systemTheme } = useTheme();
  
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      callback(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, systemTheme, callback]);
}

/**
 * Get a theme-aware class name
 */
export function getThemeClass(
  lightClass: string,
  darkClass: string,
  isDark?: boolean
): string {
  if (typeof isDark === 'boolean') {
    return isDark ? darkClass : lightClass;
  }
  
  // If isDark is not provided, return both classes with theme selectors
  return `${lightClass} ${darkClass}:dark`;
}

/**
 * Generate a theme-aware style object
 */
export function getThemeStyle(
  lightStyle: React.CSSProperties,
  darkStyle: React.CSSProperties,
  isDark?: boolean
): React.CSSProperties {
  return isDark ? { ...lightStyle, ...darkStyle } : lightStyle;
}

/**
 * Create a theme-aware CSS variable
 */
export function createThemeVar(name: string, lightValue: string, darkValue: string) {
  return {
    [`--${name}-light`]: lightValue,
    [`--${name}-dark`]: darkValue,
    [`--${name}`]: `var(--${name}-light)`,
  };
}
