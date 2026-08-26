import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { marked } from "https://esm.sh/marked@17.0.1";
import { renderLessonForValidation } from "../_shared/lessonHtmlRenderer.ts";
import { retryableFailures } from "../_shared/lessonRubric.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// Tunable without a redeploy: the right value depends on real pass rates, which
// can only be measured against production data (see lesson_validation_results).
const MAX_REGEN_ATTEMPTS = (() => {
  const raw = Number(Deno.env.get("MAX_REGEN_ATTEMPTS"));
  return Number.isInteger(raw) && raw >= 0 && raw <= 3 ? raw : 1;
})();

// Wall-clock budget so the whole request stays under Supabase's ~150s edge
// function limit. A second (regeneration) pass runs only if enough time remains;
// otherwise we return the first result with its validation flags instead of 504-ing.
const TOTAL_BUDGET_MS = 135000;    // hard ceiling for all AI work in one request
const GEN_HARD_CAP_MS = 110000;    // never let a single generation run longer than this
const MIN_REGEN_BUDGET_MS = 70000; // only regenerate if at least this much budget remains

// Public list-price estimates (USD per 1,000,000 tokens).
// Actual Lovable AI gateway billing may differ; these are used only for
// admin-facing cost comparison/reporting in ai_cost_logs.
const PRICING_PER_M_TOKENS = {
  "google/gemini-2.5-flash": { input: 0.30, output: 2.50 },
  "google/gemini-2.5-pro":   { input: 1.25, output: 10.00 },
  "claude-haiku-4.5":        { input: 1.00, output: 5.00 },
  "claude-sonnet-4.6":       { input: 3.00, output: 15.00 },
} as const;

function computeCost(model: keyof typeof PRICING_PER_M_TOKENS, inputTokens: number, outputTokens: number): number {
  const rate = PRICING_PER_M_TOKENS[model];
  if (!rate) return 0;
  return (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;
}

function decodeUserIdFromJwt(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

// Strengths-based naming system
const LEVEL_MAP: Record<string, string> = {
  'Below Grade': 'embers',
  'On Grade': 'flames',
  'Above Grade': 'blazers',
  'Advanced': 'supernovas',
};

const LEVEL_ICONS: Record<string, string> = {
  'Below Grade': '🔥',
  'On Grade': '🔥',
  'Above Grade': '💫',
  'Advanced': '🌟',
};

interface StudentGroup {
  id: string;
  groupName: string;
  numStudents: number;
  readingLevelLabel: string;
  readingLevelLexile: string;
  homeLanguage: string;
  ellStatus: string;
  iep504Status: string;
  learningPreferences: string[];
  accommodations: string[];
  notes: string;
}

const READING_LEVEL_ORDER: Record<string, number> = {
  'Below Grade': 1,
  'On Grade': 2,
  'Above Grade': 3,
  'Advanced': 4,
};

type ValidationResponse = {
  passed: boolean;
  hardCheckResults: Record<string, { passed: boolean; details?: string; skipped?: boolean }>;
  rubricVersion: string;
};

// Call the stateless validate-lesson edge function.
async function callValidate(
  structuredLessonData: unknown,
  renderedHtml: unknown,
  gradeBand: string | null,
  authHeader: string | null,
): Promise<ValidationResponse | null> {
  if (!SUPABASE_URL) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/validate-lesson`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader ?? `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ structuredLessonData, gradeBand, renderedHtml }),
    });
    if (!res.ok) {
      console.error("validate-lesson returned", res.status, await res.text());
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error("validate-lesson call failed:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonContent, selectedGroups, options, gradeBand } = await req.json();
    const authHeader = req.headers.get("Authorization");

    // Input size validation (cost-abuse prevention)
    if (typeof lessonContent !== "string" || lessonContent.length === 0) {
      return new Response(JSON.stringify({ error: "lessonContent is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (lessonContent.length > 50000) {
      return new Response(JSON.stringify({ error: "lessonContent exceeds 50,000 character limit" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(selectedGroups) || selectedGroups.length === 0 || selectedGroups.length > 10) {
      return new Response(JSON.stringify({ error: "selectedGroups must contain between 1 and 10 groups" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Differentiating lesson for ${selectedGroups.length} groups`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const sortedGroups = [...(selectedGroups as StudentGroup[])].sort((a, b) => {
      const orderA = READING_LEVEL_ORDER[a.readingLevelLabel] || 2;
      const orderB = READING_LEVEL_ORDER[b.readingLevelLabel] || 2;
      return orderA - orderB;
    });

    const systemPrompt = `You are an expert educator creating differentiated lesson content.

CRITICAL: You must respond with VALID JSON only. No markdown outside the JSON structure.

Output this exact JSON structure:
{
  "teacherGuide": "Complete teacher guide as markdown string",
  "studentHandouts": [
    {
      "groupId": "group-id-from-input",
      "groupName": "Exact group name from input",
      "level": "embers|sparks|flames|blazers|supernovas",
      "language": "English|Spanish|Arabic|Somali|etc",
      "content": "Complete student handout as markdown string",
      "englishContent": "English version of the same content (ONLY for non-English groups)"
    }
  ]
}

TEACHER GUIDE REQUIREMENTS (teacherGuide field):
- Always in English
- Include: Lesson Overview, Accommodations Summary Table, Materials Needed, Pacing Guide
- Include: Facilitation Guide with specific teacher language
- Include: Differentiation Strategies BY GROUP (detailed, actionable)
- Include: Formative Assessment Checkpoints
- Use markdown formatting

STUDENT HANDOUT REQUIREMENTS:

FOR ENGLISH GROUPS:
- content: The lesson in English
- englishContent: null or omit

FOR NON-ENGLISH GROUPS (CRITICAL - BILINGUAL OUTPUT):
- content: The FULL lesson translated into the group's home language
- englishContent: The SAME lesson content in English
- BOTH versions must have IDENTICAL STRUCTURE so they align side-by-side:
  - Same section headers (translated vs English)
  - Same number of practice problems
  - Same vocabulary terms
  - Same reflection prompts
- This enables side-by-side bilingual display

HANDOUT CONTENT STRUCTURE (both languages):
- Start with: **Name:** [BLANK] **Date:** [BLANK]
- Include: Learning Target (student-friendly)
- Include: Lesson content
- Include: Vocabulary box
- Include: Practice section, with [ANSWER LINE] after every question
- Include: Reflection section
- Use markdown formatting
- NEVER include teacher directions, scaffolding strategies, or pacing notes
- Write TO the student: "You will..." not "Teacher will..."

ACCESSIBILITY REQUIREMENTS (MANDATORY — output is validated against these before it can be exported to an LMS):

1. HEADINGS
- Use markdown headings (#, ##, ###) in order. Never skip a level: a ## may only be followed by another ## or a ###, never by a ####.
- Heading text must be plain words only. NO emoji, icons, arrows, or decorative characters anywhere in a heading, and especially never at the start of one — a screen reader announces the emoji's name before the heading text.
- Emoji are fine in ordinary body text. Keep them out of headings.

2. LINKS
- Link text must describe the destination: "Read the NASA water cycle overview", not "click here" or "read more".
- Never use "click here", "read more", "learn more", "here", or "this link" as the visible text of a link.

3. COLOR
- Never identify work by color alone. "Answer the red questions" is not usable by a student who cannot see color.
- Always pair a color with a label, number, or word: "Answer the questions marked Set A (red)", "Complete problems 1-5 (green box)".

4. ANSWER BLANKS — use these tokens, never underscores
- [BLANK] for a short inline blank (a name, a date, a single word).
- [ANSWER LINE] for a full-width line or box where a student writes a sentence or more.
- NEVER write runs of underscores such as _____ . A screen reader announces each underscore separately.
- Every question in a Practice section must be followed by [ANSWER LINE] (or [BLANK] if the answer is one word).

5. TABLES — vocabulary boxes, glossaries, and anything in columns
- A table MUST have a delimiter row directly under the header, with exactly one cell per header cell:
  | Word | Meaning |
  | --- | --- |
  | Melody | A group of sounds that moves up and down |
- The delimiter row is not optional. Without it the table is not a table: it reaches the student as a row of literal | characters, and a screen reader reads it as one long run-on sentence.
- Start every table line at the left margin. Never indent a table, and never nest one inside a bullet or numbered list.
- Put a blank line before and after the table.
- Every row must have the same number of cells as the header.

6. MATH
- If the lesson contains equations, write them as LaTeX delimited with $...$ for inline math and $$...$$ for display math.
- Never render an equation as an image, and never flatten it into ambiguous plain text.
- Lessons containing math are flagged for manual teacher review, so keep equations simple and self-explanatory.

6. IMAGES
- Only request an image when it carries meaning students need. Decorative images are not worth the accessibility cost.
- Write [VISUAL:] descriptions as descriptions of what the finished image SHOWS, not as instructions to an image generator. Write "The water cycle as a loop between a lake, a cloud, and rain falling on a hillside", not "Create a colorful diagram showing the water cycle".

LEVEL MAPPING:
- "Below Grade" → "embers"
- "On Grade" → "flames"
- "Above Grade" → "blazers"
- "Advanced" → "supernovas"

CRITICAL FOR [VISUAL:] TAGS:
- [VISUAL: description] tags must ALWAYS be written in ENGLISH, even inside translated content
- This ensures consistent image generation across all language versions
- Example in a Spanish handout: "[VISUAL: The water cycle as a loop, with arrows from a lake to a cloud to rain]" (NOT "[VISUAL: Un diagrama del ciclo del agua]")
- For translated content, add a translated caption on the line AFTER the [VISUAL:] tag to help students understand
- Example:
  [VISUAL: A plant cell with the nucleus, cell wall, and chloroplasts labeled]
  *Diagrama etiquetado de una célula vegetal*

ORDER: Always process groups from lowest to highest level (embers → supernovas).`;

    const groupDescriptions = sortedGroups.map((g: StudentGroup) => {
      const levelKey = LEVEL_MAP[g.readingLevelLabel] || 'flames';
      const icon = LEVEL_ICONS[g.readingLevelLabel] || '📖';
      let desc = `GROUP: "${g.groupName}"
- ID: ${g.id}
- Level: ${g.readingLevelLabel} (${levelKey}) ${icon}
- Students: ${g.numStudents}
- Language: ${g.homeLanguage}
- Lexile: ${g.readingLevelLexile || 'Not specified'}`;
      if (g.ellStatus !== 'None') desc += `\n- ELL Status: ${g.ellStatus}`;
      if (g.iep504Status !== 'None') desc += `\n- IEP/504: ${g.iep504Status}`;
      if (g.accommodations.length > 0) desc += `\n- Accommodations: ${g.accommodations.join(', ')}`;
      if (g.learningPreferences.length > 0) desc += `\n- Learning Preferences: ${g.learningPreferences.join(', ')}`;
      if (g.notes) desc += `\n- Notes: ${g.notes}`;
      return desc;
    }).join('\n\n');

    let optionsDesc = 'OPTIONS:\n';
    if (options.includeVocabularyScaffolding) {
      optionsDesc += '- Include vocabulary scaffolding with bilingual glossaries\n';
    }
    if (options.generateComprehensionQuestions) {
      optionsDesc += '- Generate comprehension questions for each group\n';
    }
    if (options.includeVisualPlaceholders) {
      optionsDesc += `- IMPORTANT: Include [VISUAL: description of what the image shows] tags throughout the content. ALWAYS write the description in ENGLISH even for translated handouts, and describe what the finished image shows rather than instructing a generator. Add at least 2-3 visuals per handout. For translated content, add a translated caption line after the tag. Example in a Spanish handout:\n  [VISUAL: The water cycle as a loop between a lake, a cloud, and rain falling on a hillside]\n  *El ciclo del agua*\n`;
    }
    if (options.includeGraphicOrganizers) {
      optionsDesc += `- Include graphic organizers (type: ${options.graphicOrganizerType || 'auto'})\n`;
    }

    const userPrompt = `Create a differentiated lesson with structured output.

STUDENT GROUPS (ordered lowest to highest level):
${groupDescriptions}

${optionsDesc}

ORIGINAL LESSON CONTENT:
---
${lessonContent}
---

Remember:
1. Output ONLY valid JSON matching the schema
2. teacherGuide: Full teacher reference document in English (markdown)
3. studentHandouts: Array with one object per group, each with complete student-facing content
4. Non-English groups get fully translated handouts
5. Never put teacher directions in student handouts
6. Use groupId exactly as provided in the input`;

    const hasNonEnglish = selectedGroups.some((g: StudentGroup) => g.homeLanguage !== 'English');
    const modelToUse = (selectedGroups.length > 2 || hasNonEnglish)
      ? "google/gemini-2.5-pro"
      : "google/gemini-2.5-flash";
    console.log(`Using model: ${modelToUse} for ${selectedGroups.length} groups`);

    // Run AI generation + parse + fallback. Extracted so we can re-run on regen.
    const generateOnce = async (abortMs: number): Promise<{ teacherGuide: string; studentHandouts: any[]; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), abortMs);
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            max_tokens: 20000,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("AI gateway error:", response.status, errorText);
          const err: any = new Error(`AI gateway error: ${response.status}`);
          err.status = response.status;
          throw err;
        }

        const responseText = await response.text();
        console.log('Response text length:', responseText?.length || 0);
        if (!responseText || responseText.trim() === '') {
          throw new Error("Empty response from AI gateway");
        }
        const aiResponse = JSON.parse(responseText);
        const rawContent = aiResponse.choices?.[0]?.message?.content;
        if (!rawContent) {
          console.error('AI response structure:', JSON.stringify(aiResponse).substring(0, 500));
          throw new Error("No content generated from AI");
        }
        console.log('Raw AI response length:', rawContent.length);
        const usage = {
          prompt_tokens: Number(aiResponse?.usage?.prompt_tokens) || 0,
          completion_tokens: Number(aiResponse?.usage?.completion_tokens) || 0,
          total_tokens: Number(aiResponse?.usage?.total_tokens) || 0,
        };

        let lessonData: any;
        try {
          lessonData = JSON.parse(rawContent);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          let cleanedContent = rawContent.trim();
          if (cleanedContent.startsWith('```json')) cleanedContent = cleanedContent.slice(7);
          else if (cleanedContent.startsWith('```')) cleanedContent = cleanedContent.slice(3);
          if (cleanedContent.endsWith('```')) cleanedContent = cleanedContent.slice(0, -3);
          cleanedContent = cleanedContent.trim();
          try {
            lessonData = JSON.parse(cleanedContent);
          } catch (secondError) {
            console.error('Second parse attempt failed:', secondError);
            const teacherGuideMatch = rawContent.match(/"teacherGuide"\s*:\s*"([\s\S]*?)(?:","studentHandouts"|"\s*,\s*"studentHandouts")/);
            const studentHandoutsMatch = rawContent.match(/"studentHandouts"\s*:\s*\[([\s\S]*?)\]\s*}/);
            if (teacherGuideMatch) {
              lessonData = {
                teacherGuide: teacherGuideMatch[1]
                  .replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
                studentHandouts: [],
              };
              if (studentHandoutsMatch) {
                try {
                  const handoutsStr = '[' + studentHandoutsMatch[1] + ']';
                  const fixedHandouts = handoutsStr
                    .replace(/,\s*]/g, ']').replace(/,\s*,/g, ',');
                  lessonData.studentHandouts = JSON.parse(fixedHandouts);
                } catch (handoutsError) {
                  console.error('Failed to parse studentHandouts:', handoutsError);
                }
              }
            } else {
              throw new Error('Failed to parse AI response as JSON - content may be truncated');
            }
          }
        }

        if (!lessonData.teacherGuide) {
          throw new Error('AI response missing teacher guide');
        }
        if (!Array.isArray(lessonData.studentHandouts) || lessonData.studentHandouts.length === 0) {
          console.warn('studentHandouts missing or empty, creating fallback handouts for each group');
          lessonData.studentHandouts = sortedGroups.map((g: StudentGroup) => ({
            groupId: g.id,
            groupName: g.groupName,
            level: LEVEL_MAP[g.readingLevelLabel] || 'flames',
            language: g.homeLanguage,
            content: `# ${g.groupName} Handout\n\n**Name:** [BLANK] **Date:** [BLANK]\n\n**Learning Target:** See teacher guide for objectives.\n\n---\n\n*Content generation incomplete. Please regenerate this lesson.*`,
            englishContent: g.homeLanguage !== 'English' ? `# ${g.groupName} Handout\n\n**Name:** [BLANK] **Date:** [BLANK]\n\n**Learning Target:** See teacher guide for objectives.\n\n---\n\n*Content generation incomplete. Please regenerate this lesson.*` : null,
          }));
        }
        return {
          teacherGuide: lessonData.teacherGuide,
          studentHandouts: lessonData.studentHandouts,
          usage,
        };
      } catch (error) {
        if ((error as any).name === 'AbortError') {
          const timeoutError: any = new Error("AI generation timed out");
          timeoutError.status = 504;
          throw timeoutError;
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // Generate, validate, and auto-regenerate up to MAX_REGEN_ATTEMPTS times.
    let structuredLessonData: { teacherGuide: string; studentHandouts: any[] } | null = null;
    let validation: ValidationResponse | null = null;
    let regenAttempts = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    const startedAt = Date.now();
    const remainingBudgetMs = () => TOTAL_BUDGET_MS - (Date.now() - startedAt);

    for (let attempt = 0; attempt <= MAX_REGEN_ATTEMPTS; attempt += 1) {
      // Time-budget guard: skip a regeneration we cannot finish before the
      // platform wall-clock limit; return the first result with its validation
      // flags instead of letting the whole request 504.
      if (attempt > 0 && remainingBudgetMs() < MIN_REGEN_BUDGET_MS) {
        console.warn(`Skipping regen attempt ${attempt}: only ${remainingBudgetMs()}ms budget left`);
        break;
      }
      const abortMs = Math.max(30000, Math.min(GEN_HARD_CAP_MS, remainingBudgetMs() - 8000));
      let attemptResult: { teacherGuide: string; studentHandouts: any[]; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } };
      try {
        attemptResult = await generateOnce(abortMs);
      } catch (err: any) {
        if (err?.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        if (err?.status === 402) {
          return new Response(
            JSON.stringify({ error: "API credits exhausted. Please add credits to continue." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        if (err?.status === 504) {
          return new Response(
            JSON.stringify({ error: "Lesson generation took too long. Try fewer student groups or shorter lesson content." }),
            { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        throw err;
      }
      totalPromptTokens += attemptResult.usage.prompt_tokens;
      totalCompletionTokens += attemptResult.usage.completion_tokens;
      structuredLessonData = {
        teacherGuide: attemptResult.teacherGuide,
        studentHandouts: attemptResult.studentHandouts,
      };

      console.log(
        `Generated (attempt ${attempt}): teacherGuide ${structuredLessonData.teacherGuide.length} chars, ${structuredLessonData.studentHandouts.length} handouts`,
      );

      // Validate the HTML that will actually ship, rendered through the same
      // module the exporter uses — not the markdown behind it.
      const renderedHtml = renderLessonForValidation(
        structuredLessonData,
        (md: string) => marked.parse(md) as string,
      );
      validation = await callValidate(structuredLessonData, renderedHtml, gradeBand ?? null, authHeader);
      if (!validation) {
        console.warn("validate-lesson unavailable; returning without validation");
        break;
      }
      regenAttempts = attempt;

      const failed = Object.entries(validation.hardCheckResults)
        .filter(([, r]) => !r.passed && !r.skipped)
        .map(([k]) => k);

      // Only a blocking failure is worth a second generation. Advisory checks
      // do not stop export, and a full regeneration costs a model call and
      // ~30-60s of the request budget — too much to spend on a check that was
      // never going to hold the lesson back.
      const worthRetrying = retryableFailures(validation.hardCheckResults);

      if (worthRetrying.length === 0) {
        if (failed.length > 0) {
          console.log(
            `Attempt ${attempt}: no blocking failures worth regenerating; advisory issues remain: ${failed.join(", ")}`,
          );
        } else {
          console.log(`Validation passed on attempt ${attempt}`);
        }
        break;
      }

      console.warn(
        `Validation failed on attempt ${attempt}; blocking: ${worthRetrying.join(", ")}${
          failed.length > worthRetrying.length ? ` (advisory also failing: ${failed.filter((f) => !worthRetrying.includes(f)).join(", ")})` : ""
        }`,
      );
      if (attempt === MAX_REGEN_ATTEMPTS) {
        console.warn(`Reached max regen attempts (${MAX_REGEN_ATTEMPTS}); returning residual issues`);
      }
    }

    // Log AI cost — never let logging failures affect the lesson response.
    try {
      const claudeModel: "claude-haiku-4.5" | "claude-sonnet-4.6" =
        modelToUse === "google/gemini-2.5-pro" ? "claude-sonnet-4.6" : "claude-haiku-4.5";
      const estimatedCost = computeCost(modelToUse as keyof typeof PRICING_PER_M_TOKENS, totalPromptTokens, totalCompletionTokens);
      const claudeEstimatedCost = computeCost(claudeModel, totalPromptTokens, totalCompletionTokens);
      const userId = decodeUserIdFromJwt(authHeader);

      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { error: logError } = await admin.from("ai_cost_logs").insert({
          user_id: userId,
          function_name: "differentiate-lesson",
          model: modelToUse,
          input_tokens: totalPromptTokens,
          output_tokens: totalCompletionTokens,
          estimated_cost: Number(estimatedCost.toFixed(6)),
          claude_estimated_cost: Number(claudeEstimatedCost.toFixed(6)),
          metadata: {
            regen_attempts: regenAttempts,
            num_groups: selectedGroups.length,
            had_non_english: hasNonEnglish,
            gemini_model: modelToUse,
            claude_model: claudeModel,
          },
        });
        if (logError) {
          console.error("ai_cost_logs insert error:", logError);
        }
      } else {
        console.error("ai_cost_logs skipped: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      }
    } catch (logErr) {
      console.error("ai_cost_logs unexpected error:", logErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: structuredLessonData,
        validation: validation
          ? {
              passed: validation.passed,
              hardCheckResults: validation.hardCheckResults,
              rubricVersion: validation.rubricVersion,
              regenAttempts,
            }
          : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error differentiating lesson:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});