import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { buildLessonSectionHTML } from "@/lib/export/htmlExporter";

/**
 * Schoology counterpart to PushToCanvasDialog. Reuses the same
 * `buildLessonSectionHTML` pipeline so bilingual table semantics stay intact,
 * and the same multi-page model (teacher guide + one page per student group).
 *
 * Difference from Canvas: Schoology pages target a *section* (no course/module
 * split), and v1 does NOT re-host images — the lesson HTML is pushed with its
 * Supabase image URLs in place.
 */

export interface PushHandout {
  groupName: string;
  content: string;
  englishContent?: string;
  homeLanguage?: string;
}

interface SchoologySection { id: string; title: string; courseTitle: string }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lessonTitle: string;
  teacherGuide?: string;
  handouts: PushHandout[];
  imageMap?: Map<string, string>;
}

interface BuiltPage {
  title: string;
  bodyHtml: string;
  published: boolean;
  groupKey: string;
}

interface PageResult {
  title: string;
  groupKey?: string;
  published: boolean;
  success: boolean;
  pageId?: string;
  error?: { code: string; message: string };
}

function buildPages(
  lessonTitle: string,
  teacherGuide: string | undefined,
  handouts: PushHandout[],
  imageMap?: Map<string, string>,
): BuiltPage[] {
  const pages: BuiltPage[] = [];
  if (teacherGuide && teacherGuide.trim()) {
    pages.push({
      title: `${lessonTitle} — Teacher Guide`,
      bodyHtml: buildLessonSectionHTML({
        heading: "Teacher Guide",
        content: teacherGuide,
        homeLanguage: "English",
        imageMap,
      }),
      published: false,
      groupKey: "teacher_guide",
    });
  }
  for (const h of handouts) {
    if (!h.content || !h.content.trim()) continue;
    pages.push({
      title: `${lessonTitle} — ${h.groupName}`,
      bodyHtml: buildLessonSectionHTML({
        heading: h.groupName,
        content: h.content,
        englishContent: h.englishContent,
        homeLanguage: h.homeLanguage || "English",
        imageMap,
      }),
      published: true,
      groupKey: `group_${h.groupName.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`,
    });
  }
  return pages;
}

export function PushToSchoologyDialog({
  open, onOpenChange, lessonTitle, teacherGuide, handouts, imageMap,
}: Props) {
  const [sections, setSections] = useState<SchoologySection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [sectionsError, setSectionsError] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<PageResult[] | null>(null);

  const builtPages = buildPages(lessonTitle, teacherGuide, handouts, imageMap);

  const loadSections = async () => {
    setSectionsLoading(true); setSectionsError(null);
    const { data, error } = await supabase.functions.invoke("schoology-sections", { method: "GET" });
    setSectionsLoading(false);
    if (error || !data || data.error) {
      setSectionsError(data?.error ?? error?.message ?? "Failed to load sections");
      return;
    }
    setSections(data.sections ?? []);
  };

  useEffect(() => {
    if (open) {
      setSectionId("");
      setErrorMsg(null);
      setResults(null);
      loadSections();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!sectionId || builtPages.length === 0) return;
    setSubmitting(true); setErrorMsg(null); setResults(null);

    const imageUrls = imageMap ? Array.from(imageMap.values()) : [];
    const { data, error } = await supabase.functions.invoke("schoology-push-lesson", {
      method: "POST",
      body: {
        sectionId,
        pages: builtPages.map(({ title, bodyHtml, published, groupKey }) => ({
          title, bodyHtml, published, groupKey,
        })),
        imageUrls,
      },
    });
    setSubmitting(false);

    if (error || (data && data.error && !data.results)) {
      const code = data?.code as string | undefined;
      const msg = data?.error || error?.message || "Push failed";
      if (code === "TOKEN_EXPIRED" || code === "NO_CONNECTION") {
        setErrorMsg("Your Schoology connection is missing or was rejected. Reconnect Schoology in Settings.");
      } else {
        setErrorMsg(`Something went wrong: ${msg}. Try again, or check your Schoology connection in Settings.`);
      }
      return;
    }

    const pageResults = (data.results ?? []) as PageResult[];
    const succeeded = pageResults.filter((r) => r.success).length;
    const total = pageResults.length;
    setResults(pageResults);

    if (data.partialFailure) {
      toast.warning(`${succeeded} of ${total} pages pushed`, {
        description: "See dialog for details on the failed pages.",
        duration: 8000,
      });
    } else {
      toast.success(`Pushed ${succeeded} page${succeeded === 1 ? "" : "s"} to Schoology`, {
        duration: 6000,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Push to Schoology</DialogTitle>
          <DialogDescription>
            This creates one Schoology page per part of the lesson — an
            unpublished Teacher Guide plus one published page per student group
            ({builtPages.length} page{builtPages.length === 1 ? "" : "s"} total).
            Images are linked from RealPath (re-hosting into Schoology is coming).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Section</label>
            {sectionsLoading ? (
              <div className="h-10 rounded-md bg-muted animate-pulse" />
            ) : sectionsError ? (
              <div className="text-sm text-destructive flex items-center gap-2">
                <span>{sectionsError}</span>
                <Button size="sm" variant="outline" onClick={loadSections}>Retry</Button>
              </div>
            ) : sections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No Schoology sections found for your account.</p>
            ) : (
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger><SelectValue placeholder="Select a section" /></SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.courseTitle ? `${s.courseTitle} — ${s.title}` : s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {submitting && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Pushing {builtPages.length} page{builtPages.length === 1 ? "" : "s"} to Schoology…
            </p>
          )}
          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

          {results && (
            <div className="space-y-2 border rounded-md p-3 bg-muted/30 max-h-64 overflow-y-auto">
              <p className="text-sm font-medium">Results</p>
              <ul className="space-y-1.5">
                {results.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {r.success ? (
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate">
                        {r.title}
                        {!r.published && r.success && (
                          <span className="ml-2 text-xs text-muted-foreground">(unpublished)</span>
                        )}
                      </div>
                      {!r.success && (
                        <p className="text-xs text-destructive">{r.error?.message ?? "Failed"}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {results ? "Close" : "Cancel"}
          </Button>
          {!results && (
            <Button onClick={handleSubmit} disabled={!sectionId || submitting || builtPages.length === 0}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Push {builtPages.length} page{builtPages.length === 1 ? "" : "s"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
