import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  variant?: 'default' | 'gradient';
}

export function Card({
  children,
  className,
  title,
  subtitle,
  icon,
  footer,
  variant = 'default'
}: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl shadow-soft overflow-hidden',
        variant === 'gradient' 
          ? 'bg-gradient-to-br from-primary-600 to-primary-800'
          : 'bg-gray-800',
        className
      )}
    >
      {(title || subtitle || icon) && (
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center space-x-4">
            {icon && (
              <div className="flex-shrink-0">
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-white">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-300">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="p-6">{children}</div>
      
      {footer && (
        <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-700/50">
          {footer}
        </div>
      )}
    </div>
  );
} 