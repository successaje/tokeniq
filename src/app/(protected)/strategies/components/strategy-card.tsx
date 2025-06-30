'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BarChart2, ArrowUpRight, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { StrategyMetricTooltip } from './strategy-metric-tooltip';
import { StrategyCardSkeleton } from './strategy-card-skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface StrategyCardProps {
  title: string;
  icon: React.ReactNode;
  allocation: number;
  summary: string;
  apy?: number;
  riskLevel?: 'Low' | 'Medium' | 'High';
  lastExecuted?: string;
  onPreview: () => void;
  onSchedule: () => void;
  isLoading?: boolean;
}

const getRiskColor = (risk?: string) => {
  switch (risk) {
    case 'Low': return 'bg-green-500';
    case 'Medium': return 'bg-yellow-500';
    case 'High': return 'bg-red-500';
    default: return 'bg-gray-300';
  }
}

export function StrategyCard({ 
  title, 
  icon, 
  allocation, 
  summary, 
  apy = 3.2,
  riskLevel = 'Medium',
  lastExecuted = '2h ago',
  onPreview, 
  onSchedule,
  isLoading = false
}: StrategyCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  if (isLoading) {
    return <StrategyCardSkeleton />;
  }
  return (
    <Card 
      className="group relative w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-labelledby={`strategy-${title.toLowerCase().replace(/\s+/g, '-')}-title`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
      
      <CardHeader className="relative z-10 flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start space-x-3">
          <div className="mt-0.5 rounded-xl bg-blue-100 p-2.5 text-blue-600 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:shadow-blue-500/20">
            {icon}
          </div>
          <div>
            <CardTitle 
              id={`strategy-${title.toLowerCase().replace(/\s+/g, '-')}-title`}
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </CardTitle>
            <div className="mt-1 flex items-center">
              <span className="inline-flex items-center text-sm text-gray-500">
                <span className={cn(
                  'mr-2 inline-block h-2 w-2 rounded-full',
                  getRiskColor(riskLevel)
                )} />
                {riskLevel} Risk
              </span>
              <StrategyMetricTooltip content="Risk level indicates the volatility and potential loss associated with this strategy">
                <span className="sr-only">Risk level information</span>
              </StrategyMetricTooltip>
            </div>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className="border-blue-100 bg-blue-50/80 text-sm font-medium text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-100"
              aria-label={`${allocation}% of your portfolio is allocated to this strategy`}
            >
              {allocation}% Allocation
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-white text-gray-700 shadow-lg">
            <p>{allocation}% of your portfolio is allocated to this strategy</p>
          </TooltipContent>
        </Tooltip>
      </CardHeader>
      
      <CardContent className="relative z-10 pb-4">
        <p className="text-sm text-gray-600">{summary}</p>
        
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Allocation Progress</span>
            <span className="font-medium text-gray-700">{allocation}%</span>
          </div>
          <Progress value={allocation} className="h-2 bg-gray-100" indicatorClassName="bg-blue-500" />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-blue-600 transition-colors hover:bg-blue-100">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            <span className="font-medium">{lastExecuted}</span>
            <StrategyMetricTooltip content="Last time this strategy was executed">
              <span className="sr-only">Last execution information</span>
            </StrategyMetricTooltip>
          </div>
          <div className="flex items-center rounded-full bg-green-50 px-3 py-1.5 text-green-600 transition-colors hover:bg-green-100">
            <BarChart2 className="mr-1.5 h-3.5 w-3.5" />
            <span className="font-medium">+{apy.toFixed(1)}% APY</span>
            <StrategyMetricTooltip content="Annual Percentage Yield - estimated yearly return based on past performance">
              <span className="sr-only">APY information</span>
            </StrategyMetricTooltip>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="relative z-10 flex justify-between border-t border-gray-100 pt-4">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onPreview}
            className="group/button relative overflow-hidden border-gray-200 bg-white text-gray-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
            aria-label={`Learn more about ${title} strategy`}
          >
            <span className="relative z-10 flex items-center">
              Details
              <ArrowUpRight className="ml-1 h-3.5 w-3.5 opacity-0 transition-all group-hover/button:ml-2 group-hover/button:opacity-100" />
            </span>
          </Button>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="More information"
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-white text-gray-700 shadow-lg">
              <p>View detailed metrics and performance history</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <Button 
          variant="default" 
          size="sm" 
          onClick={onSchedule}
          className="group/button relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm transition-all hover:shadow-md hover:shadow-blue-500/30"
          aria-label={`Schedule ${title} strategy`}
        >
          <Clock className="mr-2 h-4 w-4 transition-transform group-hover/button:animate-pulse" />
          <span className="relative z-10">Schedule</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
