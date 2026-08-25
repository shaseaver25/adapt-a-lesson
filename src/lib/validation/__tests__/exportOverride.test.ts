import { describe, expect, it } from 'vitest';
import {
  buildOverriddenChecks,
  isValidOverride,
  MIN_OVERRIDE_REASON_LENGTH,
  overrideError,
  overrideReasonError,
  type ExportOverride,
} from '../../../../supabase/functions/_shared/lessonExportOverride.ts';
import { buildConformanceFooterHTML } from '../../../../supabase/functions/_shared/lessonHtmlRenderer.ts';

const GOOD_REASON =
  'Diagram alt text needs rewriting; assigning tomorrow and replacing the page by Friday.';

const validOverride = (): ExportOverride => ({
  reason: GOOD_REASON,
  overriddenChecks: [
    { name: 'alt_text_reviewed', label: 'Alt text describes the image, not the prompt' },
  ],
  overriddenAt: '2026-08-25T22:00:00.000Z',
});

describe('overrideReasonError', () => {
  it('requires a reason', () => {
    expect(overrideReasonError(undefined)).toMatch(/required/i);
    expect(overrideReasonError('')).toMatch(/required/i);
    expect(overrideReasonError('   ')).toMatch(/required/i);
  });

  it('rejects the throwaway reasons that make the log useless', () => {
    for (const junk of ['n/a', 'ok', 'fix later', 'asdf']) {
      expect(overrideReasonError(junk), junk).not.toBeNull();
    }
  });

  it('accepts a substantive reason', () => {
    expect(overrideReasonError(GOOD_REASON)).toBeNull();
  });

  it('measures length after trimming, so whitespace cannot pad it', () => {
    const padded = `${' '.repeat(MIN_OVERRIDE_REASON_LENGTH + 5)}too short`;
    expect(overrideReasonError(padded)).not.toBeNull();
  });

  it('rejects an unreasonably long reason', () => {
    expect(overrideReasonError('x'.repeat(5000))).toMatch(/under/i);
  });
});

describe('overrideError', () => {
  it('accepts an override covering every blocking failure', () => {
    expect(overrideError(validOverride(), ['alt_text_reviewed'])).toBeNull();
    expect(isValidOverride(validOverride(), ['alt_text_reviewed'])).toBe(true);
  });

  it('refuses an override that does not cover every failing check', () => {
    const problem = overrideError(validOverride(), ['alt_text_reviewed', 'has_all_alt_text']);
    expect(problem).toMatch(/does not cover/i);
    expect(problem).toContain('Every image has alt text');
  });

  it('refuses an override with no checks recorded', () => {
    const o = { ...validOverride(), overriddenChecks: [] };
    expect(overrideError(o, ['alt_text_reviewed'])).toMatch(/which checks/i);
  });

  it('refuses an override with no timestamp', () => {
    const { overriddenAt: _drop, ...rest } = validOverride();
    expect(overrideError(rest, ['alt_text_reviewed'])).toMatch(/timestamp/i);
  });

  it('refuses a missing or non-object override', () => {
    expect(overrideError(undefined, ['alt_text_reviewed'])).toMatch(/no override/i);
    expect(overrideError('yes', ['alt_text_reviewed'])).toMatch(/no override/i);
  });

  it('refuses a valid-looking override whose reason is junk', () => {
    const o = { ...validOverride(), reason: 'ok' };
    expect(overrideError(o, ['alt_text_reviewed'])).not.toBeNull();
  });
});

describe('buildOverriddenChecks', () => {
  it('captures the label and detail of each failing check as the repair list', () => {
    const results = {
      alt_text_reviewed: { passed: false, details: 'handout[0] (Sparks): 1 image(s)' },
      has_all_sections: { passed: true },
    };
    expect(buildOverriddenChecks(results, ['alt_text_reviewed'])).toEqual([
      {
        name: 'alt_text_reviewed',
        label: 'Alt text describes the image, not the prompt',
        details: 'handout[0] (Sparks): 1 image(s)',
      },
    ]);
  });

  it('survives a missing results object', () => {
    expect(buildOverriddenChecks(null, ['alt_text_reviewed'])).toEqual([
      {
        name: 'alt_text_reviewed',
        label: 'Alt text describes the image, not the prompt',
        details: undefined,
      },
    ]);
  });
});

describe('conformance record discloses an override', () => {
  const baseRecord = {
    rubricVersion: 'v2.0',
    generatedAt: '2026-08-25T22:00:00.000Z',
    checks: [
      {
        name: 'alt_text_reviewed',
        label: 'Alt text describes the image, not the prompt',
        passed: false,
        blocking: true,
        details: 'handout[0] (Sparks): 1 image(s)',
      },
    ],
  };

  it('states the failure in words up front, not just as a table row', () => {
    const html = buildConformanceFooterHTML({ ...baseRecord, override: validOverride() });
    expect(html).toContain('Exported with a known accessibility failure');
    expect(html).toContain('pending repair');
    expect(html).toContain('Alt text describes the image, not the prompt');
  });

  it('prints the teacher’s reason on the page a district reads', () => {
    const html = buildConformanceFooterHTML({ ...baseRecord, override: validOverride() });
    expect(html).toContain(GOOD_REASON);
  });

  it('escapes the reason so it cannot inject markup into the LMS page', () => {
    const html = buildConformanceFooterHTML({
      ...baseRecord,
      override: {
        ...validOverride(),
        reason: `${GOOD_REASON} <script>alert('x')</script>`,
      },
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('says nothing about an override when there was none', () => {
    const html = buildConformanceFooterHTML(baseRecord);
    expect(html).not.toContain('Exported with a known accessibility failure');
  });
});
