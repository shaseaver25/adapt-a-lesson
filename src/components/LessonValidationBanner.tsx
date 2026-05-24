import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { humanizeCheck } from './LessonValidationBadge';

interface LessonValidationBannerProps {
  failedChecks: Array<{ name: string; details?: string }>;
  onRegenerate?: () => void;
}

export function LessonValidationBanner({ failedChecks, onRegenerate }: LessonValidationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || failedChecks.length === 0) return null;

  return (
    <Alert className="mb-4 border-yellow-300 bg-yellow-50 text-yellow-900">
      <AlertTriangle className="h-4 w-4 !text-yellow-700" />
      <div className="flex-1">
        <AlertTitle className="text-yellow-900">
          Quality check found {failedChecks.length} issue{failedChecks.length === 1 ? '' : 's'}
        </AlertTitle>
        <AlertDescription className="text-yellow-900/90">
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
            {failedChecks.map((c) => (
              <li key={c.name}>
                <span className="font-medium">{humanizeCheck(c.name)}</span>
                {c.details ? <span className="text-yellow-900/70"> — {c.details}</span> : null}
              </li>
            ))}
          </ul>
          {onRegenerate ? (
            <div className="mt-3">
              <Button size="sm" variant="outline" onClick={onRegenerate} className="border-yellow-400">
                Regenerate this lesson
              </Button>
            </div>
          ) : null}
        </AlertDescription>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="ml-2 text-yellow-900/60 hover:text-yellow-900"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}
