'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  PieChart, 
  ArrowUpRight,
  Download,
  Filter
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  AreaChart,
  Area,
  Cell
} from 'recharts';

const TVL_DATA = [
  { date: 'Jan', value: 1.2 },
  { date: 'Feb', value: 1.8 },
  { date: 'Mar', value: 2.4 },
  { date: 'Apr', value: 3.1 },
  { date: 'May', value: 3.8 },
  { date: 'Jun', value: 4.5 },
];

const ASSET_DISTRIBUTION = [
  { name: 'ETH LSTs', value: 45, color: 'hsl(var(--primary))' },
  { name: 'Stablecoins', value: 35, color: '#0052FF' },
  { name: 'BTC Pairs', value: 15, color: '#627EEA' },
  { name: 'Altcoins', value: 5, color: '#3B82F6' }
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('6M');

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Treasury Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Institutional-grade performance and risk metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-9 gap-2">
            <Filter className="h-4 w-4" /> Filter Assets
          </Button>
          <Button className="h-9 gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total AUM', value: '$45.2M', change: '+12.4%', icon: BarChart3 },
          { title: '30D APY', value: '9.2%', change: '+0.5%', icon: TrendingUp },
          { title: 'Sharpe Ratio', value: '1.85', change: '+0.12', icon: Activity },
          { title: 'Max Drawdown', value: '-2.4%', change: '-0.2%', icon: PieChart }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-5 flex flex-col justify-between border-border/50 bg-card/30 hover:bg-card/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</span>
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                <div className="flex items-center mt-1 text-emerald-500 text-xs font-medium">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {stat.change}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        <Card className="lg:col-span-2 p-6 border-border/50 bg-card/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">AUM Growth</h3>
            <div className="flex bg-muted/50 rounded-md p-1 gap-1">
              {['1M', '3M', '6M', '1Y'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`text-xs px-3 py-1 rounded-sm font-medium transition-colors ${timeRange === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TVL_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => `$${val}M`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorTvl)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 border-border/50 bg-card/30">
          <h3 className="font-semibold text-lg mb-6">Asset Distribution</h3>
          <div className="h-[200px] w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ASSET_DISTRIBUTION} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" hide />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {ASSET_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-3">
            {ASSET_DISTRIBUTION.map((asset, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }} />
                  <span className="font-medium">{asset.name}</span>
                </div>
                <span className="text-muted-foreground">{asset.value}%</span>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}