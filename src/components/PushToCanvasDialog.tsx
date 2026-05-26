import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { buildLessonSectionHTML } from "@/lib/export/htmlExporter";

/**
 * Architectural choice — Option A (frontend HTML generation):
 * We render every page's HTML body via the shared `buildLessonSectionHTML`
 * pipeline (the same one used for direct HTML export). This keeps the
 * bilingual <table>/<caption>/<th scope="col">/<td lang="..."> semantics
 * intact (WCAG SC 1.3.1, SC 3.1.2) without porting the renderer to Deno.
 */

export interface PushHandout {
  groupName: string;
  /** Markdown content (in target language for non-English groups). */
  content: string;
  /** English markdown — present makes the page bilingual. */
  englishContent?: string;
  /** Defaults to "English". */
  homeLanguage?: string;
}

interface CanvasCourse { id: number; name: string; courseCode?: string }
interface CanvasModule { id: number; name: string }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lessonTitle: string;
  /** Teacher guide markdown. Pushed as an UNPUBLISHED page. */
  teacherGuide?: string;
  /** One published page per handout. */
  handouts: PushHandout[];
  /** [VISUAL: description] -> signed URL. */
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
  pageUrl?: string;
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

export function PushToCanvasDialog({
  open, onOpenChange, lessonTitle, teacherGuide, handouts, imageMap,
}: Props) {
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string>("");

  const [modules, setModules] = useState<CanvasModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [moduleId, setModuleId] = useState<string>("none");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<PageResult[] | null>(null);
  const [courseUrl, setCourseUrl] = useState<string | null>(null);

  const builtPages = buildPages(lessonTitle, teacherGuide, handouts, imageMap);

  const loadCourses = async () => {
    setCoursesLoading(true); setCoursesError(null);
    const { data, error } = await supabase.functions.invoke("canvas-courses", { method: "GET" });
    setCoursesLoading(false);
    if (error || !data) { setCoursesError(error?.message ?? "Failed to load courses"); return; }
    setCourses(data.courses ?? []);
  };

  useEffect(() => {
    if (open) {
      setCourseId(""); setModuleId("none"); setModules([]);
      setErrorMsg(null); setResults(null); setCourseUrl(null);
      loadCourses();
    }
  }, [open]);

  useEffect(() => {
    if (!courseId) { setModules([]); return; }
    setModulesLoading(true);
    supabase.functions.invoke("canvas-modules", {
      method: "POST",
      body: { courseId: Number(courseId) },
    }).then(({ data, error }) => {
      setModulesLoading(false);
      if (error || !data) { setModules([]); return; }
      setModules(data.modules ?? []);
    });
  }, [courseId]);

  const handleSubmit = async () => {
    if (!courseId || builtPages.length === 0) return;
    setSubmitting(true); setErrorMsg(null); setResults(null); setCourseUrl(null);

    const imageUrls = imageMap ? Array.from(imageMap.values()) : [];
    const { data, error } = await supabase.functions.invoke("canvas-push-lesson", {
      method: "POST",
      body: {
        courseId: Number(courseId),
        moduleId: moduleId === "none" ? null : Number(moduleId),
        pages: builtPages.map(({ title, bodyHtml, published, groupKey }) => ({
          title, bodyHtml, published, groupKey,
        })),
        imageUrls,
      },
    });
    setSubmitting(false);

    // Top-level failure (no results array returned).
    if (error || (data && data.error && !data.results)) {
      const code = data?.code as string | undefined;
      const msg = data?.error || error?.message || "Push failed";
      if (code === "TOKEN_EXPIRED" || code === "NO_CONNECTION") {
        setErrorMsg("Your Canvas connection has expired or is missing. Reconnect Canvas in Settings.");
      } else if (code === "IMAGE_UPLOAD_FAILED") {
        setErrorMsg(`An image failed to upload to Canvas. Details: ${msg}`);
      } else {
        setErrorMsg(`Something went wrong: ${msg}. Try again, or check your Canvas connection in Settings.`);
      }
      return;
    }

    const pageResults = (data.results ?? []) as PageResult[];
    const succeeded = pageResults.filter((r) => r.success).length;
    const total = pageResults.length;
    setResults(pageResults);
    setCourseUrl(data.courseUrl ?? null);

    if (data.partialFailure) {
      toast.warning(`${succeeded} of ${total} pages pushed`, {
        description: "See dialog for details on the failed pages.",
        duration: 8000,
      });
    } else {
      toast.success(`Pushed ${succeeded} page${succeeded === 1 ? "" : "s"} to Canvas`, {
        description: `Uploaded ${data.imagesUploaded}/${data.imagesAttempted} images.`,
        duration: Infinity,
        action: data.courseUrl
          ? { label: "Open course", onClick: () => window.open(data.courseUrl, "_blank") }
          : undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Push to Canvas</DialogTitle>
          <DialogDescription>
            This creates one Canvas page per part of the lesson — an
            unpublished Teacher Guide plus one published page per student
            group ({builtPages.length} page{builtPages.length === 1 ? "" : "s"} total).
            Images upload to Canvas file storage so they don't expire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Course</label>
            {coursesLoading ? (
              <div className="h-10 rounded-md bg-muted animate-pulse" />
            ) : coursesError ? (
              <div className="text-sm text-destructive flex items-center gap-2">
                <span>{coursesError}</span>
                <Button size="sm" variant="outline" onClick={loadCourses}>Retry</Button>
              </div>
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No Canvas courses found. Create a course in Canvas first.</p>
            ) : (
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.courseCode ? `${c.courseCode} — ${c.name}` : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {courseId && (
            <div>
              <label className="text-sm font-medium mb-1 block">Module (optional)</label>
              {modulesLoading ? (
                <div className="h-10 rounded-md bg-muted animate-pulse" />
              ) : (
                <Select value={moduleId} onValueChange={setModuleId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">(No module — add to course only)</SelectItem>
                    {modules.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {submitting && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Pushing {builtPages.length} page{builtPages.length === 1 ? "" : "s"} to Canvas — this can take 10–30 seconds depending on images.
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
                      {r.success && r.pageUrl ? (
                        <a
                          href={r.pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          View in Canvas <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : !r.success ? (
                        <p className="text-xs text-destructive">{r.error?.message ?? "Failed"}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              {courseUrl && (
                <a
                  href={courseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 pt-1"
                >
                  Open course Pages <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {results ? "Close" : "Cancel"}
          </Button>
          {!results && (
            <Button onClick={handleSubmit} disabled={!courseId || submitting || builtPages.length === 0}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Push {builtPages.length} page{builtPages.length === 1 ? "" : "s"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}