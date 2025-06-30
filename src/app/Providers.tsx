'use client';

import React from 'react';
import { ReactNode, useEffect, useState, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { PublicLayout } from './_components/PublicLayout';
import { Providers } from '@/components/providers/Providers';
import { Toaster } from '@/components/ui/toaster';
import { ThemeVariables } from '@/components/theme/ThemeVariables';

interface AppProvidersProps {
  children: ReactNode;
}

// Error boundary component
class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AppProviders error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="mb-4">We're working on fixing this issue. Please try again later.</p>
            <button
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AppProviders({ children }: AppProvidersProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  // Wait until after client-side hydration to show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until we're on the client side
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isPublicRoute = pathname === '/' || 
    (pathname?.startsWith('/(public)') ?? false) ||
    !pathname?.startsWith('/protected');

  return (
    <ErrorBoundary>
      <Suspense 
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        }
      >
        <Providers>
          <ThemeVariables />
          {isPublicRoute ? (
            <PublicLayout>{children}</PublicLayout>
          ) : (
            <div className="flex min-h-screen flex-col">
              {children}
            </div>
          )}
          <Toaster />
        </Providers>
      </Suspense>
    </ErrorBoundary>
  );
}
