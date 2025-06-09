'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  DocumentMagnifyingGlassIcon,
  DocumentCheckIcon,
  CalendarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Mock data for reports
const REPORTS = [
  {
    id: 1,
    name: 'Monthly Performance Report',
    type: 'Performance',
    date: '2024-03-01',
    status: 'Generated',
    icon: DocumentChartBarIcon
  },
  {
    id: 2,
    name: 'Asset Allocation Analysis',
    type: 'Analysis',
    date: '2024-03-01',
    status: 'Generated',
    icon: ChartBarIcon
  },
  {
    id: 3,
    name: 'Risk Assessment Report',
    type: 'Risk',
    date: '2024-02-28',
    status: 'Generated',
    icon: DocumentMagnifyingGlassIcon
  },
  {
    id: 4,
    name: 'Tax Report Q1 2024',
    type: 'Tax',
    date: '2024-02-15',
    status: 'Pending',
    icon: DocumentCheckIcon
  }
];

export default function ReportsPage() {
  const { address, isConnected } = useAccount();
  const [selectedReport, setSelectedReport] = useState<number | null>(null);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Please connect your wallet</h1>
        <p className="text-muted-foreground">
          Connect your wallet to view your reports
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">
            View and download your portfolio reports
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex items-center"
          >
            <CalendarIcon className="h-5 w-5 mr-2" />
            Schedule Report
          </Button>
          <Button
            className="flex items-center"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Generate New Report
          </Button>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DocumentChartBarIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Performance</h2>
            </div>
            <p className="text-muted-foreground">Track your portfolio's performance over time</p>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Analysis</h2>
            </div>
            <p className="text-muted-foreground">Detailed analysis of your asset allocation</p>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DocumentMagnifyingGlassIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Risk</h2>
            </div>
            <p className="text-muted-foreground">Comprehensive risk assessment reports</p>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DocumentCheckIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Tax</h2>
            </div>
            <p className="text-muted-foreground">Tax reports and documentation</p>
          </div>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card className="bg-card hover:bg-accent/50 transition-colors mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6 text-card-foreground">Recent Reports</h2>
          <div className="space-y-4">
            {REPORTS.map((report) => (
              <div 
                key={report.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors",
                  selectedReport === report.id ? "bg-primary/10" : "bg-accent/20 hover:bg-accent/30"
                )}
                onClick={() => setSelectedReport(report.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <report.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{report.name}</p>
                    <p className="text-sm text-muted-foreground">{report.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">{report.date}</p>
                  <p className={cn(
                    "text-sm",
                    report.status === 'Generated' ? "text-emerald-500" : "text-yellow-500"
                  )}>
                    {report.status}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Report Preview */}
      {selectedReport && (
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-card-foreground">Report Preview</h2>
              <Button
                className="flex items-center"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Download Report
              </Button>
            </div>
            <div className="h-[400px] bg-accent/20 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="h-16 w-16 text-muted-foreground" />
            </div>
          </div>
        </Card>
      )}
    </>
  );
} 