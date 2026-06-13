import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ShieldAlert, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export function EmergencyWithdrawModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'confirm' | 'simulating' | 'success'>('confirm');

  const handleWithdraw = () => {
    setStep('simulating');
    setTimeout(() => {
      setStep('success');
    }, 2500);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => setStep('confirm'), 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0c0c0c] border border-white/10 text-zinc-50 sm:max-w-md font-sans p-0 overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 bg-black/50">
          <DialogTitle className="flex items-center gap-3 text-[15px] font-medium text-white">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            Emergency Withdrawal
          </DialogTitle>
          <DialogDescription className="text-zinc-500 font-light text-[13px] mt-1">
            Override the AI and return all capital to your wallet instantly.
          </DialogDescription>
        </div>

        <div className="p-6">
          
          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="bg-black border border-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3 text-[13px]">
                  <span className="text-zinc-500 font-medium">Withdraw Amount</span>
                  <span className="text-white font-medium">$35,850.00</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-zinc-500 font-medium">Yield Impact</span>
                  <span className="text-red-400 font-medium">-$4,850/yr projected</span>
                </div>
              </div>

              <p className="text-[12px] text-zinc-500 font-light text-center leading-relaxed">
                The agent will immediately trigger cross-chain Unwind functions across Aave, Uniswap, and Pendle. Expect ~$45 in slippage and exit fees.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={handleClose} 
                  className="flex-1 h-10 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[13px] font-medium rounded-md transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleWithdraw}
                  className="flex-1 h-10 bg-red-600 hover:bg-red-500 text-white text-[13px] font-medium rounded-md transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                >
                  Confirm Withdrawal
                </button>
              </div>
            </div>
          )}

          {step === 'simulating' && (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto" />
              <h3 className="text-[14px] font-medium text-white">Simulating Unwind Execution</h3>
              <p className="text-[12px] text-zinc-500 font-light">Processing 3 transactions across Arbitrum...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-[15px] font-medium text-white">Funds Returned</h3>
              <p className="text-[13px] text-zinc-400 font-light max-w-xs mx-auto leading-relaxed">
                $35,805.00 has been successfully withdrawn to your wallet (0x8A...3F2C).
              </p>
              <div className="pt-4">
                <button 
                  onClick={handleClose} 
                  className="h-10 px-8 bg-white text-black hover:bg-zinc-200 text-[13px] font-medium rounded-md transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
