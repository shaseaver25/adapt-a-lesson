
# Implementation Plan: PII Detection Unit Tests

## Summary
Add minimal Vitest infrastructure and comprehensive unit tests for the PII detection utilities (`detectPotentialPII` and `mightContainPII`).

---

## Changes Overview

### 1. Modify `package.json`
Add vitest as a dev dependency and test scripts.

**Changes:**
- Add `"vitest": "^3.2.4"` to devDependencies
- Add scripts:
  - `"test": "vitest"` (watch mode)
  - `"test:run": "vitest run"` (single run)

---

### 2. Create `vitest.config.ts`
Minimal configuration for pure TypeScript utility testing.

**Configuration:**
- Environment: `node` (no DOM needed)
- Globals: `true` (but we'll still use explicit imports for clarity)
- Include pattern: `src/**/*.{test,spec}.{ts,tsx}`
- Alias: `@` → `./src` (matching existing Vite config)

---

### 3. Create Test File
**Path:** `src/lib/compliance/__tests__/detectPotentialPII.test.ts`

**Test Structure (~180 lines):**

```
detectPotentialPII()
├── Low risk cases
│   ├── "Group A: reading level 3" → low, [], 0
│   ├── "Discuss chapter 2 pages 10-12" → low, [], 0
│   └── "Room 204, period 5" → low, [], 0
│
├── Medium risk cases
│   ├── Email detection
│   ├── Phone detection
│   └── Multiple name patterns (≥2)
│
├── High risk cases
│   ├── DOB plausible (2012)
│   ├── Student ID pattern
│   └── SSN-like pattern
│
├── DOB sanity checks (NOT high)
│   ├── Historical date (1776)
│   ├── Future date (2099)
│   └── Old adult date (1975)
│
├── False positive filtering
│   ├── "Reading Level" (from NAME_FALSE_POSITIVES)
│   └── "Student Group" (from NAME_FALSE_POSITIVES)
│
└── Edge cases
    ├── Empty string
    └── Very short string

mightContainPII()
├── Returns false
│   ├── Empty string
│   ├── "Hello world"
│   └── "abc"
│
└── Returns true
    ├── Email indicator (@)
    ├── Phone pattern
    ├── SSN pattern
    └── Year pattern (2012)
```

---

## False Positive Test Values
Using actual values from `NAME_FALSE_POSITIVES` in the codebase:
- `"Reading Level"` (line 123)
- `"Student Group"` (line 128)

---

## Running Tests

After implementation:
```bash
# Watch mode (re-runs on file changes)
npm run test

# Single run (CI/CD friendly)
npm run test:run
```

---

## No Changes Required
- **tsconfig.json**: Not needed (using explicit vitest imports)
- **Production code**: No modifications
- **Other dependencies**: Only vitest added
