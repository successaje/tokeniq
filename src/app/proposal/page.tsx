'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowRight, BrainCircuit, Wallet, 
  ShieldAlert, Activity, Zap, CheckCircle2,
  ListTree
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Proposal() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-zinc-50 font-sans selection:bg-white/20">
      
      {/* Navigation */}
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center">
              <span className="text-black font-bold text-[10px]">TQ</span>
            </div>
            <span className="font-medium text-[13px] text-zinc-300">AI Strategy Proposal</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[11px] font-mono text-zinc-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            0x8A...3F2C
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 border-b border-white/5 pb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[11px] uppercase tracking-wider font-medium rounded mb-4">
              <CheckCircle2 className="w-3 h-3" /> Confidence: 92%
            </div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-2 text-white">Execution Plan</h1>
            <p className="text-zinc-500 font-light text-[15px]">
              Review the autonomous allocation strategy generated for your $45,000 capital.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 bg-[#0c0c0c] border border-white/5 px-6 py-4 rounded-xl"
          >
            <div className="text-right">
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Expected Yield</div>
              <div className="text-2xl font-medium text-emerald-400">+$4,850/year</div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          
          {/* Strategy List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-1 lg:col-span-2 space-y-3"
          >
            {/* Liquid Reserve */}
            <div className="bg-[#0c0c0c] border border-white/5 hover:border-white/10 transition-colors rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <h3 className="font-medium text-[15px] text-white">Keep Liquid</h3>
                  <p className="text-zinc-500 text-[13px] font-light">Retained in wallet for operational expenses.</p>
                </div>
              </div>
              <div className="text-xl font-medium text-white">$10,000</div>
            </div>

            <div className="h-4 flex justify-center opacity-20">
               <div className="w-px h-full bg-white"></div>
            </div>

            {/* Stable Yield */}
            <div className="bg-[#0c0c0c] border border-white/5 hover:border-white/10 transition-colors rounded-2xl p-5 flex items-center justify-between relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-50"></div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-[15px] text-white">Stable Yield</h3>
                  <p className="text-zinc-500 text-[13px] font-light">Low-risk lending protocols on Arbitrum.</p>
                </div>
              </div>
              <div className="text-xl font-medium text-white">$20,000</div>
            </div>

            <div className="h-4 flex justify-center opacity-20">
               <div className="w-px h-full bg-white"></div>
            </div>

            {/* Balanced Strategy */}
            <div className="bg-[#0c0c0c] border border-white/5 hover:border-white/10 transition-colors rounded-2xl p-5 flex items-center justify-between relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-50"></div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-medium text-[15px] text-white">Balanced Strategy</h3>
                  <p className="text-zinc-500 text-[13px] font-light">Automated liquidity provision and delta-neutral yield.</p>
                </div>
              </div>
              <div className="text-xl font-medium text-white">$10,000</div>
            </div>

            <div className="h-4 flex justify-center opacity-20">
               <div className="w-px h-full bg-white"></div>
            </div>

            {/* Growth Strategy */}
            <div className="bg-[#0c0c0c] border border-white/5 hover:border-white/10 transition-colors rounded-2xl p-5 flex items-center justify-between relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 opacity-50"></div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-[15px] text-white">Growth Strategy</h3>
                  <p className="text-zinc-500 text-[13px] font-light">Principal-protected directional yield trading.</p>
                </div>
              </div>
              <div className="text-xl font-medium text-white">$5,000</div>
            </div>

          </motion.div>

          {/* Action Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-1"
          >
            <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8 sticky top-24">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <ListTree className="w-4 h-4 text-zinc-400" />
                <h3 className="text-[14px] font-medium text-white">Execution Authorization</h3>
              </div>
              
              <p className="text-zinc-400 font-light text-[13px] mb-8 leading-relaxed">
                Activating Autopilot grants TokenIQ permission to route capital, deposit into vaults, and continuously monitor positions for optimal yield. You retain full custody.
              </p>

              <button 
                onClick={() => router.push('/approval')}
                className="w-full h-12 bg-white text-black hover:bg-zinc-200 text-[14px] font-medium rounded-md transition-all flex items-center justify-center shadow-lg"
              >
                Activate Autopilot
              </button>
              
              <div className="mt-6 text-center">
                <button className="text-[11px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest">
                  View Smart Contract Details
                </button>
              </div>
            </div>
          </motion.div>

        </div>

      </main>
    </div>
  );
}
