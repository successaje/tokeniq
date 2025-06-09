'use client';

import { Card } from '@/components/ui/Card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { date: 'Jan', yield: 4.2 },
  { date: 'Feb', yield: 5.1 },
  { date: 'Mar', yield: 6.3 },
  { date: 'Apr', yield: 7.8 },
  { date: 'May', yield: 8.5 },
  { date: 'Jun', yield: 9.2 },
  { date: 'Jul', yield: 10.1 },
  { date: 'Aug', yield: 11.3 },
  { date: 'Sep', yield: 12.5 },
  { date: 'Oct', yield: 13.8 },
  { date: 'Nov', yield: 14.2 },
  { date: 'Dec', yield: 15.8 },
]

export function YieldPerformanceChart() {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            className="text-sm text-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            className="text-sm text-muted-foreground"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <Card className="p-2">
                    <p className="font-medium">{payload[0].payload.date}</p>
                    <p className="text-sm text-muted-foreground">
                      {payload[0].value}% APY
                    </p>
                  </Card>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="yield"
            stroke="hsl(var(--primary))"
            fillOpacity={1}
            fill="url(#colorYield)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
