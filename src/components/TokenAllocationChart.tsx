'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTheme } from '@/context/theme-context';

// Using theme-aware colors
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
  'hsl(var(--muted))'
];

const data = [
  { name: 'Ethereum', value: 45 },
  { name: 'Bitcoin', value: 25 },
  { name: 'Stablecoins', value: 15 },
  { name: 'Altcoins', value: 10 },
  { name: 'Other', value: 5 },
];

export default function TokenAllocationChart() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="w-full h-full">
      <h3 className="text-lg font-medium mb-4 text-foreground">Asset Allocation</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="hsl(var(--primary))"
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))' }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => [`${value}%`, props.payload.name]}
              contentStyle={{
                backgroundColor: isDark ? 'hsl(var(--card))' : 'hsl(var(--background))',
                border: `1px solid ${isDark ? 'hsl(var(--border))' : 'hsl(var(--border))'}`,
                borderRadius: '0.5rem',
                color: isDark ? 'hsl(var(--card-foreground))' : 'hsl(var(--foreground))',
                padding: '0.5rem'
              }}
            />
            <Legend 
              wrapperStyle={{
                color: isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
