'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Filter, X } from 'lucide-react';

import type { FilterOption } from './types';

interface FiltersProps {
  chains: FilterOption[];
  categories: FilterOption[];
  selectedChains: string[];
  selectedCategories: string[];
  onChainSelect: (id: string, selected: boolean) => void;
  onCategorySelect: (id: string, selected: boolean) => void;
  onReset: () => void;
}

export function Filters({
  chains,
  categories,
  selectedChains,
  selectedCategories,
  onChainSelect,
  onCategorySelect,
  onReset,
}: FiltersProps) {
  const totalFilters = selectedChains.length + selectedCategories.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {totalFilters > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0.5">
              {totalFilters}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={onReset}
            >
              Reset all
              <X className="ml-1 h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-2">
            <h5 className="text-sm font-medium">Chains</h5>
            <div className="space-y-2">
              {chains.map((chain) => (
                <div key={chain.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`chain-${chain.id}`}
                    checked={selectedChains.includes(chain.id)}
                    onCheckedChange={(checked) =>
                      onChainSelect(chain.id, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`chain-${chain.id}`}
                    className="flex-1 text-sm font-normal cursor-pointer"
                  >
                    {chain.label}
                  </Label>
                  {chain.count !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {chain.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="text-sm font-medium">Categories</h5>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) =>
                      onCategorySelect(category.id, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`category-${category.id}`}
                    className="flex-1 text-sm font-normal capitalize cursor-pointer"
                  >
                    {category.label}
                  </Label>
                  {category.count !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {category.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
