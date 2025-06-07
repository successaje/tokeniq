'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const data = [
  { month: 'Jan', yield: 5.2, tvl: 180000 },
  { month: 'Feb', yield: 6.1, tvl: 190000 },
  { month: 'Mar', yield: 7.4, tvl: 205000 },
  { month: 'Apr', yield: 8.2, tvl: 220000 },
  { month: 'May', yield: 8.7, tvl: 230000 },
  { month: 'Jun', yield: 8.9, tvl: 234567 },
];

export default function YieldPerformanceChart() {
  return (
    <div className="w-full h-full">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              stroke="#3B82F6"
              tick={{ fill: '#9CA3AF' }}
              domain={[0, 10]}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#10B981"
              tick={{ fill: '#9CA3AF' }}
              domain={[150000, 250000]}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                color: '#F9FAFB',
                padding: '0.5rem'
              }}
              formatter={(value, name) => {
                if (name === 'Yield') {
                  return [`${value}%`, name];
                } else {
                  return [`$${value.toLocaleString()}`, name];
                }
              }}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="yield"
              name="Yield (APY)"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.1}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="tvl"
              name="TVL (USD)"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
