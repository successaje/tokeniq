import { cn } from '@/lib/utils';
import { BackgroundVariant, getBackgroundVariant, getBorderVariant, getTextVariant } from '@/lib/utils';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BackgroundVariant;
  withBorder?: boolean;
  withHover?: boolean;
}

export function Surface({
  className,
  variant = 'default',
  withBorder = true,
  withHover = false,
  children,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(
        getBackgroundVariant(variant),
        getTextVariant(variant),
        withBorder && getBorderVariant(variant),
        withBorder && 'border',
        withHover && 'hover:opacity-90 transition-opacity',
        'rounded-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
