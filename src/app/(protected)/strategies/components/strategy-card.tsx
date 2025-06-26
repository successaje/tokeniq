'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BarChart2 } from 'lucide-react';

interface StrategyCardProps {
  title: string;
  icon: React.ReactNode;
  allocation: number;
  summary: string;
  onPreview: () => void;
  onSchedule: () => void;
}

export function StrategyCard({ 
  title, 
  icon, 
  allocation, 
  summary, 
  onPreview, 
  onSchedule 
}: StrategyCardProps) {
  return (
    <Card className="w-full max-w-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <CardTitle className="text-lg font-semibold">
            {title}
          </CardTitle>
        </div>
        <Badge variant="outline" className="text-sm font-medium">
          {allocation}% Allocation
        </Badge>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground">{summary}</p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Clock className="mr-1.5 h-4 w-4" />
            <span>Last executed: 2h ago</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <BarChart2 className="mr-1.5 h-4 w-4" />
            <span>+3.2% APY</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button variant="outline" size="sm" onClick={onPreview}>
          Preview
        </Button>
        <Button variant="outline" size="sm" onClick={onSchedule}>
          <Clock className="mr-2 h-4 w-4" />
          Schedule
        </Button>
      </CardFooter>
    </Card>
  );
}
