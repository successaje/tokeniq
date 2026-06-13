'use client';

import { motion } from 'framer-motion';
import { Network, ArrowRightLeft, ShieldCheck, Clock, Settings, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CrossChainPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-12 max-w-5xl mx-auto"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Cross-Chain Router</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Secured by Chainlink CCIP
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-9 gap-2">
            <Activity className="h-4 w-4" /> Explorer
          </Button>
          <Button variant="outline" className="h-9 gap-2">
            <Settings className="h-4 w-4" /> Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Router Interface */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <Card className="p-6 border-border/50 bg-card/30">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-semibold text-lg">Bridge Assets</h3>
              <div className="px-2 py-1 rounded-sm bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                Optimal Route Found
              </div>
            </div>

            <div className="space-y-6">
              {/* From / To Networks */}
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Network</label>
                  <div className="h-14 border border-border/50 bg-background rounded-lg flex items-center px-4 justify-between cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <span className="text-blue-500 font-bold text-xs">ARB</span>
                      </div>
                      <span className="font-semibold">Arbitrum One</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-border/50 bg-muted/20 hover:bg-muted/50">
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To Network</label>
                  <div className="h-14 border border-border/50 bg-background rounded-lg flex items-center px-4 justify-between cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#0052FF]/10 flex items-center justify-center">
                        <span className="text-[#0052FF] font-bold text-xs">BASE</span>
                      </div>
                      <span className="font-semibold">Base</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asset & Amount</label>
                  <span className="text-xs text-muted-foreground">Balance: 12,500.00 USDC</span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 flex items-center gap-2 pr-4 border-r border-border/50">
                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">$</div>
                    <span className="font-semibold">USDC</span>
                  </div>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="h-16 pl-32 text-2xl font-semibold bg-background border-border/50 rounded-lg"
                    defaultValue="5000"
                  />
                  <div className="absolute right-4 text-xs font-medium text-primary cursor-pointer hover:underline">MAX</div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-lg bg-muted/20 border border-border/50 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expected Output</span>
                  <span className="font-semibold">4,998.50 USDC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    CCIP Network Fee
                  </span>
                  <span className="font-mono text-xs">~0.0012 ETH ($3.50)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Estimated Time
                  </span>
                  <span className="text-xs">~5 minutes</span>
                </div>
              </div>

              <Button className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all rounded-lg">
                Approve & Execute Route
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Sidebar Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <Card className="p-5 border-border/50 bg-card/30">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Route Intelligence</h4>
            <div className="space-y-4">
              <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Network className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-500">Arbitrum → Base (Optimal)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  This route minimizes slippage by utilizing direct CCIP lanes. Gas fees are currently low on both networks.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-border/50 bg-card/30">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Recent Transfers</h4>
            <div className="space-y-4 divide-y divide-border/30">
              {[
                { from: 'Arbitrum', to: 'Ethereum', amount: '25,000 USDC', status: 'Completed', time: '2 hrs ago' },
                { from: 'Ethereum', to: 'Arbitrum', amount: '10.5 ETH', status: 'Completed', time: '1 day ago' },
              ].map((tx, i) => (
                <div key={i} className="pt-4 first:pt-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold">{tx.amount}</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-500">{tx.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{tx.from} → {tx.to}</span>
                    <span>{tx.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
