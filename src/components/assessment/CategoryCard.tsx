import { cn } from '@/lib/utils';
import { AssessmentCategory, AIResistanceLevel } from '@/types/assessmentMethods';

interface CategoryCardProps {
  category: AssessmentCategory;
  isSelected: boolean;
  onClick: () => void;
}

const resistanceColors: Record<AIResistanceLevel, string> = {
  'very-high': 'bg-emerald-500',
  'high': 'bg-green-400',
  'low': 'bg-orange-400',
};

export function CategoryCard({ category, isSelected, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200',
        'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'min-w-[120px] flex-1',
        isSelected
          ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 shadow-md'
          : 'border-border bg-card hover:bg-muted/50'
      )}
      aria-pressed={isSelected}
      aria-label={`${category.label} - ${category.description}`}
    >
      <span className="text-3xl mb-2" role="img" aria-hidden="true">
        {category.icon}
      </span>
      <span className="font-semibold text-sm text-foreground text-center leading-tight">
        {category.label}
      </span>
      <div className="flex items-center gap-1.5 mt-2">
        <span
          className={cn('w-2 h-2 rounded-full', resistanceColors[category.aiResistance])}
          aria-hidden="true"
        />
        <span className="text-xs text-muted-foreground capitalize">
          {category.aiResistance === 'very-high' ? 'Very High' : category.aiResistance}
        </span>
      </div>
    </button>
  );
}
