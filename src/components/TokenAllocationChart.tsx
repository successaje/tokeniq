'use client';

import { Card } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const data = [
  { name: 'USDC', value: 40, color: '#2775CA' },
  { name: 'ETH', value: 25, color: '#627EEA' },
  { name: 'WBTC', value: 20, color: '#F7931A' },
  { name: 'USDT', value: 15, color: '#26A17B' },
]

export function TokenAllocationChart() {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <Card className="p-2">
                    <p className="font-medium">{payload[0].name}</p>
                    <p className="text-sm text-muted-foreground">
                      {payload[0].value}%
                    </p>
                  </Card>
                )
              }
              return null
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-sm text-muted-foreground">
                {value} ({entry.payload.value}%)
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
