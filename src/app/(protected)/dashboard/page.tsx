'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  BrainCircuit, ShieldAlert, Activity, 
  TerminalSquare, Wallet, Globe, ArrowRight,
  TrendingUp, Layers
} from 'lucide-react';
import { ReasoningModal } from '@/components/modals/ReasoningModal';
import { EmergencyWithdrawModal } from '@/components/modals/EmergencyWithdrawModal';

const mockPerformanceData = [
  { name: 'Mon', value: 45000 },
  { name: 'Tue', value: 45105 },
  { name: 'Wed', value: 45220 },
  { name: 'Thu', value: 45180 },
  { name: 'Fri', value: 45310 },
  { name: 'Sat', value: 45450 },
  { name: 'Sun', value: 45850 },
];

const mockChainData = [
  { name: 'Arbitrum', value: 75, color: '#2b6cb0' },
  { name: 'Ethereum', value: 15, color: '#627EEA' },
  { name: 'Base', value: 10, color: '#0052FF' },
];

export default function Dashboard() {
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-zinc-50 font-sans pb-20 selection:bg-white/20">
      
      {/* Top Bar */}
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center">
              <span className="text-black font-bold text-[10px]">TQ</span>
            </div>
            <span className="font-medium text-[13px] text-zinc-300">Agent Command Center</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsWithdrawOpen(true)}
              className="h-7 px-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-[11px] font-medium rounded-md transition-colors"
            >
              Emergency Withdraw
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-8 max-w-6xl">
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-5">
            <div className="text-zinc-500 text-[11px] uppercase tracking-wider mb-2">Portfolio Value</div>
            <div className="text-2xl font-medium text-white tracking-tight">$45,850.00</div>
          </div>
          <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-5">
            <div className="text-zinc-500 text-[11px] uppercase tracking-wider mb-2">Capital Utilization</div>
            <div className="text-2xl font-medium text-white tracking-tight">77.8%</div>
          </div>
          <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-5">
            <div className="text-zinc-500 text-[11px] uppercase tracking-wider mb-2">Yield Generated</div>
            <div className="text-2xl font-medium text-emerald-400 tracking-tight">+$850.00</div>
          </div>
          <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-5">
            <div className="text-zinc-500 text-[11px] uppercase tracking-wider mb-2">Risk Score</div>
            <div className="text-2xl font-medium text-white tracking-tight">2.4<span className="text-[13px] text-zinc-500 font-light ml-1">/ 10</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart Area */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6 h-80 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[14px] font-medium text-white">Performance</h3>
                <div className="flex gap-1 bg-black p-1 rounded-md border border-white/5">
                  <span className="px-2 py-1 text-[11px] rounded text-zinc-500 hover:text-white cursor-pointer">1W</span>
                  <span className="px-2 py-1 text-[11px] rounded bg-white/10 text-white cursor-pointer">1M</span>
                  <span className="px-2 py-1 text-[11px] rounded text-zinc-500 hover:text-white cursor-pointer">ALL</span>
                </div>
              </div>
              <div className="flex-1 w-full h-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockPerformanceData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#333" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`$${value}`, 'Value']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6">
                <h3 className="text-[14px] font-medium text-white mb-6">Chain Distribution</h3>
                <div className="h-40 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockChainData}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {mockChainData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span className="text-[12px] text-zinc-400">Arbitrum</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6 flex flex-col">
                <h3 className="text-[14px] font-medium text-white mb-4">AI Recommendations</h3>
                <div className="flex-1 space-y-3">
                  <div className="bg-black border border-white/5 p-3 rounded-lg flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
                    <div>
                      <div className="text-[13px] text-white font-medium mb-1">Increase Stable Exposure</div>
                      <div className="text-[11px] text-zinc-500 leading-relaxed">Market volatility detected. Suggest moving 5% from Growth to Stable Yield.</div>
                    </div>
                  </div>
                  <div className="bg-black border border-white/5 p-3 rounded-lg flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                    <div>
                      <div className="text-[13px] text-white font-medium mb-1">Compound Available</div>
                      <div className="text-[11px] text-zinc-500 leading-relaxed">$45 pending in Aave rewards ready for auto-compound.</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* AI Activity Feed */}
          <div className="col-span-1">
            <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6 h-full flex flex-col">
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[14px] font-medium text-white">Agent Activity Feed</h3>
                <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded text-[10px] text-zinc-400 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Live
                </div>
              </div>

              <div className="flex-1 space-y-5">
                
                <div className="relative pl-4 border-l border-white/10">
                  <div className="absolute w-2 h-2 rounded-full bg-blue-500 -left-[4.5px] top-1"></div>
                  <div className="text-[10px] text-blue-400 font-mono mb-1">2 mins ago</div>
                  <div className="text-[13px] font-medium text-white mb-1">Rebalanced Position</div>
                  <div className="text-[12px] text-zinc-500 font-light leading-relaxed">Adjusted Uniswap V3 LP tick bounds to capture higher volume.</div>
                </div>

                <div className="relative pl-4 border-l border-white/10 opacity-70 hover:opacity-100 transition-opacity">
                  <div className="absolute w-2 h-2 rounded-full bg-zinc-600 -left-[4.5px] top-1"></div>
                  <div className="text-[10px] text-zinc-500 font-mono mb-1">1 hr ago</div>
                  <div className="text-[13px] font-medium text-white mb-1">Risk Scan Completed</div>
                  <div className="text-[12px] text-zinc-500 font-light leading-relaxed">Analyzed 3 protocols. No smart contract vulnerabilities found.</div>
                </div>

                <div className="relative pl-4 border-l border-white/10 opacity-70 hover:opacity-100 transition-opacity">
                  <div className="absolute w-2 h-2 rounded-full bg-zinc-600 -left-[4.5px] top-1"></div>
                  <div className="text-[10px] text-zinc-500 font-mono mb-1">4 hrs ago</div>
                  <div className="text-[13px] font-medium text-white mb-1">Harvested Yield</div>
                  <div className="text-[12px] text-zinc-500 font-light leading-relaxed">Compounded $12.40 from Aave V3.</div>
                </div>
                
                <div className="relative pl-4 border-l border-transparent opacity-70 hover:opacity-100 transition-opacity">
                  <div className="absolute w-2 h-2 rounded-full bg-zinc-600 -left-[4.5px] top-1"></div>
                  <div className="text-[10px] text-zinc-500 font-mono mb-1">1 day ago</div>
                  <div className="text-[13px] font-medium text-white mb-1">Initial Allocation</div>
                  <div className="text-[12px] text-zinc-500 font-light leading-relaxed">Deployed $35,000 across 3 strategies.</div>
                </div>

              </div>

              <div className="pt-6 mt-4 border-t border-white/5">
                <button 
                  onClick={() => setIsReasoningOpen(true)}
                  className="w-full h-10 bg-white/5 hover:bg-white/10 text-white text-[13px] font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <BrainCircuit className="w-4 h-4" /> Inspect AI Reasoning
                </button>
              </div>
            </div>
          </div>

        </div>

      </main>

      <ReasoningModal isOpen={isReasoningOpen} onClose={() => setIsReasoningOpen(false)} />
      <EmergencyWithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />

    </div>
  );
}
