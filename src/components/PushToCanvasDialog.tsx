import { useEffect, useState } from "react";
import { marked } from "marked";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CanvasCourse { id: number; name: string; courseCode?: string }
interface CanvasModule { id: number; name: string }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lessonTitle: string;
  /** Markdown content sections to concatenate into the Canvas page body. */
  markdownSections: Array<{ heading?: string; content: string }>;
  /** Image URLs (Supabase signed) referenced in the body — will be re-uploaded to Canvas. */
  imageUrls: string[];
}

function buildHtml(title: string, sections: Array<{ heading?: string; content: string }>): string {
  const parts = sections
    .filter((s) => s.content && s.content.trim())
    .map((s) => {
      const h = s.heading ? `<h2>${escapeHtml(s.heading)}</h2>` : "";
      return h + (marked.parse(s.content) as string);
    });
  return `<h1>${escapeHtml(title)}</h1>` + parts.join("\n<hr/>\n");
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function PushToCanvasDialog({ open, onOpenChange, lessonTitle, markdownSections, imageUrls }: Props) {
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string>("");

  const [modules, setModules] = useState<CanvasModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [moduleId, setModuleId] = useState<string>("none");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadCourses = async () => {
    setCoursesLoading(true); setCoursesError(null);
    const { data, error } = await supabase.functions.invoke("canvas-courses", { method: "GET" });
    setCoursesLoading(false);
    if (error || !data) { setCoursesError(error?.message ?? "Failed to load courses"); return; }
    setCourses(data.courses ?? []);
  };

  useEffect(() => {
    if (open) {
      setCourseId(""); setModuleId("none"); setModules([]); setErrorMsg(null);
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
    if (!courseId) return;
    setSubmitting(true); setErrorMsg(null);
    const bodyHtml = buildHtml(lessonTitle, markdownSections);
    const { data, error } = await supabase.functions.invoke("canvas-push-lesson", {
      method: "POST",
      body: {
        courseId: Number(courseId),
        moduleId: moduleId === "none" ? null : Number(moduleId),
        title: lessonTitle,
        bodyHtml,
        imageUrls,
      },
    });
    setSubmitting(false);
    if (error || (data && data.error)) {
      const code = data?.code as string | undefined;
      const msg = data?.error || error?.message || "Push failed";
      if (code === "TOKEN_EXPIRED" || code === "NO_CONNECTION") {
        setErrorMsg("Your Canvas connection has expired or is missing. Reconnect Canvas in Settings.");
      } else if (code === "IMAGE_UPLOAD_FAILED") {
        setErrorMsg(`An image failed to upload to Canvas. Details: ${msg}`);
      } else if (code === "CANVAS_API_ERROR") {
        setErrorMsg(`Canvas rejected the upload. Details: ${msg}. If this keeps happening, try disconnecting and reconnecting Canvas.`);
      } else {
        setErrorMsg(`Something went wrong: ${msg}. Try again, or check your Canvas connection in Settings.`);
      }
      return;
    }
    const pageUrl = data.pageUrl as string;
    onOpenChange(false);
    toast.success("Pushed to Canvas", {
      description: `Uploaded ${data.imagesUploaded}/${data.imagesAttempted} images.`,
      duration: Infinity,
      action: { label: "View in Canvas", onClick: () => window.open(pageUrl, "_blank") },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Push to Canvas</DialogTitle>
          <DialogDescription>
            This will upload the lesson as a Page in your selected Canvas course. Images will be uploaded to Canvas's file storage so they don't expire.
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
              Pushing to Canvas — this can take 10–30 seconds depending on images.
            </p>
          )}
          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!courseId || submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Push to Canvas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}