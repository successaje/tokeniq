'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamically import ClientLayout with no SSR
const ClientLayout = dynamic(
  () => import('./ClientLayout').then((mod) => mod.default || mod),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    ),
  }
);

export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
