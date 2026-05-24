import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface LessonValidationBadgeProps {
  passed: boolean;
  failedChecks?: string[];
  regenAttempts?: number;
  className?: string;
}

const CHECK_LABELS: Record<string, string> = {
  has_all_sections: 'Missing a required section',
  has_no_placeholder: 'Placeholder text left in handout',
  has_all_alt_text: 'Image missing alt text',
  has_valid_heading_hierarchy: 'Heading hierarchy issue',
  translated_content_has_lang_attribute: 'Translated content missing lang attribute',
  bilingual_section_counts_match: 'Bilingual sections do not align',
  vocabulary_table_well_formed: 'Vocabulary table is malformed',
  practice_section_has_answer_mechanism: 'Practice section has no answer space',
  word_count_in_grade_range: 'Word count outside grade band range',
};

export function humanizeCheck(name: string): string {
  return CHECK_LABELS[name] ?? name.replace(/_/g, ' ');
}

export function LessonValidationBadge({
  passed,
  failedChecks = [],
  regenAttempts = 0,
  className,
}: LessonValidationBadgeProps) {
  if (passed) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className={`gap-1 bg-green-100 text-green-800 hover:bg-green-100 border-green-200 ${className ?? ''}`}
            >
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">
              This lesson passed RealPath's quality checks (rubric v1.0).
              Regenerated {regenAttempts} time{regenAttempts === 1 ? '' : 's'} before passing.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const count = failedChecks.length;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={`gap-1 bg-yellow-100 text-yellow-900 hover:bg-yellow-100 border-yellow-300 ${className ?? ''}`}
          >
            <AlertTriangle className="h-3 w-3" />
            {count} issue{count === 1 ? '' : 's'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm font-medium mb-1">Quality issues found:</p>
          <ul className="text-xs list-disc pl-4 space-y-0.5">
            {failedChecks.map((c) => (
              <li key={c}>{humanizeCheck(c)}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
