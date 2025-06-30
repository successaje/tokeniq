'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DataPoint {
  date: string;
  apy: number;
}

interface VaultPerformanceChartProps {
  data: DataPoint[];
}

export function VaultPerformanceChart({ data }: VaultPerformanceChartProps) {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'APY %',
        data: data.map(item => item.apy),
        borderColor: 'hsl(221.2 83.2% 53.3%)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: 'hsl(221.2 83.2% 53.3%)',
        pointBorderColor: '#fff',
        pointHoverRadius: 5,
        pointHoverBackgroundColor: 'hsl(221.2 83.2% 53.3%)',
        pointHoverBorderColor: '#fff',
        pointHitRadius: 10,
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'hsl(224 71.4% 4.1%)',
        titleColor: 'hsl(0 0% 100%)',
        bodyColor: 'hsl(0 0% 100%)',
        borderColor: 'hsl(215.4 16.3% 46.9%)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: any) => {
            return `APY: ${context.raw}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'hsl(215.4 16.3% 46.9%)',
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'hsl(215.4 16.3% 46.9%)',
          borderDash: [5, 5],
          drawBorder: false,
        },
        ticks: {
          color: 'hsl(215.4 16.3% 46.9%)',
          callback: (value: any) => `${value}%`,
        },
        min: Math.max(0, Math.min(...data.map(item => item.apy)) * 0.9), // 10% below min value
      },
    },
  };

  return (
    <div className="h-80 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
