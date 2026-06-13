'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Bot, Info, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type InsightType = 'info' | 'warning' | 'opportunity' | 'alert';

interface Insight {
  id: string;
  type: InsightType;
  decision: string;
  reasoning: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  expectedYield: string;
  timestamp: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const MOCK_INSIGHTS: Omit<Insight, 'id' | 'timestamp'>[] = [
  {
    type: 'opportunity',
    decision: 'Allocate to Arbitrum Stablecoin Vault',
    reasoning: 'Detected idle capital. The Arbitrum stablecoin vault is currently yielding above average rates with minimal impermanent loss risk.',
    riskLevel: 'Low',
    expectedYield: '8.5% - 10.2% APY',
    action: {
      label: 'Execute Allocation',
      onClick: () => console.log('Execute allocation')
    }
  },
  {
    type: 'warning',
    decision: 'Rebalance from ETH Staking to Liquidity Mining',
    reasoning: 'ETH price volatility is increasing. Rebalancing to a Delta-neutral strategy on Arbitrum DEXs will protect principal while capturing fee yield.',
    riskLevel: 'Medium',
    expectedYield: '12.0% - 15.5% APY',
    action: {
      label: 'View Strategy',
      onClick: () => console.log('View strategy')
    }
  }
];

const getInsightIcon = (type: InsightType) => {
  switch (type) {
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'opportunity':
      return <Sparkles className="w-4 h-4 text-blue-500" />;
    default:
      return <Info className="w-4 h-4 text-gray-500" />;
  }
};

export function ElizaOS() {
  const [isMinimized, setIsMinimized] = useState(true);
  const [currentInsight, setCurrentInsight] = useState<Insight | null>(null);
  const [insightQueue, setInsightQueue] = useState<Insight[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  // Initialize insights system
  useEffect(() => {
    console.log('ElizaOS initialized - insights system ready');
  }, []);

  // Simulate receiving new insights
  useEffect(() => {
    const interval = setInterval(() => {
      const randomInsight = MOCK_INSIGHTS[Math.floor(Math.random() * MOCK_INSIGHTS.length)];
      const newInsight: Insight = {
        ...randomInsight,
        id: Date.now().toString(),
        timestamp: Date.now()
      };
      
      setInsightQueue(prev => [...prev, newInsight]);
    }, 60000); // Every minute for demo purposes

    return () => clearInterval(interval);
  }, []);

  // Process the insight queue
  useEffect(() => {
    if (insightQueue.length > 0 && !currentInsight) {
      const [nextInsight, ...remainingInsights] = insightQueue;
      setCurrentInsight(nextInsight);
      setInsightQueue(remainingInsights);
      
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        setCurrentInsight(null);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [insightQueue, currentInsight]);

  const handleDismiss = useCallback(() => {
    setCurrentInsight(null);
  }, []); 

  const handleAction = useCallback((action: () => void) => {
    action();
    handleDismiss();
  }, [handleDismiss]);

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12 shadow-lg bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMinimized(false)}
        >
          <Bot className="w-5 h-5" />
          {insightQueue.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
              {insightQueue.length}
            </span>
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50 w-80"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-card/90 backdrop-blur-lg rounded-xl border shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b bg-card/50">
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">ElizaOS</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsMinimized(true)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          {currentInsight ? (
            <motion.div
              key={currentInsight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4"
            >
              <div className="flex items-start space-x-3">
                <div className={cn(
                  'flex-shrink-0 flex items-center justify-center mt-0.5',
                  {
                    'text-amber-500': currentInsight.type === 'warning',
                    'text-blue-500': currentInsight.type === 'opportunity',
                    'text-gray-500': currentInsight.type === 'info'
                  }
                )}>
                  {getInsightIcon(currentInsight.type)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-1">{currentInsight.decision}</div>
                  <p className="text-xs text-muted-foreground mb-3">{currentInsight.reasoning}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="bg-muted/30 p-1.5 rounded">
                      <span className="text-muted-foreground">Risk:</span> <span className={cn("font-medium", {
                        "text-green-500": currentInsight.riskLevel === 'Low',
                        "text-yellow-500": currentInsight.riskLevel === 'Medium',
                        "text-red-500": currentInsight.riskLevel === 'High'
                      })}>{currentInsight.riskLevel}</span>
                    </div>
                    <div className="bg-muted/30 p-1.5 rounded">
                      <span className="text-muted-foreground">Yield:</span> <span className="font-medium text-blue-500">{currentInsight.expectedYield}</span>
                    </div>
                  </div>
                  {currentInsight.action && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => currentInsight.action && handleAction(currentInsight.action.onClick)}
                    >
                      {currentInsight.action.label} <ArrowRight className="ml-1 w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 text-center text-sm text-muted-foreground"
            >
              <p>No new insights at the moment.</p>
              <p className="text-xs mt-1">I'll notify you when there's something important.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-3 py-2 bg-muted/30 text-xs text-muted-foreground flex justify-between items-center">
          <button 
            className="hover:text-foreground transition-colors"
            onClick={handleDismiss}
          >
            Dismiss
          </button>
          <div className="flex items-center space-x-2">
            {insightQueue.length > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {insightQueue.length}
              </span>
            )}
            <button 
              className="hover:text-foreground transition-colors"
              onClick={() => setCurrentInsight(insightQueue[0] || null)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
