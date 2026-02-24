

# Plan: Marketing Survey & Analytics

## Overview

Build a dedicated Marketing Survey system separate from the existing product feedback form. This includes a new multi-step survey page at `/marketing-survey`, a new database table, and a new admin tab to view/analyze responses with NPS tracking.

## Database Changes

**New table: `marketing_surveys`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | nullable (allow anonymous if shared externally) |
| created_at | timestamptz | default now() |
| primary_role | text | required |
| grade_levels | text[] | checkboxes |
| usage_duration | text | how long using RealPath |
| lessons_per_week | text | |
| features_used | text[] | checkboxes |
| time_saved_rating | integer | 1-10 scale |
| previous_method | text | multiple choice |
| lesson_quality_satisfaction | integer | 1-5 |
| multilingual_satisfaction | integer | 1-5 |
| student_impact | text | Yes/No/Too early |
| nps_score | integer | 0-10, the critical metric |
| wcag_adoption_factor | text | Yes/No/Not sure |
| ocr_complaint | text | Yes/No/Prefer not to say |
| most_valuable_thing | text | open-ended |
| improvement_suggestion | text | open-ended |
| incentive_claimed | boolean | default false |
| incentive_claim_date | timestamptz | |

RLS policies: users can insert their own; admins can read all.

## New Files

1. **`src/pages/MarketingSurvey.tsx`** - 4-step form:
   - Step 1: About You (role, grade levels, usage duration)
   - Step 2: Usage & Value (lessons/week, features used, time saved, previous method)
   - Step 3: Satisfaction & Impact (lesson quality, multilingual, student impact, NPS 0-10)
   - Step 4: Compliance & Open Feedback (WCAG factor, OCR complaint, most valuable thing, improvement suggestion)

2. **`src/hooks/useMarketingSurveyForm.ts`** - Form state management with localStorage draft persistence (mirrors existing `useFeedbackForm` pattern)

3. **`src/components/admin/AdminMarketingSurvey.tsx`** - Admin analytics tab with:
   - NPS score calculation and trend chart (Promoters 9-10, Passives 7-8, Detractors 0-6)
   - Average time-saved rating
   - Feature usage breakdown (bar chart)
   - Role and grade level distribution (pie charts)
   - Student impact breakdown
   - WCAG/OCR compliance insights for enterprise sales
   - Table of all responses with search, pagination, CSV export
   - Detail modal for individual responses

## Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add route `/marketing-survey` |
| `src/pages/Admin.tsx` | Add "Marketing Survey" tab with icon |

## Key Design Decisions

- **Separate from existing feedback**: The existing `/feedback` form is product-focused. This survey is marketing/sales-focused with NPS, compliance questions, and interview-prep data.
- **NPS calculation**: `NPS = %Promoters(9-10) - %Detractors(0-6)`, displayed prominently in admin view.
- **Same incentive pattern**: Offer 30-day free extension for completing the survey (reuses `subscription_overrides` table).
- **The interview questions are NOT included in the digital form** since they're designed for live conversations. They could be added as a downloadable guide or reference in the admin panel.

## Technical Details

- The NPS 0-10 slider will use the existing `@radix-ui/react-slider` component
- Star ratings reuse existing `StarRating` component for 1-5 scales
- Charts use existing `recharts` dependency
- Form draft auto-saves to localStorage (same pattern as feedback form)
- Survey responses exportable as CSV from admin panel

