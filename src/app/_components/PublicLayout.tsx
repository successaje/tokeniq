'use client';

import { ReactNode, useState } from 'react';
import { Header } from '@/components/layouts/Header';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Header 
        isMenuOpen={isMenuOpen} 
        onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
      />
      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  );
}
