"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { useToast } from "@/hooks/use-toast"
import { ArrowRight, Loader2, Wallet, Percent, Clock, Shield } from "lucide-react"

const loanOptions = [
  {
    id: "stable",
    name: "Stable Loan",
    rate: "5.5%",
    term: "12 months",
    collateral: "150%",
    description: "Low-risk loan with stable interest rates",
  },
  {
    id: "flexible",
    name: "Flexible Loan",
    rate: "7.2%",
    term: "6 months",
    collateral: "120%",
    description: "Short-term loan with flexible repayment",
  },
  {
    id: "yield",
    name: "Yield Loan",
    rate: "4.8%",
    term: "24 months",
    collateral: "200%",
    description: "Long-term loan with yield optimization",
  },
]

export default function LoansPage() {
  const { isConnected } = useAccount()
  const { toast } = useToast()
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLoanRequest = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet to continue.",
        variant: "destructive",
      })
      return
    }

    if (!selectedLoan || !amount) {
      toast({
        title: "Missing Information",
        description: "Please select a loan type and enter an amount.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement loan request logic
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast({
        title: "Loan Requested",
        description: "Your loan request has been submitted successfully.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "There was an error processing your loan request. Please try again.",
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
            Please connect your wallet to access loans.
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
        className="mx-auto max-w-6xl"
      >
        <h1 className="mb-8 text-3xl font-bold">Loans & Yield</h1>

        {/* Loan Options */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {loanOptions.map((loan) => (
            <Card
              key={loan.id}
              className={`cursor-pointer p-6 transition-all ${
                selectedLoan === loan.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedLoan(loan.id)}
            >
              <h3 className="mb-2 text-xl font-semibold">{loan.name}</h3>
              <div className="mb-4 space-y-2">
                <div className="flex items-center text-sm">
                  <Percent className="mr-2 h-4 w-4 text-primary" />
                  <span>Interest Rate: {loan.rate}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="mr-2 h-4 w-4 text-primary" />
                  <span>Term: {loan.term}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Shield className="mr-2 h-4 w-4 text-primary" />
                  <span>Collateral: {loan.collateral}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{loan.description}</p>
            </Card>
          ))}
        </div>

        {/* Loan Request Form */}
        <Card className="p-6">
          <h2 className="mb-6 text-xl font-semibold">Request Loan</h2>
          <div className="mb-6">
            <Label htmlFor="amount">Loan Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleLoanRequest}
            disabled={isLoading || !selectedLoan || !amount}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Request Loan <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </Card>
      </motion.div>
    </div>
  )
} 