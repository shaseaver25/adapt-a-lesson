import { AlertTriangle, CheckCircle2, MinusCircle, ShieldAlert, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  CHECK_ORDER,
  checkLabel,
  checkRemedy,
  isBlockingCheck,
  type HardCheckResults,
} from '../../supabase/functions/_shared/lessonRubric.ts';

interface LessonValidationPanelProps {
  hardCheckResults: HardCheckResults;
  rubricVersion: string;
  blocking: string[];
  advisory: string[];
  className?: string;
}

type Status = 'passed' | 'failed' | 'skipped';

function statusOf(result?: { passed: boolean; skipped?: boolean }): Status {
  if (!result) return 'skipped';
  if (result.skipped) return 'skipped';
  return result.passed ? 'passed' : 'failed';
}

const STATUS_TEXT: Record<Status, string> = {
  passed: 'Passed',
  failed: 'Failed',
  skipped: 'Not applicable',
};

function StatusIcon({ status }: { status: Status }) {
  if (status === 'passed') return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />;
  if (status === 'failed') return <XCircle className="h-4 w-4 text-destructive shrink-0" aria-hidden="true" />;
  return <MinusCircle className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />;
}

export function LessonValidationPanel({
  hardCheckResults,
  rubricVersion,
  blocking,
  advisory,
  className,
}: LessonValidationPanelProps) {
  const names = CHECK_ORDER.filter((name) => name in hardCheckResults);
  const isBlocked = blocking.length > 0;

  return (
    <section
      className={`rounded-lg border bg-card ${className ?? ''}`}
      aria-labelledby="a11y-panel-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex items-center gap-2">
          {isBlocked ? (
            <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          )}
          <h3 id="a11y-panel-heading" className="font-display font-semibold">
            Accessibility checks
          </h3>
          <Badge variant="outline" className="text-xs">Rubric {rubricVersion}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {isBlocked
            ? `${blocking.length} blocking issue${blocking.length === 1 ? '' : 's'} — export is disabled until ${
                blocking.length === 1 ? 'it is' : 'they are'
              } fixed.`
            : advisory.length > 0
              ? `Ready to export. ${advisory.length} advisory note${advisory.length === 1 ? '' : 's'} to review.`
              : 'Ready to export. All checks passed.'}
        </p>
      </div>

      <ul className="divide-y">
        {names.map((name) => {
          const result = hardCheckResults[name];
          const status = statusOf(result);
          const blockingCheck = isBlockingCheck(name);
          return (
            <li key={name} className="flex items-start gap-3 p-3">
              <StatusIcon status={status} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{checkLabel(name)}</span>
                  <span className="text-xs text-muted-foreground">{STATUS_TEXT[status]}</span>
                  {blockingCheck ? (
                    <Badge variant="outline" className="text-[0.65rem] uppercase tracking-wide">
                      Blocking
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[0.65rem] uppercase tracking-wide">
                      Advisory
                    </Badge>
                  )}
                </div>
                {result?.details ? (
                  <p className="mt-1 text-xs text-muted-foreground break-words">{result.details}</p>
                ) : null}
                {status === 'failed' && checkRemedy(name) ? (
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-foreground/80">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>{checkRemedy(name)}</span>
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="border-t p-3 text-xs text-muted-foreground">
        These are automated checks against RealPath's internal rubric. They are not a substitute for a
        manual accessibility audit.
      </p>
    </section>
  );
}
