'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight, Flame, TrendingUp, Zap, Activity, Database, Link2 } from 'lucide-react';
import { theme } from '../theme';

interface NewsItem {
  id: string;
  title: string;
  category: 'defi' | 'rwa' | 'chainlink' | 'sei' | 'market';
  timestamp: string;
  isHot?: boolean;
}

const newsItems: NewsItem[] = [
  {
    id: '1',
    title: 'Sei Network v2 upgrade brings parallel EVM execution',
    category: 'sei',
    timestamp: '2h ago',
    isHot: true
  },
  {
    id: '2',
    title: 'Yei Finance launches new BTCFi vault with 12.8% APY',
    category: 'defi',
    timestamp: '4h ago'
  },
  {
    id: '3',
    title: 'Chainlink CCIP now live on Base mainnet',
    category: 'chainlink',
    timestamp: '6h ago'
  },
  {
    id: '4',
    title: 'RWA tokenization volume hits $1B milestone',
    category: 'rwa',
    timestamp: '1d ago'
  },
  {
    id: '5',
    title: 'BTC breaks $45k as ETF inflows continue',
    category: 'market',
    timestamp: '1d ago',
    isHot: true
  },
  {
    id: '6',
    title: 'DeFi TVL surges 12% in past week',
    category: 'defi',
    timestamp: '2d ago'
  },
  {
    id: '7',
    title: 'Sei ecosystem fund announces $50M grants program',
    category: 'sei',
    timestamp: '2d ago',
    isHot: true
  },
  {
    id: '8',
    title: 'Chainlink staking v0.3 launches with 5% APY',
    category: 'chainlink',
    timestamp: '3d ago'
  },
  {
    id: '9',
    title: 'BlackRock files for new tokenized money market fund',
    category: 'rwa',
    timestamp: '3d ago'
  },
  {
    id: '10',
    title: 'Ethereum L2s hit all-time high in daily transactions',
    category: 'market',
    timestamp: '4d ago'
  }
];

const categoryIcons = {
  defi: <TrendingUp className="h-3.5 w-3.5" />,
  rwa: <Database className="h-3.5 w-3.5" />,
  chainlink: <Link2 className="h-3.5 w-3.5" />,
  sei: <Zap className="h-3.5 w-3.5" />,
  market: <Activity className="h-3.5 w-3.5" />
};

const categoryColors = {
  defi: 'bg-purple-100 text-purple-800',
  rwa: 'bg-amber-100 text-amber-800',
  chainlink: 'bg-blue-100 text-blue-800',
  sei: 'bg-indigo-100 text-indigo-800',
  market: 'bg-emerald-100 text-emerald-800'
};

export function NewsTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const currentItem = newsItems[currentIndex];
  
  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % newsItems.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [isPaused]);
  
  return (
    <div 
      className={cn(
        "w-full bg-background border rounded-lg overflow-hidden",
        theme.transitions.smooth,
        "hover:shadow-md"
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="px-4 py-2 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
            categoryColors[currentItem.category]
          )}>
            {categoryIcons[currentItem.category]}
            {currentItem.category.toUpperCase()}
          </div>
          {currentItem.isHot && (
            <div className="flex items-center gap-1 bg-rose-100 text-rose-800 px-2 py-1 rounded-md text-xs font-medium">
              <Flame className="h-3.5 w-3.5" />
              HOT
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentItem.title}</p>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{currentItem.timestamp}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
      
      <div className="w-full bg-muted h-1">
        <div 
          className={cn(
            "h-full bg-primary transition-all duration-5000 ease-linear",
            isPaused ? 'bg-opacity-50' : ''
          )}
          style={{ width: isPaused ? '100%' : '0%' }}
        />
      </div>
    </div>
  );
}
