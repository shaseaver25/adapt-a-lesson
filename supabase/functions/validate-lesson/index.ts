import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RUBRIC_VERSION } from "../_shared/lessonRubric.ts";
import { runAllChecks } from "../_shared/lessonChecks.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { structuredLessonData, gradeBand, renderedHtml } = body as Record<string, unknown>;
    if (!structuredLessonData || typeof structuredLessonData !== "object") {
      return new Response(JSON.stringify({ error: "structuredLessonData is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rendered = renderedHtml && typeof renderedHtml === "object" ? renderedHtml : null;
    if (!rendered) {
      console.warn("validate-lesson called without renderedHtml; markup checks fail closed");
    }

    const hardCheckResults = runAllChecks(
      structuredLessonData as never,
      rendered as never,
      (gradeBand as string | null) ?? null,
    );
    const passed = Object.values(hardCheckResults).every((r) => r.passed || r.skipped);

    return new Response(
      JSON.stringify({ passed, hardCheckResults, rubricVersion: RUBRIC_VERSION }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("validate-lesson error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
