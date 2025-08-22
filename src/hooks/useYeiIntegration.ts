import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { YeiService } from '@/services/yei/yeiService';
import { ElizaOS } from '@/services/eliza/ElizaOS';

type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

export function useYeiIntegration(riskProfile: RiskProfile = 'moderate') {
  const { address } = useAccount();
  const chainId = useChainId();
  const [eliza, setEliza] = useState<ElizaOS | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize ElizaOS with the current chain
  useEffect(() => {
    if (chainId) {
      setEliza(new ElizaOS(riskProfile, chainId));
    }
  }, [chainId, riskProfile]);

  // Optimize portfolio allocation
  const optimizePortfolio = useCallback(async (assets: { address: string; balance: string }[]) => {
    if (!eliza || !address) {
      throw new Error('Not connected or Eliza not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await eliza.optimizePortfolio(assets);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to optimize portfolio'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [eliza, address]);

  // Setup recurring payments
  const setupRecurringPayment = useCallback(async (
    token: string,
    recipients: { address: string; amount: string }[],
    interval: 'daily' | 'weekly' | 'monthly'
  ) => {
    if (!eliza) {
      throw new Error('Eliza not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await eliza.setupRecurringPayment(token, recipients, interval);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to setup recurring payment'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [eliza]);

  // Check risk exposure
  const checkRiskExposure = useCallback(async (asset: string) => {
    if (!eliza) {
      throw new Error('Eliza not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await eliza.checkRiskExposure(asset);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check risk exposure'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [eliza]);

  return {
    eliza,
    isLoading,
    error,
    optimizePortfolio,
    setupRecurringPayment,
    checkRiskExposure,
    isConnected: !!address,
    chainId,
  };
}
