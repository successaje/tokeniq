'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  FileText, Activity, ShieldAlert, 
  Wallet, ArrowRight, BrainCircuit,
  AlertTriangle
} from 'lucide-react';

export default function Assessment() {
  return (
    <div className="min-h-screen bg-black text-zinc-50 font-sans selection:bg-white/20">
      
      {/* Navigation */}
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center">
              <span className="text-black font-bold text-[10px]">TQ</span>
            </div>
            <span className="font-medium text-[13px] text-zinc-300">AI Financial Report</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[11px] font-mono text-zinc-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            0x8A...3F2C
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 border-b border-white/5 pb-8"
        >
          <div className="inline-flex items-center gap-2 px-2 py-1 bg-blue-500/10 text-blue-400 text-[11px] uppercase tracking-wider font-medium rounded mb-4">
            <FileText className="w-3 h-3" /> Agent Assessment
          </div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-3 text-white">Portfolio Analysis</h1>
          <p className="text-zinc-500 font-light text-[15px]">
            TokenIQ has analyzed your historical spending patterns, risk tolerance, and current asset distribution to generate this advisory report.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-1 md:col-span-2 bg-[#0c0c0c] border border-white/5 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-zinc-400" />
                <h2 className="text-[14px] font-medium text-white">Idle Capital Detected</h2>
              </div>
              <div className="text-[12px] text-zinc-500 uppercase tracking-wider">Review Required</div>
            </div>
            
            <div className="flex items-end gap-4 mb-6">
              <div className="text-5xl font-medium tracking-tight text-white">$45,000</div>
              <div className="pb-1 text-red-400 font-medium text-[13px] flex items-center gap-1">
                 Non-Productive
              </div>
            </div>
            <p className="text-zinc-500 text-[13px] font-light leading-relaxed max-w-lg">
              We detected $45,000 in stablecoins and base assets earning 0% yield. You are forfeiting an estimated $3,200 in potential annual returns by not utilizing current Arbitrum DeFi rates.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="w-4 h-4 text-zinc-400" />
                <h2 className="text-[14px] font-medium text-white">Risk Profile</h2>
              </div>
              <div className="text-2xl font-medium text-white mb-1 tracking-tight">Conservative</div>
              <div className="text-[12px] text-zinc-500 uppercase tracking-wider mb-6">Score: 2.4 / 10</div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Confidence Score</div>
              <div className="text-lg font-medium text-emerald-400">92%</div>
            </div>
          </motion.div>

        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 mb-10"
        >
          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
            <BrainCircuit className="w-4 h-4 text-zinc-400" />
            <h2 className="text-[14px] font-medium text-white">AI Restructuring Recommendation</h2>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-black border border-white/5 rounded-xl">
                <div className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">Current Holdings</div>
                <div className="text-lg font-medium text-white">$45,000.00</div>
              </div>
              <div className="p-4 bg-black border border-white/5 rounded-xl">
                <div className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">Spending Analysis</div>
                <div className="text-lg font-medium text-white">~$1,800 / mo</div>
              </div>
              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <div className="text-blue-400 text-[11px] uppercase tracking-wider mb-1">Liquidity Reserve</div>
                <div className="text-lg font-medium text-white">$10,000.00</div>
              </div>
            </div>

            <div className="bg-black border border-white/5 rounded-xl p-5">
              <h3 className="font-medium text-[13px] text-white mb-3">Advisor Notes</h3>
              <ul className="space-y-3 text-[13px] text-zinc-400 font-light">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  <span>Based on a monthly burn rate of $1,800, a $10,000 liquid reserve provides over 5 months of runway without requiring withdrawals.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  <span>The remaining $35,000 is classified as redundant capital and should be deployed into yield-bearing strategies to achieve the projected $3,200 annual return.</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end"
        >
          <Link href="/proposal">
            <button className="h-10 px-6 text-[14px] font-medium bg-white text-black hover:bg-zinc-200 rounded-md transition-all flex items-center justify-center gap-2 group">
              View AI Strategy Proposal
              <ArrowRight className="w-4 h-4 ml-1 opacity-50 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
            </button>
          </Link>
        </motion.div>

      </main>
    </div>
  );
}
