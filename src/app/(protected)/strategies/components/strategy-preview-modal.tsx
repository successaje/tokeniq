'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface StrategyPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: {
    title: string;
    description: string;
    allocation: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    apy: number;
    tvl: string;
    minLockPeriod: string;
  };
}

export function StrategyPreviewModal({ isOpen, onClose, strategy }: StrategyPreviewModalProps) {
  const riskColors = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-red-100 text-red-800',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{strategy.title}</DialogTitle>
          <div className="flex items-center space-x-2 pt-2">
            <Badge className={riskColors[strategy.riskLevel]}>{strategy.riskLevel} Risk</Badge>
            <Badge variant="outline" className="text-sm font-medium">
              {strategy.allocation}% Allocation
            </Badge>
            <Badge variant="secondary" className="text-sm font-medium">
              {strategy.apy}% APY
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <p className="text-muted-foreground">{strategy.description}</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Allocation Progress</span>
              <span className="text-sm text-muted-foreground">{strategy.allocation}% of portfolio</span>
            </div>
            <Progress value={strategy.allocation} className="h-2" />
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Total Value Locked</h4>
              <p className="text-lg font-semibold">{strategy.tvl}</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Min. Lock Period</h4>
              <p className="text-lg font-semibold">{strategy.minLockPeriod}</p>
            </div>
          </div>
          
          <div className="pt-4">
            <h4 className="text-sm font-medium mb-3">Strategy Allocation</h4>
            <div className="grid grid-cols-3 gap-4">
              {[
                { name: 'Stablecoins', value: '45%' },
                { name: 'Liquidity Pools', value: '30%' },
                { name: 'Yield Farming', value: '25%' },
              ].map((item) => (
                <div key={item.name} className="border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">{item.name}</p>
                  <p className="text-lg font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>Add to Portfolio</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
