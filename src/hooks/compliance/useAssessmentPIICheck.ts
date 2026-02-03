/**
 * Assessment PII Check Helper
 * 
 * Provides a convenience function to check all assessment-related fields for PII.
 * Uses the core usePIIGuard hook internally.
 */

import { usePIIGuard } from './usePIIGuard';
import { PIIWarningModal } from '@/components/compliance/PIIWarningModal';
import type { LessonContext, LocalContext } from '@/types/assessmentMethods';

/** Fields to check in assessment forms */
interface AssessmentFieldsToCheck {
  lessonContext: LessonContext;
  localContext: LocalContext;
  /** Optional entity ID if editing existing assessment */
  entityId?: string | null;
}

/** Result of checking all assessment fields */
interface AssessmentPIICheckResult {
  /** Whether to proceed with the operation */
  proceed: boolean;
  /** Whether an admin override was used */
  overridden?: boolean;
}

/**
 * Hook for checking PII in assessment forms.
 * Checks lesson title, objectives, and local context details.
 * 
 * @example
 * const { checkAssessmentFields, modalState, handleEdit, handleOverride, isChecking } = useAssessmentPIICheck();
 * 
 * const handleGenerate = async () => {
 *   const { proceed } = await checkAssessmentFields({
 *     lessonContext,
 *     localContext,
 *   });
 *   if (!proceed) return;
 *   // Continue with generation...
 * };
 */
export function useAssessmentPIICheck() {
  const { checkText, modalState, handleEdit, handleOverride, isChecking } = usePIIGuard();

  /**
   * Check all assessment fields for PII.
   * Returns immediately if any field triggers a block.
   */
  const checkAssessmentFields = async (
    fields: AssessmentFieldsToCheck
  ): Promise<AssessmentPIICheckResult> => {
    const { lessonContext, localContext, entityId } = fields;

    // Check lesson title
    if (lessonContext.title.trim()) {
      const titleCheck = await checkText({
        text: lessonContext.title,
        fieldName: 'lesson_title',
        entityType: 'assessment',
        entityId: entityId ?? null,
      });
      if (!titleCheck.proceed) return { proceed: false };
      if (titleCheck.overridden) return { proceed: true, overridden: true };
    }

    // Check each learning objective
    const objectives = lessonContext.objectives.filter(o => o.trim());
    for (let i = 0; i < objectives.length; i++) {
      const objectiveCheck = await checkText({
        text: objectives[i],
        fieldName: `learning_objective_${i + 1}`,
        entityType: 'assessment',
        entityId: entityId ?? null,
      });
      if (!objectiveCheck.proceed) return { proceed: false };
      if (objectiveCheck.overridden) return { proceed: true, overridden: true };
    }

    // Check local context details (free-text field)
    if (localContext.details.trim()) {
      const detailsCheck = await checkText({
        text: localContext.details,
        fieldName: 'local_context_details',
        entityType: 'assessment',
        entityId: entityId ?? null,
      });
      if (!detailsCheck.proceed) return { proceed: false };
      if (detailsCheck.overridden) return { proceed: true, overridden: true };
    }

    return { proceed: true };
  };

  return {
    checkAssessmentFields,
    modalState,
    handleEdit,
    handleOverride,
    isChecking,
    // Export modal component for convenience
    PIIWarningModal,
  };
}
