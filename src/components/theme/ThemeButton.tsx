'use client';

import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { forwardRef } from 'react';

type ThemeButtonVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
type ThemeButtonSize = 'sm' | 'default' | 'lg' | 'icon';

type ThemeButtonProps = ButtonProps & {
  /** Button variant */
  variant?: ThemeButtonVariant;
  /** Button size */
  size?: ThemeButtonSize;
  /** Light theme specific class names */
  lightClassName?: string;
  /** Dark theme specific class names */
  darkClassName?: string;
  /** Whether to use theme-aware colors */
  themeAware?: boolean;
  /** Whether to show a loading state */
  isLoading?: boolean;
  /** Loading spinner component */
  loadingSpinner?: React.ReactNode;
};

const variantClasses: Record<ThemeButtonVariant, { light: string; dark: string }> = {
  default: {
    light: 'bg-background text-foreground border border-input hover:bg-accent hover:text-accent-foreground',
    dark: 'bg-background text-foreground border border-input hover:bg-accent/50 hover:text-accent-foreground',
  },
  // 'default' variant serves as primary
  secondary: {
    light: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    dark: 'bg-secondary/80 text-secondary-foreground hover:bg-secondary/60',
  },
  // Using secondary as accent since accent variant is not in base Button
  destructive: {
    light: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    dark: 'bg-destructive/90 text-destructive-foreground hover:bg-destructive',
  },
  outline: {
    light: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
    dark: 'border border-input bg-transparent hover:bg-accent/10 hover:text-accent-foreground',
  },
  ghost: {
    light: 'hover:bg-accent hover:text-accent-foreground',
    dark: 'hover:bg-accent/10 hover:text-accent-foreground',
  },
  link: {
    light: 'text-primary underline-offset-4 hover:underline',
    dark: 'text-primary/90 underline-offset-4 hover:underline',
  },
};

const sizeClasses: Record<ThemeButtonSize, string> = {
  sm: 'h-9 rounded-md px-3',
  default: 'h-10 px-4 py-2',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
};

/**
 * A theme-aware button component that adapts its appearance based on the current theme.
 * Extends the base Button component with theme-specific styling.
 */
export const ThemeButton = forwardRef<HTMLButtonElement, ThemeButtonProps>(
  ({
    className,
    variant = 'default',
    size = 'default',
    lightClassName,
    darkClassName,
    themeAware = true,
    isLoading = false,
    loadingSpinner,
    disabled,
    children,
    ...props
  }, ref) => {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    
    const variantClass = variantClasses[variant] || variantClasses.default;
    const sizeClass = sizeClasses[size] || sizeClasses.default;
    
    return (
      <Button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          themeAware ? (isDark ? variantClass.dark : variantClass.light) : '',
          sizeClass,
          isDark ? darkClassName : lightClassName,
          className
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            {loadingSpinner || (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
          </span>
        )}
        <span className={cn('flex items-center', isLoading && 'invisible')}>
          {children}
        </span>
      </Button>
    );
  }
);

ThemeButton.displayName = 'ThemeButton';

// Convenience components for common button variants
export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<ThemeButtonProps, 'variant'>>(
  (props, ref) => <ThemeButton ref={ref} variant="default" {...props} />
);
PrimaryButton.displayName = 'PrimaryButton';

export const SecondaryButton = forwardRef<HTMLButtonElement, Omit<ThemeButtonProps, 'variant'>>(
  (props, ref) => <ThemeButton ref={ref} variant="secondary" {...props} />
);
SecondaryButton.displayName = 'SecondaryButton';

// Alias for secondary button since accent variant is not in base Button
export const AccentButton = forwardRef<HTMLButtonElement, Omit<ThemeButtonProps, 'variant'>>(
  (props, ref) => <ThemeButton ref={ref} variant="secondary" {...props} />
);
AccentButton.displayName = 'AccentButton';

export const DestructiveButton = forwardRef<HTMLButtonElement, Omit<ThemeButtonProps, 'variant'>>(
  (props, ref) => <ThemeButton ref={ref} variant="destructive" {...props} />
);
DestructiveButton.displayName = 'DestructiveButton';

export const OutlineButton = forwardRef<HTMLButtonElement, Omit<ThemeButtonProps, 'variant'>>(
  (props, ref) => <ThemeButton ref={ref} variant="outline" {...props} />
);
OutlineButton.displayName = 'OutlineButton';

export const GhostButton = forwardRef<HTMLButtonElement, Omit<ThemeButtonProps, 'variant'>>(
  (props, ref) => <ThemeButton ref={ref} variant="ghost" {...props} />
);
GhostButton.displayName = 'GhostButton';

export const LinkButton = forwardRef<HTMLButtonElement, Omit<ThemeButtonProps, 'variant'>>(
  (props, ref) => <ThemeButton ref={ref} variant="link" {...props} />
);
LinkButton.displayName = 'LinkButton';
