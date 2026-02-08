

# Welcome Email Implementation Plan

## Overview
Implement a welcome email that triggers automatically when new users register. The email will use the template you provided, with dynamic content from the `profiles` table.

## Architecture Decision: Resend vs Gmail

| Option | Pros | Cons |
|--------|------|------|
| **Resend (Recommended)** | Already configured, domain verified, reliable delivery, simple | Not Gmail directly |
| Gmail API | Sends from actual Gmail | Complex OAuth, token refresh, 500/day limit, not designed for transactional email |

**Recommendation**: Continue using Resend but change the "from" address to `support@realpathlearning.com`. This way:
- Emails send reliably from your verified domain
- When users click "reply", it goes to your Google Workspace inbox
- No additional API keys or OAuth needed

---

## Implementation Steps

### Step 1: Create Welcome Email Edge Function
**New file**: `supabase/functions/send-welcome-email/index.ts`

**Request payload**:
```text
{
  email: string
  userName: string | null
}
```

**Email content** (based on your template):
- **From**: `RealPath Learning <support@realpathlearning.com>`
- **Subject**: "Welcome to RealPath Learning : Let's Build Your First Lesson"
- **Dynamic fields**:
  - `${userName}` → pulled from `profiles.full_name`
- **Links**:
  - CTA button → `https://realpathlearning.com/studio`
  - Support email → `mailto:support@realpathlearning.com`

### Step 2: Trigger Welcome Email After Registration
**Option A - Database Trigger (Recommended)**

Create a Postgres trigger on `profiles` table INSERT that calls the edge function. This ensures welcome emails are sent even for admin-created users.

**Option B - Frontend Trigger**

Call the edge function from `useAuth.ts` after successful signup. Simpler but only works for self-registration.

**Recommendation**: Use Option A (database trigger) for consistency.

### Step 3: HTML Email Template
Convert your Gmail template to an inline-styled HTML email:

```text
Subject: Welcome to RealPath Learning : Let's build your first lesson

Body structure:
- Header with logo and welcome message
- Personalized greeting: "Hi [full_name]!"
- Value proposition
- Primary CTA button: "Create your first student group and lesson now"
  → Links to https://realpathlearning.com/studio
- Secondary link: "We're just a click away"
  → mailto:support@realpathlearning.com
- Footer with social links
```

### Step 4: Update config.toml
Add the new function configuration:
```toml
[functions.send-welcome-email]
verify_jwt = false
```

---

## Files to Create/Modify

| Action | File Path |
|--------|-----------|
| Create | `supabase/functions/send-welcome-email/index.ts` |
| Modify | `supabase/config.toml` |
| Create | Database trigger via migration (optional, for auto-send) |

---

## Technical Details

### Edge Function Structure
```text
1. Parse request (email, userName)
2. Validate required fields
3. Build HTML email with inline styles
4. Send via Resend API from support@realpathlearning.com
5. Return success/error response
```

### Email Template Features
- Mobile-responsive inline CSS
- Brand colors matching REAL Path Learning
- Clear CTA buttons
- Accessible alt text for images
- Plain text fallback (optional)

---

## Alternative: Gmail Integration (Not Recommended)

If you specifically want to send from Gmail itself (not just use the address as "from"):

1. **Gmail API approach** requires:
   - Google Cloud project with Gmail API enabled
   - OAuth2 service account or user consent
   - Token refresh mechanism
   - Additional secret: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - Significantly more complex code

2. **SMTP relay** (using Gmail as SMTP):
   - Gmail allows SMTP relay for Google Workspace
   - Would need to store Gmail app password as secret
   - Less reliable than Resend

**Recommendation**: Stick with Resend. Using `support@realpathlearning.com` as the "from" address gives you the professional appearance, and replies will go to your Google Workspace inbox.

---

## Summary

- **New edge function**: `send-welcome-email`
- **Triggered**: After user registration (via database trigger or frontend call)
- **Sender**: `REAL Path Learning <support@realpathlearning.com>` (via Resend)
- **Dynamic content**: User's name from `profiles.full_name`
- **Links**: Studio link + support email
- **No additional secrets needed** (Resend is already configured)

