"use client"

import { useState } from "react"
import { useAccount, useChainId } from "wagmi"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select } from "@/components/ui/Select"
import { useToast } from "@/hooks/use-toast"
import { ArrowDownUp, ArrowRight, Loader2, Wallet } from "lucide-react"
import { chains } from "@/config/chains"
import { tokens } from "@/config/tokens"
import Image from "next/image"

export default function BridgePage() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { toast } = useToast()

  const [fromChain, setFromChain] = useState(chainId)
  const [toChain, setToChain] = useState(chainId)
  const [token, setToken] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSwap = () => {
    const temp = fromChain
    setFromChain(toChain)
    setToChain(temp)
  }

  const handleBridge = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet to continue.",
        variant: "destructive",
      })
      return
    }

    if (!token || !amount) {
      toast({
        title: "Invalid Input",
        description: "Please select a token and enter an amount.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement actual bridge logic
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulated delay
      toast({
        title: "Bridge Initiated",
        description: "Your transfer has been initiated. Please check your wallet for confirmation.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Bridge Failed",
        description: "There was an error processing your transfer. Please try again.",
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
            Please connect your wallet to use the bridge.
          </p>
          <Button size="lg" className="w-full">Connect Wallet</Button>
        </Card>
      </div>
    )
  }

  const selectedFromChain = chains.find((chain) => chain.id === fromChain)
  const selectedToChain = chains.find((chain) => chain.id === toChain)
  const selectedToken = tokens.find((t) => t.address === token)

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-xl"
      >
        <h1 className="mb-8 text-3xl font-bold">Bridge Assets</h1>
        <Card className="overflow-hidden border-none bg-gradient-to-b from-background to-background/50 p-6 shadow-lg">
          <div className="space-y-6">
            {/* From Chain */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">From</Label>
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                {selectedFromChain && (
                  <Image
                    src={`/chains/${selectedFromChain.network}.png`}
                    alt={selectedFromChain.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <Select
                  value={fromChain.toString()}
                  onValueChange={(value) => setFromChain(Number(value))}
                  className="flex-1 border-none bg-transparent shadow-none focus:ring-0"
                >
                  {chains.map((chain) => (
                    <option key={chain.id} value={chain.id}>
                      {chain.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSwap}
                className="rounded-full bg-primary/10 hover:bg-primary/20"
              >
                <ArrowDownUp className="h-4 w-4 text-primary" />
              </Button>
            </div>

            {/* To Chain */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">To</Label>
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                {selectedToChain && (
                  <Image
                    src={`/chains/${selectedToChain.network}.png`}
                    alt={selectedToChain.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <Select
                  value={toChain.toString()}
                  onValueChange={(value) => setToChain(Number(value))}
                  className="flex-1 border-none bg-transparent shadow-none focus:ring-0"
                >
                  {chains.map((chain) => (
                    <option key={chain.id} value={chain.id}>
                      {chain.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Token Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Token</Label>
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                {selectedToken && (
                  <Image
                    src={selectedToken.logoURI || ""}
                    alt={selectedToken.symbol}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <Select
                  value={token}
                  onValueChange={setToken}
                  className="flex-1 border-none bg-transparent shadow-none focus:ring-0"
                >
                  <option value="">Select a token</option>
                  {tokens
                    .filter((t) => t.chainId === fromChain)
                    .map((token) => (
                      <option key={token.address} value={token.address}>
                        {token.symbol}
                      </option>
                    ))}
                </Select>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 border-none bg-transparent shadow-none focus:ring-0"
                />
                {selectedToken && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setAmount("MAX")}
                  >
                    MAX
                  </Button>
                )}
              </div>
            </div>

            {/* Bridge Button */}
            <Button
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              size="lg"
              onClick={handleBridge}
              disabled={isLoading || !token || !amount}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bridging...
                </>
              ) : (
                <>
                  Bridge <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
} 