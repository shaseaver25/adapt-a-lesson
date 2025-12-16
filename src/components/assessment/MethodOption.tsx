import { cn } from '@/lib/utils';
import { MethodOutput } from '@/types/assessmentMethods';
import { Clock, Check, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MethodOptionProps {
  method: MethodOutput;
  isSelected: boolean;
  onClick: () => void;
}

export function MethodOption({ method, isSelected, onClick }: MethodOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-all duration-200',
        'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isSelected
          ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
          : 'border-border bg-card hover:bg-muted/50'
      )}
      aria-pressed={isSelected}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-foreground">{method.name}</span>
            {method.aiProof && (
              <Badge 
                variant="secondary" 
                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-xs"
              >
                Authentic
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{method.time}</span>
          </div>
        </div>
        <div className="flex-shrink-0 mt-1">
          {isSelected ? (
            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground/40" />
          )}
        </div>
      </div>

      {/* Expanded outputs section */}
      {isSelected && method.outputs && method.outputs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
          <p className="text-xs font-medium text-muted-foreground mb-2">What you'll get:</p>
          <div className="flex flex-wrap gap-1.5">
            {method.outputs.map((output, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground"
              >
                {output}
              </span>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}
