import { PortfolioOverview } from '@/components/portfolio/PortfolioOverview';
import { Surface } from '@/components/ui/surface';

export default function PortfolioPage() {
  return (
    <div className="flex-1 p-4 md:p-6 max-w-[2000px] mx-auto w-full space-y-6">
      <Surface variant="elevated" className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Portfolio</h1>
            <p className="text-sm text-muted-foreground">Your complete asset overview</p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span className="bg-muted px-3 py-1 rounded-full text-xs">
              Last updated: Just now
            </span>
          </div>
        </div>
      </Surface>
      
      <PortfolioOverview />
    </div>
  );
}
