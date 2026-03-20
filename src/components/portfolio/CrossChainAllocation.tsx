'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Network, ArrowRightRight, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function CrossChainAllocation() {
  const [isAllocating, setIsAllocating] = useState(false);
  const [hasAllocated, setHasAllocated] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleAllocate = () => {
    setIsAllocating(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate XCM routing process
    setTimeout(() => {
      setIsAllocating(false);
      setHasAllocated(true);
      toast.success('Funds allocated across Polkadot parachains', {
        description: 'XCM transfer executed successfully.',
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      });
    }, 2500);
  };

  return (
    <Card className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border-purple-500/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-purple-500" />
          <CardTitle className="text-xl font-bold">Cross-Chain Allocation (XCM)</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Automated treasury distribution via Polkadot Hub
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-pink-500" />
                Moonbeam
              </span>
              <span>20%</span>
            </div>
            <Progress value={20} className="h-2 bg-muted/50 [&>div]:bg-pink-500" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Astar
              </span>
              <span>15%</span>
            </div>
            <Progress value={15} className="h-2 bg-muted/50 [&>div]:bg-blue-500" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                Acala
              </span>
              <span>25%</span>
            </div>
            <Progress value={25} className="h-2 bg-muted/50 [&>div]:bg-red-500" />
          </div>
        </div>

        <div className="pt-2">
          <Button
            className="w-full relative overflow-hidden group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            onClick={handleAllocate}
            disabled={isAllocating || hasAllocated}
          >
            {isAllocating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Routing funds via XCM... ({progress}%)
              </>
            ) : hasAllocated ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Optimization Complete
              </>
            ) : (
              <>
                <ArrowRightRight className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                Allocate Across Chains
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
