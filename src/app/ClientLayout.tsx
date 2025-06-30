'use client';

import { useEffect, useState, ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import providers to avoid SSR issues
const AppProviders = dynamic(
  () => import('./Providers').then(mod => mod.AppProviders),
  { ssr: false }
);

// Create a client-side only wrapper for the app content
const ClientApp = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
};

interface ClientLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function ClientLayout({ 
  children, 
  className = '' 
}: ClientLayoutProps) {
  // Use a state to track if we're on the client
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything on the server
  if (!isClient) {
    return null;
  }

  return (
    <AppProviders>
      <ClientApp>
        {children}
      </ClientApp>
    </AppProviders>
  );
}
