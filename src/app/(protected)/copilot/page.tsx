'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Send, Sparkles, Activity, ShieldCheck, ArrowRight, Loader2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useEliza } from '@/providers/ElizaProvider';
import { cn } from '@/lib/utils';

export default function CopilotPage() {
  const { messages, isLoading, sendMessage } = useEliza();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<any | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    
    // Look for the most recent structured insight in the messages
    const latestInsightMsg = [...messages].reverse().find(m => m.metadata?.insight);
    if (latestInsightMsg) {
      setActiveAnalysis(latestInsightMsg.metadata?.insight);
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    await sendMessage(msg);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      
      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col border-border/50 bg-card/30 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <BrainCircuit className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">ElizaOS Decision Engine</h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Agent Connected (Arbitrum Network)
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground"
              >
                <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-6">
                  <BrainCircuit className="h-8 w-8 text-primary/40" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">How can I optimize your capital today?</h3>
                <p className="max-w-md text-sm">
                  I can analyze current yields, execute cross-chain rebalancing, or audit your portfolio's risk profile.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mt-8">
                  {[
                    "Analyze Arbitrum stablecoin yields",
                    "Rebalance my ETH exposure",
                    "What is my current risk score?",
                    "Find delta-neutral strategies"
                  ].map((suggestion, i) => (
                    <button 
                      key={i}
                      onClick={() => sendMessage(suggestion)}
                      className="text-left px-4 py-3 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/50 hover:border-primary/30 transition-all text-xs"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex w-full", msg.type === 'user' ? "justify-end" : "justify-start")}
              >
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-5 py-3.5 text-sm",
                  msg.type === 'user' 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-muted/50 border border-border/50 rounded-tl-sm text-foreground"
                )}>
                  {msg.content}
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start w-full"
              >
                <div className="bg-muted/30 border border-border/50 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground font-mono">Computing optimal allocation...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </AnimatePresence>
        </div>

        <div className="p-4 border-t border-border/50 bg-background">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Command ElizaOS..."
              className="pr-12 h-12 bg-muted/20 border-border/50 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/50"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 h-9 w-9 rounded-lg transition-all"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-muted-foreground uppercase tracking-wider">
            <span>Secured by Arbitrum</span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </Card>

      {/* Side Panel: Structured Analytics */}
      <div className="w-[380px] hidden xl:flex flex-col gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Real-Time Output Stream
        </h3>
        
        {activeAnalysis ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAnalysis.Decision}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 overflow-y-auto space-y-4 pb-4"
            >
              <Card className="p-4 border-primary/20 bg-primary/5 shadow-[0_0_15px_-3px_rgba(var(--primary),0.1)]">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-background p-1.5 rounded border border-primary/20">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Decision</h4>
                    <p className="text-sm font-semibold">{activeAnalysis.Decision}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-border/50 bg-card/30">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" /> Reasoning
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {activeAnalysis.Reasoning}
                </p>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 border-border/50 bg-card/30 flex flex-col justify-between">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" /> Risk Level
                  </h4>
                  <div className="text-xl font-semibold mt-2">{activeAnalysis.Risk}</div>
                </Card>
                
                <Card className="p-4 border-border/50 bg-card/30 flex flex-col justify-between">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" /> Exp. Yield
                  </h4>
                  <div className="text-xl font-semibold text-emerald-500 mt-2">{activeAnalysis.Yield}</div>
                </Card>
              </div>

              <Button className="w-full h-12 mt-4 font-semibold shadow-lg hover:shadow-xl transition-shadow group">
                Sign & Execute Transaction
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </AnimatePresence>
        ) : (
          <Card className="flex-1 flex flex-col items-center justify-center p-6 border-dashed border-border/50 bg-transparent text-center">
            <Activity className="h-8 w-8 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              Awaiting intelligence processing.<br/> Ask ElizaOS to analyze a strategy to view structured outputs here.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
