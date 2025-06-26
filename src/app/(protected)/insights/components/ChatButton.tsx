'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Brain } from 'lucide-react';
import { ChatModal } from './ChatModal';

interface ChatButtonProps {
  onOpen?: () => void;
}

export function ChatButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
            'shadow-lg hover:shadow-xl transition-all duration-300',
            'p-3',
            isHovered ? 'scale-110' : 'scale-100'
          )}
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Brain className="h-5 w-5 text-emerald-500" />
        </Button>
        <span className="ml-2 text-sm font-medium whitespace-nowrap">
          Ask Eliza
        </span>
      </div>

      <ChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
