'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button';
import { useEffect, useState } from 'react';

type ThemeSwitcherProps = {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export function ThemeSwitcher({
  className,
  size = 'default',
  variant = 'ghost',
}: ThemeSwitcherProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        aria-label="Loading theme"
      >
        <div className="h-5 w-5" />
      </Button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={className}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">
        {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>
    </Button>
  );
}
