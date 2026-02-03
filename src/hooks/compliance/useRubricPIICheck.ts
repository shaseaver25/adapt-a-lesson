/**
 * Rubric PII Check Helper
 * 
 * Provides convenience functions to check rubric-related fields for PII.
 * Uses the core usePIIGuard hook internally.
 */

import { usePIIGuard } from './usePIIGuard';
import { PIIWarningModal } from '@/components/compliance/PIIWarningModal';

/** Fields to check in rubric forms */
interface RubricFieldsToCheck {
  /** Rubric name (optional) */
  rubricName?: string;
  /** Assessment description */
  assessmentDescription: string;
  /** Learning objectives array */
  objectives: string[];
  /** Optional entity ID if editing existing rubric */
  entityId?: string | null;
}

/** Result of checking rubric fields */
interface RubricPIICheckResult {
  /** Whether to proceed with the operation */
  proceed: boolean;
  /** Whether an admin override was used */
  overridden?: boolean;
}

/**
 * Hook for checking PII in rubric forms.
 * Checks rubric name, assessment description, and objectives.
 * 
 * @example
 * const { checkRubricFields, modalState, handleEdit, handleOverride, isChecking } = useRubricPIICheck();
 * 
 * const handleGenerate = async () => {
 *   const { proceed } = await checkRubricFields({
 *     rubricName,
 *     assessmentDescription,
 *     objectives,
 *   });
 *   if (!proceed) return;
 *   // Continue with generation...
 * };
 */
export function useRubricPIICheck() {
  const { checkText, modalState, handleEdit, handleOverride, isChecking } = usePIIGuard();

  /**
   * Check a single text content field for PII (e.g., generated rubric content).
   */
  const checkContentField = async (
    content: string,
    entityId?: string | null
  ): Promise<RubricPIICheckResult> => {
    if (!content.trim()) {
      return { proceed: true };
    }
    
    const contentCheck = await checkText({
      text: content,
      fieldName: 'rubric_content',
      entityType: 'rubric',
      entityId: entityId ?? null,
    });
    
    if (!contentCheck.proceed) return { proceed: false };
    if (contentCheck.overridden) return { proceed: true, overridden: true };
    
    return { proceed: true };
  };

  /**
   * Check all rubric input fields for PII.
   * Returns immediately if any field triggers a block.
   */
  const checkRubricFields = async (
    fields: RubricFieldsToCheck
  ): Promise<RubricPIICheckResult> => {
    const { rubricName, assessmentDescription, objectives, entityId } = fields;

    // Check rubric name if provided
    if (rubricName && rubricName.trim()) {
      const nameCheck = await checkText({
        text: rubricName,
        fieldName: 'rubric_name',
        entityType: 'rubric',
        entityId: entityId ?? null,
      });
      if (!nameCheck.proceed) return { proceed: false };
      if (nameCheck.overridden) return { proceed: true, overridden: true };
    }

    // Check assessment description (rubric context)
    if (assessmentDescription.trim()) {
      const descCheck = await checkText({
        text: assessmentDescription,
        fieldName: 'rubric_context',
        entityType: 'rubric',
        entityId: entityId ?? null,
      });
      if (!descCheck.proceed) return { proceed: false };
      if (descCheck.overridden) return { proceed: true, overridden: true };
    }

    // Check each objective
    const filteredObjectives = objectives.filter(o => o.trim());
    for (let i = 0; i < filteredObjectives.length; i++) {
      const objectiveCheck = await checkText({
        text: filteredObjectives[i],
        fieldName: `rubric_objective_${i + 1}`,
        entityType: 'rubric',
        entityId: entityId ?? null,
      });
      if (!objectiveCheck.proceed) return { proceed: false };
      if (objectiveCheck.overridden) return { proceed: true, overridden: true };
    }

    return { proceed: true };
  };

  return {
    checkRubricFields,
    checkContentField,
    modalState,
    handleEdit,
    handleOverride,
    isChecking,
    // Export modal component for convenience
    PIIWarningModal,
  };
}
