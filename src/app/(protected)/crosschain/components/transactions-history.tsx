'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ChevronDown, ChevronUp, ArrowRightIcon } from 'lucide-react';
import Image from 'next/image';

// Mock token data with icons
const TOKENS: Token[] = [
  { id: 'usdc', symbol: 'USDC', name: 'USD Coin', icon: '/icons/tokens/usdc.png' },
  { id: 'usdt', symbol: 'USDT', name: 'Tether', icon: '/icons/tokens/usdt.png' },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', icon: '/icons/tokens/ethereum.png' },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche', icon: '/icons/tokens/avalanche.png' },
];

const CHAIN_ICONS: Record<string, string> = {
  'ethereum': '/icons/chains/ethereum.png',
  'polygon': '/icons/chains/polygon.png',
  'bsc': '/icons/chains/bsc.png',
  'arbitrum': '/icons/chains/arbitrum.png',
  'optimism': '/icons/chains/optimism.png',
};

const getTokenIcon = (symbol: string) => {
  const token = TOKENS.find(t => t.symbol === symbol);
  return token?.icon || '/icons/tokens/default.svg';
};

const getChainIcon = (chainName: string) => {
  const chainKey = chainName.toLowerCase();
  return CHAIN_ICONS[chainKey] || '/icons/chains/default.svg';
};

type TransactionStatus = 'completed' | 'pending' | 'failed';

interface Transaction {
  id: string;
  fromChain: string;
  toChain: string;
  token: string;
  tokenSymbol: string;
  amount: string;
  value: string;
  timestamp: string;
  status: TransactionStatus;
  txHash: string;
}

interface Token {
  id: string;
  symbol: string;
  name: string;
  icon: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    fromChain: 'Ethereum',
    toChain: 'Polygon',
    token: 'USDC',
    amount: '100.00',
    value: '$100.00',
    timestamp: '2025-06-25T10:30:00Z',
    status: 'completed',
    txHash: '0x123...abc',
    tokenSymbol: 'USDC'
  },
  {
    id: '2',
    fromChain: 'BSC',
    toChain: 'Ethereum',
    token: 'ETH',
    amount: '0.5',
    value: '$1,500.00',
    timestamp: '2025-06-25T09:15:00Z',
    status: 'pending',
    txHash: '0x456...def',
    tokenSymbol: 'ETH'
  },
  {
    id: '3',
    fromChain: 'Arbitrum',
    toChain: 'Optimism',
    token: 'USDT',
    amount: '250.00',
    value: '$250.00',
    timestamp: '2025-06-24T16:45:00Z',
    status: 'failed',
    txHash: '0x789...ghi'
  },
  {
    id: '4',
    fromChain: 'Polygon',
    toChain: 'BSC',
    token: 'MATIC',
    amount: '500.00',
    value: '$250.00',
    timestamp: '2025-06-24T14:20:00Z',
    status: 'completed',
    txHash: '0xabc...jkl'
  },
  {
    id: '5',
    fromChain: 'Optimism',
    toChain: 'Arbitrum',
    token: 'WBTC',
    amount: '0.01',
    value: '$650.00',
    timestamp: '2025-06-23T11:05:00Z',
    status: 'completed',
    txHash: '0xdef...mno'
  },
];

const statusVariantMap: Record<TransactionStatus, string> = {
  completed: 'bg-green-500/10 text-green-500',
  pending: 'bg-yellow-500/10 text-yellow-500',
  failed: 'bg-red-500/10 text-red-500',
};

const getStatusIcon = (status: TransactionStatus) => {
  switch (status) {
    case 'completed':
      return (
        <div className="p-1 rounded-full bg-green-500/10">
          <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case 'pending':
      return (
        <div className="p-1 rounded-full bg-yellow-500/10">
          <svg className="h-3.5 w-3.5 text-yellow-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    case 'failed':
      return (
        <div className="p-1 rounded-full bg-red-500/10">
          <svg className="h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
  }
};

export const TransactionsHistory = () => {
  const [showAll, setShowAll] = useState(false);
  const transactions = showAll ? MOCK_TRANSACTIONS : MOCK_TRANSACTIONS.slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: TransactionStatus) => {
    return (
      <Badge className={statusVariantMap[status]} variant="secondary">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const viewOnExplorer = (txHash: string, chain: string) => {
    // In a real app, this would open the transaction in the appropriate block explorer
    console.log(`Viewing transaction ${txHash} on ${chain} explorer`);
    // Example: window.open(`https://${chain.toLowerCase()}.explorer/tx/${txHash}`, '_blank');
  };

  return (
    <Card className="w-full border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,white)]"></div>
      <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </div>
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Transaction History
          </CardTitle>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
        >
          View All
          <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </CardHeader>
      <CardContent className="relative z-10 p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-background/30 backdrop-blur-sm">
              <TableRow className="border-b border-border/50">
                <TableHead className="h-12 text-xs font-medium text-muted-foreground uppercase tracking-wider">From</TableHead>
                <TableHead className="h-12 text-xs font-medium text-muted-foreground uppercase tracking-wider">To</TableHead>
                <TableHead className="h-12 text-xs font-medium text-muted-foreground uppercase tracking-wider">Token</TableHead>
                <TableHead className="h-12 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Amount</TableHead>
                <TableHead className="h-12 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</TableHead>
                <TableHead className="h-12 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Date</TableHead>
                <TableHead className="h-12 w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const statusColors = {
                  completed: 'bg-green-500/10 text-green-500',
                  pending: 'bg-yellow-500/10 text-yellow-500',
                  failed: 'bg-red-500/10 text-red-500',
                };
                
                return (
                  <TableRow 
                    key={tx.id} 
                    className="group border-b border-border/20 hover:bg-background/50 transition-colors"
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="h-6 w-6 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                            <Image 
                              src={getChainIcon(tx.fromChain)} 
                              alt={tx.fromChain}
                              width={24}
                              height={24}
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = '/icons/chains/default.svg';
                              }}
                            />
                          </div>
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></div>
                        </div>
                        <span className="font-medium">{tx.fromChain}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="h-6 w-6 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                              <Image 
                                src={getChainIcon(tx.toChain)} 
                                alt={tx.toChain}
                                width={24}
                                height={24}
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = '/icons/chains/default.svg';
                                }}
                              />
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-background"></div>
                          </div>
                          <ArrowRightIcon className="h-4 w-4 mx-2 text-muted-foreground flex-shrink-0" />
                          <span>{tx.toChain}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          <Image 
                            src={getTokenIcon(tx.token)} 
                            alt={tx.token}
                            width={24}
                            height={24}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = '/icons/tokens/default.svg';
                            }}
                          />
                        </div>
                        <span className="font-medium">{tx.token}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="font-medium">{tx.amount}</div>
                      <div className="text-xs text-muted-foreground">{tx.value}</div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[tx.status]}`}>
                        {getStatusIcon(tx.status)}
                        <span>{tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right text-sm text-muted-foreground">
                      {formatDate(tx.timestamp)}
                    </TableCell>
                    <TableCell className="py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/50"
                        onClick={() => viewOnExplorer(tx.txHash, tx.fromChain)}
                        title="View on explorer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {MOCK_TRANSACTIONS.length > 3 && (
          <div className="border-t p-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-muted-foreground"
            >
              {showAll ? (
                <>
                  Show Less
                  <ChevronUp className="ml-1 h-4 w-4" />
                </>
              ) : (
                <>
                  Show All {MOCK_TRANSACTIONS.length} Transactions
                  <ChevronDown className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
