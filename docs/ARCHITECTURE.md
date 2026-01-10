# Educator Tools Suite - Architecture Documentation

> **Last Updated:** January 2026  
> **Version:** 2.0

---

## Project Overview

The **Let's Get REAL** (Responsive. Equitable. Adaptive. Learner.) Educator Tools Suite is a comprehensive web application designed to help teachers differentiate instruction, create AI-resistant assessments, and support diverse learners. Built as a Season 2 Winner of the Lovable SheBuilds 48-Hour Buildathon 2025.

### Core Features

1. **Lesson Differentiator** - Adapts lessons to different student reading levels, languages, and accommodations
2. **AI-Resistant Assessment Generator** - Creates assessments with local context that can't be easily completed by AI
3. **Analytic Rubric Generator** - Builds detailed rubrics with AI-proof verification criteria
4. **Audio Generation System** - Multilingual text-to-speech for all content
5. **Graphic Organizer Generator** - Creates visual learning aids
6. **Student Group Management** - Organizes learners by reading level, language, and accommodations
7. **Admin Dashboard** - User management, analytics, support tickets, and feature flags
8. **Help Center** - Self-service documentation and support ticket system

---

## File Structure

```
project-root/
├── docs/
│   ├── ARCHITECTURE.md           # This documentation file
│   └── PRODUCT_REPORT.md         # Product & technical report
├── src/
│   ├── assets/
│   │   ├── real-logo.png         # Application logo
│   │   ├── jena-zangs.jpg        # Team member photo
│   │   └── shannon-seaver.jpg    # Team member photo
│   ├── components/
│   │   ├── admin/                # Admin dashboard components
│   │   │   ├── AdminActivityLog.tsx
│   │   │   ├── AdminAnalytics.tsx
│   │   │   ├── AdminCosts.tsx
│   │   │   ├── AdminErrorLogs.tsx
│   │   │   ├── AdminFeatureFlags.tsx
│   │   │   ├── AdminFeedback.tsx
│   │   │   ├── AdminHelpArticles.tsx
│   │   │   ├── AdminOverview.tsx
│   │   │   ├── AdminSupportTickets.tsx
│   │   │   ├── AdminUsers.tsx
│   │   │   └── UserExportFilters.tsx
│   │   ├── assessment/           # Assessment method components
│   │   │   ├── AssessmentMethodSelector.tsx
│   │   │   ├── CategoryCard.tsx
│   │   │   ├── LocalContextCard.tsx
│   │   │   └── MethodOption.tsx
│   │   ├── export/               # Export functionality
│   │   │   └── ExportForLMSButton.tsx
│   │   ├── feedback/             # User feedback components
│   │   │   ├── FeedbackProgress.tsx
│   │   │   └── StarRating.tsx
│   │   ├── ui/                   # shadcn/ui component library (40+ components)
│   │   ├── AIVulnerabilityAnalysis.tsx
│   │   ├── AssessmentForm.tsx
│   │   ├── AssessmentOutput.tsx
│   │   ├── AudioEnabledSection.tsx
│   │   ├── AudioGenerationButton.tsx
│   │   ├── AudioUsageDashboard.tsx
│   │   ├── BilingualAudioPlayer.tsx
│   │   ├── BilingualSideBySideLayout.tsx
│   │   ├── BilingualVocabularyCard.tsx
│   │   ├── BilingualVocabularyPlayer.tsx
│   │   ├── ClassFolderCard.tsx
│   │   ├── CreateFolderModal.tsx
│   │   ├── DifferentiateForm.tsx
│   │   ├── DifferentiatedLessonOutput.tsx
│   │   ├── DifferentiationProgress.tsx
│   │   ├── DifferentiationProgressModal.tsx
│   │   ├── DraggableStudentGroupCard.tsx
│   │   ├── GraphicOrganizerGenerator.tsx
│   │   ├── LanguageSelector.tsx
│   │   ├── LessonAudioPlayer.tsx
│   │   ├── LessonImageBrowser.tsx
│   │   ├── LessonImageFrame.tsx
│   │   ├── LessonOutput.tsx
│   │   ├── LoginModal.tsx
│   │   ├── NavLink.tsx
│   │   ├── ProfileModal.tsx
│   │   ├── RubricForm.tsx
│   │   ├── RubricOutput.tsx
│   │   ├── SavedAssessmentSelector.tsx
│   │   ├── StudentGroupCard.tsx
│   │   ├── StudentGroupFormModal.tsx
│   │   ├── SubscriptionBanner.tsx
│   │   └── UpgradePromptModal.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx       # Authentication state
│   │   └── DifferentiationContext.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx        # Mobile detection
│   │   ├── use-toast.ts          # Toast notifications
│   │   ├── useAdmin.ts           # Admin functionality
│   │   ├── useAssessmentGenerator.ts
│   │   ├── useAudioUsage.ts
│   │   ├── useAuth.ts            # Authentication hook
│   │   ├── useDifferentiationGenerator.ts
│   │   ├── useFeedbackForm.ts
│   │   ├── useGraphicOrganizer.ts
│   │   ├── useHelpArticles.ts
│   │   ├── useLessonAudio.ts
│   │   ├── useLessonImages.ts
│   │   ├── useLessonImagesDB.ts
│   │   ├── useRubricGenerator.ts
│   │   ├── useSessionDuration.ts
│   │   ├── useSessionManagement.ts
│   │   ├── useSubscription.ts
│   │   └── useSupportTickets.ts
│   ├── i18n/
│   │   ├── index.tsx             # Internationalization setup
│   │   └── translations/         # Language files (en, es, so, vi, zh)
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts         # Supabase client (auto-generated)
│   │       └── types.ts          # Database types (auto-generated)
│   ├── lib/
│   │   ├── authValidation.ts     # Auth validation utilities
│   │   ├── differentiation.ts    # Differentiation helpers
│   │   ├── export/
│   │   │   └── htmlExporter.ts   # HTML export for LMS
│   │   ├── imageGeneration.ts
│   │   ├── pricing.ts            # Subscription pricing
│   │   ├── readingLevelNames.ts
│   │   ├── tooltipDescriptions.ts
│   │   └── utils.ts              # Utility functions
│   ├── pages/
│   │   ├── Admin.tsx             # Admin dashboard
│   │   ├── AudioUsage.tsx        # Audio usage tracking
│   │   ├── Feedback.tsx          # User feedback form
│   │   ├── ForgotPassword.tsx    # Password reset
│   │   ├── HelpArticle.tsx       # Individual help article
│   │   ├── HelpCenter.tsx        # Help center hub
│   │   ├── Index.tsx             # Main application page
│   │   ├── Landing.tsx           # Marketing landing page
│   │   ├── LessonAudioView.tsx   # Audio playback view
│   │   ├── LessonView.tsx        # Saved lesson view
│   │   ├── Login.tsx             # Login page
│   │   ├── MyTickets.tsx         # User's support tickets
│   │   ├── NotFound.tsx          # 404 page
│   │   ├── PaymentSuccess.tsx    # Stripe success page
│   │   ├── Pricing.tsx           # Subscription pricing
│   │   ├── Privacy.tsx           # Privacy policy
│   │   ├── Profile.tsx           # User profile
│   │   ├── Register.tsx          # Registration page
│   │   ├── SavedAssessments.tsx  # Saved assessments list
│   │   ├── SavedLessons.tsx      # Saved lessons list
│   │   ├── SavedRubrics.tsx      # Saved rubrics list
│   │   ├── SessionManagement.tsx # Active sessions
│   │   ├── StudentGroups.tsx     # Student group management
│   │   ├── SubmitTicket.tsx      # Submit support ticket
│   │   ├── Terms.tsx             # Terms of service
│   │   └── TicketDetail.tsx      # Support ticket detail
│   ├── types/
│   │   ├── assessment.ts
│   │   ├── assessmentMethods.ts
│   │   ├── audioRequirements.ts
│   │   ├── audioScript.ts
│   │   ├── differentiatedLesson.ts
│   │   ├── helpCenter.ts
│   │   ├── rubric.ts
│   │   ├── studentGroup.ts
│   │   └── vulnerabilityAnalysis.ts
│   ├── App.tsx                   # Root app with routing
│   ├── App.css                   # Global styles
│   ├── index.css                 # Tailwind + design tokens
│   └── main.tsx                  # React entry point
├── supabase/
│   ├── functions/
│   │   ├── admin-create-user/    # Admin user creation
│   │   ├── analyze-assessment-vulnerability/
│   │   ├── check-subscription/   # Stripe subscription check
│   │   ├── create-checkout/      # Stripe checkout
│   │   ├── customer-portal/      # Stripe portal
│   │   ├── differentiate-lesson/
│   │   ├── elevenlabs-tts/       # Text-to-speech
│   │   ├── generate-assessment/
│   │   ├── generate-graphic-organizer/
│   │   ├── generate-group-audio/
│   │   ├── generate-lesson-audio/
│   │   ├── generate-lesson-diagram/
│   │   ├── generate-rubric/
│   │   ├── get-lesson-audio-status/
│   │   ├── get-lesson-with-audio/
│   │   ├── retry-audio-generation/
│   │   ├── send-ticket-reply-notification/
│   │   ├── track-login-attempt/
│   │   └── translate-content/
│   └── config.toml               # Supabase configuration
├── public/
│   ├── examples/                 # Example files for demos
│   ├── videos/                   # Tutorial videos
│   ├── real-logo.png
│   ├── favicon.ico
│   └── robots.txt
├── index.html
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## Core Components

### Pages Overview

| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Marketing page with feature overview |
| Index | `/app` | Main application with tabbed tools |
| Login | `/login` | User authentication |
| Register | `/register` | User registration |
| Profile | `/profile` | User settings and profile |
| Student Groups | `/student-groups` | Manage learner profiles |
| Saved Lessons | `/saved-lessons` | View differentiated lessons |
| Saved Assessments | `/saved-assessments` | View generated assessments |
| Saved Rubrics | `/saved-rubrics` | View generated rubrics |
| Audio Usage | `/audio-usage` | TTS usage and costs |
| Help Center | `/help` | Self-service documentation |
| Submit Ticket | `/submit-ticket` | Support ticket submission |
| My Tickets | `/my-tickets` | User's support tickets |
| Admin | `/admin` | Admin dashboard |
| Pricing | `/pricing` | Subscription plans |

### Main Application Tools (Index.tsx)

| Tab | Form Component | Output Component |
|-----|----------------|------------------|
| Differentiate | `DifferentiateForm` | `DifferentiatedLessonOutput` |
| Assessment | `AssessmentForm` | `AssessmentOutput` |
| Rubric | `RubricForm` | `RubricOutput` |

### Admin Dashboard Components

| Component | Purpose |
|-----------|---------|
| `AdminOverview` | Key metrics and summary |
| `AdminUsers` | User management and export |
| `AdminAnalytics` | Usage analytics |
| `AdminCosts` | AI cost tracking |
| `AdminFeedback` | User feedback review |
| `AdminSupportTickets` | Ticket management |
| `AdminHelpArticles` | Help content management |
| `AdminFeatureFlags` | Feature toggle management |
| `AdminActivityLog` | Audit trail |
| `AdminErrorLogs` | Error tracking |

---

## Design System

### Color Palette

```css
/* Primary Colors */
--primary: 221 50% 45%          /* Calming Blue */
--primary-foreground: 0 0% 100%

/* Accent Colors */
--accent: 160 45% 45%           /* Teal Green */
--accent-foreground: 0 0% 100%
--accent-warm: 35 85% 55%       /* Warm Orange */

/* Background & Surface */
--background: 40 30% 97%        /* Warm Off-White */
--card: 40 30% 99%              /* Card White */
--muted: 40 20% 94%             /* Muted Surface */

/* Text Colors */
--foreground: 220 20% 20%       /* Dark Text */
--muted-foreground: 220 15% 45% /* Secondary Text */

/* Semantic Colors */
--success: 160 60% 40%          /* Green */
--warning: 35 85% 55%           /* Orange */
--destructive: 0 70% 50%        /* Red */
```

### Typography

- **Font Family:** Nunito (Google Fonts)
- **Weights:** 400 (regular), 600 (semibold), 700 (bold)

---

## Backend Architecture

### Edge Functions (19 total)

| Function | Purpose | AI Model |
|----------|---------|----------|
| `admin-create-user` | Admin user creation | - |
| `analyze-assessment-vulnerability` | AI vulnerability scoring | Gemini 2.5 Flash |
| `check-subscription` | Stripe subscription check | - |
| `create-checkout` | Stripe checkout session | - |
| `customer-portal` | Stripe customer portal | - |
| `differentiate-lesson` | Lesson differentiation | Gemini 2.5 Flash |
| `elevenlabs-tts` | Text-to-speech generation | ElevenLabs |
| `generate-assessment` | Assessment creation | Gemini 2.5 Flash |
| `generate-graphic-organizer` | Visual organizers | Gemini 2.5 Flash |
| `generate-group-audio` | Group-specific audio | ElevenLabs |
| `generate-lesson-audio` | Full lesson audio | ElevenLabs |
| `generate-lesson-diagram` | Diagram generation | Gemini 2.5 Flash |
| `generate-rubric` | Rubric generation | Gemini 2.5 Flash |
| `get-lesson-audio-status` | Audio generation status | - |
| `get-lesson-with-audio` | Lesson + audio retrieval | - |
| `retry-audio-generation` | Retry failed audio | ElevenLabs |
| `send-ticket-reply-notification` | Email notifications | Resend |
| `track-login-attempt` | Login tracking | - |
| `translate-content` | Content translation | Gemini 2.5 Flash |

### Database Tables (20+ tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User information, login tracking |
| `user_roles` | Role-based access (super_admin, admin, moderator, user) |
| `student_groups` | Learner profiles with reading levels, languages |
| `class_folders` | Organization for student groups |
| `generated_lessons` | Saved differentiated lessons |
| `generated_rubrics` | Saved rubrics with AI-proof criteria |
| `generated_assessments` | Saved assessments with local context |
| `generated_audio` | Audio files metadata |
| `vocabulary_audio` | Bilingual vocabulary pronunciation |
| `lesson_images` | Lesson image attachments |
| `lesson_audio_status` | Audio generation progress |
| `audio_usage` | TTS cost tracking |
| `ai_cost_logs` | API cost tracking |
| `audio_cache` | Cached audio for reuse |
| `help_articles` | Help center content |
| `help_article_feedback` | Article feedback |
| `support_tickets` | Support ticket data |
| `support_ticket_replies` | Ticket replies |
| `user_feedback` | User survey responses |
| `user_sessions` | Active session tracking |
| `user_time_stats` | Usage time tracking |
| `subscription_overrides` | Admin subscription overrides |
| `feature_flags` | Feature toggles |
| `activity_logs` | Audit trail |
| `error_logs` | Error tracking |
| `login_attempts` | Security logging |
| `usage_analytics` | Aggregate analytics |
| `rubric_verifications` | Rubric verification records |
| `saved_assessments` | Assessment templates |

---

## Authentication & Authorization

### Auth Flow
- Supabase Auth with email/password
- Auto-confirm email enabled for development
- Session management with active session tracking
- Account lockout after failed attempts

### Role System
- `super_admin` - Full system access
- `admin` - User and content management
- `moderator` - Limited admin capabilities
- `user` - Standard user access

---

## Third-Party Integrations

| Service | Purpose | Secret Key |
|---------|---------|------------|
| Lovable AI Gateway | AI text generation | `LOVABLE_API_KEY` (automatic) |
| ElevenLabs | Text-to-speech | `ELEVENLABS_API_KEY` |
| Stripe | Payments & subscriptions | `STRIPE_SECRET_KEY` |
| Resend | Email notifications | `RESEND_API_KEY` |

---

## Dependencies

### Core Framework
- **React 18** - UI library
- **React Router DOM 6** - Client-side routing
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety

### UI Components
- **shadcn/ui** - Component library (40+ components)
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library
- **TailwindCSS** - Utility-first CSS
- **tailwindcss-animate** - Animation utilities
- **Framer Motion** - Advanced animations

### Backend Integration
- **@supabase/supabase-js** - Supabase client
- **@tanstack/react-query** - Server state management

### Content Rendering
- **react-markdown** - Markdown to React
- **remark-gfm** - GitHub Flavored Markdown
- **marked** - Markdown parsing

### Forms & Validation
- **react-hook-form** - Form management
- **@hookform/resolvers** - Validation resolvers
- **zod** - Schema validation

### Utilities
- **date-fns** - Date utilities
- **clsx** - Conditional classnames
- **tailwind-merge** - Merge Tailwind classes
- **class-variance-authority** - Component variants
- **jszip** - File compression for exports
- **canvas-confetti** - Celebration effects

---

## Internationalization

### Supported Languages
- English (en)
- Spanish (es)
- Vietnamese (vi)
- Mandarin Chinese (zh)
- Somali (so)

### Content Translation Languages (for lessons)
- Spanish, Vietnamese, Mandarin Chinese, Somali, Arabic, Hmong, Korean, Tagalog, Portuguese, Russian, French, Swahili, Haitian Creole, Karen, Oromo

---

## Key Patterns

### 1. Form → API → Output Pattern
Each tool follows a consistent pattern:
1. User fills form component
2. Form calls mutation hook
3. Hook invokes edge function
4. Response updates state
5. Output component renders result

### 2. Real-time Updates
- Supabase Realtime for live data sync
- React Query for cache invalidation

### 3. Role-Based Access Control
- RLS policies on all tables
- Client-side role checks
- Edge function authorization

### 4. Audio Generation Pipeline
1. Content preparation
2. Section-by-section TTS generation
3. Storage in Supabase Storage
4. Progress tracking via `lesson_audio_status`
5. Caching for reuse

---

## Performance Considerations

- Lazy loading of routes
- Audio caching to reduce API calls
- Optimistic updates with React Query
- Debounced form submissions
- Virtualized lists for large datasets

---

*Last updated: January 2026*
