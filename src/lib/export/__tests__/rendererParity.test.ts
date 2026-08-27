import { describe, expect, it } from 'vitest';
import { marked } from 'marked';
import {
  buildLessonSectionHTML as sharedBuildLessonSectionHTML,
  processLessonMarkdown,
  renderLessonForValidation,
} from '../../../../supabase/functions/_shared/lessonHtmlRenderer.ts';
import { buildLessonSectionHTML, generateStudentHTML } from '../htmlExporter';
import {
  altTextMapFixture,
  BILINGUAL_LESSON,
  imageMapFixture,
  longDescriptionMapFixture,
  SPANISH_HANDOUT_CONTENT,
  SPANISH_HANDOUT_ENGLISH_CONTENT,
} from '../../../test/fixtures/bilingualLesson';

const parseMarkdown = (md: string) => marked.parse(md) as string;

const assets = () => ({
  imageMap: imageMapFixture(),
  altTextMap: altTextMapFixture(),
  longDescriptionMap: longDescriptionMapFixture(),
});

const spanishGroup = {
  id: 'group-es',
  groupName: 'Sparks',
  readingLevelLabel: 'Below Grade',
  homeLanguage: 'Spanish',
};

describe('renderer parity between validation and export', () => {
  it('produces byte-identical section HTML from the exporter and the validation renderer', () => {
    const fromExporter = buildLessonSectionHTML({
      heading: 'Sparks',
      content: SPANISH_HANDOUT_CONTENT,
      englishContent: SPANISH_HANDOUT_ENGLISH_CONTENT,
      homeLanguage: 'Spanish',
      assets: assets(),
    });

    const fromValidation = renderLessonForValidation(BILINGUAL_LESSON, parseMarkdown, assets())
      .studentHandouts[0].sectionHtml;

    expect(fromExporter).toBe(fromValidation);
  });

  it('routes the Canvas-push renderer through the shared module', () => {
    const viaExporter = buildLessonSectionHTML({
      heading: 'Sparks',
      content: SPANISH_HANDOUT_CONTENT,
      englishContent: SPANISH_HANDOUT_ENGLISH_CONTENT,
      homeLanguage: 'Spanish',
      assets: assets(),
    });
    const viaShared = sharedBuildLessonSectionHTML({
      heading: 'Sparks',
      content: SPANISH_HANDOUT_CONTENT,
      englishContent: SPANISH_HANDOUT_ENGLISH_CONTENT,
      homeLanguage: 'Spanish',
      parseMarkdown,
      assets: assets(),
    });
    expect(viaExporter).toBe(viaShared);
  });

  it('embeds the same rendered columns in the standalone HTML file', () => {
    const standalone = generateStudentHTML({
      title: 'The Water Cycle',
      content: SPANISH_HANDOUT_CONTENT,
      englishContent: SPANISH_HANDOUT_ENGLISH_CONTENT,
      group: spanishGroup,
      generatedDate: '2026-08-25',
      assets: assets(),
    });

    const translatedColumn = processLessonMarkdown(SPANISH_HANDOUT_CONTENT, parseMarkdown, assets());
    const englishColumn = processLessonMarkdown(
      SPANISH_HANDOUT_ENGLISH_CONTENT,
      parseMarkdown,
      assets(),
    );

    expect(standalone).toContain(translatedColumn);
    expect(standalone).toContain(englishColumn);
  });

  it('gives the monolingual branch the same lang and dir markup in both exporters', () => {
    const standalone = generateStudentHTML({
      title: 'The Water Cycle',
      content: '# Hello',
      group: { ...spanishGroup, homeLanguage: 'Arabic' },
      generatedDate: '2026-08-25',
    });
    const section = buildLessonSectionHTML({
      heading: 'Sparks',
      content: '# Hello',
      homeLanguage: 'Arabic',
    });

    expect(standalone).toContain('<div class="single-column-content" lang="ar" dir="rtl">');
    expect(section).toContain('<div class="single-column-content" lang="ar" dir="rtl">');
  });
});

describe('language markup on the shipped fragment', () => {
  it('marks up the translated column with an ISO code and direction', () => {
    const html = buildLessonSectionHTML({
      heading: 'Sparks',
      content: SPANISH_HANDOUT_CONTENT,
      englishContent: SPANISH_HANDOUT_ENGLISH_CONTENT,
      homeLanguage: 'Spanish',
    });
    expect(html).toContain('<td lang="es" dir="ltr"');
    expect(html).toContain('<td lang="en" dir="ltr"');
    expect(html).toContain('scope="col"');
  });

  it('falls back to und for a language with no ISO 639-1 mapping', () => {
    const html = buildLessonSectionHTML({
      heading: 'Sparks',
      content: '# Hola',
      englishContent: '# Hello',
      homeLanguage: 'Klingon',
    });
    expect(html).toContain('lang="und"');
  });

  it('keeps visually-hidden text hidden without a host stylesheet', () => {
    const html = buildLessonSectionHTML({
      heading: 'Sparks',
      content: SPANISH_HANDOUT_CONTENT,
      englishContent: SPANISH_HANDOUT_ENGLISH_CONTENT,
      homeLanguage: 'Spanish',
    });
    expect(html).toMatch(/<caption[^>]*class="sr-only"[^>]*style="position:absolute/);
  });
});

describe('answer blanks', () => {
  it('replaces [ANSWER LINE] with a labelled writing line', () => {
    const html = processLessonMarkdown('Question one\n\n[ANSWER LINE]\n', parseMarkdown);
    expect(html).toContain('class="answer-line"');
    expect(html).toContain('Space for your written answer');
    expect(html).not.toContain('[ANSWER LINE]');
  });

  it('replaces [BLANK] with an inline labelled blank', () => {
    const html = processLessonMarkdown('**Name:** [BLANK]', parseMarkdown);
    expect(html).toContain('class="answer-blank"');
    expect(html).toContain('blank to fill in');
  });

  it('rewrites legacy underscore runs so no bare underscores ship', () => {
    const html = processLessonMarkdown('**Name:** __________ **Date:** _____', parseMarkdown);
    expect(html).not.toMatch(/_{5,}/);
    expect(html.match(/class="answer-blank"/g)).toHaveLength(2);
  });
});

describe('downloaded handouts carry the conformance record', () => {
  // The public claim is that every lesson "ships with a record of what passed".
  // A downloaded file is uploaded to an LMS by hand and is just as
  // district-facing as one pushed to Canvas, so it must carry the record too.
  const conformance = {
    rubricVersion: 'v2.0',
    generatedAt: '2026-08-25T22:00:00.000Z',
    checks: [
      {
        name: 'has_all_sections',
        label: 'All required sections present',
        passed: true,
        blocking: true,
      },
    ],
  };

  const group = {
    id: 'g1',
    groupName: 'Sparks',
    readingLevelLabel: 'Below Grade',
    homeLanguage: 'English',
  };

  it('includes the record when one is supplied', () => {
    const html = generateStudentHTML({
      title: 'Water Cycle',
      content: '# Water Cycle\n\nRain falls.',
      group,
      generatedDate: '25/08/2026',
      conformance,
    });
    expect(html).toContain('Accessibility conformance record');
    expect(html).toContain('All required sections present');
    expect(html).toContain('v2.0');
  });

  it('omits it entirely when none is supplied, rather than implying a pass', () => {
    const html = generateStudentHTML({
      title: 'Water Cycle',
      content: '# Water Cycle\n\nRain falls.',
      group,
      generatedDate: '25/08/2026',
    });
    expect(html).not.toContain('Accessibility conformance record');
  });
});
