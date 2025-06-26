import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, TrendingUp, BarChart2, Zap } from 'lucide-react';

const defaultData: YieldDataPoint[] = [
  { month: 'Jan', yield: 3.2, change: 0 },
  { month: 'Feb', yield: 3.5, change: 0.3 },
  { month: 'Mar', yield: 4.1, change: 0.6 },
  { month: 'Apr', yield: 4.8, change: 0.7 },
  { month: 'May', yield: 5.2, change: 0.4 },
  { month: 'Jun', yield: 5.7, change: 0.5 },
  { month: 'Jul', yield: 5.4, change: -0.3 },
  { month: 'Aug', yield: 5.9, change: 0.5 },
  { month: 'Sep', yield: 6.3, change: 0.4 },
  { month: 'Oct', yield: 6.1, change: -0.2 },
  { month: 'Nov', yield: 6.5, change: 0.4 },
  { month: 'Dec', yield: 7.0, change: 0.5 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <p className="text-sm">
            <span className="font-medium">{data.yield}%</span> APY
          </p>
        </div>
        {data.change !== 0 && (
          <p className={cn(
            "text-xs mt-1 flex items-center",
            data.change >= 0 ? 'text-emerald-500' : 'text-rose-500'
          )}>
            {data.change >= 0 ? (
              <ArrowUpRight className="w-3 h-3 mr-1" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-1" />
            )}
            {Math.abs(data.change)}% from previous
          </p>
        )}
      </div>
    );
  }
  return null;
};

interface YieldDataPoint {
  month: string;
  yield: number;
  change: number;
}

interface YieldHistoryProps {
  className?: string;
  data?: YieldDataPoint[];
}

export function YieldHistory({ className, data = defaultData }: YieldHistoryProps) {
  const lastDataPoint = data[data.length - 1];
  const previousMonthData = data[data.length - 2];
  const monthlyChange = lastDataPoint.yield - previousMonthData.yield;
  const allTimeHigh = Math.max(...data.map(d => d.yield));
  const isAllTimeHigh = lastDataPoint.yield === allTimeHigh;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      <Card className="p-6 bg-gradient-to-br from-card to-card/80 border border-border/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Yield History
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Historical APY performance over the last 12 months
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium">Live data</span>
          </div>
        </div>
        
        <div className="h-[280px] -mx-2 -mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                vertical={false} 
                stroke="#f0f0f0" 
                strokeDasharray="3 3"
                strokeOpacity={0.3}
              />
              
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#666', fontSize: 12, fontWeight: 500 }}
                tickMargin={10}
                padding={{ left: 10, right: 10 }}
              />
              
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: '#666', fontSize: 11, fontWeight: 500 }}
                width={32}
                domain={['dataMin - 1', 'dataMax + 1']}
                padding={{ top: 10, bottom: 10 }}
              />
              
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{
                  stroke: '#3b82f6',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                  strokeOpacity: 0.5,
                }}
              />
              
              <Area 
                type="monotone" 
                dataKey="yield" 
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorYield)"
                activeDot={{
                  r: 6,
                  fill: '#2563eb',
                  stroke: '#fff',
                  strokeWidth: 2,
                  className: 'shadow-lg'
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 pt-6 border-t border-border/20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BarChart2 className="w-4 h-4" />
                <span className="text-xs font-medium">Current APY</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {lastDataPoint.yield}%
                </span>
                {isAllTimeHigh && (
                  <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                    ATH
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">30d Change</span>
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xl font-semibold",
                monthlyChange >= 0 ? 'text-emerald-500' : 'text-rose-500'
              )}>
                {monthlyChange >= 0 ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownRight className="w-5 h-5" />
                )}
                {Math.abs(monthlyChange)}%
              </div>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-medium">All Time High</span>
              </div>
              <div className="text-xl font-semibold">
                {allTimeHigh}%
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
