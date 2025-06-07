'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', volume: 4000 },
  { name: 'Feb', volume: 3000 },
  { name: 'Mar', volume: 5000 },
  { name: 'Apr', volume: 2780 },
  { name: 'May', volume: 3890 },
  { name: 'Jun', volume: 2390 },
];

export default function VolumeChart() {
  return (
    <div className="w-full h-full">
      <h3 className="text-lg font-medium mb-4">Trading Volume (24h)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                color: '#F9FAFB'
              }}
              formatter={(value) => [`$${value.toLocaleString()}`, 'Volume']}
            />
            <Legend />
            <Bar dataKey="volume" fill="#3B82F6" name="Volume" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
