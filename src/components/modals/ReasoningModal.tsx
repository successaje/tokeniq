import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BrainCircuit, AlertTriangle, Activity, Database, CheckCircle2 } from 'lucide-react';

export function ReasoningModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0c0c0c] border border-white/10 text-zinc-50 sm:max-w-2xl font-sans p-0 overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 bg-black/50">
          <DialogTitle className="flex items-center gap-3 text-[15px] font-medium text-white">
            <BrainCircuit className="w-4 h-4 text-zinc-400" />
            AI Reasoning Log
          </DialogTitle>
          <DialogDescription className="text-zinc-500 font-light text-[13px] mt-1">
            Execution rationale and risk analysis for recent autonomous actions.
          </DialogDescription>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Latest Execution: Rebalance</h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Confidence: 94%
              </span>
            </div>
            
            <div className="bg-black border border-white/5 rounded-xl p-5 text-[13px] font-light text-zinc-400 space-y-5">
              
              <div className="flex gap-4">
                <div className="w-6 flex justify-center mt-0.5">
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-white font-medium mb-1">Trigger Event</div>
                  <p className="leading-relaxed">ETH volatility spiked 14% over 2 hours. Current LP position ($10,000) was approaching the upper tick bound on Arbitrum Uniswap V3.</p>
                </div>
              </div>

              <div className="h-px bg-white/5 ml-10"></div>

              <div className="flex gap-4">
                <div className="w-6 flex justify-center mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-white font-medium mb-1">Why this strategy?</div>
                  <p className="leading-relaxed">Adjusting the tick range prevents the position from going out-of-range and pausing fee generation. Expected outcome is to maintain the ~18.2% APY target despite market chop.</p>
                </div>
              </div>

              <div className="h-px bg-white/5 ml-10"></div>

              <div className="flex gap-4">
                <div className="w-6 flex justify-center mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <div className="text-white font-medium mb-1">Alternative Options Considered</div>
                  <p className="leading-relaxed mb-2">Withdraw entirely to USDC to preserve capital.</p>
                  <div className="bg-white/5 border border-white/5 p-3 rounded-md">
                    <span className="text-zinc-300 font-medium">Rejection Reason:</span> Projected impermanent loss (0.4%) was significantly lower than the expected yield from trading fees in high volatility (1.2% daily).
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
