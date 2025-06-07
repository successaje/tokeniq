import { 
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const strategies = [
  {
    id: 1,
    name: 'Yield Optimizer',
    description: 'Automatically rebalances assets across DeFi protocols to maximize yield returns.',
    icon: ArrowTrendingUpIcon,
    metrics: {
      apy: '12.5%',
      risk: 'Medium',
      tvl: '$2.5M',
    },
    chains: ['Ethereum', 'Polygon'],
  },
  {
    id: 2,
    name: 'Stablecoin Diversification',
    description: 'Spreads stablecoin holdings across multiple protocols to reduce risk exposure.',
    icon: BanknotesIcon,
    metrics: {
      apy: '8.2%',
      risk: 'Low',
      tvl: '$5.1M',
    },
    chains: ['Ethereum', 'Arbitrum', 'Polygon'],
  },
  {
    id: 3,
    name: 'Real Estate Yield',
    description: 'Generates yield from tokenized real estate assets through lending and staking.',
    icon: BuildingLibraryIcon,
    metrics: {
      apy: '15.8%',
      risk: 'Medium-High',
      tvl: '$1.8M',
    },
    chains: ['Ethereum'],
  },
  {
    id: 4,
    name: 'Fixed Income Portfolio',
    description: 'Manages a portfolio of tokenized bonds and fixed-income instruments.',
    icon: ChartBarIcon,
    metrics: {
      apy: '7.5%',
      risk: 'Low',
      tvl: '$3.2M',
    },
    chains: ['Ethereum', 'Polygon'],
  },
];

export default function StrategiesPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">AI Strategy Center</h1>
          <p className="text-gray-400">Explore and activate AI-powered investment strategies</p>
        </div>
        <Button
          variant="outline"
          leftIcon={<ArrowPathIcon className="w-5 h-5" />}
        >
          Refresh Recommendations
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {strategies.map((strategy) => (
          <Card
            key={strategy.id}
            title={strategy.name}
            icon={<strategy.icon className="w-6 h-6 text-primary-500" />}
          >
            <p className="text-gray-300 mb-6">
              {strategy.description}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <div className="text-sm text-gray-400">APY</div>
                <div className="text-lg font-medium text-green-500">
                  {strategy.metrics.apy}
                </div>
              </div>
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <div className="text-sm text-gray-400">Risk Level</div>
                <div className="text-lg font-medium text-white">
                  {strategy.metrics.risk}
                </div>
              </div>
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <div className="text-sm text-gray-400">TVL</div>
                <div className="text-lg font-medium text-white">
                  {strategy.metrics.tvl}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {strategy.chains.map((chain) => (
                  <span
                    key={chain}
                    className="px-2 py-1 text-xs font-medium bg-gray-900/50 rounded-lg text-gray-300"
                  >
                    {chain}
                  </span>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  Preview
                </Button>
                <Button size="sm" leftIcon={<CalendarIcon className="w-4 h-4" />}>
                  Schedule
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
} 