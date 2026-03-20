import { Clock, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/surface';

const activities = [
  {
    id: 1,
    type: 'receive',
    token: 'SEI',
    amount: 5000,
    value: 12000,
    address: 'Sei Network',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    txHash: '0x123...abc'
  },
  {
    id: 2,
    type: 'receive',
    token: 'USDC',
    amount: 10000,
    value: 10000,
    address: 'Sei Network',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    txHash: '0x456...def'
  },
  {
    id: 3,
    type: 'receive',
    token: 'USDT',
    amount: 3000,
    value: 3000,
    address: 'Sei Network',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    txHash: '0x789...ghi'
  },
  {
    id: 4,
    type: 'receive',
    token: 'BTC',
    amount: 0.05,
    value: 3000,
    address: 'Sei Network',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    txHash: '0xabc...jkl'
  },
  {
    id: 5,
    type: 'receive',
    token: 'ETH',
    amount: 1.0,
    value: 2000,
    address: 'Sei Network',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    txHash: '0xdef...mno'
  },
  {
    id: 6,
    type: 'swap',
    fromToken: 'USDC',
    fromAmount: 5000,
    toToken: 'SEI',
    toAmount: 2083,
    value: 5000,
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    txHash: '0xghi...pqr'
  },
];

export function ActivityFeed() {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'receive':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'swap':
        return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getActivityTitle = (activity: any) => {
    switch (activity.type) {
      case 'send':
        return `Sent ${activity.amount} ${activity.token}`;
      case 'receive':
        return `Received ${activity.amount} ${activity.token}`;
      case 'swap':
        return `Swapped ${activity.fromAmount} ${activity.fromToken} for ${activity.toAmount} ${activity.toToken}`;
      default:
        return 'Unknown activity';
    }
  };

  const getActivitySubtitle = (activity: any) => {
    const date = new Date(activity.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Clock className="h-3 w-3 mr-1" />
        {formattedDate} at {formattedTime}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Recent Activity</h3>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          View all
        </Button>
      </div>
      <Surface variant="elevated" className="p-0 overflow-hidden">
        <div className="space-y-3 p-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-muted p-2">
                  {getActivityIcon(activity.type)}
                </div>
                <div>
                  <div className="font-medium">{getActivityTitle(activity)}</div>
                  {getActivitySubtitle(activity)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  ${activity.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}
