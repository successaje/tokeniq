import { ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Surface } from '@/components/ui/surface';
import { cn } from '@/lib/utils';

type Token = {
  name: string;
  symbol: string;
  balance: number;
  value: number;
  price: number;
  change24h: number;
  allocation: number;
};

interface TokenTableProps {
  tokens: Token[];
}

export function TokenTable({ tokens }: TokenTableProps) {
  return (
    <div className="w-full overflow-auto">
      <Surface variant="elevated" className="p-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/10 dark:bg-muted/5">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 font-medium">Asset</TableHead>
              <TableHead className="h-10 text-right font-medium">Balance</TableHead>
              <TableHead className="h-10 text-right font-medium">Price</TableHead>
              <TableHead className="h-10 text-right font-medium">Value</TableHead>
              <TableHead className="h-10 text-right font-medium">24h</TableHead>
              <TableHead className="h-10 text-right font-medium">Allocation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => (
              <TableRow key={token.symbol} className="cursor-pointer border-t hover:bg-muted/10 dark:hover:bg-muted/5">
                <TableCell className="py-3">
                  <div className="flex items-center">
                    <div className="mr-3 h-8 w-8 rounded-full bg-muted/50 dark:bg-muted/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium">{token.symbol[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{token.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{token.symbol}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right py-3">
                  <div className="font-medium">
                    {Number(token.balance).toLocaleString(undefined, {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 8
                    })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${(token.value).toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </div>
                </TableCell>
                <TableCell className="text-right py-3">
                  ${token.price < 1 
                    ? token.price.toFixed(6).replace(/\.?0+$/, '')
                    : token.price.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 6 
                      })}
                </TableCell>
                <TableCell className="text-right py-3 font-medium">
                  ${token.value.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </TableCell>
                <TableCell className="text-right py-3">
                  <div className={cn(
                    'flex items-center justify-end font-medium',
                    token.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {token.change24h >= 0 ? (
                      <ArrowUp className="h-3.5 w-3.5 mr-1.5" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {Math.abs(token.change24h).toFixed(2)}%
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center justify-end">
                    <div className="w-16 text-right text-sm font-medium">
                      {token.allocation.toFixed(1)}%
                    </div>
                    <div className="w-20 bg-muted/50 dark:bg-muted/20 rounded-full h-2 ml-3">
                      <div 
                        className={cn(
                          'h-full rounded-full',
                          token.change24h >= 0 ? 'bg-green-500' : 'bg-red-500'
                        )}
                        style={{ width: `${Math.min(100, token.allocation)}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Surface>
    </div>
  );
}
