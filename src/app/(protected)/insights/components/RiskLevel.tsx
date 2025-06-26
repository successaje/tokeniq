import { cn } from '@/lib/utils';

interface RiskLevelProps {
  risk: number;
  label: string;
  className?: string;
}

export function RiskLevel({ risk, label, className }: RiskLevelProps) {
  const riskColors = {
    Low: 'bg-green-500/20 text-green-500',
    Moderate: 'bg-yellow-500/20 text-yellow-500',
    High: 'bg-red-500/20 text-red-500'
  };

  const getRiskLevel = (risk: number) => {
    if (risk < 0.3) return 'Low';
    if (risk < 0.6) return 'Moderate';
    return 'High';
  };

  return (
    <div className={cn("flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted/75 transition-colors", className)}>
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          riskColors[getRiskLevel(risk)]
        )}>
          <span className="text-sm font-medium">{Math.round(risk * 100)}%</span>
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted/50">
        <div 
          className={cn(
            "h-full rounded-full transition-all",
            riskColors[getRiskLevel(risk)]
          )}
          style={{ width: `${Math.round(risk * 100)}%` }}
        />
      </div>
    </div>
  );
}
