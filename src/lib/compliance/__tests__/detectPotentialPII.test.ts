/**
 * PII Detection Unit Tests
 * 
 * Tests for detectPotentialPII() and mightContainPII() utilities.
 * Assertions are ONLY on risk, findings, and matchCount - never on matched text.
 */

import { describe, it, expect } from 'vitest';
import { detectPotentialPII, mightContainPII } from '../detectPotentialPII';

describe('detectPotentialPII', () => {
  describe('Low risk cases', () => {
    it('returns low risk for educational group text', () => {
      const result = detectPotentialPII('Group A: reading level 3');
      expect(result.risk).toBe('low');
      expect(result.findings).toEqual([]);
      expect(result.matchCount).toBe(0);
    });

    it('returns low risk for chapter discussion text', () => {
      const result = detectPotentialPII('Discuss chapter 2 pages 10-12');
      expect(result.risk).toBe('low');
      expect(result.findings).toEqual([]);
      expect(result.matchCount).toBe(0);
    });

    it('returns low risk for room and period text', () => {
      const result = detectPotentialPII('Room 204, period 5');
      expect(result.risk).toBe('low');
      expect(result.findings).toEqual([]);
      expect(result.matchCount).toBe(0);
    });
  });

  describe('Medium risk cases', () => {
    it('detects email as medium risk', () => {
      const result = detectPotentialPII('contact me at teacher@school.org');
      expect(result.risk).toBe('medium');
      expect(result.findings).toContain('email');
      expect(result.matchCount).toBeGreaterThan(0);
    });

    it('detects phone number as medium risk', () => {
      const result = detectPotentialPII('Call 612-555-1212');
      expect(result.risk).toBe('medium');
      expect(result.findings).toContain('phone');
      expect(result.matchCount).toBeGreaterThan(0);
    });

    it('detects multiple name patterns as medium risk', () => {
      const result = detectPotentialPII('Anna Smith and John Davis');
      expect(result.risk).toBe('medium');
      expect(result.findings).toContain('name_like_pattern');
      expect(result.matchCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('High risk cases', () => {
    it('detects plausible DOB as high risk', () => {
      const result = detectPotentialPII('DOB 02/14/2012');
      expect(result.risk).toBe('high');
      expect(result.findings).toContain('dob');
    });

    it('detects student ID as high risk', () => {
      const result = detectPotentialPII('Student ID 1234567');
      expect(result.risk).toBe('high');
      expect(result.findings).toContain('student_id');
    });

    it('detects SSN-like pattern as high risk', () => {
      const result = detectPotentialPII('123-45-6789');
      expect(result.risk).toBe('high');
      expect(result.findings).toContain('ssn_like');
    });
  });

  describe('DOB sanity checks - should NOT flag as high risk', () => {
    it('does not flag historical date (1776) as DOB', () => {
      const result = detectPotentialPII('07/04/1776');
      expect(result.risk).not.toBe('high');
      expect(result.findings).not.toContain('dob');
    });

    it('does not flag future date (2099) as DOB', () => {
      const result = detectPotentialPII('01/01/2099');
      expect(result.risk).not.toBe('high');
      expect(result.findings).not.toContain('dob');
    });

    it('does not flag old adult date (1975) as DOB', () => {
      const result = detectPotentialPII('03/03/1975');
      expect(result.risk).not.toBe('high');
      expect(result.findings).not.toContain('dob');
    });
  });

  describe('False positive filtering', () => {
    it('does not flag "Reading Level" as name-like pattern', () => {
      const result = detectPotentialPII('Reading Level');
      expect(result.risk).toBe('low');
      expect(result.findings).not.toContain('name_like_pattern');
    });

    it('does not flag "Student Group" as name-like pattern', () => {
      const result = detectPotentialPII('Student Group');
      expect(result.risk).toBe('low');
      expect(result.findings).not.toContain('name_like_pattern');
    });

    it('does not flag "San Francisco" as name-like pattern', () => {
      const result = detectPotentialPII('San Francisco');
      expect(result.risk).toBe('low');
      expect(result.findings).not.toContain('name_like_pattern');
    });
  });

  describe('Edge cases', () => {
    it('returns low risk for empty string', () => {
      const result = detectPotentialPII('');
      expect(result.risk).toBe('low');
      expect(result.findings).toEqual([]);
      expect(result.matchCount).toBe(0);
    });

    it('returns low risk for very short string', () => {
      const result = detectPotentialPII('ab');
      expect(result.risk).toBe('low');
      expect(result.findings).toEqual([]);
      expect(result.matchCount).toBe(0);
    });
  });
});

describe('mightContainPII', () => {
  describe('returns false for safe strings', () => {
    it('returns false for empty string', () => {
      expect(mightContainPII('')).toBe(false);
    });

    it('returns false for "Hello world"', () => {
      expect(mightContainPII('Hello world')).toBe(false);
    });

    it('returns false for very short string', () => {
      expect(mightContainPII('abc')).toBe(false);
    });
  });

  describe('returns true for PII indicators', () => {
    it('returns true for email indicator', () => {
      expect(mightContainPII('test@email.com')).toBe(true);
    });

    it('returns true for phone pattern', () => {
      expect(mightContainPII('555-123-4567')).toBe(true);
    });

    it('returns true for SSN pattern', () => {
      expect(mightContainPII('123-45-6789')).toBe(true);
    });

    it('returns true for year pattern indicating potential DOB', () => {
      expect(mightContainPII('born in 2012')).toBe(true);
    });
  });
});
