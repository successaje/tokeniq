'use client';

import { motion } from 'framer-motion';
import { 
  Building2, LineChart, Server, 
  ArrowRight, BrainCircuit, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

const mockTreasuryGrowth = [
  { month: 'Jan', value: 14200000 },
  { month: 'Feb', value: 14250000 },
  { month: 'Mar', value: 14290000 },
  { month: 'Apr', value: 14350000 },
  { month: 'May', value: 14420000 },
  { month: 'Jun', value: 14510000 },
  { month: 'Jul', value: 14600000 },
];

export default function TreasuryMode() {
  return (
    <div className="min-h-screen bg-black text-zinc-50 font-sans pb-20 selection:bg-white/20">
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(40,40,40,0.4),transparent_50%)] z-0 pointer-events-none"></div>

      <header className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-50 relative">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center">
              <span className="text-black font-bold text-[10px]">TQ</span>
            </div>
            <span className="font-medium text-[13px] text-zinc-300">Enterprise Mode</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[11px] font-mono text-zinc-400">
            DAO Treasury Connection Active
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-12 max-w-5xl relative z-10">
        
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-1 bg-white/5 text-white text-[11px] uppercase tracking-wider font-medium rounded mb-4 border border-white/10">
              <Building2 className="w-3 h-3" /> DAO Profile
            </div>
            <h1 className="text-3xl md:text-5xl font-medium mb-3 tracking-tight text-white">AI CFO for Treasuries</h1>
            <p className="text-zinc-500 font-light text-[15px] max-w-xl">
              Eliminate multi-sig paralysis. TokenIQ detects idle treasury funds and generates governance-ready yield strategies.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          
          <div className="col-span-1 md:col-span-2 bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6 text-[13px] font-medium text-white">
              <Server className="w-4 h-4 text-zinc-400" />
              Treasury Overview
            </div>
            <div className="flex flex-col sm:flex-row gap-10 mb-6">
              <div>
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Total Treasury Value</div>
                <div className="text-4xl font-medium tracking-tight text-white">$14.2M</div>
              </div>
              <div className="w-px bg-white/5 hidden sm:block"></div>
              <div>
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Idle Treasury Capital</div>
                <div className="text-3xl font-medium tracking-tight text-red-400">$8.5M</div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex justify-between text-[11px] text-zinc-500 uppercase tracking-wider mb-2">
                <span>Active Capital</span>
                <span>Unutilized (59.8%)</span>
              </div>
              <div className="w-full bg-black border border-white/5 rounded-full h-2 overflow-hidden flex">
                <div className="bg-emerald-500 h-full w-[40.2%]"></div>
                <div className="bg-red-500 h-full w-[59.8%]"></div>
              </div>
            </div>
          </div>

          <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6 text-[13px] font-medium text-white">
                <LineChart className="w-4 h-4 text-zinc-400" />
                Treasury Health Score
              </div>
              <div className="text-5xl font-medium text-white mb-2 tracking-tight">34<span className="text-xl text-zinc-600 font-light ml-1">/100</span></div>
            </div>
            <div className="pt-6 border-t border-white/5">
               <p className="text-zinc-500 text-[12px] font-light leading-relaxed">
                 The DAO is currently forfeiting an estimated <span className="text-white font-medium">$542,000</span> in annualized yield due to treasury inefficiency.
               </p>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
           
           <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6 text-[13px] font-medium text-white">
                 <BrainCircuit className="w-4 h-4 text-blue-400" />
                 AI Governance Proposal (TQ-P-42)
              </div>
              
              <div className="space-y-3 mb-8">
                 <div className="bg-black border border-white/5 rounded-xl p-4 flex justify-between items-center text-[13px]">
                    <span className="text-zinc-400">Strategy 1: Arbitrum Aave V3</span>
                    <span className="text-white font-medium">Allocate $4.0M</span>
                 </div>
                 <div className="bg-black border border-white/5 rounded-xl p-4 flex justify-between items-center text-[13px]">
                    <span className="text-zinc-400">Strategy 2: Uniswap V3 LP</span>
                    <span className="text-white font-medium">Allocate $1.5M</span>
                 </div>
                 <div className="bg-black border border-white/5 rounded-xl p-4 flex justify-between items-center text-[13px]">
                    <span className="text-zinc-400">Strategy 3: Pendle Finance</span>
                    <span className="text-white font-medium">Allocate $1.0M</span>
                 </div>
                 <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex justify-between items-center text-[13px]">
                    <span className="text-blue-400 font-medium">Retain Operational Reserve</span>
                    <span className="text-blue-400 font-medium">$2.0M</span>
                 </div>
              </div>

              <button className="w-full h-10 bg-white text-black hover:bg-zinc-200 text-[13px] font-medium rounded-md transition-all">
                Submit Proposal to Snapshot
              </button>
           </div>

           <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2 text-[13px] font-medium text-white">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Expected Treasury Growth
                 </div>
                 <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded">Projected</span>
              </div>
              
              <div className="flex-1 w-full min-h-[220px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockTreasuryGrowth}>
                       <defs>
                          <linearGradient id="growthColor" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="month" stroke="#333" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                       <YAxis hide domain={['dataMin - 100000', 'dataMax + 100000']} />
                       <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: '#fff' }}
                          formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, 'Proj. Value']}
                       />
                       <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#growthColor)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

        </div>

      </main>
    </div>
  );
}
