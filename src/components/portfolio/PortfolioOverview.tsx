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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-0.5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5">
          <div className="relative z-10 h-full rounded-[11px] bg-card p-6 transition-all duration-300 group-hover:bg-card/90">
            <Card className="bg-transparent border-0 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
                <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-blue-400"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-1">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-100 to-blue-300 bg-clip-text text-transparent">
                  {formattedValue}
                </div>
                <div className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  portfolioChange >= 0 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {portfolioChange >= 0 ? (
                    <svg className="-ml-0.5 mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M5.293 2.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L8.586 7H2a1 1 0 110-2h6.586L5.293 3.293a1 1 0 010-1.414z" />
                    </svg>
                  ) : (
                    <svg className="-ml-0.5 mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M5.293 2.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L8.586 7H2a1 1 0 110-2h6.586L5.293 3.293a1 1 0 010-1.414z" transform="rotate(180 6 7)" />
                    </svg>
                  )}
                  {portfolioChange >= 0 ? '+' : ''}{portfolioChange}% (24h)
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl group-hover:bg-blue-500/30 transition-colors"></div>
        </div>
        
        <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-600/10 p-0.5 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5">
          <div className="relative z-10 h-full rounded-[11px] bg-card p-6 transition-all duration-300 group-hover:bg-card/90">
            <Card className="bg-transparent border-0 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Assets</CardTitle>
                <div className="p-1.5 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-purple-400"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-1">
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-purple-400 bg-clip-text text-transparent">
                  {tokens.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Different assets</p>
              </CardContent>
            </Card>
          </div>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-purple-500/20 blur-2xl group-hover:bg-purple-500/30 transition-colors"></div>
        </div>
        
        <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 p-0.5 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5">
          <div className="relative z-10 h-full rounded-[11px] bg-card p-6 transition-all duration-300 group-hover:bg-card/90">
            <Card className="bg-transparent border-0 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Best Performer</CardTitle>
                <div className="p-1.5 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-amber-400"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-1">
                <div className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                  SOL
                </div>
                <div className="mt-1.5 inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500">
                  <svg className="-ml-0.5 mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M5.293 2.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L8.586 7H2a1 1 0 110-2h6.586L5.293 3.293a1 1 0 010-1.414z" />
                  </svg>
                  +5.2% (24h)
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-amber-500/20 blur-2xl group-hover:bg-amber-500/30 transition-colors"></div>
        </div>
        
        <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 p-0.5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5">
          <div className="relative z-10 h-full rounded-[11px] bg-card p-6 transition-all duration-300 group-hover:bg-card/90">
            <Card className="bg-transparent border-0 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Stablecoins</CardTitle>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-emerald-400"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-1">
                <div className="text-2xl font-bold bg-gradient-to-r from-emerald-200 to-teal-400 bg-clip-text text-transparent">
                  $2,000
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">16% of portfolio</p>
              </CardContent>
            </Card>
          </div>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-emerald-500/20 blur-2xl group-hover:bg-emerald-500/30 transition-colors"></div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="relative overflow-hidden rounded-xl border border-muted/20 bg-gradient-to-br from-card/50 to-card/80 shadow-sm transition-all duration-300 hover:shadow-md">
        <Tabs defaultValue="tokens" className="w-full">
          <div className="relative z-10 border-b border-muted/20 bg-gradient-to-r from-card/95 to-card/95 backdrop-blur-sm px-6">
            <TabsList className="w-auto justify-start space-x-6 rounded-none border-b-0 bg-transparent p-0">
              <TabsTrigger 
                value="tokens" 
                className="group relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-1 pb-4 pt-2 font-medium text-muted-foreground shadow-none transition-all duration-200 hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <span className="relative z-10">Tokens</span>
                <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary transition-transform duration-200 group-data-[state=active]:scale-x-100"></span>
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="group relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-1 pb-4 pt-2 font-medium text-muted-foreground shadow-none transition-all duration-200 hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <span className="relative z-10 flex items-center">
                  <span>Activity</span>
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary transition-colors group-hover:bg-primary/20">12</span>
                </span>
                <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary transition-transform duration-200 group-data-[state=active]:scale-x-100"></span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-0">
            <TabsContent value="tokens" className="m-0">
              <div className="p-6 pt-4">
                <TokenTable tokens={tokens} />
              </div>
            </TabsContent>
            
            <TabsContent value="activity" className="m-0">
              <div className="p-6 pt-4">
                <ActivityFeed />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
