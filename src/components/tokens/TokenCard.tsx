import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, BarChart2 } from 'lucide-react';
import Link from 'next/link';

interface TokenCardProps {
  name: string;
  symbol: string;
  price: string;
  priceChange24h: number;
  logoUrl?: string;
  chainId?: number;
}

export function TokenCard({
  name,
  symbol,
  price,
  priceChange24h,
  logoUrl,
  chainId = 1, // Default to Ethereum
}: TokenCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden p-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={`${name} logo`} 
              className="h-10 w-10 rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = `https://ui-avatars.com/api/?name=${symbol}&background=random`;
              }}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium">{symbol?.slice(0, 3) || 'TOK'}</span>
            </div>
          )}
          <div>
            <h3 className="font-medium">{name}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">{symbol}</span>
              <Badge variant="outline" className="text-xs h-5">
                {getChainName(chainId)}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={`/tokens/${symbol.toLowerCase()}`}>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Price</span>
          <span className="font-medium">{price}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">24h</span>
          <span className={priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}>
            {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
          </span>
        </div>
        <div className="pt-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/tokens/${symbol.toLowerCase()}/trade`}>
              <BarChart2 className="h-4 w-4 mr-2" />
              Trade
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function getChainName(chainId: number): string {
  const chains: Record<number, string> = {
    1: 'Ethereum',
    56: 'BSC',
    137: 'Polygon',
    59140: 'Sei',
    42161: 'Arbitrum',
    10: 'Optimism',
    250: 'Fantom',
    43114: 'Avalanche',
  };
  return chains[chainId] || `Chain ${chainId}`;
}
