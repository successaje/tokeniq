'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Calendar, Brain } from 'lucide-react';
import { theme } from '../theme';

interface StrategyCardProps {
  title: string;
  allocation: string;
  rebalanceDate: string;
  onClick?: () => void;
  onEdit?: () => void;
  onSchedule?: () => void;
}

export function StrategyCard({
  title,
  allocation,
  rebalanceDate,
  onClick,
  onEdit,
  onSchedule,
}: StrategyCardProps) {
  return (
    <Card 
      className={cn(
        "flex flex-col h-full",
        theme.animations.fade,
        theme.transitions.smooth,
        "hover:shadow-xl"
      )}
      onMouseEnter={(e) => e.currentTarget.classList.add(theme.animations.hoverScale)}
      onMouseLeave={(e) => e.currentTarget.classList.remove(theme.animations.hoverScale)}
    >
      <CardHeader className={cn(
        "flex flex-row items-center justify-between p-4",
        theme.transitions.smooth
      )}>
        <div className="flex items-center gap-2">
          <Check className={cn(
            "h-4 w-4 text-emerald-500",
            theme.animations.pulse
          )} />
          <CardTitle className={cn(
            "text-lg font-semibold",
            theme.transitions.smooth
          )}>{title}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm text-muted-foreground",
            theme.transitions.smooth
          )}>{allocation}</span>
          <span className={cn(
            "px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full",
            theme.animations.hoverRotate
          )}>
            <Brain className="h-3 w-3 inline-block mr-1" />
            AI-Generated
          </span>
        </div>
      </CardHeader>
      <CardContent className={cn(
        "flex flex-col justify-between flex-1 p-4",
        theme.transitions.smooth
      )}>
        <div>
          <div className={cn(
            "flex items-center gap-2 mb-2",
            theme.transitions.smooth
          )}>
            <Calendar className={cn(
              "h-4 w-4 text-muted-foreground",
              theme.animations.pulse
            )} />
            <span className={cn(
              "text-sm text-muted-foreground",
              theme.transitions.smooth
            )}>Suggested rebalance: {rebalanceDate}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="default"
            size="sm"
            onClick={onClick}
            className={cn(
              "flex-1",
              theme.transitions.smooth,
              theme.animations.hoverScale
            )}
          >
            Accept
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className={cn(
              "flex-1",
              theme.transitions.smooth,
              theme.animations.hoverScale
            )}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSchedule}
            className={cn(
              "flex-1",
              theme.transitions.smooth,
              theme.animations.hoverScale
            )}
          >
            Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
