import { 
  BanknotesIcon, 
  ChartBarIcon, 
  CubeIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card } from '@/components/ui/Card';

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
          <div className="h-64 mt-6 bg-gray-900/50 rounded-lg flex items-center justify-center">
            Chart Placeholder
          </div>
        </Card>

        {/* Tokenized Assets */}
        <Card
          title="Tokenized Assets"
          subtitle="Recently added assets"
          icon={<CubeIcon className="w-6 h-6 text-primary-500" />}
        >
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-600/20 rounded-full flex items-center justify-center">
                    <CubeIcon className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <div className="font-medium">Asset #{i}</div>
                    <div className="text-sm text-gray-400">Real Estate</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">$123,456</div>
                  <div className="text-sm text-green-500">+2.34%</div>
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
          <div className="h-64 bg-gray-900/50 rounded-lg flex items-center justify-center">
            Chart Placeholder
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
} 