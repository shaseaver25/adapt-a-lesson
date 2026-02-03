/**
 * PII Detection Patterns
 * 
 * Centralized regex patterns for detecting potential PII.
 * These patterns are designed to catch common formats while
 * minimizing false positives.
 * 
 * IMPORTANT: These patterns are for warning purposes only.
 * False positives are acceptable; false negatives are not.
 */

import type { PIIFindingType } from '@/types/compliance';

/** Pattern definition with metadata */
export interface PIIPattern {
  /** Regex pattern for detection */
  regex: RegExp;
  /** Finding type for logging */
  type: PIIFindingType;
  /** Whether this pattern indicates high risk */
  isHighRisk: boolean;
}

/**
 * Email pattern
 * Matches: user@domain.com, first.last@school.edu
 * Intentionally broad to catch variations
 */
const EMAIL_PATTERN: PIIPattern = {
  regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  type: 'email',
  isHighRisk: false,
};

/**
 * Phone number patterns
 * Matches: (555) 123-4567, 555-123-4567, 555.123.4567, 5551234567
 * Requires 10+ digits to avoid matching short number sequences
 */
const PHONE_PATTERN: PIIPattern = {
  regex: /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,
  type: 'phone',
  isHighRisk: false,
};

/**
 * Date of birth patterns
 * Matches: MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD, Month DD, YYYY
 * Note: Year validation happens in detector, not here
 */
const DOB_PATTERN: PIIPattern = {
  regex: /\b(?:(?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])[-/](?:19|20)\d{2}|(?:19|20)\d{2}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+(?:19|20)\d{2})\b/gi,
  type: 'dob',
  isHighRisk: true,
};

/**
 * Student ID patterns
 * Matches: Common student ID formats like S12345678, STU-12345, 900123456
 * Intentionally catches various institutional formats
 */
const STUDENT_ID_PATTERN: PIIPattern = {
  regex: /\b(?:S(?:TU)?[-_]?\d{5,9}|ID[-_:]?\s*\d{5,10}|\d{9,10})\b/gi,
  type: 'student_id',
  isHighRisk: true,
};

/**
 * SSN-like patterns
 * Matches: 123-45-6789, 123 45 6789
 * Very high risk - likely actual SSN
 */
const SSN_PATTERN: PIIPattern = {
  regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  type: 'ssn_like',
  isHighRisk: true,
};

/**
 * Name-like patterns
 * Matches: Capitalized word pairs that look like names
 * Examples: "John Smith", "Maria Garcia-Lopez"
 * 
 * This has the highest false positive rate but catches
 * the most common PII entry mistake (typing student names)
 */
const NAME_LIKE_PATTERN: PIIPattern = {
  regex: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z'-]+)+\b/g,
  type: 'name_like_pattern',
  isHighRisk: false,
};

/**
 * All PII patterns indexed by finding type
 */
export const PII_PATTERNS: Record<PIIFindingType, PIIPattern> = {
  email: EMAIL_PATTERN,
  phone: PHONE_PATTERN,
  dob: DOB_PATTERN,
  student_id: STUDENT_ID_PATTERN,
  ssn_like: SSN_PATTERN,
  name_like_pattern: NAME_LIKE_PATTERN,
};

/**
 * Ordered list of patterns for consistent iteration
 * Order: High-risk patterns first for early exit optimization
 */
export const PATTERN_ORDER: PIIFindingType[] = [
  'ssn_like',
  'student_id', 
  'dob',
  'email',
  'phone',
  'name_like_pattern',
];

/**
 * Common false positive terms to exclude from name detection
 * These are educational terms that match name-like patterns
 */
export const NAME_FALSE_POSITIVES = new Set([
  'Reading Level',
  'Grade Level',
  'English Language',
  'Home Language',
  'Learning Objectives',
  'Student Group',
  'Extended Time',
  'Visual Supports',
  'Audio Support',
  'Reduced Workload',
  'Graphic Organizer',
  'New York',
  'Los Angeles',
  'San Francisco',
  'Las Vegas',
  'San Diego',
  'San Antonio',
  'El Paso',
  'United States',
]);

/**
 * Extract year from a date string if present
 * Used for DOB year validation
 */
export function extractYearFromDate(dateStr: string): number | null {
  // Match 4-digit year
  const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return parseInt(yearMatch[0], 10);
  }
  return null;
}
