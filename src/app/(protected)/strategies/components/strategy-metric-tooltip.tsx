'use client'

import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface StrategyMetricTooltipProps {
  content: string
  children?: React.ReactNode
}

export function StrategyMetricTooltip({ content, children }: StrategyMetricTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help items-center">
            {children}
            <Info className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[250px] bg-white p-3 text-sm text-foreground shadow-lg">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
