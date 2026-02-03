/**
 * Compliance Types for FERPA PII Detection System
 * 
 * These types support the PII detection and logging infrastructure.
 * No actual PII is ever stored - only metadata about detection events.
 */

/** Risk levels for PII detection */
export type PIIRisk = 'low' | 'medium' | 'high';

/** Types of PII patterns that can be detected */
export type PIIFindingType = 
  | 'email' 
  | 'phone' 
  | 'dob' 
  | 'student_id' 
  | 'ssn_like' 
  | 'name_like_pattern';

/** Result of PII detection scan */
export interface PIIDetectionResult {
  /** Overall risk level based on findings */
  risk: PIIRisk;
  /** Types of PII patterns found (no actual content) */
  findings: PIIFindingType[];
  /** Total number of matches across all pattern types */
  matchCount: number;
}

/** Entity types that can trigger compliance events */
export type ComplianceEntityType = 
  | 'student_group' 
  | 'lesson' 
  | 'assessment' 
  | 'rubric';

/** Event types for compliance logging */
export type ComplianceEventType = 
  | 'PII_WARNING_TRIGGERED' 
  | 'PII_OVERRIDE_USED';

/** Actions that can be taken in response to PII detection */
export type ComplianceAction = 
  | 'blocked' 
  | 'edited' 
  | 'override_allowed';

/** 
 * Payload for logging compliance events to the database.
 * CRITICAL: Never include actual PII text in this payload.
 */
export interface ComplianceEventPayload {
  /** User who triggered the event */
  user_id: string;
  /** Type of compliance event */
  event_type: ComplianceEventType;
  /** Type of entity being created/edited */
  entity_type: ComplianceEntityType;
  /** ID of the entity (null if not yet created) */
  entity_id: string | null;
  /** Name of the field that triggered detection */
  field_name: string;
  /** Risk level from detection */
  risk_level: PIIRisk;
  /** Array of finding types only (no content) */
  findings: PIIFindingType[];
  /** Total match count */
  match_count: number;
  /** Action taken by user/system */
  action_taken: ComplianceAction | null;
}

/** Configuration for PII detection behavior */
export interface PIIDetectionConfig {
  /** Minimum year for DOB to be considered a student (e.g., 2000) */
  minStudentBirthYear: number;
  /** Maximum year for DOB to be considered a student (current year - 3) */
  maxStudentBirthYear: number;
  /** Threshold for name-like patterns to trigger medium risk */
  nameLikeThreshold: number;
}

/** Default configuration for PII detection */
export const DEFAULT_PII_CONFIG: PIIDetectionConfig = {
  minStudentBirthYear: 2000,
  maxStudentBirthYear: new Date().getFullYear() - 3,
  nameLikeThreshold: 2,
};
