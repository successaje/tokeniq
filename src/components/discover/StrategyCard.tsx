import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, BarChart2, Zap, Shield, ArrowDownRight, Network, TrendingUp, PieChart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StrategyRisk = 'low' | 'medium' | 'high';

interface StrategyCardProps {
  title: string;
  description: string;
  apr: number;
  risk: StrategyRisk;
  tvl: string;
  chain: string;
  className?: string;
  onSelect?: () => void;
}

export function StrategyCard({
  title,
  description,
  apr,
  risk,
  tvl,
  chain,
  className,
  onSelect,
}: StrategyCardProps) {
  const riskData = {
    low: {
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      icon: <Shield className="w-4 h-4" />,
      label: 'Low Risk'
    },
    medium: {
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      icon: <BarChart2 className="w-4 h-4" />,
      label: 'Medium Risk'
    },
    high: {
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      icon: <Zap className="w-4 h-4" />,
      label: 'High Risk'
    },
  };

  const riskInfo = riskData[risk];
  const isProfitable = apr > 5; // Example condition for profit indicator

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300 }}
      onClick={onSelect}
      className={cn("relative group w-full h-full", className)}
    >
      <Card 
        className={cn(
          "h-full p-4 sm:p-5 bg-gradient-to-br from-card to-card/80 border border-border/30",
          "transition-all duration-300 hover:shadow-lg hover:border-primary/20 overflow-hidden"
        )}
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <div className="relative z-10 h-full flex flex-col">
          {/* Header with title and risk */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent break-words max-w-[70%]">
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap",
                riskInfo.color
              )}>
                {riskInfo.icon}
                <span className="hidden sm:inline">{riskInfo.label}</span>
              </span>
            </div>
          </div>
          
          {/* Description */}
          <p className="text-muted-foreground text-xs sm:text-sm mb-4 line-clamp-2 break-words flex-grow">
            {description}
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {apr}%
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">APY</div>
            </div>
            
            <div className="space-y-0.5">
              <div className="text-sm sm:text-base font-medium">{tvl}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">TVL</div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-sm sm:text-base font-medium">
                <Network className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground/70" />
                {chain}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Network</div>
            </div>
          </div>
          
          {/* Performance */}
          <div className="mt-auto pt-3 border-t border-border/20">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground mb-1.5">
              <span>Performance (30d)</span>
              <div className="flex items-center gap-1">
                {isProfitable ? (
                  <>
                    <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500 font-medium">+{Math.floor(Math.random() * 15) + 5}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-3 h-3 text-rose-500" />
                    <span className="text-rose-500 font-medium">-{Math.floor(Math.random() * 5) + 1}%</span>
                  </>
                )}
              </div>
            </div>
            <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  isProfitable ? "bg-emerald-500" : "bg-rose-500"
                )}
                style={{ width: `${isProfitable ? 70 + Math.random() * 20 : 30 + Math.random() * 20}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
