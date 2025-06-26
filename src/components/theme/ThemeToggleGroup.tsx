'use client';

import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

type ThemeOption = 'light' | 'dark' | 'system';

type ThemeToggleGroupProps = {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ThemeToggleGroup({
  className,
  variant = 'outline',
  size = 'default',
}: ThemeToggleGroupProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(
    theme as ThemeOption || 'system'
  );

  useEffect(() => {
    setMounted(true);
    // Ensure we have a valid theme set
    if (theme && ['light', 'dark', 'system'].includes(theme)) {
      setSelectedTheme(theme as ThemeOption);
    }
  }, [theme]);

  if (!mounted) {
    return (
      <div className={cn('flex items-center space-x-1', className)}>
        {['light', 'system', 'dark'].map((t) => (
          <Button
            key={t}
            variant={variant}
            size={size}
            className="h-9 w-9 p-0"
            aria-label={`Set theme to ${t}`}
          >
            <div className="h-4 w-4" />
          </Button>
        ))}
      </div>
    );
  }

  const themes: { value: ThemeOption; icon: React.ReactNode; label: string }[] = [
    {
      value: 'light',
      icon: <Sun className="h-4 w-4" />,
      label: 'Light',
    },
    {
      value: 'system',
      icon: <Laptop className="h-4 w-4" />,
      label: 'System',
    },
    {
      value: 'dark',
      icon: <Moon className="h-4 w-4" />,
      label: 'Dark',
    },
  ];

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {themes.map(({ value, icon, label }) => (
        <Button
          key={value}
          variant={selectedTheme === value ? 'default' : variant}
          size={size}
          className={cn(
            'h-9 w-9 p-0',
            selectedTheme === value && 'bg-primary text-primary-foreground'
          )}
          onClick={() => {
            setTheme(value);
            setSelectedTheme(value);
          }}
          aria-label={`Set theme to ${label}`}
          aria-pressed={selectedTheme === value}
        >
          {icon}
          <span className="sr-only">{label} theme</span>
        </Button>
      ))}
    </div>
  );
}
