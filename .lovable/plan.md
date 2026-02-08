
# User Lifecycle Email Templates Implementation

## Overview
Create three new email templates for key user lifecycle events, following the established pattern from `send-welcome-email` and `send-free-month-email`.

---

## Email Templates to Create

### 1. First Lesson Celebration Email
**Trigger**: When a user saves their first differentiated lesson

**Subject**: "You Did It! Your First Lesson is Ready"

**Content Highlights**:
- Congratulatory message with celebration tone
- Quick tips for next steps (download, share with students)
- CTA: "View Your Lessons" → `https://realpathlearning.com/saved-lessons`
- Secondary: Create next lesson → `/studio`

**Dynamic Fields**:
- `userName` (from profiles.full_name)
- `lessonTitle` (from generated_lessons.lesson_title)

---

### 2. Feedback Request Email
**Trigger**: Manually triggered from Admin panel OR scheduled after 5 days of activity

**Subject**: "How's Your Experience So Far? Share Your Thoughts"

**Content Highlights**:
- Personalized ask for feedback
- Highlight the 30-day free extension incentive
- CTA: "Share Feedback" → `https://realpathlearning.com/feedback`
- Mention it takes only 3 minutes

**Dynamic Fields**:
- `userName` (from profiles.full_name)

---

### 3. Invite a Fellow Educator Email
**Trigger**: Manually triggered by user (share button) or admin campaign

**Subject**: "[UserName] Thinks You'll Love RealPath Learning"

**Content Highlights**:
- Personal referral message from the inviting educator
- Brief product value proposition
- CTA: "Try It Free" → `https://realpathlearning.com/register`
- Optional: Custom message from the referrer

**Dynamic Fields**:
- `inviterName` (referring user's name)
- `recipientEmail` (colleague's email)
- `personalMessage` (optional custom note)

---

## Technical Implementation

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/send-first-lesson-email/index.ts` | First lesson celebration |
| `supabase/functions/send-feedback-request-email/index.ts` | Feedback request with incentive |
| `supabase/functions/send-invite-educator-email/index.ts` | Referral/invite email |

### Config Updates

Add to `supabase/config.toml`:
```toml
[functions.send-first-lesson-email]
verify_jwt = false

[functions.send-feedback-request-email]
verify_jwt = false

[functions.send-invite-educator-email]
verify_jwt = true  # Requires auth to prevent abuse
```

---

## Trigger Mechanisms

### First Lesson Email
**Option A - Database Trigger (Recommended)**
- Add trigger on `generated_lessons` INSERT
- Check if user's lesson count becomes 1 (first lesson)
- Call edge function automatically

**Option B - Frontend Call**
- Call from `useDifferentiationGenerator.ts` after successful save
- Check lesson count first to ensure it's the first

### Feedback Request Email
- **Admin Panel**: Add "Send Feedback Request" button in AdminUsers
- **Scheduled**: Could use Supabase pg_cron for users after X days (future enhancement)

### Invite Educator Email
- **Frontend Component**: Create "Invite a Colleague" modal/form
- **User Profile or Dashboard**: Add share/invite button
- User enters colleague's email + optional message
- Edge function sends the invitation

---

## Email Template Specifications

### Design Consistency
All emails will follow the established pattern:
- **Header**: Brand gradient (#2F4F2F → #4F7F4F) with logo
- **Body**: Clean white background, 16px body text
- **CTA Button**: Green (#2F4F2F)
- **Footer**: copyright, support email
- **From Address**: `RealPath Learning <support@realpathlearning.com>`

### Email Dimensions
- Max width: 600px
- Padding: 40px (desktop), responsive on mobile
- Border radius: 12px for cards

---

## Database Changes (Optional Enhancement)

To properly track first lesson events, we could add a tracking column:

```sql
-- Track milestone emails sent to prevent duplicates
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_lesson_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS feedback_request_sent_at TIMESTAMP WITH TIME ZONE;
```

This prevents duplicate emails if the trigger fires multiple times.

---

## Implementation Order

1. **First**: Create `send-first-lesson-email` edge function
2. **Second**: Create database trigger for first lesson detection
3. **Third**: Create `send-feedback-request-email` edge function
4. **Fourth**: Add admin UI button to send feedback requests
5. **Fifth**: Create `send-invite-educator-email` edge function
6. **Sixth**: Create frontend "Invite a Colleague" component

---

## Sample Email Copy

### First Lesson Email
```text
Subject: You Did It! Your First Lesson is Ready

Hi [Name]!

Congratulations! You just created your first differentiated lesson:
"[Lesson Title]"

You're now part of a community of educators using RealPath Learning 
to support every learner in their classroom.

What's Next?
• Download and print your student handouts
• Review your Teacher Guide for facilitation tips
• Create another lesson for a different topic

[View Your Lessons Button]

Keep up the amazing work!
The RealPath Learning Team
```

### Feedback Request Email
```text
Subject: How's Your Experience So Far? 

Hi [Name]!

You've been using RealPath Learning, and we'd love to hear from you!

Your feedback shapes our roadmap and helps us build better tools 
for educators everywhere.

As a thank you, complete our 3-minute survey or let us know if we can have a 1:1 discussion with you to influence our building roadmap!

[Share Your Feedback Button]

Questions? We're just a click away.
The RealPath Learning Team
```

### Invite Educator Email
```text
Subject: [Inviter Name] Thinks You'll Love RealPath Learning

Hi there!

[Inviter Name] invited you to try RealPath Learning, the AI-powered 
platform that helps educators create differentiated lessons in minutes.

[Optional: Personal message from inviter]

With RealPath Learning, you can:
• Differentiate any lesson for multiple reading levels
• Generate authentic assessments and rubrics
• Support multilingual learners with audio features
• Create lessons according to students IEPs

[Try It Free Button]

Questions? Reply to this email.
The RealPath Learning Team
```

---

## Summary

| Email | Trigger | Edge Function | Config |
|-------|---------|---------------|--------|
| First Lesson | DB trigger on `generated_lessons` | `send-first-lesson-email` | verify_jwt = false |
| Feedback Request | Admin button / scheduled | `send-feedback-request-email` | verify_jwt = false |
| Invite Educator | User-initiated via UI | `send-invite-educator-email` | verify_jwt = true |

All emails use the existing Resend integration with `RESEND_API_KEY` secret, sending from `support@realpathlearning.com`.
