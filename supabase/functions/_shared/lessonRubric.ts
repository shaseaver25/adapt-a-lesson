/**
 * The rubric contract shared by validate-lesson, the teacher-facing UI, and the
 * conformance record written onto every exported LMS page.
 *
 * Dependency-free so the browser bundle and Deno edge functions can both import
 * it and stay in agreement about what a check is called and whether it blocks
 * export.
 */

export const RUBRIC_VERSION = 'v2.0';

export type CheckName =
  | 'has_all_sections'
  | 'has_no_placeholder'
  | 'has_all_alt_text'
  | 'alt_text_reviewed'
  | 'has_valid_heading_hierarchy'
  | 'heading_text_has_no_leading_emoji'
  | 'translated_content_has_lang_attribute'
  | 'bilingual_section_counts_match'
  | 'vocabulary_table_well_formed'
  | 'practice_section_has_answer_mechanism'
  | 'answer_blanks_use_semantic_markup'
  | 'link_text_is_descriptive'
  | 'no_color_only_instructions'
  | 'math_requires_manual_review'
  | 'word_count_in_grade_range';

export interface CheckDefinition {
  label: string;
  /** A blocking failure stops export to an LMS. */
  blocking: boolean;
  /** What a teacher should do about it, shown inline in the UI. */
  remedy: string;
}

export const CHECK_DEFINITIONS: Record<CheckName, CheckDefinition> = {
  has_all_sections: {
    label: 'All required sections present',
    blocking: true,
    remedy: 'Regenerate the lesson — the teacher guide or the student handouts came back empty.',
  },
  has_no_placeholder: {
    label: 'No placeholder text left in the lesson',
    blocking: true,
    remedy: 'Regenerate the lesson, or edit out the placeholder text before exporting.',
  },
  has_all_alt_text: {
    label: 'Every image has alt text',
    blocking: true,
    remedy: 'Regenerate the diagrams, or remove the image from the handout.',
  },
  alt_text_reviewed: {
    label: 'Alt text describes the image, not the prompt',
    blocking: true,
    remedy:
      'Alt text fell back to the image-generation prompt. Regenerate the diagram so alt text is written from the finished image, or remove the image.',
  },
  has_valid_heading_hierarchy: {
    label: 'Heading levels do not skip',
    blocking: false,
    remedy: 'Regenerate the lesson so heading levels step down one at a time.',
  },
  heading_text_has_no_leading_emoji: {
    label: 'Headings do not start with an emoji',
    blocking: false,
    remedy:
      'Move the emoji into the body text. Screen readers read the emoji name before the heading text.',
  },
  translated_content_has_lang_attribute: {
    label: 'Translated content carries a language attribute',
    blocking: true,
    remedy:
      'The home language could not be mapped to a language code. Pick a supported language on the student group.',
  },
  bilingual_section_counts_match: {
    label: 'Bilingual columns have matching sections',
    blocking: false,
    remedy: 'Regenerate so both language columns cover the same sections.',
  },
  vocabulary_table_well_formed: {
    label: 'Tables have header cells and even rows',
    blocking: false,
    remedy: 'Regenerate the lesson so each table row has one cell per column header.',
  },
  practice_section_has_answer_mechanism: {
    label: 'Practice sections give students somewhere to answer',
    blocking: false,
    remedy: 'Regenerate so each practice question is followed by [ANSWER LINE] or [BLANK].',
  },
  answer_blanks_use_semantic_markup: {
    label: 'Answer blanks avoid runs of underscores',
    blocking: false,
    remedy:
      'The export converts underscore runs automatically, but regenerating produces cleaner source.',
  },
  link_text_is_descriptive: {
    label: 'Link text describes its destination',
    blocking: false,
    remedy: 'Replace "click here" / "read more" links with text naming the destination.',
  },
  no_color_only_instructions: {
    label: 'Instructions do not depend on color alone',
    blocking: false,
    remedy: 'Pair every color reference with a label, number, or icon students can also read.',
  },
  math_requires_manual_review: {
    label: 'Math needs manual review',
    blocking: false,
    remedy:
      'This lesson contains equations. MathML conversion is not implemented, so a teacher must check the equations render and read correctly before assigning.',
  },
  word_count_in_grade_range: {
    label: 'Word count fits the grade band',
    blocking: false,
    remedy: 'Regenerate with a different grade band, or accept the length.',
  },
};

export const CHECK_ORDER: CheckName[] = Object.keys(CHECK_DEFINITIONS) as CheckName[];

export const BLOCKING_CHECKS: CheckName[] = CHECK_ORDER.filter(
  (name) => CHECK_DEFINITIONS[name].blocking,
);

export interface CheckResult {
  passed: boolean;
  details?: string;
  skipped?: boolean;
}

export type HardCheckResults = Partial<Record<string, CheckResult>>;

export function checkLabel(name: string): string {
  return CHECK_DEFINITIONS[name as CheckName]?.label ?? name.replace(/_/g, ' ');
}

export function isBlockingCheck(name: string): boolean {
  return CHECK_DEFINITIONS[name as CheckName]?.blocking ?? false;
}

export function checkRemedy(name: string): string | undefined {
  return CHECK_DEFINITIONS[name as CheckName]?.remedy;
}

/** Names of blocking checks that ran and failed. */
export function blockingFailures(results: HardCheckResults | null | undefined): string[] {
  if (!results) return [];
  return Object.entries(results)
    .filter(([name, result]) => !!result && !result.skipped && !result.passed && isBlockingCheck(name))
    .map(([name]) => name);
}

/** Names of non-blocking checks that ran and failed. */
export function advisoryFailures(results: HardCheckResults | null | undefined): string[] {
  if (!results) return [];
  return Object.entries(results)
    .filter(([name, result]) => !!result && !result.skipped && !result.passed && !isBlockingCheck(name))
    .map(([name]) => name);
}

export function canExport(results: HardCheckResults | null | undefined): boolean {
  return blockingFailures(results).length === 0;
}
