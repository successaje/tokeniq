'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  return (
    <div className="w-full h-[400px] bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Token Price (USD)</h2>
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
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#9CA3AF"
          />
          <YAxis 
            stroke="#9CA3AF"
            domain={[0, 'dataMax + 1000']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#F9FAFB'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            name="Token Price"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
