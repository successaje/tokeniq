import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export function ElizaOSBadge({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
      "bg-gradient-to-r from-indigo-500/20 to-indigo-600/20 text-indigo-500",
      "border border-indigo-500/30",
      "hover:from-indigo-500/30 hover:to-indigo-600/30 transition-all duration-300",
      className
    )}>
      <Sparkles className="h-4 w-4" />
      <span>Powered by ElizaOS</span>
    </div>
  );
}
