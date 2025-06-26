'use client';

import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import Image, { type ImageProps } from 'next/image';
import { useEffect, useState } from 'react';

type ThemeAvatarProps = Omit<ImageProps, 'src' | 'alt'> & {
  lightSrc: string;
  darkSrc: string;
  alt: string;
};

export function ThemeAvatar({
  lightSrc,
  darkSrc,
  alt,
  className,
  ...props
}: ThemeAvatarProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('bg-muted rounded-full', className)}>
        <div className="h-full w-full animate-pulse rounded-full bg-muted-foreground/20" />
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-full', className)}>
      <Image
        {...props}
        src={resolvedTheme === 'dark' ? darkSrc : lightSrc}
        alt={alt}
        className={cn('h-full w-full object-cover', className)}
        aria-hidden="true"
        onError={(e) => {
          // Fallback to light theme image if dark theme image fails to load
          if (e.currentTarget.src !== lightSrc) {
            e.currentTarget.src = lightSrc;
          }
        }}
      />
      <span className="sr-only">{alt}</span>
    </div>
  );
}
