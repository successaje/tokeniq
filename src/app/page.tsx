'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase, setWalletAddress } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { 
  ArrowRightIcon,
  ArrowDownIcon,
  SparklesIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowsRightLeftIcon,
  CpuChipIcon,
  WalletIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

// Animated text rotator with crossfade and no collapse
const AnimatedText = ({ texts, interval = 4000 }: { texts: string[], interval?: number }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [nextIndex, setNextIndex] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
        setNextIndex((prevNextIndex) => (prevNextIndex + 1) % texts.length);
        setIsAnimating(false);
      }, 600); // Half of the transition duration
    }, interval);

    return () => clearInterval(timer);
  }, [texts.length, interval]);

  const variants = {
    current: { 
      opacity: 1 as const,
      y: 0 as const,
      filter: 'blur(0px)' as const,
    },
    next: { 
      opacity: 0 as const,
      y: 30 as const,
      filter: 'blur(4px)' as const,
    },
    exit: {
      opacity: 0,
      y: -30,
      filter: 'blur(4px)',
    }
  };

  const transition = {
    duration: 0.5,
    ease: 'easeOut',
  } as const;

  return (
    <div className="relative h-24 sm:h-28 md:h-32 lg:h-36 xl:h-40 inline-block w-full">
      {/* Current text */}
      <motion.span
        key={`current-${currentIndex}`}
        initial={false}
        animate={isAnimating ? 'exit' : 'current'}
        variants={variants}
        transition={transition}
        className="absolute inset-0 w-full h-full flex items-start justify-center"
      >
        <span className="relative z-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          {texts[currentIndex]}
        </span>
      </motion.span>
      
      {/* Next text */}
      {isAnimating && (
        <motion.span
          key={`next-${nextIndex}`}
          initial="next"
          animate="current"
          variants={variants}
          transition={transition}
          className="absolute inset-0 w-full h-full flex items-start justify-center"
        >
          <span className="relative z-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {texts[nextIndex]}
          </span>
        </motion.span>
      )}
    </div>
  );
};

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6
    }
  }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
} as const;

const floatAnimation = {
  initial: { y: 0 },
  animate: {
    y: [0, -15, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    }
  }
} as const;

export default function Home() {
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const { address } = useAccount();
  const { userExists, isLoading: isCheckingUser } = useUserProfile(address);
  const router = useRouter();

  // Update wallet address in supabase client when it changes
  useEffect(() => {
    if (address) {
      setWalletAddress(address);
      setIsWalletConnected(true);
    } else {
      setIsWalletConnected(false);
    }
  }, [address]);

  // Handle wallet connection state
  useEffect(() => {
    if (isWalletConnected && !isCheckingUser) {
      if (userExists) {
        // User exists, but don't auto-redirect
        console.log('User is connected and exists');
      } else {
        // New user, don't auto-show onboarding
        console.log('New user detected');
      }
    }
  }, [isWalletConnected, isCheckingUser, userExists]);

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      console.error('No wallet address available');
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const username = formData.get('username') as string;
    const walletAddress = address.toLowerCase();

    try {
      // Ensure the Supabase client has the latest wallet address
      const supabaseClient = setWalletAddress(walletAddress);

      // First, check if the username is already taken
      const { data: existingUser, error: checkError } = await supabaseClient
        .from('profiles')
        .select('wallet_address')
        .eq('username', username)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingUser && existingUser.wallet_address !== walletAddress) {
        throw new Error('Username is already taken');
      }

      // Create or update the profile
      const { data, error } = await supabaseClient
        .from('profiles')
        .upsert({
          wallet_address: walletAddress,
          email,
          username,
          onboarding_complete: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as const, {
          onConflict: 'wallet_address',
        });

      if (error) throw error;

      // Force a hard refresh to ensure all data is up to date
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error in handleOnboarding:', error);
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Error: ${errorMessage}`);
    }
  };

  if (isOnboarding) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
        <Card className="w-full max-w-md p-6 space-y-6">
          <h2 className="text-2xl font-bold text-center">Welcome to TokenIQ</h2>
          <p className="text-center text-muted-foreground mb-6">
            Please complete your profile to get started
          </p>
          <form onSubmit={handleOnboarding} className="space-y-4">
            <div>
              <Label htmlFor="wallet">Wallet Address</Label>
              <Input
                id="wallet"
                type="text"
                value={address}
                disabled
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                className="mt-1"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                required
                className="mt-1"
                placeholder="Enter your username"
              />
            </div>
            <Button type="submit" className="w-full">
              Complete Profile
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Global gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background/95" />
        <div className="absolute -top-1/4 -left-1/4 w-full h-1/2 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)/2%,transparent_70%)]" />
      </div>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/5" />
          
          {/* Animated grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          
          {/* Floating gradient orbs */}
          <motion.div 
            className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl -z-10"
            animate={{
              scale: [1, 1.1, 1],
              x: [0, 20, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
          <motion.div 
            className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl -z-10"
            animate={{
              scale: [1, 1.1, 1],
              x: [0, -20, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: 2
            }}
          />
        </div>
        
        <div className="container px-6 mx-auto relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-6xl mx-auto text-center pt-8 sm:pt-12 md:pt-16"
          >
            <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary-foreground mb-10 md:mb-12 border border-border/20 backdrop-blur-sm"
            >
              <SparklesIcon className="w-4 h-4 mr-2 animate-pulse" />
              <span>Now with AI-Powered Insights</span>
              <div className="ml-2 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            </motion.div>
            
            <motion.div 
              variants={fadeInUp}
              className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl xl:text-8xl mb-8 leading-tight"
            >
              <div className="mb-2">The Future of</div>
              <AnimatedText 
                texts={[
                  'DeFi Analytics',
                  'Crypto Trading',
                  'Portfolio Management',
                  'Yield Optimization',
                  'Cross-Chain Swaps',
                  'AI-Powered Insights'
                ]} 
                interval={4000}
              />
              <motion.span 
                className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-2xl -z-0"
                animate={{
                  opacity: [0.6, 0.8, 0.6],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              />
            </motion.div>
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl md:text-2xl text-foreground/80 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Unlock the full potential of your Crypto portfolio and Bitcoin assets through advanced vault strategies, tokenization, and AI-driven financial automation—all in one platform.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <div className="relative z-10 w-full sm:w-auto">
                <Link href="/discover" className="block w-full">
                  <Button className="group w-full sm:w-auto px-10 py-6 text-base font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 relative z-10">
                    <span>Launch App</span>
                    <ArrowRightIcon className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
              <div className="relative z-10 w-full sm:w-auto">
                <Link href="#features" className="block w-full">
                  <Button variant="outline" className="w-full sm:w-auto px-10 py-6 text-base font-medium group relative z-10">
                    <span>Explore Features</span>
                    <ArrowDownIcon className="w-5 h-5 ml-2 transition-transform group-hover:translate-y-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
            
            {/* Stats preview */}
            <motion.div 
              variants={fadeIn}
              className="mt-16 p-6 bg-background/50 backdrop-blur-md rounded-2xl border border-border/20 inline-flex flex-wrap justify-center gap-8"
            >
              {[
                { value: '10K+', label: 'Active Users' },
                { value: '$500M+', label: 'Assets Tracked' },
                { value: '50+', label: 'Blockchains' },
                { value: '24/7', label: 'Support' }
              ].map((stat, index) => (
                <div key={index} className="text-center px-4">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-foreground/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
            
            {/* Scroll indicator */}
            <motion.div 
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                y: [20, 0, 0, -10],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "easeInOut",
              }}
            >
              <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex justify-center p-1 mb-2">
                <motion.div
                  className="w-1 h-2 bg-foreground/50 rounded-full"
                  animate={{
                    y: [0, 8, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: 'loop',
                    ease: "easeInOut",
                  }}
                />
              </div>
              <span className="text-xs text-foreground/50">Scroll to explore</span>
            </motion.div>
            
            {/* Value Propositions / Features Highlights */}
            <section className="py-20 relative overflow-hidden">
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background/50 to-background/80" />
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'radial-gradient(circle at 25% 25%, var(--primary) 0.5px, transparent 0.5px)',
                  backgroundSize: '20px 20px',
                }} />
              </div>
              
              <div className="container mx-auto px-6">
                <motion.div 
                  className="text-center mb-16"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    Powering the Future of BTCfi
                  </h2>
                  <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
                    Advanced DeFi solutions built on Core to maximize your Bitcoin's potential
                  </p>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                  {[
                    {
                      icon: '🚀',
                      title: 'BTC Vaults & Yield',
                      description: 'Put your Bitcoin to work with decentralized vaults on Core. Earn yield, borrow, or tokenize your BTC assets.'
                    },
                    {
                      icon: '🌉',
                      title: 'Cross-Chain Bridge with Chainlink CCIP',
                      description: 'Move tokens across chains securely and instantly using Chainlink CCIP and Core\'s native bridges.'
                    },
                    {
                      icon: '🤖',
                      title: 'ElizaOS: Your AI Finance Agent',
                      description: 'Get real-time insights, strategy suggestions, and automated vault execution powered by ElizaOS.'
                    },
                    {
                      icon: '📊',
                      title: 'Portfolio & Strategy Insights',
                      description: 'Visualize your portfolio, track performance, and discover high-yield BTCfi opportunities across chains.'
                    },
                    {
                      icon: '🧩',
                      title: 'Tokenize Real-World Assets (RWAs)',
                      description: 'Bring your invoices, carbon credits, and RWAs on-chain as tradable assets on Core.'
                    },
                    {
                      icon: '🔒',
                      title: 'Non-Custodial & Secure',
                      description: 'Maintain full control of your assets with non-custodial solutions secured by Core\'s Bitcoin-backed security.'
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      className="group relative p-6 rounded-2xl bg-background/50 border border-border/20 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="text-4xl mb-4">{feature.icon}</div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-foreground/70">{feature.description}</p>
                      <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl blur-sm" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
            
            {/* Trusted by section with gradient theme */}
            <motion.div 
              className="relative mt-32 py-16 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {/* Additional gradient accents */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute -top-1/2 left-1/4 w-1/2 h-1/2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-1/4 right-1/4 w-1/3 h-1/2 bg-gradient-to-r from-pink-500/5 to-blue-500/5 rounded-full blur-3xl" />
              </div>
              
              <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                  <motion.h2 
                    className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    viewport={{ once: true }}
                  >
                    Trusted by Industry Leaders
                  </motion.h2>
                  <motion.p 
                    className="text-foreground/70 max-w-2xl mx-auto text-lg"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    Powering the future of finance with leading blockchain networks and protocols
                  </motion.p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 items-center justify-items-center">
                  {[
                    { name: 'Ethereum', logo: '/logos/ethereum.png' },
                    { name: 'Core', logo: '/core-dao-core-logo.png' },
                    { name: 'Bitcoin', logo: '/logos/bitcoin-btc-logo.png' },
                    // { name: 'Arbitrum', logo: '/arbitrum-arb-logo.png' },
                    { name: 'Avalanche', logo: '/avalanche-avax-logo.png' },
                    { name: 'Polygon', logo: '/polygon-matic-logo.png' },
                    // { name: 'BNB Chain', logo: '/bnb-bnb-logo.png' },
                    { name: 'Base', logo: '/base-logo.jpeg' },
                    { name: 'USDC', logo: '/usd-coin-usdc-logo.png' },
                    { name: 'USDT', logo: '/tether-usdt-logo.png' },
                    { name: 'Aave', logo: '/logos/aave.png' },
                    { name: 'Chainlink', logo: '/logos/chainlink.png' },
                  ].map((item, index) => (
                    <motion.div 
                      key={item.name}
                      className="relative group w-full h-24 flex items-center justify-center p-4 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-background/80 to-background/50 border border-border/20 hover:border-blue-400/30 transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + (index * 0.05) }}
                      viewport={{ once: true }}
                      whileHover={{
                        y: -8,
                        boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.04)'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <img 
                        src={item.logo} 
                        alt={item.name}
                        className="h-10 w-auto max-w-[120px] object-contain opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* BTCfi Education Section */}
      <section className="relative py-20 bg-background/50">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary)/0.03),transparent_70%)]" />
        </div>
        
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
              What is BTCfi?
            </h2>
            
            <div className="space-y-8">
              <div className="bg-background/80 backdrop-blur-sm border border-border/20 rounded-2xl p-8 md:p-10 shadow-sm">
                <p className="text-lg leading-relaxed text-foreground/90 mb-6">
                  <strong className="font-semibold text-foreground">BTCfi (Bitcoin Decentralized Finance)</strong> is the emerging frontier of DeFi innovation built around Bitcoin — unlocking the full potential of your BTC assets beyond holding.
                </p>
                
                <p className="text-foreground/80 leading-relaxed">
                  With TokenIQ, BTCfi becomes smarter, faster, and more accessible. Our platform fuses powerful AI automation, cross-chain liquidity, and the Core blockchain's performance to let you do more with your Bitcoin than ever before.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { emoji: '📈', text: 'Stake & earn from smart vaults' },
                  { emoji: '💸', text: 'Borrow stablecoins against BTC' },
                  { emoji: '🤖', text: 'Automate strategies with ElizaOS' },
                  { emoji: '🌍', text: 'Tokenize assets using BTC' },
                  { emoji: '🔗', text: 'Bridge BTC across chains' }
                ].map((item, index) => (
                  <div 
                    key={index} 
                    className="bg-background/80 backdrop-blur-sm border border-border/20 rounded-xl p-4 text-left flex items-center gap-3 hover:border-primary/30 transition-colors"
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-foreground/90">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 bg-gradient-radial from-blue-500/5 via-transparent to-transparent rounded-full" />
        </div>
        <div className="container px-6 mx-auto relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Powerful Features for Modern Investors</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your digital assets efficiently and securely
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <ChartBarIcon className="w-8 h-8 text-primary" />,
                title: 'Advanced Analytics',
                description: 'Comprehensive market data and analytics to make informed investment decisions.'
              },
              {
                icon: <ShieldCheckIcon className="w-8 h-8 text-primary" />,
                title: 'Secure Storage',
                description: 'Enterprise-grade security with multi-signature and hardware wallet support.'
              },
              {
                icon: <ArrowsRightLeftIcon className="w-8 h-8 text-primary" />,
                title: 'Cross-Chain Swaps',
                description: 'Seamlessly trade assets across multiple blockchains with minimal slippage.'
              },
              {
                icon: <CpuChipIcon className="w-8 h-8 text-primary" />,
                title: 'AI-Powered',
                description: 'Smart algorithms that analyze market trends and suggest optimal strategies.'
              },
              {
                icon: <WalletIcon className="w-8 h-8 text-primary" />,
                title: 'Portfolio Tracking',
                description: 'Real-time tracking of all your digital assets in one intuitive dashboard.'
              },
              {
                icon: <ArrowTrendingUpIcon className="w-8 h-8 text-primary" />,
                title: 'Yield Optimization',
                description: 'Automated yield farming strategies to maximize your returns.'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-background hover:bg-background/90 transition-all duration-300 border border-border/20 hover:border-primary/20 shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ElizaOS AI Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-background/90 to-background/80" />
          <div className="absolute -right-1/4 -top-1/4 w-1/2 h-1/2 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="container px-6 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <motion.div 
              className="md:w-1/2"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <SparklesIcon className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Powered by AI</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Intelligent Insights with{' '}
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  ElizaOS
                </span>
              </h2>
              <p className="text-lg text-foreground/80 mb-8">
                Our advanced AI agent provides real-time market analysis, predictive insights, and personalized recommendations to help you make informed investment decisions.
              </p>
              <div className="space-y-4">
                {[
                  'Real-time market analysis',
                  'Predictive price movements',
                  'Personalized portfolio recommendations',
                  'Risk assessment and alerts'
                ].map((feature, i) => (
                  <div key={i} className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <span className="ml-3 text-foreground/90">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/ai-insights" className="inline-flex items-center text-primary font-medium hover:underline">
                  Explore AI Features
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </motion.div>
            <motion.div 
              className="md:w-1/2 relative"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl -rotate-6 scale-105 blur-xl opacity-70" />
                <div className="relative bg-background/50 backdrop-blur-sm p-8 rounded-2xl border border-border/20 shadow-lg">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-background to-background/80 border border-border/20">
                    {/* Light mode logo */}
                    <img 
                      src="/logo_eliza_OS_light.png" 
                      alt="ElizaOS"
                      className="h-12 w-auto dark:hidden"
                      loading="lazy"
                    />
                    {/* Dark mode logo */}
                    <img 
                      src="/logo_eliza_OS_dark.png" 
                      alt="ElizaOS"
                      className="h-12 w-auto hidden dark:block"
                      loading="lazy"
                    />
                    <div className="mt-6 p-4 bg-background/50 rounded-lg border border-border/20">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium">ElizaAI</p>
                          <p className="text-sm text-foreground/70">Analyzing market trends...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
          <div className="absolute -right-1/4 top-1/2 w-1/2 h-1/2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -left-1/4 bottom-1/4 w-1/2 h-1/2 bg-gradient-to-l from-pink-500/20 to-blue-500/20 rounded-full blur-3xl" />
        </div>
        <div className="container px-6 mx-auto text-center relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to take control of your digital assets?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Join thousands of investors already using TokenIQ to manage their portfolios.
            </p>
            <Link href="/signup">
              <Button className="bg-white text-foreground hover:bg-white/90 px-8 py-6 text-base font-semibold">
                Get Started for Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 to-background" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-gradient-radial from-blue-500/5 via-transparent to-transparent rounded-full" />
        </div>
        <div className="container px-6 mx-auto relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '$500M+', label: 'Assets Managed' },
              { value: '50+', label: 'Blockchains' },
              { value: '24/7', label: 'Support' }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6"
              >
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-background/80 backdrop-blur-sm border-t border-border/30">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 to-background" />
        </div>
        <div className="container px-6 py-12 mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">TokenIQ</h3>
              <p className="text-muted-foreground">Advanced DeFi analytics and portfolio management for the modern crypto investor.</p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'API', 'Status'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Resources</h4>
              <ul className="space-y-2">
                {['Documentation', 'Guides', 'Blog', 'Support'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2">
                {['About', 'Whitepaper', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <a 
                      href={item === 'Whitepaper' ? '/whitepaper' : '#'} 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-border/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} TokenIQ. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {['twitter', 'github', 'discord', 'telegram'].map((social) => (
                <a 
                  key={social} 
                  href="#" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={social}
                >
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
