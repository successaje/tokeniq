import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

interface AssetData {
  name: string;
  value: number;
  color: string;
}

interface ChainData {
  name: string;
  value: number;
  color: string;
}

interface TreasuryOverviewProps {
  className?: string;
  totalBalance: string;
  assets: AssetData[];
  chains: ChainData[];
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  name,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function TreasuryOverview({
  className,
  totalBalance,
  assets,
  chains,
}: TreasuryOverviewProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className="p-6 bg-gradient-to-br from-card to-card/80 border-border/30 shadow-sm hover:shadow-md transition-all duration-300"
          title={
            <div className="flex items-center justify-between">
              <span>Total Balance</span>
              <div className="flex items-center text-sm text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                <span>+2.3%</span>
              </div>
            </div>
          }
          subtitle={
            <span className="text-muted-foreground text-sm">Across all chains</span>
          }
        >
          <div className="mt-4">
            <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              {totalBalance}
            </div>
            <div className="mt-2 text-sm text-muted-foreground flex items-center">
              <span className="inline-flex items-center text-green-500 mr-2">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                $24,500 (5.2%) last 30d
              </span>
            </div>
          </div>
        </Card>
        
        <Card 
          className="p-6 bg-gradient-to-br from-card to-card/80 border-border/30 shadow-sm hover:shadow-md transition-all duration-300"
          title={
            <span>Asset Distribution</span>
          }
        >
          <div className="h-[200px] mt-2 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {((assets[0].value / assets.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">{assets[0].name}</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assets}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {assets.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  formatter={(value: number) => [
                    `${((value / assets.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%`,
                    'Percentage'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card 
          className="p-6 bg-gradient-to-br from-card to-card/80 border-border/30 shadow-sm hover:shadow-md transition-all duration-300"
          title={
            <span>By Chain</span>
          }
        >
          <div className="h-[200px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chains}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chains.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  formatter={(value: number) => [
                    `${((value / chains.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%`,
                    'Percentage'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/30 shadow-sm">
          <h3 className="text-sm font-medium mb-4 text-muted-foreground">Assets</h3>
          <div className="space-y-4">
            {assets.map((asset) => {
              const percentage = (asset.value / assets.reduce((a, b) => a + b.value, 0)) * 100;
              return (
                <div key={asset.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2 border-2 border-white dark:border-card" 
                        style={{ backgroundColor: asset.color }}
                      />
                      <span>{asset.name}</span>
                    </div>
                    <span className="font-medium">
                      ${asset.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: asset.color,
                        opacity: 0.8
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/30 shadow-sm md:col-span-2">
          <h3 className="text-sm font-medium mb-4 text-muted-foreground">Chain Distribution</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {chains.map((chain) => {
              const percentage = (chain.value / chains.reduce((a, b) => a + b.value, 0)) * 100;
              return (
                <div key={chain.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2 border-2 border-white dark:border-card" 
                        style={{ backgroundColor: chain.color }}
                      />
                      <span>{chain.name}</span>
                    </div>
                    <span className="font-medium">
                      ${chain.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{percentage.toFixed(1)}%</span>
                    <span>${(chain.value / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: chain.color,
                        opacity: 0.8
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
