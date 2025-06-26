'use client';

import { Web3Provider } from './Web3Provider';
import { ThemeProviderWrapper } from '@/components/theme/ThemeProviderWrapper';
import { ContractProviderWrapper } from './ContractProviderWrapper';

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProviderWrapper>
      <Web3Provider>
        <ContractProviderWrapper>
          {children}
        </ContractProviderWrapper>
      </Web3Provider>
    </ThemeProviderWrapper>
  );
}