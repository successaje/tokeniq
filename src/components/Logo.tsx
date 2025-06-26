'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className, width = 32, height = 32 }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === 'dark' ? '/tokeniq-darkmode-logo.png' : '/tokeniq-lightmode-logo.png';

  return (
    <div className={cn('relative', className)}>
      <Image
        src={logoSrc}
        alt="TokenIQ Logo"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
} 