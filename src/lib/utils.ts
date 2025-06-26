import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ThemeColor = 'primary' | 'secondary' | 'accent' | 'destructive' | 'muted' | 'popover' | 'card' | 'elevated' | 'surface';
export type BackgroundVariant = 'default' | 'elevated' | 'surface' | 'muted';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getThemeColor(color: ThemeColor, variant: 'bg' | 'text' | 'border' | 'ring' = 'bg') {
  return {
    [variant]: `var(--${color}${variant === 'ring' ? '' : `-${variant}`})`,
  };
}

export function getThemeGradient(angle: number = 45, ...colors: string[]) {
  const gradientStops = colors.join(', ');
  return {
    background: `linear-gradient(${angle}deg, ${gradientStops})`,
  };
}

export function getBackgroundVariant(variant: BackgroundVariant = 'default') {
  const variants = {
    default: 'bg-background',
    elevated: 'bg-elevated',
    surface: 'bg-surface',
    muted: 'bg-muted',
  };
  return variants[variant];
}

export function getTextVariant(variant: BackgroundVariant = 'default') {
  const variants = {
    default: 'text-foreground',
    elevated: 'text-elevated-foreground',
    surface: 'text-surface-foreground',
    muted: 'text-muted-foreground',
  };
  return variants[variant];
}

export function getBorderVariant(variant: BackgroundVariant = 'default') {
  const variants = {
    default: 'border-border',
    elevated: 'border-border/80',
    surface: 'border-border/60',
    muted: 'border-border/40',
  };
  return variants[variant];
}

export function applyThemeVars(theme: 'light' | 'dark') {
  return {
    '--background': `hsl(var(--background))`,
    '--foreground': `hsl(var(--foreground))`,
    '--primary': `hsl(var(--primary))`,
    '--primary-foreground': `hsl(var(--primary-foreground))`,
    '--secondary': `hsl(var(--secondary))`,
    '--secondary-foreground': `hsl(var(--secondary-foreground))`,
    '--accent': `hsl(var(--accent))`,
    '--accent-foreground': `hsl(var(--accent-foreground))`,
    '--destructive': `hsl(var(--destructive))`,
    '--destructive-foreground': `hsl(var(--destructive-foreground))`,
    '--muted': `hsl(var(--muted))`,
    '--muted-foreground': `hsl(var(--muted-foreground))`,
    '--popover': `hsl(var(--popover))`,
    '--popover-foreground': `hsl(var(--popover-foreground))`,
    '--card': `hsl(var(--card))`,
    '--card-foreground': `hsl(var(--card-foreground))`,
    '--elevated': `hsl(var(--elevated))`,
    '--elevated-foreground': `hsl(var(--elevated-foreground))`,
    '--surface': `hsl(var(--surface))`,
    '--surface-foreground': `hsl(var(--surface-foreground))`,
    '--border': `hsl(var(--border))`,
    '--input': `hsl(var(--input))`,
    '--ring': `hsl(var(--ring))`,
  } as React.CSSProperties;
}
