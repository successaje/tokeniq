// Theme Components
export * from './ThemeAvatar';
export * from './ThemeBackground';
export * from './ThemeButton';
export * from './ThemeCard';
export * from './ThemeIcon';
export * from './ThemeImage';
export * from './ThemeProviderWrapper';
export * from './ThemeSwitcher';
export * from './ThemeSync';
export * from './ThemeText';
export * from './ThemeToggle';
export * from './ThemeToggleGroup';
export * from './ThemeVariables';

// Re-export types for convenience
export type { ButtonSize, ButtonVariant } from '@/components/ui/button';

// Re-export next-themes for convenience
export { useTheme, type ThemeProviderProps } from 'next-themes';

// Export theme utilities
export * from './theme-utils';
