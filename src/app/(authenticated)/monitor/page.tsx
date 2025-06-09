"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { useToast } from "@/hooks/use-toast"
import { ArrowRight, Loader2, Wallet, TrendingUp, TrendingDown, Settings } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const performanceData = [
  { date: "Jan", value: 1000 },
  { date: "Feb", value: 1200 },
  { date: "Mar", value: 1150 },
  { date: "Apr", value: 1300 },
  { date: "May", value: 1400 },
  { date: "Jun", value: 1500 },
]

const metrics = [
  {
    name: "Total Value",
    value: "$15,000",
    change: "+12.5%",
    trend: "up",
  },
  {
    name: "APY",
    value: "8.5%",
    change: "+0.5%",
    trend: "up",
  },
  {
    name: "Risk Score",
    value: "Medium",
    change: "-2%",
    trend: "down",
  },
]

const adjustments = [
  {
    id: "rebalance",
    name: "Rebalance Portfolio",
    description: "Adjust asset allocation based on market conditions",
  },
  {
    id: "risk",
    name: "Adjust Risk Level",
    description: "Modify risk parameters for better returns",
  },
  {
    id: "strategy",
    name: "Update Strategy",
    description: "Fine-tune AI strategy parameters",
  },
]

export default function MonitorPage() {
  const { isConnected } = useAccount()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleAdjustment = async (adjustmentId: string) => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet to continue.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement adjustment logic
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast({
        title: "Adjustment Applied",
        description: "Your portfolio has been updated successfully.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Adjustment Failed",
        description: "There was an error applying the adjustment. Please try again.",
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
            Please connect your wallet to monitor your portfolio.
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
        <h1 className="mb-8 text-3xl font-bold">Monitor & Adjust</h1>

        {/* Performance Metrics */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.name} className="p-6">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {metric.name}
              </h3>
              <div className="mb-2 text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center text-sm">
                {metric.trend === "up" ? (
                  <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                )}
                <span
                  className={
                    metric.trend === "up" ? "text-green-500" : "text-red-500"
                  }
                >
                  {metric.change}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Performance Chart */}
        <Card className="mb-8 p-6">
          <h2 className="mb-4 text-xl font-semibold">Performance History</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Adjustments */}
        <h2 className="mb-4 text-xl font-semibold">Available Adjustments</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {adjustments.map((adjustment) => (
            <Card key={adjustment.id} className="p-6">
              <div className="mb-4">
                <Settings className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{adjustment.name}</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {adjustment.description}
              </p>
              <Button
                className="w-full"
                onClick={() => handleAdjustment(adjustment.id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    Apply <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  )
} 