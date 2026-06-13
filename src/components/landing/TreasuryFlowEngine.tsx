'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { Activity, Shield, TrendingUp, AlertTriangle, Zap, BrainCircuit } from 'lucide-react';

interface Vault {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  apy: string;
  allocation: number;
  position: { x: number; y: number };
  reasoning: string;
}

const VAULTS: Vault[] = [
  { 
    id: 'conservative', 
    name: 'Conservative Vault', 
    icon: <Shield className="h-5 w-5" />, 
    color: '#3b82f6', // blue-500
    apy: '4.2%', 
    allocation: 45,
    position: { x: -200, y: -120 },
    reasoning: 'Stablecoin yield harvesting via Aave V3 on Arbitrum.'
  },
  { 
    id: 'balanced', 
    name: 'Balanced Vault', 
    icon: <Activity className="h-5 w-5" />, 
    color: '#10b981', // emerald-500
    apy: '10.2%', 
    allocation: 35,
    position: { x: 200, y: -120 },
    reasoning: 'Optimal risk-adjusted yield detected across LST pools.'
  },
  { 
    id: 'growth', 
    name: 'Growth Vault', 
    icon: <TrendingUp className="h-5 w-5" />, 
    color: '#8b5cf6', // violet-500
    apy: '18.5%', 
    allocation: 20,
    position: { x: -180, y: 150 },
    reasoning: 'High-yield farming via concentrated liquidity pairs.'
  },
  { 
    id: 'emergency', 
    name: 'Emergency Reserve', 
    icon: <AlertTriangle className="h-5 w-5" />, 
    color: '#f59e0b', // amber-500
    apy: '0.0%', 
    allocation: 0,
    position: { x: 180, y: 150 },
    reasoning: 'Cold storage buffer for immediate drawdown response.'
  }
];

export function TreasuryFlowEngine() {
  const [activeVault, setActiveVault] = useState<string | null>(null);
  const [hoveredVault, setHoveredVault] = useState<string | null>(null);
  const [isRiskEvent, setIsRiskEvent] = useState(false);
  const [vaultAllocations, setVaultAllocations] = useState<Record<string, number>>({
    conservative: 45, balanced: 35, growth: 20, emergency: 0
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 });
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Normalize -1 to 1
    mouseX.set((e.clientX - centerX) / (rect.width / 2));
    mouseY.set((e.clientY - centerY) / (rect.height / 2));
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Autonomous Reallocation Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // 10% chance of a risk event
      const riskRoll = Math.random();
      if (riskRoll > 0.9 && !isRiskEvent) {
        setIsRiskEvent(true);
        setActiveVault('emergency');
        setVaultAllocations({ conservative: 70, balanced: 10, growth: 0, emergency: 20 });
        
        // Recover after 4 seconds
        setTimeout(() => {
          setIsRiskEvent(false);
          setActiveVault('balanced');
          setVaultAllocations({ conservative: 45, balanced: 35, growth: 20, emergency: 0 });
        }, 4000);
      } else if (!isRiskEvent) {
        // Normal rebalance
        const targets = ['conservative', 'balanced', 'growth'];
        const randomTarget = targets[Math.floor(Math.random() * targets.length)];
        setActiveVault(randomTarget);
        
        // Jiggle allocations slightly
        setVaultAllocations(prev => {
          const shift = Math.floor(Math.random() * 10) - 5;
          return {
            ...prev,
            [randomTarget]: Math.min(100, Math.max(0, prev[randomTarget] + shift)),
            conservative: randomTarget !== 'conservative' ? Math.max(0, prev.conservative - (shift/2)) : prev.conservative,
            balanced: randomTarget !== 'balanced' ? Math.max(0, prev.balanced - (shift/2)) : prev.balanced,
          };
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isRiskEvent]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[600px] flex items-center justify-center isolate"
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,160,240,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* SVG Connections Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
        <defs>
          {VAULTS.map(vault => (
            <linearGradient key={`grad-${vault.id}`} id={`grad-${vault.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isRiskEvent ? '#ef4444' : vault.color} stopOpacity={0.8} />
              <stop offset="100%" stopColor={isRiskEvent ? '#ef4444' : vault.color} stopOpacity={0.1} />
            </linearGradient>
          ))}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Center of container logic. Assuming roughly 50% 50% relative to a centered group */}
        <g style={{ transform: 'translate(50%, 50%)' }}>
          {VAULTS.map(vault => {
            const isHovered = hoveredVault === vault.id;
            const isActive = activeVault === vault.id;
            const isEmergency = isRiskEvent && vault.id === 'emergency';
            
            const strokeColor = isEmergency ? '#ef4444' : (isActive || isHovered ? vault.color : 'hsl(var(--border))');
            const strokeWidth = isActive || isHovered || isEmergency ? 3 : 1;
            const opacity = isActive || isHovered || isEmergency ? 1 : 0.3;

            return (
              <g key={`path-${vault.id}`}>
                <motion.path
                  d={`M 0 0 Q ${vault.position.x * 0.5} ${vault.position.y * 0.8} ${vault.position.x} ${vault.position.y}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isEmergency ? "5, 5" : "none"}
                  opacity={opacity}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  filter={isActive || isHovered ? "url(#glow)" : ""}
                />
                
                {/* Capital Flow Dot */}
                {(isActive || isHovered || isEmergency) && (
                  <motion.circle
                    r="4"
                    fill={isEmergency ? '#ef4444' : vault.color}
                    filter="url(#glow)"
                  >
                    <animateMotion 
                      dur={isEmergency ? "1s" : "2s"} 
                      repeatCount="indefinite"
                      path={`M 0 0 Q ${vault.position.x * 0.5} ${vault.position.y * 0.8} ${vault.position.x} ${vault.position.y}`}
                      keyPoints={isEmergency ? "1;0" : "0;1"} // reverse flow on emergency
                      keyTimes="0;1"
                      calcMode="linear"
                    />
                  </motion.circle>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Center Treasury Core Node */}
      <motion.div 
        style={{
          x: useSpring(useMotionValue(0), { damping: 50, stiffness: 400 }), // center doesn't move much
          y: useSpring(useMotionValue(0), { damping: 50, stiffness: 400 }),
        }}
        className="absolute z-20 flex flex-col items-center justify-center"
      >
        <div className={`relative flex items-center justify-center w-24 h-24 rounded-full border-2 ${isRiskEvent ? 'border-destructive bg-destructive/10' : 'border-primary bg-primary/10'} backdrop-blur-xl shadow-[0_0_50px_-10px_rgba(var(--primary),0.5)] transition-colors duration-500`}>
          {isRiskEvent ? (
             <AlertTriangle className="h-10 w-10 text-destructive animate-pulse" />
          ) : (
            <BrainCircuit className="h-10 w-10 text-primary" />
          )}
          <div className="absolute inset-0 rounded-full border border-primary/50 animate-[spin_4s_linear_infinite]" style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }} />
          <div className="absolute inset-[-10px] rounded-full border border-primary/20 animate-[spin_6s_linear_infinite_reverse]" style={{ borderBottomColor: 'transparent', borderRightColor: 'transparent' }} />
        </div>
        <div className="mt-4 text-center">
          <div className="text-sm font-bold tracking-wider uppercase text-foreground">Treasury Core</div>
          <div className={`text-xs ${isRiskEvent ? 'text-destructive' : 'text-primary'} font-mono mt-1`}>
            {isRiskEvent ? 'EMERGENCY REBALANCE' : 'AI OPERATIONAL'}
          </div>
        </div>
      </motion.div>

      {/* Orbiting Vaults */}
      {VAULTS.map(vault => {
        const isHovered = hoveredVault === vault.id;
        const isActive = activeVault === vault.id;
        const isEmergency = isRiskEvent && vault.id === 'emergency';
        const isRisked = isRiskEvent && vault.id !== 'emergency';

        // Parallax offset computation
        // Closer nodes move more, further nodes move less
        // But we'll just apply a multiplier to the base position
        const parallaxX = useMotionValue(vault.position.x);
        const parallaxY = useMotionValue(vault.position.y);
        
        // Listen to mouse changes and update parallax values
        useEffect(() => {
          const unsubscribeX = smoothX.on("change", (latest) => {
            parallaxX.set(vault.position.x + (latest * -20)); // Inverse movement
          });
          const unsubscribeY = smoothY.on("change", (latest) => {
            parallaxY.set(vault.position.y + (latest * -20));
          });
          return () => {
            unsubscribeX();
            unsubscribeY();
          };
        }, [smoothX, smoothY, parallaxX, parallaxY, vault.position]);

        return (
          <motion.div
            key={vault.id}
            style={{ x: parallaxX, y: parallaxY }}
            className="absolute z-10"
            onMouseEnter={() => setHoveredVault(vault.id)}
            onMouseLeave={() => setHoveredVault(null)}
          >
            <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl border ${isRisked ? 'border-border/30 bg-muted/20 grayscale opacity-50' : (isEmergency || isActive || isHovered ? 'border-transparent' : 'border-border/50 bg-card/50')} backdrop-blur-md cursor-pointer transition-all duration-300 group hover:scale-110 shadow-lg`}
                 style={{ 
                   borderColor: isRisked ? undefined : (isEmergency || isActive || isHovered ? vault.color : undefined),
                   backgroundColor: isRisked ? undefined : (isEmergency || isActive || isHovered ? `${vault.color}20` : undefined),
                   boxShadow: isEmergency || isActive || isHovered ? `0 0 30px -5px ${vault.color}50` : undefined
                 }}
            >
              <div className="text-foreground transition-colors" style={{ color: isRisked ? undefined : (isEmergency || isActive || isHovered ? vault.color : undefined) }}>
                {vault.icon}
              </div>
              
              {/* Allocation Badge */}
              <div className="absolute -top-3 -right-3 px-2 py-0.5 rounded-full bg-background border border-border text-[10px] font-mono font-bold">
                {Math.round(vaultAllocations[vault.id])}%
              </div>
            </div>
            
            <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-center transition-opacity">
              <div className="text-xs font-semibold">{vault.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{vault.apy} APY</div>
            </div>

            {/* Hover Tooltip (AI Reasoning) */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 p-3 rounded-xl bg-popover border border-border shadow-2xl z-50 text-left pointer-events-none"
                >
                  <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border/50">
                    <Zap className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">AI Decision</span>
                  </div>
                  <div className="text-xs leading-relaxed text-popover-foreground mb-2">
                    {vault.reasoning}
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground">Expected Yield</span>
                    <span className="font-bold text-emerald-500">{vault.apy}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
