'use client';

import { createContext, useContext, ReactNode } from 'react';
import { ElizaOS } from '@/components/eliza/ElizaOS';

interface ElizaContextType {
  // Add any methods you want to expose to other components
  showInsight: (message: string, type?: 'info' | 'warning' | 'opportunity') => void;
}

const ElizaContext = createContext<ElizaContextType | undefined>(undefined);

export function ElizaProvider({ children }: { children: ReactNode }) {
  // In a real implementation, you might want to manage some state here
  // and provide methods to interact with ElizaOS from other components
  
  const showInsight = (message: string, type: 'info' | 'warning' | 'opportunity' = 'info') => {
    // This is a placeholder - in a real app, you'd dispatch an action
    // to show the insight in the ElizaOS component
    console.log(`[ElizaOS] ${type}: ${message}`);
  };

  return (
    <ElizaContext.Provider value={{ showInsight }}>
      {children}
      <ElizaOS />
    </ElizaContext.Provider>
  );
}

export function useEliza() {
  const context = useContext(ElizaContext);
  if (context === undefined) {
    throw new Error('useEliza must be used within an ElizaProvider');
  }
  return context;
}
