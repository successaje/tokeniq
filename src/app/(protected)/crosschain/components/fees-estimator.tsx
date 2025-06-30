'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, RefreshCw } from 'lucide-react';

// Mock data for fees and ETAs
const CHAIN_FEES = {
  ethereum: { baseFee: 0.005, perDollar: 0.001 },
  polygon: { baseFee: 0.001, perDollar: 0.0005 },
  bsc: { baseFee: 0.0005, perDollar: 0.0003 },
  arbitrum: { baseFee: 0.0003, perDollar: 0.0002 },
  optimism: { baseFee: 0.0004, perDollar: 0.0002 },
};

const CHAIN_ETAS = {
  ethereum: { min: 5, max: 15 },
  polygon: { min: 2, max: 5 },
  bsc: { min: 3, max: 7 },
  arbitrum: { min: 1, max: 3 },
  optimism: { min: 1, max: 3 },
};

type ChainId = keyof typeof CHAIN_FEES;

interface FeesEstimatorProps {
  fromChain: string;
  toChain: string;
  token: string;
  amount: number;
  isLoading?: boolean;
}

export function FeesEstimator({ 
  fromChain, 
  toChain, 
  token, 
  amount,
  isLoading = false 
}: FeesEstimatorProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [fees, setFees] = useState<{ total: number; breakdown: { label: string; value: number }[] } | null>(null);
  const [eta, setEta] = useState<{ min: number; max: number } | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Simulate API call to fetch fees and ETA
    const fetchFeesAndEta = async () => {
      try {
        setIsError(false);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In a real app, this would be an API call to get actual fees
        const fromChainLower = fromChain.toLowerCase() as ChainId;
        const toChainLower = toChain.toLowerCase() as ChainId;
        
        // Calculate fees based on mock data
        const baseFee = (CHAIN_FEES[fromChainLower]?.baseFee || 0.01) + (CHAIN_FEES[toChainLower]?.baseFee || 0.01);
        const amountFee = amount * ((CHAIN_FEES[fromChainLower]?.perDollar || 0.001) + (CHAIN_FEES[toChainLower]?.perDollar || 0.001));
        const totalFee = baseFee + amountFee;
        
        setFees({
          total: totalFee,
          breakdown: [
            { label: 'Base Fee', value: baseFee },
            { label: 'Amount Fee', value: amountFee },
          ],
        });
        
        // Get ETA based on mock data
        const fromEta = CHAIN_ETAS[fromChainLower] || { min: 2, max: 5 };
        const toEta = CHAIN_ETAS[toChainLower] || { min: 2, max: 5 };
        setEta({
          min: Math.max(fromEta.min, toEta.min),
          max: Math.max(fromEta.max, toEta.max),
        });
      } catch (error) {
        console.error('Error fetching fees:', error);
        setIsError(true);
      }
    };

    if (fromChain && toChain && amount > 0) {
      fetchFeesAndEta();
    } else {
      setFees(null);
      setEta(null);
    }
  }, [fromChain, toChain, amount]);

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,white)]"></div>
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            </div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Fees & Estimated Time
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,white)]"></div>
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Fees & Estimated Time
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 text-center py-8">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 rounded-full bg-red-500/10">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">Unable to load fee information</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              We couldn't fetch the latest fee estimates. Please check your connection and try again.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full -ml-32 -mb-32"></div>
      
      <CardHeader className="relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          </div>
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Fees & Estimated Time
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-6">
        <div className="bg-background/30 backdrop-blur-sm p-4 rounded-xl border border-border/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Estimated Fee</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[240px] p-3 bg-background/90 backdrop-blur-sm border-border/50 shadow-xl">
                    <p className="text-sm">
                      Includes network fees and bridge service charges. Actual fees may vary based on network conditions.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-right">
              <div className="font-mono font-medium text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {fees ? `$${fees.total.toFixed(4)}` : '--'}
              </div>
              {fees && (
                <div className="text-xs text-muted-foreground">
                  ~${(fees.total * 2500).toFixed(2)} in {token}
                </div>
              )}
            </div>
          </div>
          
          {fees && (
            <div className="space-y-2 pt-3 border-t border-border/20">
              {fees.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/60 mr-2"></div>
                    <span>{item.label}</span>
                  </div>
                  <span className="font-medium">${item.value.toFixed(4)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-background/30 backdrop-blur-sm p-4 rounded-xl border border-border/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Estimated Time</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[240px] p-3 bg-background/90 backdrop-blur-sm border-border/50 shadow-xl">
                    <p className="text-sm">
                      Estimated time for the transaction to be completed on the destination chain.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-right">
              {eta ? (
                <div className="font-medium text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {eta.min}-{eta.max} min
                </div>
              ) : (
                <div>--</div>
              )}
            </div>
          </div>
          
          {eta && (
            <div className="mt-4">
              <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, (eta.min / eta.max) * 100)}%` }}
                />
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500/40 to-cyan-500/40 rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
                  <span>Fastest</span>
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-cyan-500 mr-1"></div>
                  <span>Expected</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-background/30 backdrop-blur-sm p-4 rounded-xl border border-border/20">
          <div className="flex items-start">
            <svg className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-muted-foreground ml-2">
              Fees are estimates only and may vary based on network conditions. The final fee will be calculated at the time of the transaction.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
