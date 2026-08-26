import { describe, expect, it } from 'vitest';
import { marked } from 'marked';
import {
  normalizeMarkdownTables,
  renderLessonForValidation,
} from '../../../../supabase/functions/_shared/lessonHtmlRenderer.ts';
import { runAllChecks } from '../../../../supabase/functions/_shared/lessonChecks.ts';

const parse = (md: string) => marked.parse(md) as string;
const rendersTable = (md: string) => /<table\b/i.test(parse(normalizeMarkdownTables(md)));
const rendersTableRaw = (md: string) => /<table\b/i.test(parse(md));

describe('normalizeMarkdownTables repairs what a model actually emits', () => {
  it('leaves a well-formed table alone', () => {
    const md = '| Word | Meaning |\n|------|---------|\n| Melody | A run of sounds |';
    expect(rendersTableRaw(md)).toBe(true);
    expect(rendersTable(md)).toBe(true);
  });

  it('adds a missing delimiter row', () => {
    const md = '| Word | Meaning |\n| Melody | A run of sounds |';
    expect(rendersTableRaw(md)).toBe(false);
    expect(rendersTable(md)).toBe(true);
  });

  it('dedents a table indented into a code block', () => {
    const md = '    | Word | Meaning |\n    |---|---|\n    | Melody | A run of sounds |';
    expect(rendersTableRaw(md)).toBe(false);
    expect(rendersTable(md)).toBe(true);
  });

  it('fixes a delimiter row whose cell count does not match the header', () => {
    const md = '| Word | Meaning |\n|---|---|---|\n| Melody | A run of sounds |';
    expect(rendersTableRaw(md)).toBe(false);
    expect(rendersTable(md)).toBe(true);
  });

  it('handles the leading-empty-cell shape seen in a real handout', () => {
    const md = '| | Up | Music sounds getting higher in pitch |\n| | Down | Music sounds getting lower in pitch |';
    expect(rendersTableRaw(md)).toBe(false);
    expect(rendersTable(md)).toBe(true);
  });

  it('never invents a table from one stray line of pipes', () => {
    expect(rendersTable('See | this | thing |')).toBe(false);
  });

  it('leaves pipes inside a fenced code block untouched', () => {
    const md = '```\n| Word | Meaning |\n| Melody | sounds |\n```';
    expect(normalizeMarkdownTables(md)).toBe(md);
  });

  it('is idempotent', () => {
    const md = '| Word | Meaning |\n| Melody | sounds |';
    const once = normalizeMarkdownTables(md);
    expect(normalizeMarkdownTables(once)).toBe(once);
  });
});

describe('vocabulary_table_well_formed catches tables that never rendered', () => {
  // Before this, a lesson whose tables all failed to parse reported
  // "no tables present" and passed — the blind spot that let literal pipe
  // characters ship to a student handout.
  const lessonWith = (content: string) => ({
    teacherGuide: '# Guide',
    studentHandouts: [{ groupId: 'g1', groupName: 'Music', language: 'English', content }],
  });

  it('fails when the source has table rows but nothing rendered as a table', () => {
    // Rendered without normalisation, mimicking content already stored broken.
    const lesson = lessonWith('| Word | Meaning |\n| Melody | sounds |');
    const rendered = {
      teacherGuideHtml: '',
      studentHandouts: [{
        groupName: 'Music',
        language: 'English',
        contentHtml: '<p>| Word | Meaning | | Melody | sounds |</p>',
        englishContentHtml: '',
      }],
    };
    const res = runAllChecks(lesson as never, rendered as never, null);
    expect(res.vocabulary_table_well_formed.passed).toBe(false);
    expect(res.vocabulary_table_well_formed.details).toMatch(/literal pipe/i);
  });

  it('passes once the same lesson goes through the real renderer', () => {
    const lesson = lessonWith('| Word | Meaning |\n| Melody | sounds |');
    const rendered = renderLessonForValidation(lesson as never, parse);
    const res = runAllChecks(lesson as never, rendered as never, null);
    expect(res.vocabulary_table_well_formed.passed).toBe(true);
  });

  it('still skips a lesson that genuinely has no tables', () => {
    const lesson = lessonWith('# Music\n\nSounds can be high or low.');
    const rendered = renderLessonForValidation(lesson as never, parse);
    const res = runAllChecks(lesson as never, rendered as never, null);
    expect(res.vocabulary_table_well_formed.skipped).toBe(true);
  });
});
