'use client';

import { Web3Provider } from './Web3Provider';
import { ThemeProviderWrapper } from '@/components/theme/ThemeProviderWrapper';
import { ContractProviderWrapper } from './ContractProviderWrapper';
import { TooltipProvider } from '@/components/ui/tooltip';

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProviderWrapper>
      <Web3Provider>
        <ContractProviderWrapper>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ContractProviderWrapper>
      </Web3Provider>
    </ThemeProviderWrapper>
  );
}