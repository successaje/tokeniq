'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/context/theme-context';

const data = [
  {
    name: 'Jan',
    price: 4000,
  },
  {
    name: 'Feb',
    price: 3000,
  },
  {
    name: 'Mar',
    price: 5000,
  },
  {
    name: 'Apr',
    price: 2780,
  },
  {
    name: 'May',
    price: 3890,
  },
  {
    name: 'Jun',
    price: 2390,
  },
  {
    name: 'Jul',
    price: 3490,
  },
];

export default function TokenChart() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="w-full h-[400px] bg-card rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4 text-foreground">Token Price (USD)</h2>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDark ? 'hsl(var(--border))' : 'hsl(var(--muted))'} 
          />
          <XAxis 
            dataKey="name" 
            stroke={isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))'}
            tick={{ fill: isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))' }}
          />
          <YAxis 
            stroke={isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))'}
            tick={{ fill: isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))' }}
            domain={[0, 'dataMax + 1000']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? 'hsl(var(--card))' : 'hsl(var(--background))',
              border: `1px solid ${isDark ? 'hsl(var(--border))' : 'hsl(var(--border))'}`,
              borderRadius: '0.5rem',
              color: isDark ? 'hsl(var(--card-foreground))' : 'hsl(var(--foreground))'
            }}
          />
          <Legend 
            wrapperStyle={{
              color: isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))'
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
            name="Token Price"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
