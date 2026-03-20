'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Check, X, Info, ChevronRight, Sparkles, Shield, AlertCircle, Clock, BarChart2, CircleDollarSign, TrendingUp as Bullish, TrendingDown as Bearish, Wrench, Plus, MessageSquare } from 'lucide-react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { StrategyCard } from './components/StrategyCard';
import { ChatButton } from './components/ChatButton';
import { InsightCard } from './components/InsightCard';
import { RiskLevel } from './components/RiskLevel';
import { ElizaOSBadge } from './components/ElizaOSBadge';
import { NewsTicker } from './components/NewsTicker';
import { DeepAnalysis } from './components/DeepAnalysis';
import { theme } from './theme';
import { useOllamaAI } from '@/hooks/useOllamaAI';
import { Loader2 } from 'lucide-react';

const marketData = {
  currentTrend: 'Bullish',
  volatility: 0.035, // 3.5%
  apyData: {
    aaveAvalanche: 5.1,
    lidoEth: 4.8,
    baseReserve: 0.05
  },
  riskMetrics: {
    marketRisk: 0.6, // 60% risk level
    liquidityRisk: 0.3, // 30% liquidity risk
    volatilityRisk: 0.4 // 40% volatility risk
  }
};

const strategyData = {
  title: "ElizaOS Strategy Copilot",
  recommendation: [
    {
      asset: "Yei Finance BTCFi Vault",
      percentage: 35,
      currentApy: 12.8,
      reason: "High yield BTCFi strategy with lending and staking components",
      riskLevel: 0.4,
      icon: TrendingUp
    },
    {
      asset: "Sei Network Liquid Staking",
      percentage: 25,
      currentApy: 9.2,
      reason: "High-performance L1 staking with liquidity",
      riskLevel: 0.3,
      icon: BarChart2
    },
    {
      asset: "Yei Stablecoin Vault",
      percentage: 20,
      currentApy: 8.9,
      reason: "Stablecoin yield strategy on Yei money market",
      riskLevel: 0.2,
      icon: Shield
    },
    {
      asset: "Sei DeFi Index",
      percentage: 15,
      currentApy: 18.5,
      reason: "Diversified DeFi exposure on Sei Network",
      riskLevel: 0.5,
      icon: Sparkles
    },
    {
      asset: "Base reserve",
      percentage: 5,
      currentApy: 0.05,
      reason: "Emergency liquidity buffer",
      riskLevel: 0.05,
      icon: CircleDollarSign
    }
  ],
  riskLevel: 0.45,
  rebalanceIn: "5 days",
  marketTrend: 'Bullish',
  volatility: 0.042,
  reasoning: [
    "Yei Finance's BTCFi vault offers superior risk-adjusted returns in the current market",
    "Sei Network's high throughput and low fees provide an optimal environment for DeFi strategies",
    "Diversification across yield sources reduces overall portfolio risk",
    "Stablecoin allocation provides stability during market volatility",
    "Sei's parallelized order book enables efficient yield optimization"
  ]
};

export default function InsightsPage() {
  const [showReasoningModal, setShowReasoningModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string>('');
  const { address } = useAccount();
  const { explainStrategy, isLoading: isOllamaLoading } = useOllamaAI();

  const riskColors = {
    Low: 'bg-emerald-500/20 text-emerald-500',
    Moderate: 'bg-amber-500/20 text-amber-500',
    High: 'bg-rose-500/20 text-rose-500'
  };

  const getRiskLevel = (risk: number) => {
    if (risk < 0.3) return 'Low';
    if (risk < 0.6) return 'Moderate';
    return 'High';
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        {/* News Ticker */}
        <div className="mt-6 mb-8">
          <NewsTicker />
        </div>

        {/* Deep Analysis */}
        <div className="mb-8">
          <DeepAnalysis />
        </div>

        {/* AI Insights Card */}
        <div className="mb-8">
          <Card className={cn(
            "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20",
            theme.animations.fade
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/20 p-3">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">AI Insights</h3>
                    <p className="text-sm text-muted-foreground">Projected Annual Yield</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    +$3,200
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Based on current allocations</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 py-8">
          {/* Left Section - Strategies */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className={cn(
                "text-2xl font-bold text-foreground",
                theme.animations.slideLeft
              )}>Strategies</h2>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  theme.transitions.smooth,
                  theme.animations.hoverScale
                )}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Strategy
              </Button>
            </div>
            <div className="space-y-4">
              <StrategyCard
                title="Yei Finance BTCFi Vault"
                allocation="35%"
                rebalanceDate="3 days"
                onClick={() => console.log('Accept Yei BTCFi strategy')}
                onEdit={() => console.log('Edit Yei BTCFi strategy')}
                onSchedule={() => console.log('Schedule Yei BTCFi strategy')}
              />
              <StrategyCard
                title="Sei Network Liquid Staking"
                allocation="25%"
                rebalanceDate="5 days"
                onClick={() => console.log('Accept Sei Staking strategy')}
                onEdit={() => console.log('Edit Sei Staking strategy')}
                onSchedule={() => console.log('Schedule Sei Staking strategy')}
              />
              <StrategyCard
                title="Yei Stablecoin Vault"
                allocation="20%"
                rebalanceDate="7 days"
                onClick={() => console.log('Accept Yei Stablecoin strategy')}
                onEdit={() => console.log('Edit Yei Stablecoin strategy')}
                onSchedule={() => console.log('Schedule Yei Stablecoin strategy')}
              />
              <StrategyCard
                title="Sei DeFi Index"
                allocation="15%"
                rebalanceDate="7 days"
                onClick={() => console.log('Accept Sei DeFi strategy')}
                onEdit={() => console.log('Edit Sei DeFi strategy')}
                onSchedule={() => console.log('Schedule Sei DeFi strategy')}
              />
              <StrategyCard
                title="Base Reserve"
                allocation="5%"
                rebalanceDate="7 days"
                onClick={() => console.log('Accept Base Reserve strategy')}
                onEdit={() => console.log('Edit Base Reserve strategy')}
                onSchedule={() => console.log('Schedule Base Reserve strategy')}
              />
            </div>
          </div>

          {/* Right Section - ElizaOS Insight Panel */}
          <div className="space-y-6">
            <Card
              className={cn(
                "h-full",
                theme.animations.fade,
                theme.transitions.smooth
              )}
            >
              <CardHeader className={cn(
                "flex flex-col gap-4",
                theme.transitions.smooth
              )}>
                <div className="flex items-center gap-4 flex-wrap">
                  <CardTitle className={cn(
                    "text-xl font-bold",
                    theme.animations.slideUp
                  )}>ElizaOS Treasury Copilot</CardTitle>
                  <ElizaOSBadge className={cn(
                    theme.animations.hoverScale
                  )} />
                  <div className={cn(
                    "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20",
                    theme.animations.hoverScale
                  )}>
                    <Sparkles className="h-3 w-3" />
                    Powered by Sei Intelligence Layer
                  </div>
                </div>
                <p className={cn(
                  "text-sm text-muted-foreground",
                  theme.transitions.smooth
                )}>
                  AI-generated recommendation based on your current balance and risk profile
                </p>
              </CardHeader>
              <CardContent className={cn(
                "space-y-6",
                theme.transitions.smooth
              )}>
                {/* Strategy Summary */}
                <div className={cn(
                  theme.transitions.smooth,
                  theme.animations.fade
                )}>
                  <h3 className="text-lg font-semibold mb-4">🔍 Strategy Summary</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className={cn(
                        "h-4 w-4 text-emerald-500",
                        theme.animations.pulse
                      )} />
                      <span className="text-sm">50% to Aave ETH Lending (Avalanche)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className={cn(
                        "h-4 w-4 text-emerald-500",
                        theme.animations.pulse
                      )} />
                      <span className="text-sm">30% to stETH via Lido (Base)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className={cn(
                        "h-4 w-4 text-emerald-500",
                        theme.animations.pulse
                      )} />
                      <span className="text-sm">20% held in USDC on Ethereum</span>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className={cn(
                  theme.transitions.smooth,
                  theme.animations.fade
                )}>
                  <h3 className="text-lg font-semibold mb-4">📊 Risk Assessment</h3>
                  <div className="text-sm text-muted-foreground">
                    Current strategy risk level: Moderate
                  </div>
                </div>

                {/* Market Signal */}
                <div className={cn(
                  theme.transitions.smooth,
                  theme.animations.fade
                )}>
                  <h3 className="text-lg font-semibold mb-4">📉 Market Signal</h3>
                  <div className="text-sm text-muted-foreground">
                    ETH APY is above 4.5%, and volatility is low
                  </div>
                </div>

                {/* Reason Box */}
                <div className={cn(
                  theme.transitions.smooth,
                  theme.animations.fade
                )}>
                  <h3 className="text-lg font-semibold mb-4">🧠 Reason Box</h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Allocating capital across Polkadot parachains for yield optimization. Using XCM to distribute funds efficiently. Maintaining cross-chain liquidity buffer.</p>

                    {showReasoningModal && (
                      <div className="mt-4 space-y-3 pt-4 border-t">
                        {/* AI-Generated Reasoning */}
                        {aiReasoning && (
                          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 mb-4">
                            <div className="flex items-start gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                              <p className="font-medium text-foreground">AI Analysis:</p>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">{aiReasoning}</p>
                          </div>
                        )}

                        {/* Detailed Metrics */}
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">Spending trendline:</p>
                            <p className="text-muted-foreground">You spend 62% of monthly income</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <BarChart2 className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">Savings rate:</p>
                            <p className="text-muted-foreground">Monthly savings rate: 38% (above 30% target)</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CircleDollarSign className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">Idle capital:</p>
                            <p className="text-muted-foreground">$45,000 idle USDC detected (15% of portfolio)</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Shield className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">Risk exposure:</p>
                            <p className="text-muted-foreground">Portfolio risk level: Moderate (45% volatility)</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">Yield efficiency:</p>
                            <p className="text-muted-foreground">Current yield: 8.5% APY, potential: 12.8% APY</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                <div className={cn(
                  theme.transitions.smooth,
                  theme.animations.fade
                )}>
                  <h3 className="text-lg font-semibold mb-4">💡 Recommendations</h3>
                  <div className="space-y-2">
                    <div className="rounded-lg border bg-amber-500/10 border-amber-500/20 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            Reduce idle USDC by 10% to improve liquidity.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Reallocate $4,500 to yield-generating strategies
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-blue-500/10 border-blue-500/20 p-3">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            Increase Sei Network allocation by 5% for higher yield potential.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Sei Network offers 12.8% APY with low gas fees
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Suggested Action */}
                <div className={cn(
                  theme.transitions.smooth,
                  theme.animations.fade
                )}>
                  <h3 className="text-lg font-semibold mb-4">📅 Suggested Action</h3>
                  <div className="text-sm text-muted-foreground">
                    Rebalance in 3 days
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    variant="default"
                    className={cn(
                      "w-full",
                      theme.transitions.smooth,
                      theme.animations.hoverScale
                    )}
                    onClick={() => console.log('Accept strategy')}
                  >
                    <Check className={cn(
                      "h-4 w-4 mr-2",
                      theme.animations.pulse
                    )} />
                    Accept Strategy
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full",
                      theme.transitions.smooth,
                      theme.animations.hoverScale
                    )}
                    onClick={() => console.log('Adjust strategy')}
                  >
                    <Wrench className={cn(
                      "h-4 w-4 mr-2",
                      theme.animations.pulse
                    )} />
                    Adjust Strategy
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full",
                      theme.transitions.smooth,
                      theme.animations.hoverScale
                    )}
                    onClick={async () => {
                      if (!showReasoningModal) {
                        // Generate AI reasoning when expanding
                        const reasoning = await explainStrategy(
                          'ElizaOS Treasury Copilot Strategy',
                          {
                            allocation: 50,
                            apy: 8.5,
                            risk: 'Moderate',
                          }
                        );
                        setAiReasoning(reasoning);
                      }
                      setShowReasoningModal(!showReasoningModal);
                    }}
                    disabled={isOllamaLoading}
                  >
                    {isOllamaLoading ? (
                      <>
                        <Loader2 className={cn(
                          "h-4 w-4 mr-2 animate-spin",
                          theme.animations.pulse
                        )} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Info className={cn(
                          "h-4 w-4 mr-2",
                          theme.animations.pulse
                        )} />
                        Explain Reasoning
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full",
                      theme.transitions.smooth,
                      theme.animations.hoverScale
                    )}
                    onClick={() => console.log('Chat with Eliza')}
                  >
                    <MessageSquare className={cn(
                      "h-4 w-4 mr-2",
                      theme.animations.pulse
                    )} />
                    Chat with ElizaOS
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <ChatButton
        className={cn(
          theme.transitions.smooth,
          theme.animations.float
        )}
        onOpen={() => console.log('Open chat')}
      />
    </div>
  );
}
