'use client';

import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { CSSProperties, ReactNode, useEffect, useRef } from 'react';

type ThemeBackgroundProps = {
  /** The background content to render */
  children?: ReactNode;
  /** Additional class names */
  className?: string;
  /** Styles for light theme */
  lightStyles?: CSSProperties;
  /** Styles for dark theme */
  darkStyles?: CSSProperties;
  /** Whether to apply a subtle noise texture */
  noise?: boolean;
  /** Opacity of the noise texture (0-1) */
  noiseOpacity?: number;
  /** Whether to apply a gradient overlay */
  gradient?: boolean;
  /** Gradient colors for light theme [from, to] */
  lightGradient?: [string, string];
  /** Gradient colors for dark theme [from, to] */
  darkGradient?: [string, string];
  /** Gradient direction in degrees (0-360) */
  gradientDirection?: number;
};

/**
 * A theme-aware background component that can apply different styles based on the current theme.
 * Supports noise textures, gradients, and custom styles for light/dark modes.
 */
export function ThemeBackground({
  children,
  className,
  lightStyles = {},
  darkStyles = {},
  noise = false,
  noiseOpacity = 0.05,
  gradient = false,
  lightGradient = ['#ffffff', '#f8fafc'],
  darkGradient = ['#020817', '#0f172a'],
  gradientDirection = 180,
}: ThemeBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const ref = useRef<HTMLDivElement>(null);

  // Apply dynamic styles based on theme
  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    
    // Apply gradient background if enabled
    if (gradient) {
      const [from, to] = isDark ? darkGradient : lightGradient;
      element.style.background = `linear-gradient(${gradientDirection}deg, ${from} 0%, ${to} 100%)`;
    }
    
    // Apply noise texture if enabled
    if (noise) {
      element.style.setProperty('--noise-opacity', noiseOpacity.toString());
      
      // Create canvas for noise texture
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        
        // Generate noise pattern
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const value = Math.random() * 255;
          data[i] = value;     // R
          data[i + 1] = value; // G
          data[i + 2] = value; // B
          data[i + 3] = 255;   // A
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Apply noise as background image
        const noiseDataUrl = canvas.toDataURL();
        element.style.backgroundImage = `url("${noiseDataUrl}")`;
      }
    }
    
    return () => {
      // Cleanup
      if (gradient) {
        element.style.background = '';
      }
      if (noise) {
        element.style.backgroundImage = '';
      }
    };
  }, [isDark, gradient, noise, lightGradient, darkGradient, gradientDirection, noiseOpacity]);

  return (
    <div
      ref={ref}
      className={cn(
        'relative h-full w-full transition-colors duration-200',
        noise && 'before:absolute before:inset-0 before:opacity-[--noise-opacity] before:content-[""]',
        className
      )}
      style={isDark ? darkStyles : lightStyles}
    >
      {children}
    </div>
  );
}

/**
 * A container component that applies theme-aware background styles to its children.
 * This is a simpler alternative to ThemeBackground with fewer customization options.
 */
export function ThemeContainer({
  children,
  className,
  withBackground = true,
  withPadding = true,
}: {
  children: ReactNode;
  className?: string;
  withBackground?: boolean;
  withPadding?: boolean;
}) {
  return (
    <div
      className={cn(
        'min-h-screen w-full',
        withBackground && 'bg-background text-foreground',
        withPadding && 'p-4 sm:p-6 md:p-8',
        className
      )}
    >
      {children}
    </div>
  );
}
