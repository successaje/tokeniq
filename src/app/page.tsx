'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowRight, BrainCircuit, Shield, 
  Zap, Lock, Activity, Layers, 
  Database, Network, Cpu, AlertTriangle, Building2
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-zinc-50 overflow-hidden font-sans selection:bg-white/20">
      
      {/* Refined Linear/Vercel Aesthetic Background */}
      <div className="fixed inset-0 -z-10 bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(40,40,40,0.6),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_20%,transparent_100%)]"></div>
      </div>
      
      {/* Navigation */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center">
              <span className="text-black font-bold text-[10px]">TQ</span>
            </div>
            <span className="font-medium tracking-tight text-sm text-zinc-200">TokenIQ</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-zinc-400">
            <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
            <Link href="#engine" className="hover:text-white transition-colors">AI Engine</Link>
            <Link href="#treasury" className="hover:text-white transition-colors">Treasury</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link href="/onboarding">
              <button className="h-8 px-4 bg-white text-black hover:bg-zinc-200 text-[13px] font-medium rounded-md shadow-sm transition-all">
                Launch App
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 px-6 flex items-center justify-center overflow-hidden">
          <div className="container mx-auto max-w-4xl relative z-10 text-center">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center space-y-6"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-zinc-300 w-fit backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                Arbitrum Agentic Network Active
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-medium tracking-[-0.04em] leading-[1.05] text-white">
                Your Money Should <br className="hidden sm:block" />
                <span className="text-zinc-500">Work Harder Than You Do.</span>
              </h1>
              
              <p className="max-w-2xl text-lg sm:text-xl text-zinc-400 font-light leading-relaxed">
                TokenIQ is an autonomous AI CFO that detects idle capital, formulates risk-adjusted strategies, and executes them seamlessly on Arbitrum.
              </p>
              
              <div className="pt-6 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/onboarding" className="w-full sm:w-auto">
                  <button className="w-full h-12 px-8 text-[15px] font-medium bg-white text-black hover:bg-zinc-200 rounded-md transition-all flex items-center justify-center gap-2 group">
                    <BrainCircuit className="h-4 w-4" />
                    Activate AI CFO
                    <ArrowRight className="h-4 w-4 ml-1 opacity-50 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                  </button>
                </Link>
                <Link href="#how-it-works" className="w-full sm:w-auto">
                  <button className="w-full h-12 px-8 text-[15px] font-medium bg-white/5 text-white border border-white/10 hover:bg-white/10 rounded-md transition-all">
                    View Architecture
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES BENTO */}
        <section id="how-it-works" className="py-24 relative border-t border-white/5 bg-zinc-950/50">
          <div className="container mx-auto px-6 max-w-5xl">
            <motion.div {...fadeInUp} className="mb-16">
              <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-3">The Autonomous Loop</h2>
              <p className="text-zinc-400 text-base font-light">From detection to execution, handled entirely by AI.</p>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {/* Feature 1: Detect */}
              <motion.div variants={fadeInUp} className="p-6 rounded-2xl border border-white/5 bg-black hover:bg-zinc-900/50 transition-colors">
                <SearchIcon className="h-6 w-6 text-zinc-300 mb-4" />
                <h3 className="text-base font-medium mb-2 text-white">Detect Idle Capital</h3>
                <p className="text-zinc-500 font-light text-[13px] leading-relaxed">
                  Scans connected wallets and treasuries to identify unproductive assets, under-optimized yields, and stranded liquidity.
                </p>
              </motion.div>

              {/* Feature 2: Strategy */}
              <motion.div variants={fadeInUp} className="p-6 rounded-2xl border border-white/5 bg-black hover:bg-zinc-900/50 transition-colors" id="engine">
                <BrainCircuit className="h-6 w-6 text-zinc-300 mb-4" />
                <h3 className="text-base font-medium mb-2 text-white">AI Strategy Engine</h3>
                <p className="text-zinc-500 font-light text-[13px] leading-relaxed">
                  Formulates a personalized, risk-adjusted portfolio based on current market depth, protocol health, and historical yield.
                </p>
              </motion.div>

              {/* Feature 3: Execution */}
              <motion.div variants={fadeInUp} className="p-6 rounded-2xl border border-white/5 bg-black hover:bg-zinc-900/50 transition-colors">
                <Activity className="h-6 w-6 text-zinc-300 mb-4" />
                <h3 className="text-base font-medium mb-2 text-white">Autonomous Execution</h3>
                <p className="text-zinc-500 font-light text-[13px] leading-relaxed">
                  Executes the approved strategy across multiple protocols instantly, abstracting away complex multi-step transactions.
                </p>
              </motion.div>

              {/* Feature 4: Emergency (Large) */}
              <motion.div variants={fadeInUp} className="md:col-span-2 p-6 rounded-2xl border border-white/5 bg-black hover:bg-zinc-900/50 transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex-1">
                  <AlertTriangle className="h-6 w-6 text-zinc-300 mb-4" />
                  <h3 className="text-base font-medium mb-2 text-white">Emergency Liquidity Response</h3>
                  <p className="text-zinc-500 font-light text-[13px] leading-relaxed max-w-sm">
                    In the event of market volatility or a smart contract exploit, the AI can be overridden. 1-click withdrawal liquidates positions and returns capital to base assets.
                  </p>
                </div>
                <div className="w-full md:w-48 h-24 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-center border-dashed">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-mono">Safety Override</span>
                </div>
              </motion.div>

              {/* Feature 5: Arbitrum */}
              <motion.div variants={fadeInUp} className="p-6 rounded-2xl border border-white/5 bg-black hover:bg-zinc-900/50 transition-colors flex flex-col justify-between">
                <div>
                  <Network className="h-6 w-6 text-zinc-300 mb-4" />
                  <h3 className="text-base font-medium mb-2 text-white">Built on Arbitrum</h3>
                  <p className="text-zinc-500 font-light text-[13px] leading-relaxed">
                    Leveraging Arbitrum's sub-cent fees to execute hundreds of micro-transactions, unlocking strategies impossible on L1.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* DAO TREASURY SECTION */}
        <section id="treasury" className="py-24 relative border-t border-white/5">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <Building2 className="h-10 w-10 text-zinc-700 mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-6">DAO Treasury Intelligence</h2>
            <p className="text-zinc-400 text-lg font-light max-w-2xl mx-auto mb-10 leading-relaxed">
              Replace multi-sig paralysis with an AI CFO. TokenIQ analyzes your on-chain treasury and generates governance-ready proposals to put idle capital to work.
            </p>
            <Link href="/treasury">
              <button className="h-10 px-6 text-[14px] font-medium bg-white/5 text-white border border-white/10 hover:bg-white/10 rounded-md transition-all">
                Explore Enterprise Mode
              </button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-10 bg-black text-center text-zinc-600 text-[12px] font-medium">
        <p>TokenIQ © 2026. Built for the Arbitrum Agentic Hackathon.</p>
      </footer>
    </div>
  );
}

function SearchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
