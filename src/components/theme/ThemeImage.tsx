'use client';

import Image, { ImageProps } from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type ThemeImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  /** The image source for light theme */
  lightSrc: string | StaticImageData;
  /** The image source for dark theme */
  darkSrc?: string | StaticImageData;
  /** Alt text for the image (required for accessibility) */
  alt: string;
  /** Whether to disable theme switching for this image */
  disableTheming?: boolean;
};

/**
 * A theme-aware image component that automatically switches between light and dark variants
 * based on the current theme.
 */
export function ThemeImage({
  lightSrc,
  darkSrc,
  alt,
  className = '',
  disableTheming = false,
  onError,
  ...props
}: ThemeImageProps) {
  const { resolvedTheme } = useTheme();
  const [currentSrc, setCurrentSrc] = useState<string | StaticImageData>(
    disableTheming ? lightSrc : resolvedTheme === 'dark' && darkSrc ? darkSrc : lightSrc
  );
  const [hasError, setHasError] = useState(false);

  // Update source when theme changes
  useEffect(() => {
    if (!disableTheming) {
      setCurrentSrc(resolvedTheme === 'dark' && darkSrc ? darkSrc : lightSrc);
      setHasError(false);
    }
  }, [resolvedTheme, lightSrc, darkSrc, disableTheming]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Fall back to light source if dark source fails to load
    if (!disableTheming && currentSrc === darkSrc && !hasError) {
      setCurrentSrc(lightSrc);
      setHasError(true);
    }
    
    // Call the original onError handler if provided
    if (onError) {
      onError(e);
    }
  };

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}

/**
 * Creates a theme-aware image component with pre-defined light and dark variants.
 * This is a convenience function to reduce boilerplate when using the same image in both themes.
 */
export function createThemedImage(
  lightSrc: string | StaticImageData,
  darkSrc?: string | StaticImageData
) {
  return function ThemedImage({
    className,
    disableTheming = false,
    ...props
  }: Omit<ThemeImageProps, 'lightSrc' | 'darkSrc'>) {
    return (
      <ThemeImage
        lightSrc={lightSrc}
        darkSrc={darkSrc}
        className={className}
        disableTheming={disableTheming}
        {...props}
      />
    );
  };
}
