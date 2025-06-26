'use client';

import { ContractProvider } from '@/contexts/ContractContext';

export function ContractProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ContractProvider>
      {children}
    </ContractProvider>
  );
}
