/**
 * The accessibility rubric's check implementations.
 *
 * Kept out of the edge function's HTTP entry point so the same code can be
 * exercised directly by the browser-side test suite.
 */
import { CHECK_ORDER, type CheckName, type CheckResult } from "./lessonRubric.ts";
import { UNKNOWN_LANGUAGE_CODE } from "./lessonHtmlRenderer.ts";

interface Handout {
  groupId?: string;
  groupName?: string;
  language?: string;
  content?: string;
  englishContent?: string | null;
  translatedContent?: string | null;
}

export interface LessonData {
  teacherGuide?: string;
  studentHandouts?: Handout[];
}

export interface RenderedHandout {
  groupId?: string;
  groupName?: string;
  language?: string;
  contentHtml?: string;
  englishContentHtml?: string;
  sectionHtml?: string;
}

export interface RenderedLesson {
  teacherGuideHtml?: string;
  studentHandouts?: RenderedHandout[];
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

const NO_RENDER: CheckResult = {
  passed: false,
  details: "Caller did not supply rendered HTML, so the shipped markup could not be checked",
};

function normalizeGradeBand(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;
  if (GRADE_RANGES[s]) return s;
  const upper = s.toUpperCase();
  if (["K", "KINDERGARTEN", "PRE-K", "PREK"].includes(upper)) return "K-2";
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
  return String(html ?? "")
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

/** Home-language and English columns of one handout, rendered separately. */
function columns(h: RenderedHandout): Array<{ label: string; html: string }> {
  const out: Array<{ label: string; html: string }> = [];
  if (h.contentHtml) out.push({ label: h.language || "home language", html: h.contentHtml });
  if (h.englishContentHtml) out.push({ label: "English", html: h.englishContentHtml });
  return out;
}

/** The column an English-only check should read. */
function englishColumn(h: RenderedHandout): string {
  return h.englishContentHtml || h.contentHtml || "";
}

interface Heading {
  level: number;
  text: string;
}

function extractHeadings(html: string): Heading[] {
  const out: Heading[] = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    out.push({ level: parseInt(m[1], 10), text: stripHtml(m[2]) });
  }
  return out;
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
        if (val.includes(ph)) found.push(`'${ph}' in studentHandouts[${i}].${name}`);
      }
    }
  });
  if (found.length === 0) return { passed: true };
  return { passed: false, details: `Found placeholders: ${found.join("; ")}` };
}

// ---------- 3. has_all_alt_text ----------
function checkAltText(rendered: RenderedLesson | null): CheckResult {
  if (!rendered) return NO_RENDER;
  const issues: string[] = [];
  let images = 0;
  const imgRe = /<img\b[^>]*>/gi;
  const altRe = /\balt\s*=\s*("([^"]*)"|'([^']*)')/i;
  (rendered.studentHandouts ?? []).forEach((h, i) => {
    columns(h).forEach(({ label, html }) => {
      for (const tag of html.match(imgRe) ?? []) {
        images += 1;
        const m = tag.match(altRe);
        const altVal = m ? (m[2] ?? m[3] ?? "") : null;
        if (altVal === null || altVal.trim() === "") {
          issues.push(`handout[${i}] (${h.groupName ?? "?"}, ${label})`);
        }
      }
    });
  });
  if (images === 0) return { passed: true, skipped: true, details: "no images in rendered output" };
  if (issues.length === 0) return { passed: true };
  return { passed: false, details: `${issues.length} image(s) missing alt text in: ${issues.join("; ")}` };
}

// ---------- 4. alt_text_reviewed ----------
function checkAltTextReviewed(rendered: RenderedLesson | null): CheckResult {
  if (!rendered) return NO_RENDER;
  const offenders: string[] = [];
  let images = 0;
  (rendered.studentHandouts ?? []).forEach((h, i) => {
    columns(h).forEach(({ html }) => {
      images += (html.match(/<img\b/gi) ?? []).length;
      const flags = (html.match(/data-review="alt-text"/g) ?? []).length;
      if (flags > 0) {
        offenders.push(`handout[${i}] (${h.groupName ?? "?"}): ${flags} image(s)`);
      }
    });
  });
  if (images === 0) return { passed: true, skipped: true, details: "no images in rendered output" };
  if (offenders.length === 0) return { passed: true };
  return {
    passed: false,
    details:
      `Alt text fell back to the image-generation prompt and needs teacher review: ${offenders.join("; ")}`,
  };
}

// ---------- 5. has_valid_heading_hierarchy ----------
function checkHeadingHierarchy(rendered: RenderedLesson | null): CheckResult {
  if (!rendered) return NO_RENDER;
  const issues: string[] = [];
  (rendered.studentHandouts ?? []).forEach((h, i) => {
    columns(h).forEach(({ label, html }) => {
      const levels = extractHeadings(html).map((x) => x.level);
      for (let k = 1; k < levels.length; k += 1) {
        if (levels[k] > levels[k - 1] + 1) {
          issues.push(
            `handout[${i}] (${h.groupName ?? "?"}, ${label}): skipped from h${levels[k - 1]} to h${levels[k]}`,
          );
          break;
        }
      }
    });
  });
  if (issues.length === 0) return { passed: true };
  return { passed: false, details: issues.join("; ") };
}

// ---------- 6. heading_text_has_no_leading_emoji ----------
const LEADING_EMOJI_RE = /^(?:\s|\u200d|\ufe0f|\u20e3)*(?:\p{Extended_Pictographic}|[\u2190-\u21ff\u2300-\u27bf\u2b00-\u2bff])/u;

function checkHeadingEmoji(rendered: RenderedLesson | null): CheckResult {
  if (!rendered) return NO_RENDER;
  const issues: string[] = [];
  const scan = (label: string, html: string) => {
    for (const heading of extractHeadings(html)) {
      if (heading.text && LEADING_EMOJI_RE.test(heading.text)) {
        issues.push(`${label}: "${heading.text.slice(0, 60)}"`);
      }
    }
  };
  scan("teacher guide", rendered.teacherGuideHtml ?? "");
  (rendered.studentHandouts ?? []).forEach((h, i) => {
    columns(h).forEach(({ label, html }) => scan(`handout[${i}] (${h.groupName ?? "?"}, ${label})`, html));
  });
  if (issues.length === 0) return { passed: true };
  return {
    passed: false,
    details: `Heading text starts with an emoji, which screen readers announce before the heading: ${
      issues.join("; ")
    }`,
  };
}

// ---------- 7. translated_content_has_lang_attribute ----------
function checkTranslatedLangAttr(rendered: RenderedLesson | null): CheckResult {
  if (!rendered) return NO_RENDER;
  const offenders: string[] = [];
  let applicable = 0;
  (rendered.studentHandouts ?? []).forEach((h, i) => {
    const language = h.language || "English";
    if (language === "English") return;
    applicable += 1;
    const section = h.sectionHtml ?? "";
    const codes = Array.from(section.matchAll(/\blang\s*=\s*"([^"]*)"/gi)).map((m) => m[1]);
    const nonEnglish = codes.filter((c) => c && c !== "en");
    if (nonEnglish.length === 0) {
      offenders.push(`handout[${i}] (${h.groupName ?? "?"}, ${language}): no non-English lang attribute`);
    } else if (nonEnglish.every((c) => c === UNKNOWN_LANGUAGE_CODE)) {
      offenders.push(
        `handout[${i}] (${h.groupName ?? "?"}, ${language}): language has no ISO 639-1 code, emitted lang="${UNKNOWN_LANGUAGE_CODE}"`,
      );
    }
  });
  if (applicable === 0) return { passed: true, skipped: true, details: "no translated content present" };
  if (offenders.length === 0) return { passed: true };
  return { passed: false, details: offenders.join("; ") };
}

// ---------- 8. bilingual_section_counts_match ----------
function checkBilingualSectionCounts(rendered: RenderedLesson | null): CheckResult {
  if (!rendered) return NO_RENDER;
  const issues: string[] = [];
  let applicable = 0;
  (rendered.studentHandouts ?? []).forEach((h, i) => {
    if (!h.contentHtml || !h.englishContentHtml) return;
    applicable += 1;
    const count = (html: string) => extractHeadings(html).filter((x) => x.level === 2 || x.level === 3).length;
    const tC = count(h.contentHtml);
    const eC = count(h.englishContentHtml);
    if (Math.abs(eC - tC) > 1) {
      issues.push(`handout[${i}] (${h.groupName ?? "?"}): english=${eC} vs translated=${tC}`);
    }
  });
  if (applicable === 0) return { passed: true, skipped: true, details: "no bilingual handouts" };
  if (issues.length === 0) return { passed: true };
  return { passed: false, details: issues.join("; ") };
}

// ---------- 9. vocabulary_table_well_formed ----------
function checkVocabularyTable(rendered: RenderedLesson | null, data: LessonData): CheckResult {
  if (!rendered) return NO_RENDER;
  const issues: string[] = [];
  let applicable = 0;

  // A table that fails to parse does not disappear — it reaches the reader as a
  // run of literal pipe characters, unnavigable by a screen reader (SC 1.3.1).
  // Counting only rendered <table> elements would report "no tables present"
  // and pass, which is precisely backwards, so compare the source against the
  // output first.
  (data.studentHandouts ?? []).forEach((h, i) => {
    const renderedHandout = (rendered.studentHandouts ?? [])[i];
    // Pair each source column with the HTML it actually produced. Keyed by
    // position, not by language name — an English-only handout keeps its
    // markdown in `content`, so matching on the label would read the wrong
    // (empty) field and report a false failure.
    const pairs: Array<[string, string | null | undefined, string]> = [
      [h.language || "home language", h.content, renderedHandout?.contentHtml ?? ""],
      ["English", h.englishContent, renderedHandout?.englishContentHtml ?? ""],
    ];
    pairs.forEach(([label, markdown, html]) => {
      if (!markdown) return;
      // Two or more consecutive pipe-delimited lines is a table someone meant.
      const looksTabular = /^[^\n]*\|[^\n]*\|[^\n]*\n[^\n]*\|[^\n]*\|/m.test(markdown);
      if (!looksTabular) return;
      if (!/<table\b/i.test(html)) {
        issues.push(
          `handout[${i}] (${h.groupName ?? "?"}, ${label}): source has table rows but none rendered as a <table> — it will show as literal pipe characters`,
        );
        applicable += 1;
      }
    });
  });
  (rendered.studentHandouts ?? []).forEach((h, i) => {
    columns(h).forEach(({ label, html }) => {
      const tables = html.match(/<table\b[\s\S]*?<\/table>/gi) ?? [];
      for (const tbl of tables) {
        applicable += 1;
        const theadMatch = tbl.match(/<thead\b[\s\S]*?<\/thead>/i);
        if (!theadMatch) {
          issues.push(`handout[${i}] (${h.groupName ?? "?"}, ${label}): table has no header row`);
          continue;
        }
        const thCount = (theadMatch[0].match(/<th\b/gi) ?? []).length;
        if (thCount === 0) {
          issues.push(`handout[${i}] (${h.groupName ?? "?"}, ${label}): table header has no <th> cells`);
          continue;
        }
        const tbodyMatch = tbl.match(/<tbody\b([\s\S]*?)<\/tbody>/i);
        if (!tbodyMatch) continue;
        const rows = tbodyMatch[1].match(/<tr\b[\s\S]*?<\/tr>/gi) ?? [];
        rows.forEach((row, rIdx) => {
          const cellCount = (row.match(/<t[dh]\b/gi) ?? []).length;
          if (cellCount !== thCount) {
            issues.push(
              `handout[${i}] (${h.groupName ?? "?"}, ${label}) row ${rIdx}: ${cellCount} cells vs ${thCount} headers`,
            );
          }
        });
      }
    });
  });
  if (applicable === 0) return { passed: true, skipped: true, details: "no tables present" };
  if (issues.length === 0) return { passed: true };
  return { passed: false, details: issues.join("; ") };
}

// ---------- 10. practice_section_has_answer_mechanism ----------
function checkPracticeAnswerMechanism(rendered: RenderedLesson | null): CheckResult {
  if (!rendered) return NO_RENDER;
  const issues: string[] = [];
  let applicable = 0;
  (rendered.studentHandouts ?? []).forEach((h, i) => {
    const src = englishColumn(h);
    if (!src) return;
    const practiceRe =
      /<h[23]\b[^>]*>([^<]*?(practice|try it)[^<]*?)<\/h[23]>([\s\S]*?)(?=<h[23]\b|$)/i;
    const m = src.match(practiceRe);
    if (!m) return;
    applicable += 1;
    const section = m[3] ?? "";
    const hasMechanism =
      /class\s*=\s*("|')[^"']*\banswer-line\b[^"']*\1/i.test(section) ||
      /class\s*=\s*("|')[^"']*\banswer-blank\b[^"']*\1/i.test(section) ||
      /<input\b/i.test(section) ||
      /<textarea\b/i.test(section) ||
      /<ol\b[\s\S]*?<li\b[^>]*>\s*<\/li>/i.test(section);
    if (!hasMechanism) {
      issues.push(`handout[${i}] (${h.groupName ?? "?"}): practice section has no answer mechanism`);
    }
  });
  if (applicable === 0) return { passed: true, skipped: true, details: "no practice section found" };
  if (issues.length === 0) return { passed: true };
  return { passed: false, details: issues.join("; ") };
}

// ---------- 11. answer_blanks_use_semantic_markup ----------
function checkAnswerBlankMarkup(data: LessonData): CheckResult {
  const offenders: string[] = [];
  (data.studentHandouts ?? []).forEach((h, i) => {
    const fields: Array<[string, string | null | undefined]> = [
      ["content", h.content],
      ["englishContent", h.englishContent],
    ];
    for (const [name, val] of fields) {
      if (!val) continue;
      const runs = (val.match(/_{5,}/g) ?? []).length;
      if (runs > 0) offenders.push(`handout[${i}].${name}: ${runs} underscore run(s)`);
    }
  });
  if (offenders.length === 0) return { passed: true };
  return {
    passed: false,
    details:
      `Source uses bare underscore blanks instead of [ANSWER LINE]/[BLANK]; the export rewrites them, but regenerating produces cleaner source: ${
        offenders.join("; ")
      }`,
  };
}

// ---------- 12. link_text_is_descriptive ----------
const VAGUE_LINK_TEXT = new Set([
  "click here",
  "click",
  "here",
  "read more",
  "more",
  "learn more",
  "link",
  "this link",
  "this",
  "see more",
  "go",
]);

function checkLinkText(rendered: RenderedLesson | null): CheckResult {
  if (!rendered) return NO_RENDER;
  const offenders: string[] = [];
  const scan = (label: string, html: string) => {
    const re = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const text = stripHtml(m[1]).toLowerCase().replace(/[.!?:;,]+$/g, "").trim();
      if (text && VAGUE_LINK_TEXT.has(text)) offenders.push(`${label}: "${text}"`);
    }
  };
  scan("teacher guide", rendered.teacherGuideHtml ?? "");
  (rendered.studentHandouts ?? []).forEach((h, i) => {
    columns(h).forEach(({ label, html }) => scan(`handout[${i}] (${h.groupName ?? "?"}, ${label})`, html));
  });
  if (offenders.length === 0) return { passed: true };
  return { passed: false, details: `Link text does not describe its destination: ${offenders.join("; ")}` };
}

// ---------- 13. no_color_only_instructions ----------
const COLOR_ONLY_RE =
  /\b(?:answer|complete|do|solve|circle|underline|highlight|match|read|choose|pick|find|skip)\b[^.!?]{0,40}\bthe\s+(red|orange|yellow|green|blue|purple|pink)\s+(questions|problems|items|boxes|words|sections|parts|rows|columns|cards|circles|squares|ones)\b/i;

function checkColorOnlyInstructions(data: LessonData): CheckResult {
  const offenders: string[] = [];
  (data.studentHandouts ?? []).forEach((h, i) => {
    for (const val of [h.content, h.englishContent]) {
      if (!val) continue;
      const m = val.match(COLOR_ONLY_RE);
      if (m) offenders.push(`handout[${i}] (${h.groupName ?? "?"}): "${m[0].trim()}"`);
    }
  });
  if (offenders.length === 0) return { passed: true };
  return {
    passed: false,
    details: `Instruction identifies work by color alone (SC 1.4.1): ${offenders.join("; ")}`,
  };
}

// ---------- 14. math_requires_manual_review ----------
const MATH_PATTERNS: Array<[string, RegExp]> = [
  ["LaTeX delimiters", /(?:\$\$[\s\S]+?\$\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\])/],
  ["LaTeX macros", /\\(?:frac|sqrt|sum|int|times|div|leq|geq|neq|alpha|beta|theta|pi)\b/],
  ["MathML", /<math\b/i],
  ["inline equations", /\d\s*[+\-×÷^]\s*\d[^=]{0,20}=/],
];

function checkMathNeedsReview(data: LessonData): CheckResult {
  const found = new Set<string>();
  const all = [
    data.teacherGuide,
    ...(data.studentHandouts ?? []).flatMap((h) => [h.content, h.englishContent]),
  ]
    .filter(Boolean)
    .join("\n");
  for (const [label, re] of MATH_PATTERNS) {
    if (re.test(all)) found.add(label);
  }
  if (found.size === 0) {
    return { passed: true, skipped: true, details: "no equations detected" };
  }
  return {
    passed: false,
    details:
      `Equations detected (${
        Array.from(found).join(", ")
      }). MathML conversion is not implemented, so a teacher must confirm the equations read correctly before assigning.`,
  };
}

// ---------- 15. word_count_in_grade_range ----------
function checkWordCountInRange(
  rendered: RenderedLesson | null,
  data: LessonData,
  gradeBand: string | null,
): CheckResult {
  const band = normalizeGradeBand(gradeBand);
  if (!band) return { passed: true, skipped: true, details: "grade band not available" };
  const [min, max] = GRADE_RANGES[band];
  const issues: string[] = [];
  const handouts = rendered?.studentHandouts ?? [];
  const source = handouts.length > 0
    ? handouts.map((h, i) => ({
      name: h.groupName ?? data.studentHandouts?.[i]?.groupName ?? "?",
      text: stripHtml(englishColumn(h)),
    }))
    : (data.studentHandouts ?? []).map((h) => ({
      name: h.groupName ?? "?",
      text: stripHtml(h.englishContent || h.content || ""),
    }));
  source.forEach((h, i) => {
    const wc = wordCount(h.text);
    if (wc < min || wc > max) {
      issues.push(`handout[${i}] (${h.name}): ${wc} words (expected ${min}-${max} for ${band})`);
    }
  });
  if (issues.length === 0) return { passed: true };
  return { passed: false, details: issues.join("; ") };
}

export function runAllChecks(
  data: LessonData,
  rendered: RenderedLesson | null,
  gradeBand: string | null,
): Record<CheckName, CheckResult> {
  const results: Record<CheckName, CheckResult> = {
    has_all_sections: checkAllSections(data),
    has_no_placeholder: checkNoPlaceholder(data),
    has_all_alt_text: checkAltText(rendered),
    alt_text_reviewed: checkAltTextReviewed(rendered),
    has_valid_heading_hierarchy: checkHeadingHierarchy(rendered),
    heading_text_has_no_leading_emoji: checkHeadingEmoji(rendered),
    translated_content_has_lang_attribute: checkTranslatedLangAttr(rendered),
    bilingual_section_counts_match: checkBilingualSectionCounts(rendered),
    vocabulary_table_well_formed: checkVocabularyTable(rendered, data),
    practice_section_has_answer_mechanism: checkPracticeAnswerMechanism(rendered),
    answer_blanks_use_semantic_markup: checkAnswerBlankMarkup(data),
    link_text_is_descriptive: checkLinkText(rendered),
    no_color_only_instructions: checkColorOnlyInstructions(data),
    math_requires_manual_review: checkMathNeedsReview(data),
    word_count_in_grade_range: checkWordCountInRange(rendered, data, gradeBand),
  };
  // Keep wire order stable for the conformance record.
  const ordered = {} as Record<CheckName, CheckResult>;
  for (const name of CHECK_ORDER) ordered[name] = results[name];
  return ordered;
}

