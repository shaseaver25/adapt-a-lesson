/**
 * PII Detection Utility
 * 
 * Scans text for potential personally identifiable information
 * and returns risk assessment WITHOUT exposing the actual content.
 * 
 * This is the core FERPA compliance detection engine.
 */

import type { 
  PIIDetectionResult, 
  PIIFindingType, 
  PIIRisk,
  PIIDetectionConfig 
} from '@/types/compliance';
import { DEFAULT_PII_CONFIG } from '@/types/compliance';
import { 
  PII_PATTERNS, 
  PATTERN_ORDER, 
  NAME_FALSE_POSITIVES,
  extractYearFromDate 
} from './piiPatterns';

/**
 * Detect potential PII in text and return risk assessment.
 * 
 * @param text - The text to scan for PII patterns
 * @param config - Optional configuration overrides
 * @returns Detection result with risk level, finding types, and match count
 * 
 * @example
 * const result = detectPotentialPII("Contact john.smith@email.com");
 * // { risk: 'medium', findings: ['email'], matchCount: 1 }
 */
export function detectPotentialPII(
  text: string,
  config: PIIDetectionConfig = DEFAULT_PII_CONFIG
): PIIDetectionResult {
  // Fast path for empty or very short text
  if (!text || text.length < 3) {
    return { risk: 'low', findings: [], matchCount: 0 };
  }

  const findings: PIIFindingType[] = [];
  const matchCounts: Partial<Record<PIIFindingType, number>> = {};
  let totalMatchCount = 0;

  // Scan for each pattern type in priority order
  for (const patternType of PATTERN_ORDER) {
    const pattern = PII_PATTERNS[patternType];
    
    // Reset regex state (important for global regexes)
    pattern.regex.lastIndex = 0;
    
    const matches = text.match(pattern.regex);
    
    if (matches && matches.length > 0) {
      // Apply pattern-specific validation
      const validatedCount = validateMatches(
        patternType, 
        matches, 
        config
      );
      
      if (validatedCount > 0) {
        findings.push(patternType);
        matchCounts[patternType] = validatedCount;
        totalMatchCount += validatedCount;
      }
    }
  }

  // Calculate risk level based on findings
  const risk = calculateRiskLevel(findings, matchCounts, config);

  return {
    risk,
    findings,
    matchCount: totalMatchCount,
  };
}

/**
 * Validate matches with pattern-specific logic.
 * Returns the count of validated matches.
 */
function validateMatches(
  patternType: PIIFindingType,
  matches: string[],
  config: PIIDetectionConfig
): number {
  switch (patternType) {
    case 'dob':
      return validateDOBMatches(matches, config);
    
    case 'name_like_pattern':
      return validateNameMatches(matches);
    
    case 'ssn_like':
      return validateSSNMatches(matches);
    
    case 'phone':
      return validatePhoneMatches(matches);
    
    default:
      // Email, student_id: accept all matches
      return matches.length;
  }
}

/**
 * Validate DOB matches - only flag if year is in student range.
 */
function validateDOBMatches(
  matches: string[],
  config: PIIDetectionConfig
): number {
  let validCount = 0;
  
  for (const match of matches) {
    const year = extractYearFromDate(match);
    
    if (year !== null) {
      // Only flag as DOB if year is in plausible student birth range
      if (year >= config.minStudentBirthYear && year <= config.maxStudentBirthYear) {
        validCount++;
      }
    }
  }
  
  return validCount;
}

/**
 * Validate name-like matches - filter out common false positives.
 */
function validateNameMatches(matches: string[]): number {
  let validCount = 0;
  
  for (const match of matches) {
    // Skip known false positives (educational terms, city names)
    if (!NAME_FALSE_POSITIVES.has(match)) {
      validCount++;
    }
  }
  
  return validCount;
}

/**
 * Validate SSN matches - filter out obvious non-SSNs.
 */
function validateSSNMatches(matches: string[]): number {
  let validCount = 0;
  
  for (const match of matches) {
    // Extract digits only
    const digits = match.replace(/\D/g, '');
    
    // SSN cannot start with 000, 666, or 900-999
    const firstThree = parseInt(digits.substring(0, 3), 10);
    if (firstThree === 0 || firstThree === 666 || firstThree >= 900) {
      continue;
    }
    
    // Middle two digits cannot be 00
    const middleTwo = parseInt(digits.substring(3, 5), 10);
    if (middleTwo === 0) {
      continue;
    }
    
    // Last four cannot be 0000
    const lastFour = parseInt(digits.substring(5, 9), 10);
    if (lastFour === 0) {
      continue;
    }
    
    validCount++;
  }
  
  return validCount;
}

/**
 * Validate phone matches - ensure they look like real phone numbers.
 */
function validatePhoneMatches(matches: string[]): number {
  let validCount = 0;
  
  for (const match of matches) {
    const digits = match.replace(/\D/g, '');
    
    // Must have exactly 10 or 11 digits (with country code)
    if (digits.length === 10 || digits.length === 11) {
      // Area code cannot start with 0 or 1
      const areaCodeStart = digits.length === 11 ? 1 : 0;
      const areaCode = parseInt(digits.charAt(areaCodeStart), 10);
      
      if (areaCode >= 2) {
        validCount++;
      }
    }
  }
  
  return validCount;
}

/**
 * Calculate overall risk level based on findings.
 * 
 * Risk rules:
 * - HIGH: Any SSN-like, student ID, or DOB pattern
 * - MEDIUM: Any email or phone pattern
 * - MEDIUM: 2+ name-like patterns (configurable threshold)
 * - LOW: Otherwise
 */
function calculateRiskLevel(
  findings: PIIFindingType[],
  matchCounts: Partial<Record<PIIFindingType, number>>,
  config: PIIDetectionConfig
): PIIRisk {
  // High risk patterns
  const highRiskPatterns: PIIFindingType[] = ['ssn_like', 'student_id', 'dob'];
  if (findings.some(f => highRiskPatterns.includes(f))) {
    return 'high';
  }
  
  // Medium risk patterns
  const mediumRiskPatterns: PIIFindingType[] = ['email', 'phone'];
  if (findings.some(f => mediumRiskPatterns.includes(f))) {
    return 'medium';
  }
  
  // Name-like patterns with threshold
  const nameCount = matchCounts['name_like_pattern'] ?? 0;
  if (nameCount >= config.nameLikeThreshold) {
    return 'medium';
  }
  
  // Default to low
  return 'low';
}

/**
 * Quick check if text likely contains PII (for performance optimization).
 * Use this for fast pre-filtering before full detection.
 */
export function mightContainPII(text: string): boolean {
  if (!text || text.length < 5) {
    return false;
  }
  
  // Quick checks for common PII indicators
  return (
    text.includes('@') || // Email
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(text) || // Phone
    /\d{3}[-\s]?\d{2}[-\s]?\d{4}/.test(text) || // SSN
    /\b(19|20)\d{2}\b/.test(text) // Year (potential DOB)
  );
}
