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
}

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface DiscoverContentProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
