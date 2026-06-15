'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';

const EXECUTION_STEPS = [
  'Portfolio analyzed',
  'Strategy generated',
  'Vault selected',
  'Funds allocated',
  'Monitoring activated'
];

export default function ApprovalExecution() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < EXECUTION_STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1500); // 1.5 seconds per step
      return () => clearTimeout(timer);
    } else {
      const finalTimer = setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      return () => clearTimeout(finalTimer);
    }
  }, [currentStep, router]);

  return (
    <div className="min-h-screen bg-black text-zinc-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Refined subtle background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(40,40,40,0.3),transparent_40%)] z-0"></div>

      <div className="relative z-10 w-full max-w-md">
        
        <div className="text-center mb-12">
           <h1 className="text-2xl font-medium tracking-tight text-white mb-2">Executing Strategy</h1>
           <p className="text-zinc-500 font-light text-[13px]">
             Please do not close this tab. The agent is interacting with Arbitrum.
           </p>
        </div>

        <div className="space-y-6">
          {EXECUTION_STEPS.map((step, index) => {
            const isPast = index < currentStep;
            const isCurrent = index === currentStep;
            const isFuture = index > currentStep;
            
            return (
              <div key={index} className="flex items-center gap-4">
                <div className="w-6 flex justify-center">
                  {isPast ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <Check className="w-3 h-3 text-emerald-500" />
                      </div>
                    </motion.div>
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                  )}
                </div>
                <div 
                  className={`text-[14px] font-medium transition-colors duration-500 ${
                    isPast ? 'text-zinc-600' : isCurrent ? 'text-white' : 'text-zinc-800'
                  }`}
                >
                  {step}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
