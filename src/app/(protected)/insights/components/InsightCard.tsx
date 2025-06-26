import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface InsightCardProps {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  description?: string;
  className?: string;
}

export function InsightCard({ title, icon, value, description, className }: InsightCardProps) {
  return (
    <Card className={cn("bg-muted/50 p-4 rounded-lg hover:bg-muted/75 transition-colors", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardDescription className="text-2xl font-bold text-center">
        {value}
      </CardDescription>
      {description && (
        <CardDescription className="text-sm text-muted-foreground mt-1">
          {description}
        </CardDescription>
      )}
    </Card>
  );
}
