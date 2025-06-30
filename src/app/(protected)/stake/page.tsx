"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowRight, Loader2, Wallet } from "lucide-react"
import Image from "next/image"

const stakingOptions = [
  {
    id: "stable",
    name: "Stable Yield",
    apy: "5-8%",
    risk: "Low",
    description: "Stake in stable assets for consistent returns",
    icon: "🛡️",
  },
  {
    id: "balanced",
    name: "Balanced Growth",
    apy: "8-12%",
    risk: "Medium",
    description: "Balanced portfolio for moderate growth",
    icon: "⚖️",
  },
  {
    id: "growth",
    name: "Growth Focus",
    apy: "12-20%",
    risk: "High",
    description: "Higher risk for potential higher returns",
    icon: "📈",
  },
]

export default function StakePage() {
  const { isConnected } = useAccount()
  const { toast } = useToast()
  const [selectedOption, setSelectedOption] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleStake = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet to continue.",
        variant: "destructive",
      })
      return
    }

    if (!selectedOption || !amount) {
      toast({
        title: "Invalid Input",
        description: "Please select a strategy and enter an amount.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement actual staking logic
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast({
        title: "Staking Initiated",
        description: "Your stake has been initiated. Please check your wallet for confirmation.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Staking Failed",
        description: "There was an error processing your stake. Please try again.",
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
            Please connect your wallet to start staking.
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
        <h1 className="mb-8 text-3xl font-bold">Stake Idle Capital</h1>
        
        <div className="grid gap-6 md:grid-cols-3">
          {stakingOptions.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer p-6 transition-all hover:border-primary ${
                selectedOption === option.id ? "border-primary" : ""
              }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <div className="mb-4 text-4xl">{option.icon}</div>
              <h3 className="mb-2 text-xl font-semibold">{option.name}</h3>
              <div className="mb-2 text-sm text-muted-foreground">
                APY: {option.apy}
              </div>
              <div className="mb-4 text-sm text-muted-foreground">
                Risk: {option.risk}
              </div>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </Card>
          ))}
        </div>

        {selectedOption && (
          <Card className="mt-8 overflow-hidden border-none bg-gradient-to-b from-background to-background/50 p-6 shadow-lg">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Amount to Stake
                </Label>
                <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 border-none bg-transparent shadow-none focus:ring-0"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setAmount("MAX")}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
                onClick={handleStake}
                disabled={isLoading || !amount}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Staking...
                  </>
                ) : (
                  <>
                    Stake <ArrowRight className="ml-2 h-4 w-4" />
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