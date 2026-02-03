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
   * Check a single text content field for PII (e.g., generated assessment content).
   */
  const checkContentField = async (
    content: string,
    entityId?: string | null
  ): Promise<AssessmentPIICheckResult> => {
    if (!content.trim()) {
      return { proceed: true };
    }
    
    const contentCheck = await checkText({
      text: content,
      fieldName: 'assessment_content',
      entityType: 'assessment',
      entityId: entityId ?? null,
    });
    
    if (!contentCheck.proceed) return { proceed: false };
    if (contentCheck.overridden) return { proceed: true, overridden: true };
    
    return { proceed: true };
  };

  /**
   * Check all assessment fields for PII.
   * Returns immediately if any field triggers a block.
   */
  const checkAssessmentFields = async (
    fields: AssessmentFieldsToCheck
  ): Promise<AssessmentPIICheckResult> => {
    const { lessonContext, localContext, entityId } = fields;

    // Check assessment name (lesson title)
    if (lessonContext.title.trim()) {
      const titleCheck = await checkText({
        text: lessonContext.title,
        fieldName: 'assessment_name',
        entityType: 'assessment',
        entityId: entityId ?? null,
      });
      if (!titleCheck.proceed) return { proceed: false };
      if (titleCheck.overridden) return { proceed: true, overridden: true };
    }

    // Check each assessment objective
    const objectives = lessonContext.objectives.filter(o => o.trim());
    for (let i = 0; i < objectives.length; i++) {
      const objectiveCheck = await checkText({
        text: objectives[i],
        fieldName: `assessment_objective_${i + 1}`,
        entityType: 'assessment',
        entityId: entityId ?? null,
      });
      if (!objectiveCheck.proceed) return { proceed: false };
      if (objectiveCheck.overridden) return { proceed: true, overridden: true };
    }

    // Check assessment context (free-text field)
    if (localContext.details.trim()) {
      const detailsCheck = await checkText({
        text: localContext.details,
        fieldName: 'assessment_context',
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
    checkContentField,
    modalState,
    handleEdit,
    handleOverride,
    isChecking,
    // Export modal component for convenience
    PIIWarningModal,
  };
}
