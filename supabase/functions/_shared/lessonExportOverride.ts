/**
 * Teacher override for a blocking accessibility failure.
 *
 * An override never makes a lesson conformant — it records that a human chose
 * to ship a known defect, so the defect can be found and repaired later. Two
 * things follow from that and are enforced here rather than left to callers:
 *
 *  1. A substantive written reason is required. An override with no reason is
 *     indistinguishable from the gate not existing.
 *  2. The failing checks are captured *at override time*. Re-running the rubric
 *     later cannot reconstruct what was wrong when the page shipped, because
 *     the lesson may have been edited since.
 *
 * Dependency-free so the browser bundle and the Deno edge functions can both
 * import it and agree on what counts as a valid override.
 */

import { checkLabel, type HardCheckResults } from './lessonRubric.ts';

/**
 * Long enough to force an actual sentence. "n/a", "ok", and "fix later" are the
 * failure mode this guards against — they make the repair log worthless.
 */
export const MIN_OVERRIDE_REASON_LENGTH = 20;
export const MAX_OVERRIDE_REASON_LENGTH = 2000;

/** One blocking check that was failing when the teacher overrode it. */
export interface OverriddenCheck {
  name: string;
  label: string;
  details?: string;
}

export interface ExportOverride {
  /** Why this lesson shipped with a known defect. Required. */
  reason: string;
  /** The repair list: what was failing at the moment of export. */
  overriddenChecks: OverriddenCheck[];
  /** ISO timestamp of the override decision. */
  overriddenAt: string;
}

/**
 * Human-readable reason why an override is not acceptable, or null when it is.
 * Returned as a message rather than a boolean so the UI and the edge function
 * can show the same text.
 */
export function overrideReasonError(reason: unknown): string | null {
  if (typeof reason !== 'string') return 'A written reason is required.';
  const trimmed = reason.trim();
  if (trimmed.length === 0) return 'A written reason is required.';
  if (trimmed.length < MIN_OVERRIDE_REASON_LENGTH) {
    return `Give at least ${MIN_OVERRIDE_REASON_LENGTH} characters explaining why this lesson is being exported with a known accessibility failure, and how it will be fixed.`;
  }
  if (trimmed.length > MAX_OVERRIDE_REASON_LENGTH) {
    return `Keep the reason under ${MAX_OVERRIDE_REASON_LENGTH} characters.`;
  }
  return null;
}

/**
 * Validate an override against the failures it claims to cover.
 *
 * An override is only valid for checks that are actually failing: it cannot be
 * used to pre-authorize a future failure, and it must not silently cover a
 * check the teacher never saw.
 */
export function overrideError(
  override: unknown,
  blocking: string[],
): string | null {
  if (!override || typeof override !== 'object') return 'No override supplied.';
  const o = override as Partial<ExportOverride>;

  const reasonError = overrideReasonError(o.reason);
  if (reasonError) return reasonError;

  if (!Array.isArray(o.overriddenChecks) || o.overriddenChecks.length === 0) {
    return 'The override does not record which checks it covers.';
  }
  const covered = new Set(o.overriddenChecks.map((c) => c?.name));
  const uncovered = blocking.filter((name) => !covered.has(name));
  if (uncovered.length > 0) {
    return `The override does not cover ${uncovered.map(checkLabel).join(', ')}.`;
  }
  if (typeof o.overriddenAt !== 'string' || !o.overriddenAt) {
    return 'The override is missing a timestamp.';
  }
  return null;
}

export function isValidOverride(override: unknown, blocking: string[]): boolean {
  return overrideError(override, blocking) === null;
}

/**
 * Build the repair list from a rubric result. This is what gets stored and what
 * gets disclosed on the exported page.
 */
export function buildOverriddenChecks(
  results: HardCheckResults | null | undefined,
  blocking: string[],
): OverriddenCheck[] {
  return blocking.map((name) => ({
    name,
    label: checkLabel(name),
    details: results?.[name]?.details,
  }));
}
