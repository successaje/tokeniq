'use client';

import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search tokens, protocols, or addresses...',
  className = ''
}: SearchBarProps) {
  const handleChange = (newValue: string) => {
    onChange(newValue);
    if (onSearch) {
      onSearch(newValue);
    }
  };

  const handleClear = () => {
    const newValue = '';
    onChange(newValue);
    if (onSearch) {
      onSearch(newValue);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        className="pl-10 pr-10 py-6 text-base"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
