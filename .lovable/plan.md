

# Fix Site Analytics to Show Accurate Data

## Problem

The admin Site Traffic dashboard currently shows **fabricated numbers**. Specific issues:

1. **Visitors are inflated**: Each login attempt timestamp is treated as a unique visitor (e.g., 421 "visitors" from 3 real users)
2. **Hardcoded fallback values**: Traffic sources, devices, countries, bounce rate, and session duration all use made-up numbers
3. **No page view tracking**: Nothing in the app records which pages users visit

## Solution

### Step 1: Create a `page_views` table

A new database table to track actual page views with real metadata:

- `user_id` (nullable for anonymous visits)
- `page_path` (e.g., "/studio", "/saved-lessons")
- `referrer` (where the user came from)
- `user_agent` (to determine device type)
- `session_id` (to calculate bounce rate and pages per visit)
- `created_at`

RLS policies: authenticated users can insert their own page views; admins can read all.

### Step 2: Add client-side page view tracker

A small React hook (`usePageViewTracker`) that:

- Fires on every route change using `react-router-dom`'s `useLocation`
- Inserts a row into `page_views` with the current path, referrer, user agent, and a session ID
- Only tracks authenticated users (since anonymous tracking without consent raises privacy concerns)
- Debounces/deduplicates rapid navigation

### Step 3: Rewrite the Edge Function

Update `get-site-analytics` to query **real data** from `page_views` and `user_sessions`:

- **Visitors**: `COUNT(DISTINCT user_id)` from `page_views`
- **Page Views**: `COUNT(*)` from `page_views`
- **Top Pages**: `GROUP BY page_path` ordered by count
- **Devices**: Parse `user_agent` for Desktop vs Mobile
- **Traffic Sources**: Parse `referrer` field
- **Session Duration**: Average from `user_sessions.session_duration_seconds`
- **Bounce Rate**: Percentage of sessions with only 1 page view
- **Countries**: Show "Not tracked" (we don't collect IP geolocation for privacy)

Remove all hardcoded fallback values. Show zeros and "No data yet" when there is no data.

### Step 4: Update the dashboard UI

- Remove the hardcoded `getFallbackData()` function from `AdminSiteAnalytics.tsx`
- Add a small banner: "Data shown reflects authenticated user activity only" so admins understand the scope
- Show "No data yet" states instead of fake numbers
- Countries section: display "Not tracked (privacy)" or remove entirely

## What will be accurate vs. not tracked

| Metric | Source | Accuracy |
|--------|--------|----------|
| Visitors | Unique user_ids in page_views | Accurate for logged-in users |
| Page Views | Count of page_view rows | Accurate for logged-in users |
| Top Pages | Grouped page_views | Accurate |
| Session Duration | user_sessions table | Accurate |
| Bounce Rate | Sessions with 1 page view | Accurate |
| Devices | User agent parsing | Approximate |
| Traffic Sources | Referrer header | Partial (often empty for direct) |
| Countries | Not collected | Will show "Not tracked" |

## Technical Details

### New table SQL

```text
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  page_path text NOT NULL,
  referrer text,
  user_agent text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Users can insert their own page views
CREATE POLICY "Users can insert own page views"
  ON public.page_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all page views
CREATE POLICY "Admins can view all page views"
  ON public.page_views FOR SELECT
  USING (is_admin(auth.uid()));
```

### Files to create
- `src/hooks/usePageViewTracker.ts` — route change listener that inserts into `page_views`

### Files to modify
- `supabase/functions/get-site-analytics/index.ts` — rewrite to query `page_views` table
- `src/components/admin/AdminSiteAnalytics.tsx` — remove fake fallback data, add "authenticated users only" note
- `src/App.tsx` — add the `usePageViewTracker` hook

### Privacy considerations
- Only tracks logged-in users (no anonymous visitor tracking)
- No IP-based geolocation
- User agent is stored for device categorization only
- Referrer is captured from the browser's standard header
