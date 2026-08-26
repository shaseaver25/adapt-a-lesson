import { useId, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, FileUp, Link2, Loader2 } from 'lucide-react';
import {
  ACCEPTED_FILE_EXTENSIONS,
  ImportError,
  importFromFile,
  importFromGoogleDocHtml,
  parseGoogleDocId,
} from '@/lib/import/documentImport';

interface Props {
  /** Called with the imported markdown. The caller decides what to do with it. */
  onImported: (markdown: string) => void;
  /** True when the field already holds content, so we can warn before replacing. */
  hasExistingContent: boolean;
  disabled?: boolean;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'working'; message: string }
  | { kind: 'done'; message: string; warnings: string[] }
  | { kind: 'error'; message: string };

export function ImportLessonControls({ onImported, hasExistingContent, disabled }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docUrl, setDocUrl] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const urlFieldId = useId();
  const statusId = useId();

  const busy = status.kind === 'working';

  const confirmReplace = () =>
    !hasExistingContent ||
    window.confirm(
      'This will replace the lesson content already in the box. Continue?',
    );

  const apply = (markdown: string, sourceLabel: string, warnings: string[]) => {
    onImported(markdown);
    const words = markdown.split(/\s+/).filter(Boolean).length;
    setStatus({
      kind: 'done',
      message: `Imported ${words.toLocaleString()} words from ${sourceLabel}. Check it below before generating.`,
      warnings,
    });
  };

  const fail = (e: unknown) => {
    setStatus({
      kind: 'error',
      message:
        e instanceof ImportError || e instanceof Error
          ? e.message
          : 'That document could not be imported.',
    });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!confirmReplace()) return;
    setStatus({ kind: 'working', message: `Reading ${file.name}…` });
    try {
      const result = await importFromFile(file);
      apply(result.markdown, result.sourceLabel, result.warnings);
    } catch (e) {
      fail(e);
    } finally {
      // Let the same file be chosen again after a failure.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGoogleDoc = async () => {
    const documentId = parseGoogleDocId(docUrl);
    if (!documentId) {
      setStatus({
        kind: 'error',
        message:
          'That does not look like a Google Docs link. Open the document and copy the address from your browser bar.',
      });
      return;
    }
    if (!confirmReplace()) return;

    setStatus({ kind: 'working', message: 'Fetching the Google Doc…' });
    try {
      const { data, error } = await supabase.functions.invoke('import-google-doc', {
        method: 'POST',
        body: { documentId },
      });
      if (error || !data || data.error) {
        throw new ImportError(
          data?.error ?? error?.message ?? 'The document could not be fetched.',
        );
      }
      const result = importFromGoogleDocHtml(data.html, 'the Google Doc');
      apply(result.markdown, result.sourceLabel, result.warnings);
    } catch (e) {
      fail(e);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
      <div className="flex items-start gap-2">
        <FileUp className="h-4 w-4 mt-0.5 text-primary shrink-0" aria-hidden="true" />
        <div>
          <h4 className="text-sm font-medium">Start from a document you already have</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Word files are read in your browser and never uploaded. A Google Doc is
            fetched by RealPath, so it has to be shared with anyone who has the link.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          {/* A real label bound to a real file input: the control is reachable and
              announced, which a bare styled button would not be. */}
          <Label htmlFor="lesson-import-file" className="text-xs font-medium block mb-1">
            Word or text file
          </Label>
          <input
            ref={fileInputRef}
            id="lesson-import-file"
            type="file"
            accept={ACCEPTED_FILE_EXTENSIONS.join(',')}
            disabled={disabled || busy}
            aria-describedby={statusId}
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50"
          />
        </div>

        <div className="flex-1 min-w-[260px]">
          <Label htmlFor={urlFieldId} className="text-xs font-medium block mb-1">
            Or paste a Google Docs link
          </Label>
          <div className="flex gap-2">
            <Input
              id={urlFieldId}
              type="url"
              inputMode="url"
              placeholder="https://docs.google.com/document/d/…"
              value={docUrl}
              disabled={disabled || busy}
              aria-describedby={statusId}
              onChange={(e) => setDocUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGoogleDoc();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleDoc}
              disabled={disabled || busy || !docUrl.trim()}
              className="gap-2 shrink-0"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Link2 className="h-4 w-4" aria-hidden="true" />
              )}
              Import
            </Button>
          </div>
        </div>
      </div>

      {/* One live region for every outcome, so a screen reader hears the result
          without the focus moving. Errors are announced assertively. */}
      <div
        id={statusId}
        role="status"
        aria-live={status.kind === 'error' ? 'assertive' : 'polite'}
        className="text-sm"
      >
        {status.kind === 'working' && (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            {status.message}
          </span>
        )}
        {status.kind === 'done' && (
          <div className="space-y-1">
            <p className="text-primary">{status.message}</p>
            {status.warnings.map((w) => (
              <p key={w} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                {w}
              </p>
            ))}
          </div>
        )}
        {status.kind === 'error' && (
          <p className="flex items-start gap-1.5 text-destructive">
            {/* Paired with text, never colour alone. */}
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-medium">Import failed. </span>
              {status.message}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
