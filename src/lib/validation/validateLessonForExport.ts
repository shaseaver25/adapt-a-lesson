import { marked } from 'marked';
import {
  type ConformanceRecord,
  renderLessonForValidation,
  type VisualAssets,
} from '../../../supabase/functions/_shared/lessonHtmlRenderer.ts';
import { runAllChecks } from '../../../supabase/functions/_shared/lessonChecks.ts';
import {
  advisoryFailures,
  blockingFailures,
  canExport,
  CHECK_ORDER,
  checkLabel,
  type HardCheckResults,
  isBlockingCheck,
  RUBRIC_VERSION,
} from '../../../supabase/functions/_shared/lessonRubric.ts';

export interface ExportValidation {
  passed: boolean;
  hardCheckResults: HardCheckResults;
  rubricVersion: string;
  blocking: string[];
  advisory: string[];
  canExport: boolean;
  validatedAt: string;
}

interface LessonLike {
  teacherGuide?: string;
  studentHandouts?: Array<{
    groupId?: string;
    groupName?: string;
    language?: string;
    content?: string;
    englishContent?: string | null;
  }>;
}

const parseMarkdown = (md: string) => marked.parse(md) as string;

/**
 * Re-run the rubric against the markup that is about to be exported.
 *
 * Generation-time validation runs before any diagram exists, so image checks
 * are inconclusive there. This runs the identical rubric over the identical
 * renderer with the real images and alt text attached, which is what the export
 * gate and the per-page conformance record are based on.
 */
export function validateLessonForExport(
  lesson: LessonLike,
  gradeBand: string | null,
  assets?: VisualAssets,
): ExportValidation {
  const rendered = renderLessonForValidation(lesson, parseMarkdown, assets);
  const hardCheckResults = runAllChecks(lesson as never, rendered as never, gradeBand) as HardCheckResults;
  return {
    passed: Object.values(hardCheckResults).every((r) => r!.passed || r!.skipped),
    hardCheckResults,
    rubricVersion: RUBRIC_VERSION,
    blocking: blockingFailures(hardCheckResults),
    advisory: advisoryFailures(hardCheckResults),
    canExport: canExport(hardCheckResults),
    validatedAt: new Date().toISOString(),
  };
}

/**
 * The rubric result in the shape that gets stamped onto every exported LMS page.
 */
export function toConformanceRecord(validation: ExportValidation): ConformanceRecord {
  return {
    rubricVersion: validation.rubricVersion,
    generatedAt: validation.validatedAt,
    checks: CHECK_ORDER.filter((name) => name in validation.hardCheckResults).map((name) => {
      const result = validation.hardCheckResults[name]!;
      return {
        name,
        label: checkLabel(name),
        passed: result.passed,
        skipped: result.skipped,
        blocking: isBlockingCheck(name),
        details: result.details,
      };
    }),
  };
}
