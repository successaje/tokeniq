import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Surface } from '@/components/ui/surface';
import { TokenTable } from './TokenTable';
import { ActivityFeed } from './ActivityFeed';

export function PortfolioOverview() {
  // Mock data - replace with real data fetching
  const portfolioValue = 12543.67;
  const portfolioChange = 2.45;
  const tokens = [
    { 
      name: 'Ethereum', 
      symbol: 'ETH', 
      balance: 2.5, 
      value: 7500.00, 
      price: 3000.00, 
      change24h: 1.2,
      allocation: 60.5 
    },
    { 
      name: 'Bitcoin', 
      symbol: 'BTC', 
      balance: 0.25, 
      value: 1500.00, 
      price: 60000.00, 
      change24h: -0.8,
      allocation: 12.0 
    },
    { 
      name: 'Solana', 
      symbol: 'SOL', 
      balance: 50, 
      value: 750.00, 
      price: 15.00, 
      change24h: 5.2,
      allocation: 6.0 
    },
    { 
      name: 'USDC', 
      symbol: 'USDC', 
      balance: 2000, 
      value: 2000.00, 
      price: 1.00, 
      change24h: 0.0,
      allocation: 16.0 
    },
    { 
      name: 'Aave', 
      symbol: 'AAVE', 
      balance: 5, 
      value: 450.00, 
      price: 90.00, 
      change24h: -2.1,
      allocation: 3.6 
    },
    { 
      name: 'Uniswap', 
      symbol: 'UNI', 
      balance: 30, 
      value: 345.00, 
      price: 11.50, 
      change24h: 1.8,
      allocation: 2.8 
    },
  ];

  const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalValue);

  return (
    <div className="space-y-4">
      {/* Portfolio Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Surface variant="elevated" className="p-6">
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-2xl font-bold">{formattedValue}</div>
              <p className={`text-xs ${portfolioChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {portfolioChange >= 0 ? '+' : ''}{portfolioChange}% (24h)
              </p>
            </CardContent>
          </Card>
        </Surface>
        
        <Surface variant="elevated" className="p-6">
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-sm font-medium">Assets</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-2xl font-bold">{tokens.length}</div>
              <p className="text-xs text-muted-foreground">Different assets</p>
            </CardContent>
          </Card>
        </Surface>
        
        <Surface variant="elevated" className="p-6">
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-2xl font-bold">SOL</div>
              <p className="text-xs text-green-500">+5.2% (24h)</p>
            </CardContent>
          </Card>
        </Surface>
        
        <Surface variant="elevated" className="p-6">
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-sm font-medium">Stablecoins</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-2xl font-bold">$2,000</div>
              <p className="text-xs text-muted-foreground">16% of portfolio</p>
            </CardContent>
          </Card>
        </Surface>
      </div>

      {/* Main Content Tabs */}
      <Surface variant="elevated" className="p-0 overflow-hidden">
        <Tabs defaultValue="tokens" className="w-full">
          <div className="border-b border-muted/20 px-4">
            <TabsList className="w-full justify-start rounded-none border-b-0 bg-transparent p-0">
              <TabsTrigger 
                value="tokens" 
                className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-4 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Tokens
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-4 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <span>Activity</span>
                <span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">12</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-0">
            <TabsContent value="tokens" className="m-0">
              <TokenTable tokens={tokens} />
            </TabsContent>
            
            <TabsContent value="activity" className="m-0">
              <ActivityFeed />
            </TabsContent>
          </div>
        </Tabs>
      </Surface>
    </div>
  );
}
