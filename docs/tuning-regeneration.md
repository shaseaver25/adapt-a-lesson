# Tuning `MAX_REGEN_ATTEMPTS`

`differentiate-lesson` regenerates a lesson when validation finds a blocking
failure, up to `MAX_REGEN_ATTEMPTS` times. The value is read from the
environment (`MAX_REGEN_ATTEMPTS`, clamped to 0–3, default 1), so it can be
changed without a redeploy.

Picking the number needs real pass rates, which cannot be measured until lessons
have run through rubric v2.0 in production. The queries below are what to run.

## What a retry costs

One full model call plus roughly 30–60 seconds of a request budget capped at
~135s. A retry is only worth it if it is reasonably likely to clear a blocking
failure — so retries are triggered by `retryableFailures()`, not by "any check
failed":

- **Advisory failures never retry.** They do not stop export, so a whole extra
  generation is a bad trade.
- **`math_requires_manual_review` never retries.** It fires on every lesson
  containing equations. It is a flag for a human, not a defect, so a retry
  returns the same flag.
- **Image checks cannot trigger a retry.** Generation-time validation runs
  before any diagram exists, so `has_all_alt_text` and `alt_text_reviewed` are
  skipped there. They are settled at export time instead.

## Query 1 — does a retry actually help?

If the second attempt rarely converts a failure into a pass, raising the cap
will not help either; the fix belongs in the prompt.

```sql
select
  regen_attempts,
  count(*)                                          as lessons,
  count(*) filter (where passed)                    as passed,
  round(100.0 * count(*) filter (where passed) / count(*), 1) as pass_pct
from lesson_validation_results
where rubric_version = 'v2.0'
group by regen_attempts
order by regen_attempts;
```

Read it as: `regen_attempts = 0` is "passed first time". A high `pass_pct` at
`regen_attempts = 1` means retries work and a second one may be worth trying. A
low one means they do not.

## Query 2 — which checks actually fail?

This says where to spend effort. A check that dominates this list is a prompt
problem, not a retry-count problem.

```sql
select
  key                                    as check_name,
  count(*)                               as failures
from lesson_validation_results,
     lateral jsonb_each(hard_check_results) as t(key, value)
where rubric_version = 'v2.0'
  and (value->>'passed')::boolean is false
  and coalesce((value->>'skipped')::boolean, false) is false
group by key
order by failures desc;
```

## Query 3 — what is still shipping broken?

Unresolved overrides are known accessibility defects live in a district's LMS.
This is the list to work down.

```sql
select
  created_at,
  lesson_title,
  export_target,
  reason,
  jsonb_array_elements(overridden_checks)->>'label' as failing_check
from lesson_export_overrides
where resolved_at is null
order by created_at;
```

## Deciding

- Blocking failures are rare (< ~5% at `regen_attempts = 0`) → leave it at 1.
- Retries convert well and failures are common → try 2, and watch p95 latency:
  the time budget skips a retry it cannot finish, so a higher cap can silently
  do nothing.
- One or two checks dominate query 2 → fix the prompt instead. A retry is the
  expensive way to work around a prompt that reliably produces the same defect.
