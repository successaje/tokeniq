import { useState, useEffect, useCallback, useMemo } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { useVaults } from './useVaults';
import { useVaultMetrics } from './useVaultMetrics';
import { VaultType } from '@/types/contracts';

// Types for analytics data
export interface VaultPerformancePoint {
  timestamp: number;
  value: number; // Price per share or TVL
  apy: number;
  blockNumber: number;
}

export interface VaultAnalytics {
  // Performance data points (hourly/daily)
  performanceData: VaultPerformancePoint[];
  
  // Performance metrics
  currentApy: number;
  avgApy7d: number;
  avgApy30d: number;
  highApy: number;
  lowApy: number;
  
  // TVL metrics
  currentTvl: bigint;
  tvlChange7d: number; // Percentage
  tvlChange30d: number; // Percentage
  
  // User metrics (if connected)
  userShareOfTvl: number; // 0-100%
  userProfitLoss: number; // In USD
  
  // Loading states
  isLoading: boolean;
  lastUpdated: number | null;
}

type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

type UseVaultAnalyticsProps = {
  vaultAddress: Address;
  timeRange?: TimeRange;
  refreshInterval?: number; // in milliseconds
};

// Mock data generator for development
const generateMockPerformanceData = (
  timeRange: TimeRange = '30d',
  initialValue: number = 1.0,
  volatility: number = 0.02
): VaultPerformancePoint[] => {
  const now = Math.floor(Date.now() / 1000);
  let points: number;
  let interval: number;
  
  switch (timeRange) {
    case '24h':
      points = 24; // Hourly for 24h
      interval = 3600; // 1 hour
      break;
    case '7d':
      points = 7; // Daily for 7d
      interval = 86400; // 1 day
      break;
    case '30d':
      points = 30; // Daily for 30d
      interval = 86400; // 1 day
      break;
    case '90d':
      points = 12; // Weekly for 90d
      interval = 604800; // 1 week
      break;
    case 'all':
    default:
      points = 12; // Monthly for all time
      interval = 2592000; // 30 days
  }
  
  const data: VaultPerformancePoint[] = [];
  let currentValue = initialValue;
  
  for (let i = points - 1; i >= 0; i--) {
    // Random walk for price
    const change = (Math.random() * 2 - 1) * volatility;
    currentValue = currentValue * (1 + change);
    
    // Ensure value doesn't go below 0.1
    currentValue = Math.max(0.1, currentValue);
    
    // Generate APY between 2% and 15%
    const apy = 2 + Math.random() * 13;
    
    data.push({
      timestamp: now - (i * interval),
      value: currentValue,
      apy,
      blockNumber: 0, // Not used in mock
    });
  }
  
  return data;
};

export function useVaultAnalytics({
  vaultAddress,
  timeRange = '30d',
  refreshInterval = 30000, // 30 seconds
}: UseVaultAnalyticsProps) {
  const { address } = useAccount();
  const { getVault } = useVaults();
  const { metrics, refresh: refreshMetrics } = useVaultMetrics({
    vaultAddress,
    refreshInterval,
  });
  
  const [analytics, setAnalytics] = useState<VaultAnalytics>({
    performanceData: [],
    currentApy: 0,
    avgApy7d: 0,
    avgApy30d: 0,
    highApy: 0,
    lowApy: 0,
    currentTvl: BigInt(0),
    tvlChange7d: 0,
    tvlChange30d: 0,
    userShareOfTvl: 0,
    userProfitLoss: 0,
    isLoading: true,
    lastUpdated: null,
  });
  
  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    try {
      const vault = getVault(vaultAddress);
      if (!vault) return;
      
      // In a real implementation, this would fetch historical data from a subgraph or API
      // For now, we'll generate mock data
      const mockData = generateMockPerformanceData(timeRange, 1.0, 0.02);
      
      // Calculate metrics from the mock data
      const currentApy = mockData[mockData.length - 1]?.apy || 0;
      const apyValues = mockData.map(d => d.apy);
      const avgApy7d = apyValues.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, apyValues.length);
      const avgApy30d = apyValues.slice(-30).reduce((a, b) => a + b, 0) / Math.min(30, apyValues.length);
      const highApy = Math.max(...apyValues);
      const lowApy = Math.min(...apyValues);
      
      // Calculate TVL changes (mock)
      const tvlChange7d = (Math.random() * 20) - 5; // -5% to +15%
      const tvlChange30d = (Math.random() * 40) - 10; // -10% to +30%
      
      // Calculate user metrics if connected
      let userShareOfTvl = 0;
      let userProfitLoss = 0;
      
      if (address) {
        // Mock user metrics
        userShareOfTvl = Math.random() * 10; // 0-10%
        userProfitLoss = (Math.random() * 1000) - 100; // -100 to +900
      }
      
      setAnalytics({
        performanceData: mockData,
        currentApy,
        avgApy7d,
        avgApy30d,
        highApy,
        lowApy,
        currentTvl: metrics.tvl,
        tvlChange7d,
        tvlChange30d,
        userShareOfTvl,
        userProfitLoss,
        isLoading: false,
        lastUpdated: Date.now(),
      });
      
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
      setAnalytics(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [vaultAddress, timeRange, address, getVault, metrics.tvl]);
  
  // Set up polling for data refresh
  useEffect(() => {
    // Initial fetch
    fetchPerformanceData();
    
    // Set up interval for polling
    const intervalId = setInterval(fetchPerformanceData, refreshInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchPerformanceData, refreshInterval]);
  
  // Get chart data for the selected time range
  const chartData = useMemo(() => {
    if (!analytics.performanceData.length) return [];
    
    return analytics.performanceData.map(point => ({
      date: new Date(point.timestamp * 1000),
      value: point.value,
      apy: point.apy,
    }));
  }, [analytics.performanceData]);
  
  // Get TVL chart data
  const tvlChartData = useMemo(() => {
    if (!analytics.performanceData.length) return [];
    
    // In a real app, this would be actual TVL data
    // For now, we'll generate it based on the performance data
    return analytics.performanceData.map((point, i) => {
      // Simulate TVL growth based on APY
      const daysAgo = (analytics.performanceData.length - i - 1) / 24; // Approximate days
      const growthFactor = Math.pow(1 + (point.apy / 100 / 365), daysAgo);
      const tvl = Number(metrics.tvl) * growthFactor * (0.8 + Math.random() * 0.4); // Add some noise
      
      return {
        date: new Date(point.timestamp * 1000),
        value: tvl,
      };
    });
  }, [analytics.performanceData, metrics.tvl]);
  
  // Get APY chart data
  const apyChartData = useMemo(() => {
    if (!analytics.performanceData.length) return [];
    
    return analytics.performanceData.map(point => ({
      date: new Date(point.timestamp * 1000),
      value: point.apy,
    }));
  }, [analytics.performanceData]);
  
  return {
    // State
    ...analytics,
    
    // Chart data
    chartData,
    tvlChartData,
    apyChartData,
    
    // Actions
    refresh: fetchPerformanceData,
    
    // Time range utilities
    timeRange,
    setTimeRange: (newRange: TimeRange) => {
      // This would trigger a refetch with the new time range
      fetchPerformanceData();
    },
  };
}
