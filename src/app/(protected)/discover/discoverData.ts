export interface Token {
  id: string;
  name: string;
  symbol: string;
  price: string;
  priceChange24h: number;
  logoUrl?: string;
  chainId: number;
  category: string;
  marketCap?: number;
  volume24h?: number;
  balance?: number;
}

export const MOCK_TOKENS: Token[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    price: '$3,450.21',
    priceChange24h: 2.34,
    logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png?1696501628',
    chainId: 1,
    category: 'Layer 1',
    marketCap: 415000000000,
    volume24h: 25000000000,
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    price: '$63,450.89',
    priceChange24h: -1.23,
    logoUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png?1696501400',
    chainId: 1,
    category: 'Store of Value',
    marketCap: 1220000000000,
    volume24h: 35000000000,
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    price: '$142.76',
    priceChange24h: 5.67,
    logoUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png?1696504756',
    chainId: 5, // Solana chain ID
    category: 'Layer 1',
    marketCap: 65000000000,
    volume24h: 3500000000,
  },
  {
    id: 'usd-coin',
    name: 'USD Coin',
    symbol: 'USDC',
    price: '$1.00',
    priceChange24h: 0.01,
    logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png?1696506694',
    chainId: 1,
    category: 'Stablecoin',
    marketCap: 32000000000,
    volume24h: 4500000000,
  },
  {
    id: 'uniswap',
    name: 'Uniswap',
    symbol: 'UNI',
    price: '$12.34',
    priceChange24h: 3.45,
    logoUrl: 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg?1696512319',
    chainId: 1,
    category: 'DEX',
    marketCap: 7800000000,
    volume24h: 250000000,
  },
  {
    id: 'aave',
    name: 'Aave',
    symbol: 'AAVE',
    price: '$89.76',
    priceChange24h: -2.34,
    logoUrl: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png?1696512452',
    chainId: 1,
    category: 'Lending',
    marketCap: 1200000000,
    volume24h: 120000000,
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    price: '$0.68',
    priceChange24h: -2.15,
    logoUrl: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png?1698233745',
    chainId: 137,
    category: 'Layer 2',
    marketCap: 6500000000,
    volume24h: 350000000,
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    price: '$24.56',
    priceChange24h: 1.45,
    logoUrl: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png?1696512369',
    chainId: 43114,
    category: 'Layer 1',
    marketCap: 9500000000,
    volume24h: 450000000,
  },
];

export const CHAINS = [
  { id: '1', label: 'Ethereum', count: 5 },
  { id: '5', label: 'Solana', count: 1 },
  { id: '137', label: 'Polygon', count: 1 },
  { id: '43114', label: 'Avalanche', count: 1 },
];

export const CATEGORIES = [
  { id: 'layer1', label: 'Layer 1', count: 3 },
  { id: 'layer2', label: 'Layer 2', count: 1 },
  { id: 'stablecoin', label: 'Stablecoin', count: 1 },
  { id: 'dex', label: 'DEX', count: 1 },
  { id: 'lending', label: 'Lending', count: 1 },
  { id: 'store-of-value', label: 'Store of Value', count: 1 },
];

export const SORT_OPTIONS = [
  { value: 'market_cap', label: 'Market Cap' },
  { value: 'volume_24h', label: 'Volume (24h)' },
  { value: 'price', label: 'Price' },
  { value: 'price_change_24h', label: 'Price Change (24h)' },
  { value: 'name', label: 'Name' },
];
