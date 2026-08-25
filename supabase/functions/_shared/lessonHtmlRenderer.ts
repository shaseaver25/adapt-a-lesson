/**
 * Single source of truth for turning lesson markdown into the HTML that is
 * actually shipped to an LMS.
 *
 * Deliberately dependency-free: the browser bundle imports it by relative
 * path and injects npm `marked`; Deno edge functions import it with the `.ts`
 * extension and inject `marked` from esm.sh. Validation and export therefore
 * can never see different markup.
 */

export const LANGUAGE_TO_ISO_639_1: Record<string, string> = {
  'English': 'en',
  'Spanish': 'es',
  'Vietnamese': 'vi',
  'Somali': 'so',
  'Arabic': 'ar',
  'Hmong': 'hmn',
  'Mandarin': 'zh',
  'Chinese': 'zh',
  'Karen': 'kar',
  'Oromo': 'om',
  'Amharic': 'am',
  'French': 'fr',
  'Portuguese': 'pt',
  'Russian': 'ru',
  'Korean': 'ko',
  'Japanese': 'ja',
  'Hindi': 'hi',
  'Urdu': 'ur',
  'Farsi': 'fa',
  'Hebrew': 'he',
  'Swahili': 'sw',
  'Haitian Creole': 'ht',
};

export const UNKNOWN_LANGUAGE_CODE = 'und';

export function getISOCode(languageName: string): string {
  if (!languageName) return UNKNOWN_LANGUAGE_CODE;
  if (LANGUAGE_TO_ISO_639_1[languageName]) {
    return LANGUAGE_TO_ISO_639_1[languageName];
  }
  const lower = languageName.toLowerCase();
  for (const [name, code] of Object.entries(LANGUAGE_TO_ISO_639_1)) {
    if (lower.includes(name.toLowerCase())) return code;
  }
  return UNKNOWN_LANGUAGE_CODE;
}

const RTL_LANG_CODES = new Set(['ar', 'he', 'fa', 'ur']);

export function isRTLLanguage(isoCode: string): boolean {
  return RTL_LANG_CODES.has(isoCode);
}

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Host LMS stylesheets do not define `.sr-only`, so visually-hidden text has to
 * carry its own inline style or it renders as visible clutter on a Canvas page.
 */
export const SR_ONLY_STYLE =
  'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';

const ANSWER_LINE_STYLE = 'border-bottom:2px solid #9ca3af;height:2.5rem;margin:0.75rem 0;';
const ANSWER_BLANK_STYLE =
  'display:inline-block;min-width:8rem;border-bottom:2px solid #9ca3af;margin:0 0.25rem;';

export type MarkdownParser = (markdown: string) => string;

export interface VisualAssets {
  /** [VISUAL: description] -> image URL */
  imageMap?: Map<string, string>;
  /** [VISUAL: description] -> WCAG alt text describing the rendered image */
  altTextMap?: Map<string, string>;
  /** [VISUAL: description] -> visible long description for data-bearing images */
  longDescriptionMap?: Map<string, string>;
}

const GENERATION_VERB_PREFIX =
  /^\s*(?:please\s+)?(?:create|generate|draw|make|render|produce|design|show)\s+(?:me\s+)?(?:an?\s+|the\s+)?/i;

const ARTEFACT_PREFIX =
  /^\s*(?:an?\s+|the\s+)?(?:simple|clean|colorful|colourful|detailed|labeled|labelled|annotated|minimal|clear|educational|vector[-\s]style|flat)?\s*(?:diagram|illustration|image|picture|photo|photograph|graphic|infographic|chart|drawing|visual|figure|sketch)\s+(?:showing|that\s+shows|of|depicting|illustrating|with|representing)\s+/i;

const STYLE_SUFFIX =
  /[,;]\s*(?:in\s+a\s+)?(?:high[-\s]contrast|flat\s+design|vector\s+style|cartoon\s+style|minimal\s+style|suitable\s+for\s+print(?:ing)?|for\s+K-?12\s+(?:classroom\s+)?use)[^.]*\.?\s*$/i;

const COMPLEX_VISUAL_RE =
  /\b(diagram|chart|graph|flowchart|timeline|map|cycle|process|infographic|plot|table|schematic|cross[-\s]section)\b/i;

/**
 * Turn an image-generation prompt into something closer to a factual
 * description of the image. This is the fallback for when no vision-generated
 * alt text is available; it is never as good as the real thing, which is why
 * `altTextIsGenerationPrompt` exists to flag it for teacher review.
 */
export function sanitizeAltText(description: string): string {
  let out = String(description ?? '').trim();
  if (!out) return '';
  out = out.replace(GENERATION_VERB_PREFIX, '');
  for (let i = 0; i < 3; i += 1) {
    const next = out.replace(ARTEFACT_PREFIX, '');
    if (next === out) break;
    out = next;
  }
  out = out.replace(STYLE_SUFFIX, '');
  out = out.replace(/\s+/g, ' ').trim();
  out = out.replace(/[.,;:]+$/, '');
  if (!out) return String(description ?? '').trim();
  out = out.charAt(0).toUpperCase() + out.slice(1);
  if (out.length > 160) out = `${out.slice(0, 157).trimEnd()}...`;
  return out;
}

export function isComplexVisual(description: string): boolean {
  return COMPLEX_VISUAL_RE.test(String(description ?? ''));
}

function srOnly(text: string): string {
  return `<span class="sr-only" style="${SR_ONLY_STYLE}">${escapeHtml(text)}</span>`;
}

function lookup(map: Map<string, string> | undefined, description: string): string | undefined {
  if (!map) return undefined;
  const trimmed = description.trim();
  if (map.has(trimmed)) return map.get(trimmed);
  const lower = trimmed.toLowerCase();
  for (const [key, value] of map.entries()) {
    if (key.toLowerCase() === lower) return value;
  }
  return undefined;
}

/**
 * Resolve the alt text an image will actually ship with, plus whether that alt
 * is still the raw generation prompt (SC 1.1.1 risk).
 */
export function resolveAltText(
  description: string,
  assets?: VisualAssets,
): { alt: string; fromVisionModel: boolean } {
  const generated = lookup(assets?.altTextMap, description);
  if (generated && generated.trim()) {
    return { alt: generated.trim(), fromVisionModel: true };
  }
  return { alt: sanitizeAltText(description), fromVisionModel: false };
}

/**
 * Apply the lesson-specific token replacements, then run the injected markdown
 * parser. Every export path and the validator go through this function.
 */
export function processLessonMarkdown(
  markdown: string,
  parseMarkdown: MarkdownParser,
  assets?: VisualAssets,
): string {
  let processed = String(markdown ?? '');

  const replaceVisual = (_match: string, rawDescription: string): string => {
    const description = rawDescription.trim();
    const imageUrl = lookup(assets?.imageMap, description);
    const { alt, fromVisionModel } = resolveAltText(description, assets);
    const longDescription = lookup(assets?.longDescriptionMap, description);

    if (!imageUrl) {
      return `<div class="visual-placeholder">
        <span class="visual-icon" aria-hidden="true">📐</span>
        <span class="visual-label">${escapeHtml(description)}</span>
        <span class="teacher-note">Teacher: Insert diagram or use whiteboard</span>
      </div>`;
    }

    const caption = longDescription && longDescription.trim()
      ? longDescription.trim()
      : alt;
    const review = fromVisionModel
      ? ''
      : `<span class="alt-text-review-flag" data-review="alt-text">${
        srOnly('Alt text for this image has not been reviewed by a teacher.')
      }</span>`;

    return `<figure class="lesson-figure">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(alt)}" class="lesson-image" loading="lazy" />
        <figcaption>${escapeHtml(caption)}</figcaption>${review}
      </figure>`;
  };

  processed = processed.replace(/\[VISUAL:\s*(.+?)\]/g, replaceVisual);
  processed = processed.replace(/\[NANOBANANA:\s*"(.+?)"\]/g, replaceVisual);

  processed = processed.replace(
    /\[ANSWER (?:LINE|BOX)\]/gi,
    () =>
      `<div class="answer-line" style="${ANSWER_LINE_STYLE}">${
        srOnly('Space for your written answer')
      }</div>`,
  );
  processed = processed.replace(
    /\[BLANK\]/gi,
    () =>
      `<span class="answer-blank" style="${ANSWER_BLANK_STYLE}">${srOnly('blank to fill in')}</span>`,
  );

  // Legacy fallback: models that still emit underscore runs must not ship a row
  // of underscores, which a screen reader announces one character at a time.
  processed = processed.replace(
    /_{5,}/g,
    () =>
      `<span class="answer-blank" style="${ANSWER_BLANK_STYLE}">${srOnly('blank to fill in')}</span>`,
  );

  return parseMarkdown(processed);
}

export interface LessonSectionInput {
  heading: string;
  content: string;
  englishContent?: string | null;
  homeLanguage: string;
  parseMarkdown: MarkdownParser;
  assets?: VisualAssets;
}

/**
 * Inner-body HTML fragment for one lesson section: heading plus either a
 * bilingual <table> (SC 1.3.1) with per-cell `lang`/`dir` (SC 3.1.2), or a
 * single-column <div> carrying the same language markup.
 */
export function buildLessonSectionHTML(input: LessonSectionInput): string {
  const { heading, content, englishContent, homeLanguage, parseMarkdown, assets } = input;
  const isBilingual =
    homeLanguage !== 'English' && !!englishContent && englishContent.trim().length > 0;

  const translatedLangCode = getISOCode(homeLanguage);
  const isRTL = isRTLLanguage(translatedLangCode);
  const dirAttr = isRTL ? 'rtl' : 'ltr';

  const translatedHTML = processLessonMarkdown(content, parseMarkdown, assets);
  const englishHTML = isBilingual && englishContent
    ? processLessonMarkdown(englishContent, parseMarkdown, assets)
    : '';

  const captionId = `bilingual-desc-${escapeHtml(translatedLangCode)}`;
  const body = isBilingual
    ? `
      <table class="bilingual-container" aria-describedby="${captionId}">
        <caption id="${captionId}" class="sr-only" style="${SR_ONLY_STYLE}">
          Side-by-side bilingual handout. Left column: ${
      escapeHtml(homeLanguage)
    }. Right column: English. The two columns present the same lesson content in parallel.
        </caption>
        <thead>
          <tr>
            <th scope="col" lang="${translatedLangCode}" dir="${dirAttr}" class="bilingual-header translated">
              <span class="column-flag" aria-hidden="true">🌍</span>
              ${escapeHtml(homeLanguage)}
            </th>
            <th scope="col" lang="en" dir="ltr" class="bilingual-header english">
              <span class="column-flag" aria-hidden="true">🇺🇸</span>
              English
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td lang="${translatedLangCode}" dir="${dirAttr}" class="bilingual-cell translated">
              <div class="column-content">${translatedHTML}</div>
            </td>
            <td lang="en" dir="ltr" class="bilingual-cell english">
              <div class="column-content">${englishHTML}</div>
            </td>
          </tr>
        </tbody>
      </table>
    `
    : `<div class="single-column-content" lang="${translatedLangCode}" dir="${dirAttr}">${translatedHTML}</div>`;

  return `<section class="lesson-section"><h2>${escapeHtml(heading)}</h2>${body}</section>`;
}

export interface RenderedHandout {
  groupId?: string;
  groupName?: string;
  language?: string;
  /** Home-language column, rendered on its own. */
  contentHtml: string;
  /** English column, rendered on its own. Empty for monolingual handouts. */
  englishContentHtml: string;
  /** The full section fragment, including the language markup wrapper. */
  sectionHtml: string;
}

export interface RenderedLesson {
  teacherGuideHtml: string;
  studentHandouts: RenderedHandout[];
}

interface LessonHandoutLike {
  groupId?: string;
  groupName?: string;
  language?: string;
  content?: string;
  englishContent?: string | null;
}

interface LessonDataLike {
  teacherGuide?: string;
  studentHandouts?: LessonHandoutLike[];
}

/**
 * Render a whole lesson exactly as the export path would, so the validator
 * inspects the markup that ships rather than the markdown behind it.
 */
export function renderLessonForValidation(
  lesson: LessonDataLike,
  parseMarkdown: MarkdownParser,
  assets?: VisualAssets,
): RenderedLesson {
  return {
    teacherGuideHtml: processLessonMarkdown(lesson.teacherGuide ?? '', parseMarkdown, assets),
    studentHandouts: (lesson.studentHandouts ?? []).map((h) => {
      const homeLanguage = h.language || 'English';
      return {
        groupId: h.groupId,
        groupName: h.groupName,
        language: homeLanguage,
        contentHtml: processLessonMarkdown(h.content ?? '', parseMarkdown, assets),
        englishContentHtml: h.englishContent
          ? processLessonMarkdown(h.englishContent, parseMarkdown, assets)
          : '',
        sectionHtml: buildLessonSectionHTML({
          heading: h.groupName ?? 'Student Handout',
          content: h.content ?? '',
          englishContent: h.englishContent ?? undefined,
          homeLanguage,
          parseMarkdown,
          assets,
        }),
      };
    }),
  };
}

export interface ConformanceCheck {
  name: string;
  label: string;
  passed: boolean;
  skipped?: boolean;
  blocking: boolean;
  details?: string;
}

export interface ConformanceRecord {
  rubricVersion: string;
  generatedAt: string;
  checks: ConformanceCheck[];
  /**
   * Present when a teacher exported this page despite a blocking failure. The
   * record must say so: a district reading it needs to know the page ships with
   * a known defect, not infer it from a "Failed" row.
   */
  override?: {
    reason: string;
    overriddenChecks: { name: string; label: string; details?: string }[];
    overriddenAt: string;
  };
}

function conformanceResultText(check: ConformanceCheck): string {
  if (check.skipped) return 'Not applicable';
  return check.passed ? 'Passed' : 'Failed';
}

/**
 * Per-page conformance record appended to every exported LMS page. This is the
 * artifact a district can point at; the internal results table is not visible
 * to them.
 */
export function buildConformanceFooterHTML(record: ConformanceRecord): string {
  const rows = record.checks
    .map((check) => {
      const notes = [check.blocking ? 'Blocking' : 'Advisory', check.details]
        .filter(Boolean)
        .join(' — ');
      return `<tr>
        <th scope="row" style="text-align:left;padding:0.25rem 0.5rem;border:1px solid #d1d5db;font-weight:500;">${
        escapeHtml(check.label)
      }</th>
        <td style="padding:0.25rem 0.5rem;border:1px solid #d1d5db;">${
        escapeHtml(conformanceResultText(check))
      }</td>
        <td style="padding:0.25rem 0.5rem;border:1px solid #d1d5db;">${escapeHtml(notes)}</td>
      </tr>`;
    })
    .join('');

  const failed = record.checks.filter((c) => !c.skipped && !c.passed).length;
  const summary = failed === 0
    ? 'All checks in this rubric passed.'
    : `${failed} check${failed === 1 ? '' : 's'} did not pass. See the table for detail.`;

  // A knowingly-shipped defect is stated up front, in words, before the table.
  // Anything less would let this record read as a pass at a glance.
  const overrideNotice = record.override
    ? `
  <div class="conformance-override" role="note" style="border:2px solid #b91c1c;padding:0.75rem 1rem;margin:1rem 0;">
    <h3 style="margin-top:0;">Exported with a known accessibility failure</h3>
    <p>A teacher chose to export this page while ${
      record.override.overriddenChecks.length
    } required check${
      record.override.overriddenChecks.length === 1 ? '' : 's'
    } ${
      record.override.overriddenChecks.length === 1 ? 'was' : 'were'
    } still failing, on <time datetime="${escapeHtml(record.override.overriddenAt)}">${
      escapeHtml(record.override.overriddenAt)
    }</time>. This page does not meet the rubric below and is pending repair.</p>
    <p><strong>Checks overridden:</strong> ${
      escapeHtml(record.override.overriddenChecks.map((c) => c.label).join(', '))
    }</p>
    <p><strong>Reason given:</strong> ${escapeHtml(record.override.reason)}</p>
  </div>`
    : '';

  return `
<hr />
<section class="accessibility-conformance" aria-labelledby="a11y-conformance-heading">
  <h2 id="a11y-conformance-heading">Accessibility conformance record</h2>
  <p>Rubric version <strong>${escapeHtml(record.rubricVersion)}</strong> · Generated <time datetime="${
    escapeHtml(record.generatedAt)
  }">${escapeHtml(record.generatedAt)}</time></p>${overrideNotice}
  <p>${escapeHtml(summary)}</p>
  <table style="border-collapse:collapse;">
    <caption class="sr-only" style="${SR_ONLY_STYLE}">
      Automated accessibility checks run against this page before export, with the result of each check.
    </caption>
    <thead>
      <tr>
        <th scope="col" style="text-align:left;padding:0.25rem 0.5rem;border:1px solid #d1d5db;">Check</th>
        <th scope="col" style="text-align:left;padding:0.25rem 0.5rem;border:1px solid #d1d5db;">Result</th>
        <th scope="col" style="text-align:left;padding:0.25rem 0.5rem;border:1px solid #d1d5db;">Notes</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p>These are automated checks against an internal rubric. They are not a substitute for a manual accessibility audit or a published conformance report.</p>
</section>`;
}
