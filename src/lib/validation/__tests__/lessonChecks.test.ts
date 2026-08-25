import { describe, expect, it } from 'vitest';
import { marked } from 'marked';
import { renderLessonForValidation } from '../../../../supabase/functions/_shared/lessonHtmlRenderer.ts';
import { runAllChecks } from '../../../../supabase/functions/_shared/lessonChecks.ts';
import { blockingFailures, canExport } from '../../../../supabase/functions/_shared/lessonRubric.ts';
import { validateLessonForExport, toConformanceRecord } from '../validateLessonForExport';
import {
  altTextMapFixture,
  BILINGUAL_LESSON,
  imageMapFixture,
  longDescriptionMapFixture,
  VISUAL_DESCRIPTION,
} from '../../../test/fixtures/bilingualLesson';

const parseMarkdown = (md: string) => marked.parse(md) as string;

const fullAssets = () => ({
  imageMap: imageMapFixture(),
  altTextMap: altTextMapFixture(),
  longDescriptionMap: longDescriptionMapFixture(),
});

function check(lesson: unknown, assets?: unknown) {
  const rendered = renderLessonForValidation(lesson as never, parseMarkdown, assets as never);
  return runAllChecks(lesson as never, rendered as never, null);
}

describe('markup checks read the rendered HTML', () => {
  it('passes the lang-attribute check on a bilingual lesson', () => {
    const results = check(BILINGUAL_LESSON, fullAssets());
    expect(results.translated_content_has_lang_attribute.passed).toBe(true);
    expect(results.translated_content_has_lang_attribute.skipped).toBeUndefined();
  });

  it('fails the lang-attribute check when the language has no ISO code', () => {
    const lesson = {
      ...BILINGUAL_LESSON,
      studentHandouts: [
        { ...BILINGUAL_LESSON.studentHandouts[0], language: 'Chuukese' },
      ],
    };
    const results = check(lesson, fullAssets());
    expect(results.translated_content_has_lang_attribute.passed).toBe(false);
    expect(results.translated_content_has_lang_attribute.details).toContain('und');
  });

  it('finds the vocabulary table only after markdown is rendered', () => {
    const results = check(BILINGUAL_LESSON, fullAssets());
    expect(results.vocabulary_table_well_formed.skipped).toBeUndefined();
    expect(results.vocabulary_table_well_formed.passed).toBe(true);
  });

  it('finds the practice answer mechanism only after markdown is rendered', () => {
    const results = check(BILINGUAL_LESSON, fullAssets());
    expect(results.practice_section_has_answer_mechanism.skipped).toBeUndefined();
    expect(results.practice_section_has_answer_mechanism.passed).toBe(true);
  });

  it('fails when a practice section has nowhere to answer', () => {
    const lesson = {
      teacherGuide: 'Guide',
      studentHandouts: [{
        groupId: 'g', groupName: 'Blazers', language: 'English',
        content: '# Title\n\n## Practice\n\n1. What is a cell?\n\n2. Name one organelle.\n',
        englishContent: null,
      }],
    };
    const results = check(lesson);
    expect(results.practice_section_has_answer_mechanism.passed).toBe(false);
  });
});

describe('alt text checks', () => {
  it('passes when a vision-written description is attached', () => {
    const results = check(BILINGUAL_LESSON, fullAssets());
    expect(results.has_all_alt_text.passed).toBe(true);
    expect(results.alt_text_reviewed.passed).toBe(true);
  });

  it('blocks export when alt text fell back to the generation prompt', () => {
    const results = check(BILINGUAL_LESSON, { imageMap: imageMapFixture() });
    expect(results.has_all_alt_text.passed).toBe(true);
    expect(results.alt_text_reviewed.passed).toBe(false);
    expect(blockingFailures(results)).toContain('alt_text_reviewed');
    expect(canExport(results)).toBe(false);
  });

  it('skips the image checks when no image was generated', () => {
    const results = check(BILINGUAL_LESSON);
    expect(results.has_all_alt_text.skipped).toBe(true);
    expect(results.alt_text_reviewed.skipped).toBe(true);
    expect(canExport(results)).toBe(true);
  });

  it('uses the long description as the visible caption for a data-bearing diagram', () => {
    const rendered = renderLessonForValidation(BILINGUAL_LESSON, parseMarkdown, fullAssets());
    expect(rendered.studentHandouts[0].contentHtml).toContain(
      'Water rises from the lake as vapor',
    );
    expect(rendered.studentHandouts[0].contentHtml).not.toContain(
      `alt="${VISUAL_DESCRIPTION}"`,
    );
  });
});

describe('generation-quality checks added for the prompt rules', () => {
  it('flags a heading that starts with an emoji', () => {
    const lesson = {
      teacherGuide: 'Guide',
      studentHandouts: [{
        groupId: 'g', groupName: 'Blazers', language: 'English',
        content: '# Title\n\n## \u{1F3AF} Learning Target\n\nText.\n',
        englishContent: null,
      }],
    };
    const results = check(lesson);
    expect(results.heading_text_has_no_leading_emoji.passed).toBe(false);
  });

  it('accepts an emoji in body text', () => {
    const lesson = {
      teacherGuide: 'Guide',
      studentHandouts: [{
        groupId: 'g', groupName: 'Blazers', language: 'English',
        content: '# Title\n\n## Learning Target\n\nNice work \u{1F3AF} today.\n',
        englishContent: null,
      }],
    };
    expect(check(lesson).heading_text_has_no_leading_emoji.passed).toBe(true);
  });

  it('flags vague link text', () => {
    const lesson = {
      teacherGuide: 'Read about it [click here](https://example.test).',
      studentHandouts: [{ groupId: 'g', groupName: 'B', language: 'English', content: '# T' }],
    };
    expect(check(lesson).link_text_is_descriptive.passed).toBe(false);
  });

  it('accepts descriptive link text', () => {
    const lesson = {
      teacherGuide: 'Read the [NASA water cycle overview](https://example.test).',
      studentHandouts: [{ groupId: 'g', groupName: 'B', language: 'English', content: '# T' }],
    };
    expect(check(lesson).link_text_is_descriptive.passed).toBe(true);
  });

  it('flags underscore blanks in the generated markdown', () => {
    const lesson = {
      teacherGuide: 'Guide',
      studentHandouts: [{
        groupId: 'g', groupName: 'B', language: 'English',
        content: '**Name:** _____ **Date:** _____',
      }],
    };
    expect(check(lesson).answer_blanks_use_semantic_markup.passed).toBe(false);
  });

  it('passes when the lesson uses the semantic blank tokens', () => {
    expect(check(BILINGUAL_LESSON).answer_blanks_use_semantic_markup.passed).toBe(true);
  });

  it('flags an instruction that identifies work by color alone', () => {
    const lesson = {
      teacherGuide: 'Guide',
      studentHandouts: [{
        groupId: 'g', groupName: 'B', language: 'English',
        content: '# T\n\nAnswer the red questions first.',
      }],
    };
    expect(check(lesson).no_color_only_instructions.passed).toBe(false);
  });

  it('accepts a color paired with a label', () => {
    const lesson = {
      teacherGuide: 'Guide',
      studentHandouts: [{
        groupId: 'g', groupName: 'B', language: 'English',
        content: '# T\n\nAnswer the questions marked Set A (red box) first.',
      }],
    };
    expect(check(lesson).no_color_only_instructions.passed).toBe(true);
  });

  it('flags a lesson containing equations for manual review without blocking export', () => {
    const lesson = {
      teacherGuide: 'Solve $$x = \\frac{-b}{2a}$$ together.',
      studentHandouts: [{ groupId: 'g', groupName: 'B', language: 'English', content: '# T' }],
    };
    const results = check(lesson);
    expect(results.math_requires_manual_review.passed).toBe(false);
    expect(blockingFailures(results)).not.toContain('math_requires_manual_review');
  });

  it('skips the math check when there are no equations', () => {
    expect(check(BILINGUAL_LESSON).math_requires_manual_review.skipped).toBe(true);
  });
});

describe('blocking classification', () => {
  it('blocks on a placeholder left in the handout', () => {
    const lesson = {
      teacherGuide: 'Guide',
      studentHandouts: [{
        groupId: 'g', groupName: 'B', language: 'English',
        content: '# T\n\n*Content generation incomplete. Please regenerate this lesson.*',
      }],
    };
    expect(blockingFailures(check(lesson))).toContain('has_no_placeholder');
  });

  it('blocks on a missing teacher guide', () => {
    const results = check({ teacherGuide: '', studentHandouts: [] });
    expect(blockingFailures(results)).toContain('has_all_sections');
  });

  it('lets a clean bilingual lesson through', () => {
    expect(canExport(check(BILINGUAL_LESSON, fullAssets()))).toBe(true);
  });
});

describe('validateLessonForExport', () => {
  it('reports the export gate and builds a conformance record', () => {
    const validation = validateLessonForExport(BILINGUAL_LESSON, null, fullAssets());
    expect(validation.canExport).toBe(true);
    expect(validation.blocking).toEqual([]);

    const record = toConformanceRecord(validation);
    expect(record.rubricVersion).toBe(validation.rubricVersion);
    expect(record.checks.length).toBeGreaterThan(10);
    expect(record.checks.every((c) => typeof c.label === 'string' && c.label.length > 0)).toBe(true);
    expect(record.checks.some((c) => c.blocking)).toBe(true);
  });

  it('reports a blocked export when alt text was never reviewed', () => {
    const validation = validateLessonForExport(BILINGUAL_LESSON, null, {
      imageMap: imageMapFixture(),
    });
    expect(validation.canExport).toBe(false);
    expect(validation.blocking).toContain('alt_text_reviewed');
  });
});
