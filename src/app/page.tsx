'use client';
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight, Shield, Zap, LineChart, Users, Building2, Briefcase, Star, Rocket, ChevronRight } from 'lucide-react'
import { Header } from '@/components/layouts/Header'
import { Footer } from '@/components/layouts/Footer'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const particles = Array.from({ length: 20 })

export default function LandingPage() {
  const statements = [
    'DeFi Treasury Management',
    'AI-Powered Strategies',
    'Institutional-Grade Security'
  ]
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % statements.length)
    }, 15000)
    
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted pt-32 pb-20">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          {dimensions.width > 0 && dimensions.height > 0 && (
            <div className="absolute inset-0">
              {particles.map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-1 w-1 rounded-full bg-primary/20"
                  initial={{
                    x: Math.random() * dimensions.width,
                    y: Math.random() * dimensions.height,
                    scale: 0,
                  }}
                  animate={{
                    x: Math.random() * dimensions.width,
                    y: Math.random() * dimensions.height,
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: Math.random() * 2 + 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              ))}
            </div>
          )}

          <div className="container relative mx-auto px-4">
            <motion.div 
              className="mx-auto max-w-4xl text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="mb-8 inline-flex items-center rounded-full border bg-card/50 px-4 py-1.5 text-sm backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Rocket className="mr-2 h-4 w-4 text-primary" />
                <span>TokenIQ X is currently on testnet</span>
              </motion.div>
              <motion.h1 
                className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                The Future of{' '}
                <div className="relative inline-block min-h-[1.5em] min-w-[600px] sm:min-w-[700px] lg:min-w-[800px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5 }}
                      className="relative whitespace-nowrap"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                        {statements[currentIndex]}
                      </span>
                      <span className="relative text-foreground">
                        {statements[currentIndex]}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                  <span className="invisible whitespace-nowrap">
                    {statements[0]}
                  </span>
                </div>
              </motion.h1>
              <motion.p 
                className="mb-8 text-xl text-muted-foreground sm:text-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Unlock the full potential of your treasury with AI-powered strategies, 
                automated execution, and institutional-grade security.
              </motion.p>
              <motion.div 
                className="flex flex-wrap justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Button size="lg" className="gap-2" asChild>
                  <Link href="/dashboard">
                    Launch App <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  View Documentation <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div 
                className="mt-12 grid grid-cols-2 gap-8 text-center sm:grid-cols-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                {[
                  { value: '$500M+', label: 'Assets Under Management' },
                  { value: '15%', label: 'Average APY' },
                  { value: '100+', label: 'Active DAOs' },
                  { value: '99.9%', label: 'Uptime' }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                  >
                    <motion.div 
                      className="text-3xl font-bold text-primary"
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1, type: "spring", stiffness: 200 }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">How it Works</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">1. Connect Your Treasury</h3>
                <p className="text-muted-foreground">
                  Securely connect your treasury wallet and set your risk parameters.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">2. AI Strategy Selection</h3>
                <p className="text-muted-foreground">
                  Our AI analyzes market conditions and recommends optimal strategies.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">3. Automated Execution</h3>
                <p className="text-muted-foreground">
                  Smart contracts execute trades and manage positions automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section id="use-cases" className="bg-muted py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">Use Cases</h2>
            <div className="grid gap-8 md:grid-cols-4">
              <div className="rounded-lg border bg-card p-6">
                <Users className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-xl font-semibold">DAOs</h3>
                <p className="text-muted-foreground">
                  Manage treasury assets and generate sustainable yields for your community.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <Building2 className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-xl font-semibold">TradFi</h3>
                <p className="text-muted-foreground">
                  Bridge traditional finance with DeFi opportunities safely and efficiently.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <Briefcase className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-xl font-semibold">VCs</h3>
                <p className="text-muted-foreground">
                  Optimize portfolio performance with AI-driven yield strategies.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <Star className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-xl font-semibold">Institutions</h3>
                <p className="text-muted-foreground">
                  Access institutional-grade DeFi infrastructure and risk management.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Powered By */}
        <section id="partners" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">Powered By</h2>
            <div className="mx-auto grid max-w-4xl grid-cols-2 items-center justify-items-center gap-8 grayscale sm:grid-cols-3 md:grid-cols-4">
              <div className="flex h-8 w-32 items-center justify-center">
                <img src="/logos/chainlink.png" alt="Chainlink" className="max-h-8 w-auto" />
              </div>
              <div className="flex h-8 w-32 items-center justify-center">
                <img src="/logos/ethereum.png" alt="Ethereum" className="max-h-8 w-auto" />
              </div>
              <div className="flex h-8 w-32 items-center justify-center">
                <img src="/logos/aave.png" alt="Aave" className="max-h-8 w-auto" />
              </div>
              <div className="flex h-8 w-32 items-center justify-center">
                <img src="/arbitrum-arb-logo.png" alt="Arbitrum" className="max-h-8 w-auto" />
              </div>
              <div className="flex h-8 w-32 items-center justify-center">
                <img src="/avalanche-avax-logo.png" alt="Avalanche" className="max-h-8 w-auto" />
              </div>
              <div className="flex h-8 w-32 items-center justify-center">
                <img src="/polygon-matic-logo.png" alt="Polygon" className="max-h-8 w-auto" />
              </div>
              <div className="flex h-8 w-32 items-center justify-center">
                <img src="/base-logo.jpeg" alt="Base" className="max-h-8 w-auto" />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-muted py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">What Our Users Say</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border bg-card p-6">
                  <div className="mb-4 flex items-center">
                    <div className="mr-4 h-12 w-12 rounded-full bg-primary/10" />
                    <div>
                      <h3 className="font-semibold">User Name</h3>
                      <p className="text-sm text-muted-foreground">Position, Organization</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    "TokenIQ has revolutionized how we manage our treasury. The AI-driven strategies have consistently outperformed our expectations."
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-lg border bg-card p-8 text-center">
              <h2 className="mb-4 text-3xl font-bold">Stay Updated</h2>
              <p className="mb-6 text-muted-foreground">
                Subscribe to our newsletter for the latest updates on DeFi strategies and platform features.
              </p>
              <form className="flex flex-col gap-4 sm:flex-row">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-lg border bg-background px-4 py-2"
                />
                <Button>Subscribe</Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
} 