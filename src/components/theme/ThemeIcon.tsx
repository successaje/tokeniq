'use client';

import { ComponentType, SVGProps } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

type IconProps = SVGProps<SVGSVGElement> & {
  className?: string;
  lightClassName?: string;
  darkClassName?: string;
};

type ThemeIconProps = {
  /** The icon component for light theme */
  lightIcon: ComponentType<IconProps>;
  /** The icon component for dark theme */
  darkIcon?: ComponentType<IconProps>;
  /** Additional class names for the icon */
  className?: string;
  /** Class names to apply in light mode */
  lightClassName?: string;
  /** Class names to apply in dark mode */
  darkClassName?: string;
  /** Whether to disable theme switching for this icon */
  disableTheming?: boolean;
} & Omit<IconProps, 'className'>;

/**
 * A theme-aware icon component that automatically switches between light and dark variants
 * based on the current theme.
 */
export function ThemeIcon({
  lightIcon: LightIcon,
  darkIcon: DarkIcon,
  className = '',
  lightClassName = '',
  darkClassName = '',
  disableTheming = false,
  ...props
}: ThemeIconProps) {
  const { resolvedTheme } = useTheme();
  
  // If dark icon is not provided, use light icon for both themes
  const Icon = !disableTheming && resolvedTheme === 'dark' && DarkIcon ? DarkIcon : LightIcon;
  
  // Determine which class names to apply based on theme
  const iconClassName = cn(
    className,
    !disableTheming && resolvedTheme === 'light' && lightClassName,
    !disableTheming && resolvedTheme === 'dark' && darkClassName
  );

  return <Icon className={iconClassName} {...props} />;
}

/**
 * Creates a theme-aware icon component with pre-defined light and dark variants.
 * This is a convenience function to reduce boilerplate when using the same icon in both themes.
 */
export function createThemedIcon(
  lightIcon: ComponentType<IconProps>,
  darkIcon?: ComponentType<IconProps>
) {
  return function ThemedIcon({
    className,
    lightClassName = '',
    darkClassName = '',
    disableTheming = false,
    ...props
  }: Omit<ThemeIconProps, 'lightIcon' | 'darkIcon'>) {
    return (
      <ThemeIcon
        lightIcon={lightIcon}
        darkIcon={darkIcon}
        className={className}
        lightClassName={lightClassName}
        darkClassName={darkClassName}
        disableTheming={disableTheming}
        {...props}
      />
    );
  };
}
