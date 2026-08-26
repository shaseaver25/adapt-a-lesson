import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Contrast regression guard for the light-theme design tokens.
 *
 * The 42 contrast violations axe found on the landing page all came from one
 * token being 0.09 short of the threshold. Nothing in the build catches that, so
 * this reads the real values out of index.css and does the arithmetic — a future
 * edit that lightens a text token fails here rather than in an audit.
 *
 * The dark block is deliberately not covered: nothing in the app adds the `dark`
 * class, so those tokens never render. See the note above `.dark` in index.css.
 */

const CSS = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');

/** Read an `--x: H S% L%;` token from the `:root` block (before `.dark`). */
function token(name: string): [number, number, number] {
  const root = CSS.slice(0, CSS.indexOf('.dark'));
  const m = root.match(
    new RegExp(`--${name}:\\s*([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%`),
  );
  if (!m) throw new Error(`token --${name} not found in :root`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function hslToRgb([h, s, l]: [number, number, number]): [number, number, number] {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  const seg: [number, number, number][] = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ];
  const [r, g, b] = seg[Math.floor(h / 60) % 6];
  return [r, g, b].map((v) => Math.round((v + m) * 255)) as [number, number, number];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = relativeLuminance(hslToRgb(token(a)));
  const lb = relativeLuminance(hslToRgb(token(b)));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG 2.1 SC 1.4.3, normal-size text. */
const AA_NORMAL = 4.5;

/** Every ground a body-text token can land on. */
const GROUNDS = ['background', 'card', 'muted'] as const;

describe('light-theme text tokens meet WCAG AA (SC 1.4.3)', () => {
  for (const fg of ['foreground', 'muted-foreground', 'primary', 'secondary', 'destructive'] as const) {
    for (const bg of GROUNDS) {
      it(`--${fg} on --${bg}`, () => {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA_NORMAL);
      });
    }
  }
});

describe('solid fills meet AA against their own foreground token', () => {
  // A fill is only accessible in combination with the text placed on it. The
  // accent case is the one that regressed: gold is light, so it needs dark text
  // rather than the white every other fill uses.
  for (const fill of ['primary', 'secondary', 'accent', 'destructive'] as const) {
    it(`--${fill} with --${fill}-foreground`, () => {
      expect(contrast(fill, `${fill}-foreground`)).toBeGreaterThanOrEqual(AA_NORMAL);
    });
  }
});

describe('the specific regressions this suite exists to prevent', () => {
  it('keeps --muted-foreground usable on the cream --background', () => {
    // Was 4.41:1 at 22 20% 45% — the single cause of 42 axe violations.
    expect(contrast('muted-foreground', 'background')).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('keeps dark text on the gold accent, not white', () => {
    // White on this gold is 3.16:1. The hue is fine; the foreground was not.
    const [, , lightness] = token('accent-foreground');
    expect(lightness).toBeLessThan(50);
  });
});
