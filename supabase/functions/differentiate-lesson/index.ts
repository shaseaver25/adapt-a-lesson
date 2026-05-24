import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const MAX_REGEN_ATTEMPTS = 2;

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
      body: JSON.stringify({ structuredLessonData, gradeBand }),
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
- Start with: **Name:** _____ **Date:** _____
- Include: 🎯 Learning Target (student-friendly)
- Include: Lesson content
- Include: Vocabulary box
- Include: Practice section with answer lines
- Include: Reflection section
- Use markdown formatting
- NEVER include teacher directions, scaffolding strategies, or pacing notes
- Write TO the student: "You will..." not "Teacher will..."

LEVEL MAPPING:
- "Below Grade" → "embers"
- "On Grade" → "flames"
- "Above Grade" → "blazers"
- "Advanced" → "supernovas"

CRITICAL FOR [VISUAL:] TAGS:
- [VISUAL: description] tags must ALWAYS be written in ENGLISH, even inside translated content
- This ensures consistent image generation across all language versions
- Example in a Spanish handout: "[VISUAL: A diagram showing the water cycle with arrows]" (NOT "[VISUAL: Un diagrama del ciclo del agua]")
- For translated content, add a translated caption on the line AFTER the [VISUAL:] tag to help students understand
- Example:
  [VISUAL: A labeled diagram of a plant cell]
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
      optionsDesc += `- IMPORTANT: Include [VISUAL: detailed English description] tags throughout the content. ALWAYS write the description in ENGLISH even for translated handouts. Add at least 2-3 visuals per handout. For translated content, add a translated caption line after the tag. Example in Spanish handout:\n  [VISUAL: A diagram showing the water cycle]\n  *Un diagrama del ciclo del agua*\n`;
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
    const generateOnce = async (): Promise<{ teacherGuide: string; studentHandouts: any[] }> => {
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
          max_tokens: 65000,
        }),
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
          content: `# ${g.groupName} Handout\n\n**Name:** _____ **Date:** _____\n\n🎯 **Learning Target:** See teacher guide for objectives.\n\n---\n\n*Content generation incomplete. Please regenerate this lesson.*`,
          englishContent: g.homeLanguage !== 'English' ? `# ${g.groupName} Handout\n\n**Name:** _____ **Date:** _____\n\n🎯 **Learning Target:** See teacher guide for objectives.\n\n---\n\n*Content generation incomplete. Please regenerate this lesson.*` : null,
        }));
      }
      return {
        teacherGuide: lessonData.teacherGuide,
        studentHandouts: lessonData.studentHandouts,
      };
    };

    // Generate, validate, and auto-regenerate up to MAX_REGEN_ATTEMPTS times.
    let structuredLessonData: { teacherGuide: string; studentHandouts: any[] } | null = null;
    let validation: ValidationResponse | null = null;
    let regenAttempts = 0;

    for (let attempt = 0; attempt <= MAX_REGEN_ATTEMPTS; attempt += 1) {
      try {
        structuredLessonData = await generateOnce();
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
        throw err;
      }

      console.log(
        `Generated (attempt ${attempt}): teacherGuide ${structuredLessonData.teacherGuide.length} chars, ${structuredLessonData.studentHandouts.length} handouts`,
      );

      validation = await callValidate(structuredLessonData, gradeBand ?? null, authHeader);
      if (!validation) {
        console.warn("validate-lesson unavailable; returning without validation");
        break;
      }
      regenAttempts = attempt;
      if (validation.passed) {
        console.log(`Validation passed on attempt ${attempt}`);
        break;
      }
      const failed = Object.entries(validation.hardCheckResults)
        .filter(([, r]) => !r.passed)
        .map(([k]) => k);
      console.warn(`Validation failed on attempt ${attempt}, failed checks: ${failed.join(", ")}`);
      if (attempt === MAX_REGEN_ATTEMPTS) {
        console.warn(`Reached max regen attempts (${MAX_REGEN_ATTEMPTS}); returning residual issues`);
      }
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