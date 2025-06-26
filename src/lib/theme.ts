import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const themeColors = {
  light: {
    background: 'hsl(0, 0%, 100%)',
    foreground: 'hsl(222.2, 84%, 4.9%)',
    primary: 'hsl(183, 100%, 35%)',
    'primary-foreground': 'hsl(210, 40%, 98%)',
    // Add other theme colors as needed
  },
  dark: {
    background: 'hsl(222.2, 84%, 4.9%)',
    foreground: 'hsl(210, 40%, 98%)',
    primary: 'hsl(183, 100%, 35%)',
    'primary-foreground': 'hsl(222.2, 47.4%, 11.2%)',
    // Add other theme colors as needed
  },
} as const;

export type Theme = keyof typeof themeColors;
