'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';

export default function WalletScan() {
  const router = useRouter();
  const [step, setStep] = useState<'connect' | 'scanning' | 'results'>('connect');

  useEffect(() => {
    if (step === 'scanning') {
      const timer = setTimeout(() => setStep('results'), 4000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-black text-zinc-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(40,40,40,0.4),transparent_50%)] z-0"></div>

      <div className="relative z-10 w-full max-w-[440px]">
        
        <AnimatePresence mode="wait">
          {step === 'connect' && (
            <motion.div 
              key="connect"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8 shadow-2xl text-center"
            >
              <div className="mx-auto w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 border border-white/10">
                <WalletIcon className="w-5 h-5 text-zinc-300" />
              </div>
              <h1 className="text-xl font-medium mb-3 text-white">Initialize TokenIQ</h1>
              <p className="text-zinc-500 font-light mb-8 text-[13px] leading-relaxed">
                Connect your wallet to allow the AI to scan for idle capital and optimization opportunities.
              </p>
              <button 
                onClick={() => setStep('scanning')}
                className="w-full h-10 bg-white text-black hover:bg-zinc-200 text-[14px] font-medium rounded-md transition-all"
              >
                Connect Wallet
              </button>
            </motion.div>
          )}

          {step === 'scanning' && (
            <motion.div 
              key="scanning"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="relative mx-auto w-24 h-24 mb-6">
                <Loader2 className="w-10 h-10 text-zinc-400 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-dashed border-white/20"
                />
              </div>
              <h2 className="text-lg font-medium mb-2 text-white">Analyzing portfolio...</h2>
              <p className="text-zinc-500 font-light text-[13px] animate-pulse">
                Cross-referencing on-chain data with yield markets.
              </p>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <CheckIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-[15px] text-white">Scan Complete</h3>
                  <p className="text-zinc-500 text-[12px] font-mono">0x8A...3F2C</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-black border border-white/5 rounded-xl p-5">
                  <div className="text-zinc-500 text-[12px] uppercase tracking-wider mb-1">Detected Idle Capital</div>
                  <div className="text-3xl font-medium text-white tracking-tight">$45,000.00</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black border border-white/5 rounded-xl p-4">
                    <div className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">Opportunity Score</div>
                    <div className="font-medium text-white text-lg">94<span className="text-zinc-600 text-sm">/100</span></div>
                  </div>
                  <div className="bg-black border border-white/5 rounded-xl p-4">
                    <div className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">AI Confidence</div>
                    <div className="font-medium text-emerald-400 text-lg">92%</div>
                  </div>
                </div>

                <div className="bg-black border border-white/5 rounded-xl p-4 flex justify-between items-center">
                   <div className="text-zinc-500 text-[12px] uppercase tracking-wider">Potential Yield</div>
                   <div className="font-medium text-emerald-400 text-lg">+$3,200 <span className="text-[12px] font-normal text-zinc-500 uppercase">Annual</span></div>
                </div>
              </div>

              <button 
                onClick={() => router.push('/assessment')}
                className="w-full h-10 bg-white text-black hover:bg-zinc-200 text-[14px] font-medium rounded-md transition-all"
              >
                Generate Strategy
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function WalletIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a8 8 0 0 1-5 7.96V21a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7"/><path d="M10 9h.01"/><path d="M15 9h.01"/></svg>
  );
}

function CheckIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  );
}
