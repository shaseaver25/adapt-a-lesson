import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RUBRIC_VERSION = "v1.0";

type CheckResult = { passed: boolean; details?: string; skipped?: boolean };

interface Handout {
  groupId?: string;
  groupName?: string;
  language?: string;
  content?: string;
  englishContent?: string | null;
  translatedContent?: string | null;
}

interface LessonData {
  teacherGuide?: string;
  studentHandouts?: Handout[];
}

const PLACEHOLDER_STRINGS = [
  "Content generation incomplete",
  "Please regenerate this lesson",
  "See teacher guide for objectives",
  "[Insert content here]",
  "TODO",
  "TBD",
];

const GRADE_RANGES: Record<string, [number, number]> = {
  "K-2": [200, 800],
  "3-5": [400, 1500],
  "6-8": [600, 2200],
  "9-12": [800, 3000],
};

// Map a specific grade (e.g. "6th", "Grade 4", "K") to a band.
function normalizeGradeBand(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;
  if (GRADE_RANGES[s]) return s;
  const upper = s.toUpperCase();
  if (["K", "KINDERGARTEN", "PRE-K", "PREK"].includes(upper)) return "K-2";
  // Extract first integer
  const m = s.match(/-?\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  if (isNaN(n)) return null;
  if (n >= 0 && n <= 2) return "K-2";
  if (n >= 3 && n <= 5) return "3-5";
  if (n >= 6 && n <= 8) return "6-8";
  if (n >= 9 && n <= 12) return "9-12";
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function allText(h: Handout): string {
  return [h.content, h.englishContent, h.translatedContent].filter(Boolean).join("\n");
}

// ---------- 1. has_all_sections ----------
function checkAllSections(data: LessonData): CheckResult {
  if (!data.teacherGuide || String(data.teacherGuide).trim() === "") {
    return { passed: false, details: "teacherGuide is missing or empty" };
  }
  if (!Array.isArray(data.studentHandouts) || data.studentHandouts.length === 0) {
    return { passed: false, details: "studentHandouts is missing or empty" };
  }
  return { passed: true };
}

// ---------- 2. has_no_placeholder ----------
function checkNoPlaceholder(data: LessonData): CheckResult {
  const found: string[] = [];
  (data.studentHandouts ?? []).forEach((h, i) => {
    const fields: Array<[string, string | null | undefined]> = [
      ["content", h.content],
      ["englishContent", h.englishContent],
      ["translatedContent", h.translatedContent],
    ];
    for (const [name, val] of fields) {
      if (!val) continue;
      for (const ph of PLACEHOLDER_STRINGS) {
        if (val.includes(ph)) {
          found.push(`'${ph}' in studentHandouts[${i}].${name}`);
        }
      }
    }
  });
  if (found.length === 0) return { passed: true };
  return { passed: false, details: `Found placeholders: ${found.join("; ")}` };
}

// ---------- 3. has_all_alt_text ----------
function checkAltText(data: LessonData): CheckResult {
  let missing = 0;
  const imgRe = /<img\b[^>]*>/gi;
  const altRe = /\balt\s*=\s*("([^"]*)"|'([^']*)')/i;
  (data.studentHandouts ?? []).forEach((h) => {
    [h.englishContent, h.translatedContent, h.content].forEach((src) => {
      if (!src) return;
      const tags = src.match(imgRe) ?? [];
      for (const tag of tags) {
        const m = tag.match(altRe);
        const altVal = m ? (m[2] ?? m[3] ?? "") : null;
        if (altVal === null || altVal.trim() === "") missing += 1;
      }
    });
  });
  if (missing === 0) return { passed: true };
  return { passed: false, details: `${missing} image(s) missing alt text` };
}

// ---------- 4. has_valid_heading_hierarchy ----------
function checkHeadingHierarchy(data: LessonData): CheckResult {
  const issues: string[] = [];
  const tagRe = /<h([1-6])\b/gi;
  (data.studentHandouts ?? []).forEach((h, i) => {
    const src = h.englishContent || h.content || "";
    if (!src) return;
    const levels: number[] = [];
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(src)) !== null) levels.push(parseInt(m[1], 10));
    const h1Count = levels.filter((l) => l === 1).length;
    if (h1Count > 1) {
      issues.push(`handout[${i}] (${h.groupName ?? "?"}): ${h1Count} <h1> tags`);
    }
    for (let k = 1; k < levels.length; k += 1) {
      if (levels[k] > levels[k - 1] + 1) {
        issues.push(
          `handout[${i}] (${h.groupName ?? "?"}): skipped from h${levels[k - 1]} to h${levels[k]}`,
        );
        break;
      }
    }
  });
  if (issues.length === 0) return { passed: true };
  return { passed: false, details: issues.join("; ") };
}

// ---------- 5. translated_content_has_lang_attribute ----------
function checkTranslatedLangAttr(data: LessonData): CheckResult {
  const offenders: string[] = [];
  let applicable = 0;
  (data.studentHandouts ?? []).forEach((h, i) => {
    const translated = h.translatedContent || (h.englishContent && h.content !== h.englishContent ? h.content : null);
    if (!translated) return;
    applicable += 1;
    if (!/\blang\s*=\s*("|')/i.test(translated)) {
      offenders.push(`handout[${i}] (${h.groupName ?? "?"}, ${h.language ?? "?"})`);
    }
  });
  if (applicable === 0) return { passed: true, skipped: true, details: "no translated content present" };
  if (offenders.length === 0) return { passed: true };
  return { passed: false, details: `Missing lang attribute in: ${offenders.join("; ")}` };
}

// ---------- 6. bilingual_section_counts_match ----------
function checkBilingualSectionCounts(data: LessonData): CheckResult {
  const issues: string[] = [];
  let applicable = 0;
  (data.studentHandouts ?? []).forEach((h, i) => {
    const translated = h.translatedContent || (h.englishContent && h.content !== h.englishContent ? h.content : null);
    const english = h.englishContent;
    if (!translated || !english) return;
    applicable += 1;
    const countTags = (src: string) =>
      (src.match(/<h2\b/gi)?.length ?? 0) + (src.match(/<h3\b/gi)?.length ?? 0);
    const eC = countTags(english);
    const tC = countTags(translated);
    if (Math.abs(eC - tC) > 1) {
      issues.push(`handout[${i}] (${h.groupName ?? "?"}): english=${eC} vs translated=${tC}`);
    }
  });
  if (applicable === 0) return { passed: true, skipped: true, details: "no bilingual handouts" };
  if (issues.length === 0) return { passed: true };
  return { passed: false, details: issues.join("; ") };
}

// ---------- 7. vocabulary_table_well_formed ----------
function checkVocabularyTable(data: LessonData): CheckResult {
  const issues: string[] = [];
  let applicable = 0;
  (data.studentHandouts ?? []).forEach((h, i) => {
    const src = h.englishContent || h.content || "";
    if (!/<table\b/i.test(src)) return;
    applicable += 1;
    // Naive parse: find first <thead>...</thead> and following <tbody>...</tbody>
    const tableRe = /<table\b[\s\S]*?<\/table>/gi;
    const tables = src.match(tableRe) ?? [];
    for (const tbl of tables) {
      const theadMatch = tbl.match(/<thead\b[\s\S]*?<\/thead>/i);
      if (!theadMatch) continue;
      const thCount = (theadMatch[0].match(/<th\b/gi) ?? []).length;
      if (thCount === 0) continue;
      const tbodyMatch = tbl.match(/<tbody\b([\s\S]*?)<\/tbody>/i);
      if (!tbodyMatch) continue;
      const rows = tbodyMatch[1].match(/<tr\b[\s\S]*?<\/tr>/gi) ?? [];
      rows.forEach((row, rIdx) => {
        const tdCount = (row.match(/<td\b/gi) ?? []).length;
        if (tdCount !== thCount) {
          issues.push(`handout[${i}] row ${rIdx}: ${tdCount} cells vs ${thCount} headers`);
        }
      });
    }
  });
  if (applicable === 0) return { passed: true, skipped: true, details: "no tables present" };
  if (issues.length === 0) return { passed: true };
  return { passed: false, details: issues.join("; ") };
}

// ---------- 8. practice_section_has_answer_mechanism ----------
function checkPracticeAnswerMechanism(data: LessonData): CheckResult {
  const issues: string[] = [];
  let applicable = 0;
  (data.studentHandouts ?? []).forEach((h, i) => {
    const src = h.englishContent || h.content || "";
    if (!src) return;
    const practiceRe = /<h[23]\b[^>]*>([^<]*?(practice|try it)[^<]*?)<\/h[23]>([\s\S]*?)(?=<h[23]\b|$)/i;
    const m = src.match(practiceRe);
    if (!m) return;
    applicable += 1;
    const section = m[3] ?? "";
    const hasMechanism =
      /<div\s+class\s*=\s*("|')[^"']*\banswer-line\b[^"']*\1/i.test(section) ||
      /<input\b/i.test(section) ||
      /<textarea\b/i.test(section) ||
      /_{5,}/.test(section) ||
      /<ol\b[\s\S]*?<li\b[^>]*>\s*<\/li>/i.test(section);
    if (!hasMechanism) {
      issues.push(`handout[${i}] (${h.groupName ?? "?"}): practice section has no answer mechanism`);
    }
  });
  if (applicable === 0) return { passed: true, skipped: true, details: "no practice section found" };
  if (issues.length === 0) return { passed: true };
  return { passed: false, details: issues.join("; ") };
}

// ---------- 9. word_count_in_grade_range ----------
function checkWordCountInRange(data: LessonData, gradeBand: string | null): CheckResult {
  const band = normalizeGradeBand(gradeBand);
  if (!band) {
    return { passed: true, skipped: true, details: "grade band not available" };
  }
  const [min, max] = GRADE_RANGES[band];
  const issues: string[] = [];
  (data.studentHandouts ?? []).forEach((h, i) => {
    const src = h.englishContent || h.content || "";
    const wc = wordCount(stripHtml(src));
    if (wc < min || wc > max) {
      issues.push(`handout[${i}] (${h.groupName ?? "?"}): ${wc} words (expected ${min}-${max} for ${band})`);
    }
  });
  if (issues.length === 0) return { passed: true };
  return { passed: false, details: issues.join("; ") };
}

function runAllChecks(data: LessonData, gradeBand: string | null) {
  return {
    has_all_sections: checkAllSections(data),
    has_no_placeholder: checkNoPlaceholder(data),
    has_all_alt_text: checkAltText(data),
    has_valid_heading_hierarchy: checkHeadingHierarchy(data),
    translated_content_has_lang_attribute: checkTranslatedLangAttr(data),
    bilingual_section_counts_match: checkBilingualSectionCounts(data),
    vocabulary_table_well_formed: checkVocabularyTable(data),
    practice_section_has_answer_mechanism: checkPracticeAnswerMechanism(data),
    word_count_in_grade_range: checkWordCountInRange(data, gradeBand),
  };
}

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
    const { structuredLessonData, gradeBand } = body as {
      structuredLessonData?: LessonData;
      gradeBand?: string | null;
    };
    if (!structuredLessonData || typeof structuredLessonData !== "object") {
      return new Response(JSON.stringify({ error: "structuredLessonData is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hardCheckResults = runAllChecks(structuredLessonData, gradeBand ?? null);
    // A check counts as failing only if it ran and returned passed=false.
    const passed = Object.values(hardCheckResults).every((r) => r.passed);

    return new Response(
      JSON.stringify({
        passed,
        hardCheckResults,
        rubricVersion: RUBRIC_VERSION,
      }),
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
