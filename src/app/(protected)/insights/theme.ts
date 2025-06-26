export const theme = {
  colors: {
    primary: '#2563eb', // Indigo
    secondary: '#1e40af', // Dark Indigo
    success: '#10b981', // Emerald
    warning: '#f59e0b', // Amber
    danger: '#ef4444', // Rose
    info: '#3b82f6', // Blue
    muted: '#f3f4f6', // Gray 100
    dark: '#1f2937', // Gray 800
  },
  gradients: {
    primary: 'from-indigo-500 to-indigo-600',
    success: 'from-emerald-500 to-emerald-600',
    warning: 'from-amber-500 to-amber-600',
    danger: 'from-rose-500 to-rose-600',
    info: 'from-blue-500 to-blue-600',
  },
  shadows: {
    card: 'shadow-lg',
    hover: 'shadow-md hover:shadow-lg transition-shadow',
  },
  transitions: {
    fast: 'transition-all duration-200',
    smooth: 'transition-all duration-300',
  },
  animations: {
    fade: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    slideLeft: 'animate-slide-left',
    scale: 'animate-scale-in',
    hoverScale: 'hover:scale-105',
    hoverRotate: 'hover:rotate-[-2deg]',
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer',
    float: 'animate-float',
  },
};
