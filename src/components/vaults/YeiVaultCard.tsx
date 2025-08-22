import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultCard, type VaultCardProps } from './VaultCard';
import { useYeiIntegration } from '@/hooks/useYeiIntegration';
import { Loader2, Zap, ArrowRight, BarChart2 } from 'lucide-react';
import { formatEther, parseEther } from 'viem';

type YeiVaultCardProps = VaultCardProps & {
  // Additional Yei-specific props can be added here
};

export function YeiVaultCard({ vault, ...props }: YeiVaultCardProps) {
  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { optimizePortfolio, isLoading } = useYeiIntegration();
  
  // Determine the strategy details based on vault ID
  const strategyDetails = vault.id.includes('btc') ? {
    allocations: [
      { name: 'Yei Lending Pool', percentage: 60, color: 'bg-blue-500' },
      { name: 'Yei Staking Pool', percentage: 40, color: 'bg-purple-500' }
    ],
    description: 'Automatically allocates 60% to Yei Lending for stable yield and 40% to Yei Staking for additional rewards.',
    risk: 'Medium',
    apy: vault.apy || 0
  } : {
    allocations: [
      { name: 'Yei Money Market', percentage: 100, color: 'bg-green-500' }
    ],
    description: 'Optimizes yield through Yei Money Market protocols with automated risk management.',
    risk: 'Low',
    apy: vault.apy || 0
  };

  const handleDeposit = async () => {
    if (!amount || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // In a real implementation, this would interact with Yei contracts
      // For now, we'll simulate the deposit
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // After successful deposit, optimize the portfolio
      await optimizePortfolio([{
        address: vault.tokenAddress as `0x${string}`,
        balance: parseEther(amount).toString()
      }]);
      
      // Call the parent's onActionSuccess if provided
      if (props.onActionSuccess) {
        props.onActionSuccess();
      }
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className={props.className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {vault.name}
              <Badge variant="outline" className="border-green-500 text-green-500">
                Yei Finance
              </Badge>
            </CardTitle>
            <CardDescription className="mt-2">
              {vault.description}
            </CardDescription>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="text-2xl font-bold">{vault.apy}% APY</div>
          <div className="text-sm text-muted-foreground">
            <div>Risk: {strategyDetails.risk}</div>
            <div>Min: {formatEther(vault.minDeposit || 0n)} {vault.tokenSymbol}</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deposit" className="mt-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Amount to Deposit
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`0.00 ${vault.tokenSymbol}`}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {vault.tokenSymbol}
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full mt-2" 
                onClick={handleDeposit}
                disabled={isProcessing || !amount}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Deposit & Optimize
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="strategy" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {strategyDetails.description}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Strategy Allocation</span>
                  <span className="font-medium">APY: {strategyDetails.apy}%</span>
                </div>
                
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  {strategyDetails.allocations.map((allocation, index) => (
                    <div 
                      key={index}
                      className={`h-full ${allocation.color}`}
                      style={{ width: `${allocation.percentage}%`, display: 'inline-block' }}
                    />
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {strategyDetails.allocations.map((allocation, index) => (
                    <div key={index} className="flex items-center text-xs">
                      <div 
                        className="w-3 h-3 rounded-full mr-1" 
                        style={{ backgroundColor: allocation.color.match(/bg-(\w+)-\d+/)?.[0] || allocation.color }}
                      />
                      {allocation.name} ({allocation.percentage}%)
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2 flex items-center">
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Performance Metrics
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">TVL</div>
                    <div className="font-medium">${(Number(formatEther(vault.tvl || 0n))).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Risk Level</div>
                    <div className="font-medium">{strategyDetails.risk}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Min. Deposit</div>
                    <div className="font-medium">{formatEther(vault.minDeposit || 0n)} {vault.tokenSymbol}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Chain</div>
                    <div className="font-medium">{vault.chain}</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-0">
        <div className="text-xs text-muted-foreground">
          Powered by Yei Finance
        </div>
        <a 
          href="https://docs.yei.finance/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center"
        >
          Learn more <ArrowRight className="w-3 h-3 ml-1" />
        </a>
      </CardFooter>
    </Card>
  );
}
