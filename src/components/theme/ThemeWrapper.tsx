'use client';

import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';

type ThemeWrapperProps = {
  children: React.ReactNode;
  className?: string;
};

export function ThemeWrapper({ children, className }: ThemeWrapperProps) {
  const { mounted } = useTheme();

  if (!mounted) {
    return (
      <div className={cn('min-h-screen bg-background', className)}>
        <div className="flex h-screen w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-background text-foreground', className)}>
      {children}
    </div>
  );
}
