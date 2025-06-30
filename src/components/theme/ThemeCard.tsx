'use client';

import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type ThemeCardVariant = 'default' | 'outline' | 'ghost' | 'filled';
type ThemeCardSize = 'sm' | 'md' | 'lg';

type ThemeCardProps<T extends ElementType = 'div'> = {
  /** The HTML element to render */
  as?: T;
  /** Card content */
  children: ReactNode;
  /** Card variant */
  variant?: ThemeCardVariant;
  /** Card size */
  size?: ThemeCardSize;
  /** Additional class names */
  className?: string;
  /** Light theme specific class names */
  lightClassName?: string;
  /** Dark theme specific class names */
  darkClassName?: string;
  /** Whether to add hover effects */
  hoverable?: boolean;
  /** Whether to add padding */
  padding?: boolean;
  /** Whether to add rounded corners */
  rounded?: boolean;
  /** Whether to add a shadow */
  shadow?: boolean;
} & ComponentPropsWithoutRef<T>;

const variantClasses: Record<ThemeCardVariant, { light: string; dark: string }> = {
  default: {
    light: 'bg-card text-card-foreground border border-border',
    dark: 'bg-card text-card-foreground border border-border',
  },
  outline: {
    light: 'bg-transparent border border-border',
    dark: 'bg-transparent border border-border',
  },
  ghost: {
    light: 'bg-transparent hover:bg-accent/50',
    dark: 'bg-transparent hover:bg-accent/20',
  },
  filled: {
    light: 'bg-accent/10 text-accent-foreground',
    dark: 'bg-accent/20 text-accent-foreground',
  },
};

const sizeClasses: Record<ThemeCardSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * A theme-aware card component that adapts its appearance based on the current theme.
 * Supports multiple variants, sizes, and hover effects.
 */
export function ThemeCard<T extends ElementType = 'div'>({
  as,
  children,
  variant = 'default',
  size = 'md',
  className,
  lightClassName,
  darkClassName,
  hoverable = false,
  padding = true,
  rounded = true,
  shadow = true,
  ...props
}: ThemeCardProps<T>) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const Component = as || 'div';
  const variantClass = variantClasses[variant] || variantClasses.default;
  const sizeClass = padding ? sizeClasses[size] : '';
  
  return (
    <Component
      className={cn(
        'transition-colors duration-200',
        isDark ? variantClass.dark : variantClass.light,
        sizeClass,
        rounded && 'rounded-lg',
        shadow && 'shadow-sm',
        hoverable && 'hover:shadow-md',
        isDark ? darkClassName : lightClassName,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Card header component
 */
export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card title component
 */
export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * Card description component
 */
export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Card content component
 */
export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card footer component
 */
export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  );
}
