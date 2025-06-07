import { 
  BanknotesIcon, 
  ChartBarIcon, 
  CubeIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card } from '@/components/ui/Card';
import TokenChart from '../../components/TokenChart';
import TokenAllocationChart from '../../components/TokenAllocationChart';
import VolumeChart from '../../components/VolumeChart';
import YieldPerformanceChart from '../../components/YieldPerformanceChart';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Treasury Overview */}
        <Card
          title="Treasury Overview"
          subtitle="Total value across all chains"
          icon={<BanknotesIcon className="w-6 h-6 text-primary-500" />}
          variant="gradient"
          className="col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-sm text-gray-400">Total Value</div>
              <div className="text-2xl font-semibold">$1,234,567</div>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-sm text-gray-400">24h Change</div>
              <div className="text-2xl font-semibold text-green-500">+5.67%</div>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-sm text-gray-400">Active Chains</div>
              <div className="text-2xl font-semibold">4</div>
            </div>
          </div>
          <div className="h-96 mt-6">
            <TokenChart />
          </div>
        </Card>

        {/* Tokenized Assets */}
        <Card
          title="Tokenized Assets"
          subtitle="Portfolio allocation"
          icon={<CubeIcon className="w-6 h-6 text-primary-500" />}
          className="row-span-2"
        >
          <div className="space-y-4 mb-6">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm text-gray-400 font-medium">
              <div className="col-span-5">Asset</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">24h %</div>
              <div className="col-span-3 text-right">Allocation</div>
            </div>
            
            {/* Token Rows */}
            {[
              { 
                name: 'Ethereum', 
                symbol: 'ETH', 
                price: '$3,450.21', 
                change: '+5.2%', 
                changeType: 'positive', 
                allocation: '45%',
                icon: '🟣'
              },
              { 
                name: 'Bitcoin', 
                symbol: 'BTC', 
                price: '$64,123.45', 
                change: '+2.1%', 
                changeType: 'positive', 
                allocation: '25%',
                icon: '🟠'
              },
              { 
                name: 'USD Coin', 
                symbol: 'USDC', 
                price: '$1.00', 
                change: '0.0%', 
                changeType: 'neutral', 
                allocation: '15%',
                icon: '🔵'
              },
              { 
                name: 'Chainlink', 
                symbol: 'LINK', 
                price: '$18.76', 
                change: '-1.2%', 
                changeType: 'negative', 
                allocation: '8%',
                icon: '🔗'
              },
              { 
                name: 'Aave', 
                symbol: 'AAVE', 
                price: '$245.67', 
                change: '+3.4%', 
                changeType: 'positive', 
                allocation: '7%',
                icon: '🦉'
              },
            ].map((asset, i) => (
              <div 
                key={i}
                className="grid grid-cols-12 gap-4 p-4 bg-gray-900/50 rounded-lg items-center hover:bg-gray-800/50 transition-colors"
              >
                <div className="col-span-5 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-600/20 rounded-full flex items-center justify-center text-xl">
                    {asset.icon}
                  </div>
                  <div>
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-sm text-gray-400">{asset.symbol}</div>
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <div className="font-mono">{asset.price}</div>
                </div>
                <div className="col-span-2 text-right">
                  <span className={`font-medium ${
                    asset.changeType === 'positive' ? 'text-green-500' : 
                    asset.changeType === 'negative' ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {asset.change}
                  </span>
                </div>
                <div className="col-span-3">
                  <div className="flex items-center justify-end space-x-2">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full" 
                        style={{ width: asset.allocation }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-12">{asset.allocation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Strategy Suggestions */}
        <Card
          title="AI Strategy Suggestions"
          subtitle="Personalized recommendations"
          icon={<SparklesIcon className="w-6 h-6 text-primary-500" />}
        >
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-gray-900/50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Strategy #{i}</div>
                  <div className="text-sm text-primary-500">High Confidence</div>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-400">Expected Return</div>
                  <div className="text-green-500">+12.34%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Asset Allocation */}
        <Card
          title="Asset Allocation"
          subtitle="Portfolio distribution"
          icon={<ChartBarIcon className="w-6 h-6 text-primary-500" />}
        >
          <TokenAllocationChart />
        </Card>

        {/* Trading Volume */}
        <Card
          title="Trading Volume"
          subtitle="Last 6 months"
          icon={<SparklesIcon className="w-6 h-6 text-primary-500" />}
        >
          <VolumeChart />
        </Card>

        {/* Yield Performance */}
        <Card
          title="Yield Performance"
          subtitle="Across all strategies"
          icon={<ChartBarIcon className="w-6 h-6 text-primary-500" />}
          className="col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-sm text-gray-400">Total Yield</div>
              <div className="text-2xl font-semibold">$12,345</div>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-sm text-gray-400">APY</div>
              <div className="text-2xl font-semibold text-green-500">8.67%</div>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-sm text-gray-400">Active Strategies</div>
              <div className="text-2xl font-semibold">6</div>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-sm text-gray-400">Total Value Locked</div>
              <div className="text-2xl font-semibold">$234,567</div>
            </div>
          </div>
          <div className="h-64">
            <YieldPerformanceChart />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
} 