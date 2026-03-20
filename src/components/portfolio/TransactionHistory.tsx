'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'swap' | 'stake' | 'unstake';
  token: string;
  amount: number;
  value: number;
  timestamp: Date;
  txHash: string;
  status: 'completed' | 'pending' | 'failed';
  chain: string;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'deposit',
    token: 'SEI',
    amount: 25000,
    value: 16000,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    txHash: '0x1234...abcd',
    status: 'completed',
    chain: 'Sei Network',
  },
  {
    id: '2',
    type: 'stake',
    token: 'USDC',
    amount: 10000,
    value: 10000,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    txHash: '0x5678...efgh',
    status: 'completed',
    chain: 'Sei Network',
  },
  {
    id: '3',
    type: 'swap',
    token: 'USDC → SEI',
    amount: 5000,
    value: 5000,
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    txHash: '0x9abc...ijkl',
    status: 'completed',
    chain: 'Sei Network',
  },
  {
    id: '4',
    type: 'deposit',
    token: 'BTC',
    amount: 0.0285,
    value: 3000,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    txHash: '0xdef0...mnop',
    status: 'completed',
    chain: 'Sei Network',
  },
  {
    id: '5',
    type: 'stake',
    token: 'ETH',
    amount: 0.567,
    value: 2000,
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000),
    txHash: '0xqrst...uvwx',
    status: 'completed',
    chain: 'Sei Network',
  },
];

const getTransactionIcon = (type: Transaction['type']) => {
  switch (type) {
    case 'deposit':
    case 'stake':
      return <ArrowDownRight className="h-4 w-4 text-green-500" />;
    case 'withdraw':
    case 'unstake':
      return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    case 'swap':
      return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
    default:
      return null;
  }
};

const getTransactionLabel = (tx: Transaction) => {
  switch (tx.type) {
    case 'deposit':
      return `Deposited ${tx.amount.toLocaleString()} ${tx.token}`;
    case 'withdraw':
      return `Withdrew ${tx.amount.toLocaleString()} ${tx.token}`;
    case 'swap':
      return `Swapped ${tx.token}`;
    case 'stake':
      return `Staked ${tx.amount.toLocaleString()} ${tx.token}`;
    case 'unstake':
      return `Unstaked ${tx.amount.toLocaleString()} ${tx.token}`;
    default:
      return 'Transaction';
  }
};

export function TransactionHistory() {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Badge variant="outline" className="text-xs">
            Sei Network
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-2">
                  {getTransactionIcon(tx.type)}
                </div>
                <div>
                  <div className="font-medium">{getTransactionLabel(tx)}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTime(tx.timestamp)}
                    <span className="mx-1">•</span>
                    {tx.chain}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  ${tx.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <Badge
                  variant={tx.status === 'completed' ? 'default' : 'secondary'}
                  className="text-xs mt-1"
                >
                  {tx.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

