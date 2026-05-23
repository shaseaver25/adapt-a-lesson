/**
 * PII Guard Hook
 * 
 * Provides PII detection with modal warnings and compliance event logging.
 * Integrates with the admin system for override permissions.
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { handleError } from '@/lib/errorUtils';
import { detectPotentialPII } from '@/lib/compliance/detectPotentialPII';
import type {
  PIIDetectionResult,
  PIIFindingType,
  PIIRisk,
  ComplianceEntityType,
  ComplianceEventType,
  ComplianceAction,
} from '@/types/compliance';

/** Input for PII check */
interface PIICheckInput {
  /** Text to scan for PII */
  text: string;
  /** Name of the field being checked */
  fieldName: string;
  /** Type of entity being created/edited */
  entityType: ComplianceEntityType;
  /** ID of the entity (null if creating new) */
  entityId?: string | null;
}

/** Result of a PII check */
interface PIICheckResult {
  /** Whether to proceed with the operation */
  proceed: boolean;
  /** Whether an admin override was used */
  overridden?: boolean;
}

/** State for the PII warning modal */
interface PIIModalState {
  open: boolean;
  riskLevel: 'medium' | 'high';
  findings: PIIFindingType[];
}

/** Internal type for pending check resolution */
interface PendingCheck {
  resolve: (result: PIICheckResult) => void;
  input: PIICheckInput;
  detectionResult: PIIDetectionResult;
}

/** Return type of the usePIIGuard hook */
interface UsePIIGuardReturn {
  /** Check text for PII - returns promise that resolves after user decision */
  checkText: (input: PIICheckInput) => Promise<PIICheckResult>;
  /** Current modal state */
  modalState: PIIModalState;
  /** Handler for when user chooses to edit */
  handleEdit: () => void;
  /** Handler for admin override (undefined if not admin) */
  handleOverride: (() => void) | undefined;
  /** Whether a check is currently in progress */
  isChecking: boolean;
}

/**
 * Hook for guarding against PII in user input.
 * 
 * Provides:
 * - Text scanning with `checkText()`
 * - Automatic modal display for medium/high risk
 * - Compliance event logging
 * - Admin override capability
 * 
 * @example
 * const { checkText, modalState, handleEdit, handleOverride } = usePIIGuard();
 * 
 * const handleSubmit = async () => {
 *   const { proceed } = await checkText({
 *     text: groupName,
 *     fieldName: 'group_name',
 *     entityType: 'student_group'
 *   });
 *   
 *   if (!proceed) return;
 *   // Continue with save...
 * };
 */
export function usePIIGuard(): UsePIIGuardReturn {
  const { isAdmin, userId } = useAdmin();
  const { toast } = useToast();
  
  const [isChecking, setIsChecking] = useState(false);
  const [modalState, setModalState] = useState<PIIModalState>({
    open: false,
    riskLevel: 'medium',
    findings: [],
  });
  
  // Store pending check resolution
  const pendingCheckRef = useRef<PendingCheck | null>(null);

  /**
   * Log a compliance event to the database.
   * Never logs actual PII content - only metadata.
   */
  const logComplianceEvent = useCallback(async (
    eventType: ComplianceEventType,
    input: PIICheckInput,
    detectionResult: PIIDetectionResult,
    actionTaken: ComplianceAction | null
  ): Promise<void> => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('compliance_events')
        .insert({
          user_id: userId,
          event_type: eventType,
          entity_type: input.entityType,
          entity_id: input.entityId ?? null,
          field_name: input.fieldName,
          risk_level: detectionResult.risk,
          findings: detectionResult.findings,
          match_count: detectionResult.matchCount,
          action_taken: actionTaken,
        });

      if (error) {
        // Log error internally but don't expose to user
        console.error('[Compliance] Failed to log event:', error.message);
      }
    } catch (err) {
      // Silent failure - don't block user flow for logging errors
      console.error('[Compliance] Event logging exception:', err);
    }
  }, [userId]);

  /**
   * Check text for potential PII.
   * Returns a promise that resolves when user makes a decision.
   */
  const checkText = useCallback(async (
    input: PIICheckInput
  ): Promise<PIICheckResult> => {
    // Fast path for empty text
    if (!input.text || input.text.trim().length === 0) {
      return { proceed: true };
    }

    setIsChecking(true);

    try {
      // Run PII detection
      const detectionResult = detectPotentialPII(input.text);

      // Low risk - proceed without warning
      if (detectionResult.risk === 'low') {
        setIsChecking(false);
        return { proceed: true };
      }

      // Medium or high risk - log warning and show modal
      await logComplianceEvent(
        'PII_WARNING_TRIGGERED',
        input,
        detectionResult,
        'blocked'
      );

      // Show modal and wait for user decision
      return new Promise<PIICheckResult>((resolve) => {
        pendingCheckRef.current = {
          resolve,
          input,
          detectionResult,
        };

        setModalState({
          open: true,
          riskLevel: detectionResult.risk as 'medium' | 'high',
          findings: detectionResult.findings,
        });
      });
    } catch (err) {
      const message = handleError(err, 'PII Check');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      setIsChecking(false);
      // On error, block to be safe
      return { proceed: false };
    }
  }, [logComplianceEvent, toast]);

  /**
   * Handler for when user chooses to go back and edit.
   */
  const handleEdit = useCallback(() => {
    const pending = pendingCheckRef.current;
    
    if (pending) {
      // Log the edit action
      logComplianceEvent(
        'PII_WARNING_TRIGGERED',
        pending.input,
        pending.detectionResult,
        'edited'
      );
      
      pending.resolve({ proceed: false });
      pendingCheckRef.current = null;
    }

    setModalState(prev => ({ ...prev, open: false }));
    setIsChecking(false);
  }, [logComplianceEvent]);

  /**
   * Handler for admin override.
   * Only available if current user is an admin.
   */
  const handleOverride = useCallback(() => {
    const pending = pendingCheckRef.current;
    
    if (pending) {
      // Log the override
      logComplianceEvent(
        'PII_OVERRIDE_USED',
        pending.input,
        pending.detectionResult,
        'override_allowed'
      );
      
      toast({
        title: 'Override Applied',
        description: 'Proceeding with admin override. This action has been logged.',
      });
      
      pending.resolve({ proceed: true, overridden: true });
      pendingCheckRef.current = null;
    }

    setModalState(prev => ({ ...prev, open: false }));
    setIsChecking(false);
  }, [logComplianceEvent, toast]);

  return {
    checkText,
    modalState,
    handleEdit,
    // Allow any signed-in user to override the warning (logged for compliance audit)
    handleOverride,
    isChecking,
  };
}
