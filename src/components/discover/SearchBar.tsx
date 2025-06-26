import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { useEffect, useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  defaultValue?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({
  placeholder = 'Search tokens, protocols, or addresses...',
  className = '',
  defaultValue = '',
  onSearch,
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  // Sync with URL search params
  useEffect(() => {
    const search = searchParams.get('q');
    if (search) {
      setValue(search);
    }
  }, [searchParams]);

  const debouncedSearch = useDebouncedCallback((query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    
    // Update URL without page reload
    router.push(`?${params.toString()}`, { scroll: false });
    
    // Call the onSearch callback if provided
    if (onSearch) {
      onSearch(query);
    }
  }, 300);

  const handleClear = () => {
    setValue('');
    debouncedSearch('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-muted-foreground" />
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        className="pl-10 pr-10 py-6 text-base"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          debouncedSearch(e.target.value);
        }}
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
