'use client';

import { Card } from '@/components/ui/Card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { protocol: 'Aave', health: 95, tvl: 12.5 },
  { protocol: 'Compound', health: 92, tvl: 8.3 },
  { protocol: 'Uniswap', health: 98, tvl: 15.2 },
  { protocol: 'Curve', health: 96, tvl: 10.8 },
  { protocol: 'Lido', health: 94, tvl: 9.7 },
]

export function ProtocolHealthChart() {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="protocol" 
            className="text-sm text-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            className="text-sm text-muted-foreground"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
            domain={[80, 100]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <Card className="p-2">
                    <p className="font-medium">{payload[0].payload.protocol}</p>
                    <p className="text-sm text-muted-foreground">
                      Health: {payload[0].value}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      TVL: ${payload[0].payload.tvl}M
                    </p>
                  </Card>
                )
              }
              return null
            }}
          />
          <Bar
            dataKey="health"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 