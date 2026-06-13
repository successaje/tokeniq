"use client";

import { useState, useEffect } from 'react';
import { Menu as MenuIcon, Search, Bell, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { CustomConnectButton } from '@/components/Web3Modal';
import { Button } from '@/components/ui/button';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <header className="z-40 flex h-14 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile Menu Toggle */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <MenuIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Separator for mobile */}
      <div className="h-6 w-px bg-border lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm"
            placeholder="Search assets, strategies, or transaction hashes..."
            type="search"
            name="search"
            autoComplete="off"
          />
        </form>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* AI Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">AI Copilot Active</span>
          </div>

          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
          </Button>

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

          {/* Wallet / Network Connect */}
          <CustomConnectButton />
        </div>
      </div>
    </header>
  );
}
