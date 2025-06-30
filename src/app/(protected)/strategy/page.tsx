"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowRight, Loader2, Wallet, Brain, TrendingUp, Shield, Zap } from "lucide-react"
import Image from "next/image"

const strategies = [
  {
    id: "conservative",
    name: "Conservative Growth",
    description: "AI-optimized portfolio focusing on stable assets and low-risk opportunities",
    performance: "5-8% APY",
    risk: "Low",
    features: [
      "Automated rebalancing",
      "Risk management",
      "Stable returns",
    ],
    icon: Shield,
  },
  {
    id: "balanced",
    name: "Balanced Portfolio",
    description: "Diversified strategy combining growth and stability",
    performance: "8-12% APY",
    risk: "Medium",
    features: [
      "Dynamic allocation",
      "Market analysis",
      "Regular optimization",
    ],
    icon: Brain,
  },
  {
    id: "aggressive",
    name: "Aggressive Growth",
    description: "High-performance strategy targeting maximum returns",
    performance: "12-20% APY",
    risk: "High",
    features: [
      "Advanced algorithms",
      "Real-time optimization",
      "High-frequency trading",
    ],
    icon: Zap,
  },
]

export default function StrategyPage() {
  const { isConnected } = useAccount()
  const { toast } = useToast()
  const [selectedStrategy, setSelectedStrategy] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSelectStrategy = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet to continue.",
        variant: "destructive",
      })
      return
    }

    if (!selectedStrategy) {
      toast({
        title: "No Strategy Selected",
        description: "Please select a strategy to continue.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement strategy selection logic
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast({
        title: "Strategy Selected",
        description: "Your AI strategy has been configured. You can now monitor its performance.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Selection Failed",
        description: "There was an error selecting your strategy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-md p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="mb-4 text-2xl font-bold">Connect Wallet</h2>
          <p className="mb-6 text-muted-foreground">
            Please connect your wallet to select a strategy.
          </p>
          <Button size="lg" className="w-full">Connect Wallet</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-4xl"
      >
        <h1 className="mb-8 text-3xl font-bold">Select AI Strategy</h1>
        
        <div className="grid gap-6 md:grid-cols-3">
          {strategies.map((strategy) => (
            <Card
              key={strategy.id}
              className={`cursor-pointer p-6 transition-all hover:border-primary ${
                selectedStrategy === strategy.id ? "border-primary" : ""
              }`}
              onClick={() => setSelectedStrategy(strategy.id)}
            >
              <div className="mb-4">
                <strategy.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{strategy.name}</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {strategy.description}
              </p>
              <div className="mb-4 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Performance:</span>{" "}
                  <span className="text-muted-foreground">{strategy.performance}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Risk Level:</span>{" "}
                  <span className="text-muted-foreground">{strategy.risk}</span>
                </div>
              </div>
              <div className="space-y-1">
                {strategy.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-muted-foreground">
                    <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                    {feature}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {selectedStrategy && (
          <Card className="mt-8 overflow-hidden border-none bg-gradient-to-b from-background to-background/50 p-6 shadow-lg">
            <div className="space-y-6">
              <Button
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
                onClick={handleSelectStrategy}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configuring...
                  </>
                ) : (
                  <>
                    Select Strategy <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  )
} 