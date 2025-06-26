import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterGroupProps {
  title: string;
  options: FilterOption[];
  selected: string[];
  onSelect: (id: string, selected: boolean) => void;
  className?: string;
}

function FilterGroup({ title, options, selected, onSelect, className = '' }: FilterGroupProps) {
  return (
    <div className={className}>
      <h4 className="text-sm font-medium mb-3">{title}</h4>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <Checkbox
              id={option.id}
              checked={selected.includes(option.id)}
              onCheckedChange={(checked) => onSelect(option.id, checked === true)}
            />
            <Label htmlFor={option.id} className="text-sm font-normal flex-1">
              {option.label}
            </Label>
            {option.count !== undefined && (
              <span className="text-xs text-muted-foreground">{option.count}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface FiltersProps {
  chains: FilterOption[];
  categories: FilterOption[];
  selectedChains: string[];
  selectedCategories: string[];
  onChainSelect: (id: string, selected: boolean) => void;
  onCategorySelect: (id: string, selected: boolean) => void;
  onReset: () => void;
  className?: string;
}

export function Filters({
  chains,
  categories,
  selectedChains,
  selectedCategories,
  onChainSelect,
  onCategorySelect,
  onReset,
  className = '',
}: FiltersProps) {
  const filterCount = selectedChains.length + selectedCategories.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {filterCount > 0 && (
            <Badge variant="secondary" className="px-1.5">
              {filterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={filterCount === 0}
            >
              Reset all
            </Button>
          </div>

          <FilterGroup
            title="Chains"
            options={chains}
            selected={selectedChains}
            onSelect={onChainSelect}
          />

          <FilterGroup
            title="Categories"
            options={categories}
            selected={selectedCategories}
            onSelect={onCategorySelect}
            className="pt-4 border-t"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
