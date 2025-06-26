'use client';

import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type ThemeTextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span'
  | 'div'
  | 'label'
  | 'legend';

type ThemeTextColor =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'muted'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info';

type ThemeTextProps<T extends ElementType> = {
  /** The HTML element to render */
  as?: T;
  /** Text content or children */
  children: ReactNode;
  /** Text variant for styling */
  variant?: ThemeTextVariant;
  /** Text color variant */
  color?: ThemeTextColor;
  /** Additional class names */
  className?: string;
  /** Whether to use theme-aware colors */
  themeAware?: boolean;
  /** Light theme specific class names */
  lightClassName?: string;
  /** Dark theme specific class names */
  darkClassName?: string;
} & ComponentPropsWithoutRef<T>;

const variantClasses: Record<ThemeTextVariant, string> = {
  h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
  h2: 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
  h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
  h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
  h5: 'text-lg font-semibold',
  h6: 'text-base font-semibold',
  p: 'leading-7 [&:not(:first-child)]:mt-6',
  span: 'inline-block',
  div: '',
  label: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  legend: 'text-sm font-medium',
};

const colorClasses: Record<ThemeTextColor, { light: string; dark: string }> = {
  primary: {
    light: 'text-foreground',
    dark: 'text-foreground',
  },
  secondary: {
    light: 'text-muted-foreground',
    dark: 'text-muted-foreground',
  },
  accent: {
    light: 'text-accent-foreground',
    dark: 'text-accent-foreground',
  },
  muted: {
    light: 'text-muted-foreground/80',
    dark: 'text-muted-foreground/80',
  },
  destructive: {
    light: 'text-destructive',
    dark: 'text-destructive',
  },
  success: {
    light: 'text-green-600 dark:text-green-400',
    dark: 'text-green-400',
  },
  warning: {
    light: 'text-yellow-600 dark:text-yellow-400',
    dark: 'text-yellow-400',
  },
  info: {
    light: 'text-blue-600 dark:text-blue-400',
    dark: 'text-blue-400',
  },
};

/**
 * A theme-aware text component that automatically adjusts its styles based on the current theme.
 * Supports semantic text variants and theme-aware colors.
 */
export function ThemeText<T extends ElementType = 'p'>({
  as,
  children,
  variant = 'p',
  color = 'primary',
  className,
  themeAware = true,
  lightClassName,
  darkClassName,
  ...props
}: ThemeTextProps<T>) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const Component = as || variant;
  const variantClass = variantClasses[variant] || '';
  const colorClass = colorClasses[color];
  
  const themeAwareClass = themeAware 
    ? isDark 
      ? colorClass.dark 
      : colorClass.light 
    : '';

  return (
    <Component
      className={cn(
        variantClass,
        themeAwareClass,
        isDark ? darkClassName : lightClassName,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// Convenience components for common text variants
export const H1 = <T extends ElementType = 'h1'>(
  props: Omit<ThemeTextProps<T>, 'variant' | 'as'>
) => <ThemeText variant="h1" as="h1" {...props} />;

export const H2 = <T extends ElementType = 'h2'>(
  props: Omit<ThemeTextProps<T>, 'variant' | 'as'>
) => <ThemeText variant="h2" as="h2" {...props} />;

export const H3 = <T extends ElementType = 'h3'>(
  props: Omit<ThemeTextProps<T>, 'variant' | 'as'>
) => <ThemeText variant="h3" as="h3" {...props} />;

export const H4 = <T extends ElementType = 'h4'>(
  props: Omit<ThemeTextProps<T>, 'variant' | 'as'>
) => <ThemeText variant="h4" as="h4" {...props} />;

export const H5 = <T extends ElementType = 'h5'>(
  props: Omit<ThemeTextProps<T>, 'variant' | 'as'>
) => <ThemeText variant="h5" as="h5" {...props} />;

export const H6 = <T extends ElementType = 'h6'>(
  props: Omit<ThemeTextProps<T>, 'variant' | 'as'>
) => <ThemeText variant="h6" as="h6" {...props} />;

export const P = <T extends ElementType = 'p'>(
  props: Omit<ThemeTextProps<T>, 'variant' | 'as'>
) => <ThemeText variant="p" as="p" {...props} />;

export const Span = <T extends ElementType = 'span'>(
  props: Omit<ThemeTextProps<T>, 'variant' | 'as'>
) => <ThemeText variant="span" as="span" {...props} />;

export const Label = <T extends ElementType = 'label'>(
  props: Omit<ThemeTextProps<T>, 'variant' | 'as'>
) => <ThemeText variant="label" as="label" {...props} />;
