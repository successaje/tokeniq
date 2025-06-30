'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useNetwork } from '@/hooks/useNetwork';
import { CHAIN_NAMES } from '@/utils/networks';
import { useSwitchChain } from 'wagmi';

interface FeatureGuardProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGuard({
  feature,
  children,
  fallback,
}: FeatureGuardProps) {
  const { isFeatureAvailable, getChainForFeature, chain } = useNetwork();
  const { switchChain } = useSwitchChain();

  const isAvailable = isFeatureAvailable(feature);
  const targetChainId = getChainForFeature(feature);
  const targetChainName = CHAIN_NAMES[targetChainId] || 'required network';

  if (isAvailable) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h3 className="mb-2 text-lg font-semibold">Feature Not Available</h3>
      <p className="mb-4 text-muted-foreground">
        This feature is not available on {chain?.name || 'the current network'}. Please
        switch to {targetChainName} to continue.
      </p>
      <Button onClick={() => switchChain?.({ chainId: targetChainId }) as any}>
        Switch to {targetChainName}
      </Button>
    </div>
  );
}
