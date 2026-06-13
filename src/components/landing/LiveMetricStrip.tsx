'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const metrics = [
  { label: 'Treasury Capital Optimized', value: '$24.8M', delay: 0.1 },
  { label: 'Average Yield Efficiency', value: '+32%', delay: 0.25 },
  { label: 'Cross-Chain Allocations', value: '14 Active Routes', delay: 0.4 },
  { label: 'Emergency Liquidity Response', value: '< 2s', delay: 0.55 },
];

interface MetricCounterProps {
  value: string;
  delay: number;
}

export function MetricCounter({ value, delay }: MetricCounterProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [status, setStatus] = useState<'CALCULATING' | 'OPTIMIZED'>('CALCULATING');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;

    let frame = 0;
    const totalFrames = 35; // speed of resolution
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$%+<>';

    const delayTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        frame++;
        
        // Generate scrambled text
        const scrambled = value.split('').map((char, index) => {
          if (char === ' ') return ' ';
          // Resolve characters gradually
          if (frame / totalFrames > index / value.length) {
            return char;
          }
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');

        setDisplayValue(scrambled);

        if (frame >= totalFrames) {
          setDisplayValue(value);
          setStatus('OPTIMIZED');
          clearInterval(interval);
        }
      }, 35);

      return () => clearInterval(interval);
    }, delay * 1000);

    return () => {
      clearTimeout(delayTimeout);
    };
  }, [value, delay, isInView]);

  return (
    <div ref={ref} className="flex flex-col items-center justify-center text-center space-y-3 w-full">
      <div className="flex items-center justify-center gap-1.5 h-6">
        <span className={`text-[9px] font-mono font-black tracking-widest px-2 py-0.5 rounded-full border transition-all duration-500 uppercase ${
          status === 'CALCULATING' 
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse' 
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]'
        }`}>
          {status === 'CALCULATING' ? '● Reading...' : '✓ Optimized'}
        </span>
      </div>
      
      <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground font-mono h-10 flex items-center justify-center">
        {status === 'CALCULATING' && !displayValue ? (
          <span className="text-muted-foreground/30 animate-pulse">---</span>
        ) : (
          <span className={status === 'CALCULATING' ? 'text-primary/70' : 'text-foreground'}>
            {displayValue}
          </span>
        )}
      </div>
    </div>
  );
}

export function LiveMetricStrip() {
  return (
    <div className="w-full border-y border-border/20 bg-muted/5 backdrop-blur-sm overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10 pointer-events-none"></div>
      
      <div className="container mx-auto px-6 max-w-7xl relative z-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 md:py-12">
          {metrics.map((metric, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: metric.delay * 0.5, duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center justify-center text-center space-y-2 border-r border-border/10 last:border-0 md:border-r md:last:border-0 [&:nth-child(2)]:border-r-0 md:[&:nth-child(2)]:border-r"
            >
              <MetricCounter value={metric.value} delay={metric.delay} />
              <div className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground max-w-[150px]">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

