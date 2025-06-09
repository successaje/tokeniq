"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { useToast } from "@/hooks/use-toast"
import { ArrowRight, Loader2, Wallet, Download, FileText, ChartBar, Calendar } from "lucide-react"

const reportTypes = [
  {
    id: "performance",
    name: "Performance Report",
    description: "Detailed analysis of your portfolio performance",
    icon: ChartBar,
  },
  {
    id: "transactions",
    name: "Transaction History",
    description: "Complete record of all your transactions",
    icon: FileText,
  },
  {
    id: "tax",
    name: "Tax Report",
    description: "Tax-related information and calculations",
    icon: Calendar,
  },
]

const timeRanges = [
  { id: "week", label: "Last Week" },
  { id: "month", label: "Last Month" },
  { id: "quarter", label: "Last Quarter" },
  { id: "year", label: "Last Year" },
  { id: "all", label: "All Time" },
]

export default function ReportsPage() {
  const { isConnected } = useAccount()
  const { toast } = useToast()
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [selectedRange, setSelectedRange] = useState("month")
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateReport = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet to continue.",
        variant: "destructive",
      })
      return
    }

    if (!selectedReport) {
      toast({
        title: "No Report Selected",
        description: "Please select a report type to generate.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement report generation logic
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast({
        title: "Report Generated",
        description: "Your report has been generated successfully.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "There was an error generating your report. Please try again.",
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
            Please connect your wallet to access reports.
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
        <h1 className="mb-8 text-3xl font-bold">Reports & Analytics</h1>

        {/* Report Types */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {reportTypes.map((report) => (
            <Card
              key={report.id}
              className={`cursor-pointer p-6 transition-all ${
                selectedReport === report.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <div className="mb-4">
                <report.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{report.name}</h3>
              <p className="text-sm text-muted-foreground">{report.description}</p>
            </Card>
          ))}
        </div>

        {/* Time Range Selection */}
        <Card className="mb-8 p-6">
          <h2 className="mb-4 text-xl font-semibold">Time Range</h2>
          <div className="flex flex-wrap gap-4">
            {timeRanges.map((range) => (
              <Button
                key={range.id}
                variant={selectedRange === range.id ? "default" : "outline"}
                onClick={() => setSelectedRange(range.id)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Generate Report */}
        <Card className="p-6">
          <h2 className="mb-6 text-xl font-semibold">Generate Report</h2>
          <Button
            className="w-full"
            onClick={handleGenerateReport}
            disabled={isLoading || !selectedReport}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Generate Report <Download className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </Card>
      </motion.div>
    </div>
  )
} 