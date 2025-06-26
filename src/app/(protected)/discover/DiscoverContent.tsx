'use client';

import { useCallback, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronDown, ArrowUpDown } from 'lucide-react';
import { TokenCard } from '@/components/tokens/TokenCard';
import { SearchBar } from '@/app/(protected)/discover/SearchBar';
import { Filters } from '@/app/(protected)/discover/Filters';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';

import { MOCK_TOKENS, CHAINS, CATEGORIES, SORT_OPTIONS } from '@/app/(protected)/discover/discoverData';
import type { Token, FilterOption, SortOption } from './types';

interface DiscoverContentProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DiscoverContent({ activeTab, onTabChange }: DiscoverContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('market_cap');
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const selectedSortLabel = SORT_OPTIONS.find((option: SortOption) => option.value === sortBy)?.label || 'Sort By';

  const handleChainSelect = useCallback((id: string, selected: boolean) => {
    setSelectedChains(prev => 
      selected ? [...prev, id] : prev.filter(chainId => chainId !== id)
    );
  }, []);

  const handleCategorySelect = useCallback((id: string, selected: boolean) => {
    setSelectedCategories(prev => 
      selected ? [...prev, id] : prev.filter(catId => catId !== id)
    );
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedChains([]);
    setSelectedCategories([]);
  }, []);

  const filteredTokens = useMemo(() => {
    return MOCK_TOKENS.filter((token: Token) => {
      const matchesSearch = 
        searchQuery === '' ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesChains = selectedChains.length === 0 || 
        selectedChains.includes(token.chainId.toString());
      
      const matchesCategories = selectedCategories.length === 0 ||
        selectedCategories.some(cat => 
          token.category.toLowerCase().includes(cat.toLowerCase())
        );
      
      return matchesSearch && matchesChains && matchesCategories;
    });
  }, [searchQuery, selectedChains, selectedCategories]);

  const sortedTokens = useMemo(() => {
    const tokens = [...filteredTokens];
    
    switch (sortBy) {
      case 'market_cap':
        return tokens.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
      case 'volume_24h':
        return tokens.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
      case 'price':
        return tokens.sort((a, b) => {
          const priceA = parseFloat(a.price.replace(/[^0-9.-]+/g, ''));
          const priceB = parseFloat(b.price.replace(/[^0-9.-]+/g, ''));
          return priceB - priceA;
        });
      case 'price_change_24h':
        return tokens.sort((a, b) => (b.priceChange24h || 0) - (a.priceChange24h || 0));
      case 'name':
        return tokens.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return tokens;
    }
  }, [filteredTokens, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:max-w-md">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tokens, protocols, or addresses..."
            className="w-full"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <span className="hidden sm:inline">{selectedSortLabel}</span>
                <span className="sm:hidden">Sort</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuRadioGroup value={sortBy} onValueChange={handleSortChange}>
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <span>Filters</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Chains</h4>
                <div className="space-y-2">
                  {CHAINS.map((chain) => (
                    <label key={chain.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedChains.includes(chain.id)}
                        onChange={(e) => handleChainSelect(chain.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">{chain.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium mb-2">Categories</h4>
                <div className="space-y-2">
                  {CATEGORIES.map((category) => (
                    <label key={category.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={(e) => handleCategorySelect(category.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {(selectedChains.length > 0 || selectedCategories.length > 0) && (
                <div className="pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={handleResetFilters}
                  >
                    Reset all filters
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={onTabChange}
        className="w-full"
      >
        <TabsList className="w-full sm:w-auto overflow-x-auto mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="nfts">NFTs</TabsTrigger>
          <TabsTrigger value="pools">Pools</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <TokenGrid tokens={sortedTokens} />
        </TabsContent>

        <TabsContent value="tokens" className="mt-0">
          <TokenGrid tokens={sortedTokens} />
        </TabsContent>

        <TabsContent value="nfts" className="mt-0">
          <EmptyState 
            title="NFT Collections" 
            description="Browse and discover NFT collections across multiple chains."
          />
        </TabsContent>

        <TabsContent value="pools" className="mt-0">
          <EmptyState 
            title="Liquidity Pools" 
            description="Explore liquidity pools and yield farming opportunities."
          />
        </TabsContent>

        <TabsContent value="trending" className="mt-0">
          <EmptyState 
            title="Trending" 
            description="Discover trending tokens and collections in the market."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TokenGrid({ tokens }: { tokens: Token[] }) {
  if (tokens.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">No results found</h3>
        <p className="text-muted-foreground mt-1">
          Try adjusting your search or filter to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {tokens.map((token) => (
        <TokenCard
          key={`${token.id}-${token.chainId}`}
          name={token.name}
          symbol={token.symbol}
          price={token.price}
          priceChange24h={token.priceChange24h}
          logoUrl={token.logoUrl}
          chainId={token.chainId}
        />
      ))}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-12 rounded-lg border border-dashed">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1">{description}</p>
      <div className="mt-4">
        <Button>Explore {title}</Button>
      </div>
    </div>
  );
}
