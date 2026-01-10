# Let's Get REAL - Product & Technical Report

**Responsive. Equitable. Adaptive. Learner.**

*Season 2 Winners - Lovable SheBuilds 48-Hour Buildathon 2025*

> **Last Updated:** January 2026  
> **Version:** 2.0

---

## Executive Summary

Let's Get REAL is an AI-powered educator toolkit designed to help teachers create personalized, accessible lesson plans and authentic assessments that are resistant to AI-generated submissions. The platform addresses two critical challenges in modern education:

1. **Equity Gap**: Teachers need tools to differentiate instruction for diverse learners, including ELL students, students with IEPs, and varying reading levels
2. **AI Integrity**: The rise of generative AI requires assessments that verify authentic student work

---

## 1. Feature Breakdown

### 1.1 Lesson Plan Creator (Differentiation Engine)

**What it does:**
- Takes original lesson content and generates customized versions for multiple student groups
- Adapts reading level, vocabulary, and complexity based on Lexile scores
- Creates group-specific accommodations (extended time, visual supports, simplified instructions)
- Supports 15+ languages for ELL students

**Key capabilities:**
- **Teacher Guide**: Implementation strategies, accommodation notes, facilitation tips
- **Student Handouts**: Differentiated versions per group with appropriate scaffolding
- **Vocabulary Support**: Key terms with definitions translated to home languages
- **Graphic Organizers**: AI-generated visual learning aids (Venn diagrams, T-charts, concept maps, etc.)
- **Audio Generation**: Text-to-speech for all content in English + student's home language
- **Bilingual Side-by-Side Layout**: Content displayed in both English and home language

**Edge Function:** `differentiate-lesson`

---

### 1.2 AI-Resistant Assessment Generator

**What it does:**
- Creates authentic assessments that require local context, personal experience, and verifiable work
- Analyzes assessment vulnerability to AI-generated submissions
- Incorporates process documentation requirements
- Embeds verification checkpoints

**Key capabilities:**
- **Vulnerability Analysis**: Scores assessments 0-100 for AI susceptibility
- **Local Context Integration**: Requires school/community-specific details
- **Primary Research Requirements**: Interviews, surveys, observations
- **Process Documentation**: Work evolution, drafts, research logs
- **Live Defense Components**: Presentation requirements, Q&A verification
- **Assessment Method Selector**: Choose from multiple authentic assessment types

**Edge Functions:** `generate-assessment`, `analyze-assessment-vulnerability`

---

### 1.3 Analytic Rubric Generator

**What it does:**
- Creates standards-aligned rubrics with 4 performance levels
- Auto-adds verification criteria for high-vulnerability assessments
- Includes authenticity verification guides for teachers

**Key capabilities:**
- **AI-Proof Language**: Built-in descriptors that distinguish authentic from AI-generated work
- **Auto-Verification Criteria**: Process integrity, local/personal verification, live defense components
- **Teacher Verification Guide**: Red flags, probing questions, authenticity checkpoints
- **Learning Objective Alignment**: Criteria mapped directly to stated objectives
- **Verification Tracking**: Record student verification results

**Edge Function:** `generate-rubric`

---

### 1.4 Multilingual Content System

**What it does:**
- Translates all content to student home languages
- Maintains educational terminology appropriateness
- Preserves formatting and structure

**Supported Languages:**
- Spanish, Vietnamese, Mandarin Chinese, Somali, Arabic, Hmong, Korean, Tagalog, Portuguese, Russian, French, Swahili, Haitian Creole, Karen, Oromo

**Edge Function:** `translate-content`

---

### 1.5 Audio Generation System

**What it does:**
- Generates high-quality text-to-speech for all lesson content
- Creates bilingual vocabulary pronunciation guides
- Stores audio for offline/classroom use
- Caches audio for cost optimization

**Key capabilities:**
- **Multilingual TTS**: Native pronunciation for 15+ languages
- **Section-Optimized Voices**: Different voice settings for instructions vs. content vs. vocabulary
- **Bilingual Vocabulary Cards**: English term → home language term with audio for both
- **Usage Tracking & Budget Management**: Monitors character usage and costs
- **Audio Caching**: Reuses previously generated audio to reduce costs
- **Retry System**: Automatic retry for failed audio generation

**Edge Functions:** `elevenlabs-tts`, `generate-lesson-audio`, `generate-group-audio`, `get-lesson-audio-status`, `get-lesson-with-audio`, `retry-audio-generation`

---

### 1.6 Graphic Organizer Generator

**What it does:**
- Creates printable, fillable graphic organizers for lessons
- Supports multiple organizer types for different learning needs

**Organizer Types:**
- Venn Diagram, T-Chart, Flow Chart, Cause & Effect, Web Diagram, Frayer Model, Story Map, Claim-Evidence-Reasoning

**Edge Functions:** `generate-graphic-organizer`, `generate-lesson-diagram`

---

### 1.7 Student Group Management

**What it does:**
- Creates and manages learner profiles with detailed accommodation data
- Organizes groups into class folders
- Supports drag-and-drop organization

**Key capabilities:**
- **Reading Level Tracking**: Pre-K through Grade 11+ with Lexile scores
- **Home Language Settings**: 15+ languages supported
- **ELL Status Levels**: Non-ELL, Newcomer, Beginning, Intermediate, Advanced, Bridging
- **IEP/504 Support**: IEP, 504 Plan, Both, or Neither
- **Accommodations**: Extended time, visual supports, small group, assistive technology, etc.
- **Learning Preferences**: Visual, auditory, kinesthetic, read/write

**Database Tables:** `student_groups`, `class_folders`

---

### 1.8 Admin Dashboard

**What it does:**
- Provides administrators with full platform management capabilities
- Tracks usage, costs, and user activity

**Key capabilities:**
- **User Management**: View, filter, export users; create admin users
- **Analytics Dashboard**: Usage metrics, trends, and insights
- **AI Cost Tracking**: Monitor API costs by function and model
- **Support Ticket System**: Manage user tickets with replies and status
- **Help Article Management**: Create and edit help center content
- **Feature Flags**: Toggle features on/off
- **Activity Logs**: Full audit trail
- **Error Logs**: Track and debug issues
- **Feedback Review**: View user survey responses

**Edge Function:** `admin-create-user`

---

### 1.9 Support Ticket System

**What it does:**
- Allows users to submit support requests
- Provides admin interface for ticket management
- Sends email notifications for replies

**Key capabilities:**
- **Ticket Categories**: Technical issues, feature requests, billing, etc.
- **Priority Levels**: Low, Medium, High, Critical
- **Reply System**: Back-and-forth communication
- **Internal Notes**: Admin-only notes
- **Email Notifications**: Automatic notifications via Resend
- **Ticket Tracking**: Status management and resolution

**Edge Function:** `send-ticket-reply-notification`

**Database Tables:** `support_tickets`, `support_ticket_replies`

---

### 1.10 Help Center

**What it does:**
- Provides self-service documentation for users
- Allows users to rate article helpfulness

**Key capabilities:**
- **Categorized Articles**: Organized by topic
- **Search Functionality**: Find relevant articles
- **Feedback System**: Helpful/not helpful ratings
- **Featured Articles**: Highlight important content

**Database Tables:** `help_articles`, `help_article_feedback`

---

### 1.11 Subscription & Payments

**What it does:**
- Manages user subscriptions via Stripe
- Provides pricing tiers and upgrade prompts

**Key capabilities:**
- **Stripe Integration**: Checkout, customer portal, subscription management
- **Usage Limits**: Feature gating based on subscription tier
- **Upgrade Prompts**: Smart prompts when users hit limits
- **Admin Overrides**: Manual subscription overrides

**Edge Functions:** `create-checkout`, `customer-portal`, `check-subscription`

**Database Table:** `subscription_overrides`

---

### 1.12 Authentication & Security

**What it does:**
- Manages user authentication and session security
- Tracks login attempts and prevents brute force attacks

**Key capabilities:**
- **Email/Password Auth**: Standard authentication
- **Session Management**: View and terminate active sessions
- **Account Lockout**: Automatic lockout after failed attempts
- **Login Tracking**: IP address, device, and attempt logging
- **Role-Based Access**: Super admin, admin, moderator, user roles

**Edge Function:** `track-login-attempt`

**Database Tables:** `profiles`, `user_roles`, `user_sessions`, `login_attempts`

---

## 2. API Dependencies & Cost Structure

### 2.1 AI Text Generation (Lovable AI Gateway)

| Function | Model | Cost Estimate | Usage |
|----------|-------|---------------|-------|
| differentiate-lesson | google/gemini-2.5-flash | ~$0.001-0.005/call | Lesson differentiation |
| generate-assessment | google/gemini-2.5-flash | ~$0.001-0.003/call | Assessment creation |
| generate-rubric | google/gemini-2.5-flash | ~$0.002-0.004/call | Rubric generation |
| analyze-assessment-vulnerability | google/gemini-2.5-flash | ~$0.001/call | Vulnerability scoring |
| translate-content | google/gemini-2.5-flash | ~$0.0005-0.002/call | Translation |
| generate-graphic-organizer | google/gemini-2.5-flash | ~$0.001/call | Organizer prompts |

**Total AI cost per full lesson workflow:** ~$0.01-0.02

---

### 2.2 Text-to-Speech (ElevenLabs)

| Model | Cost | Usage |
|-------|------|-------|
| eleven_multilingual_v2 | $0.30 per 10K characters (~$0.00003/char) | All audio generation |

**Cost per lesson audio (typical):**
- Instructions section: ~1,500 chars = $0.045
- Content section: ~3,000 chars = $0.09
- Vocabulary (10 terms): ~500 chars = $0.015
- **Per group total: ~$0.15**
- **Full lesson (4 groups): ~$0.60**

**Note:** Audio caching reduces costs significantly for repeated content.

---

### 2.3 Email Notifications (Resend)

| Service | Cost | Usage |
|---------|------|-------|
| Resend API | Free tier: 100 emails/day | Support ticket notifications |

---

### 2.4 Complete Cost Per User Action

| User Action | Estimated Cost |
|-------------|----------------|
| Differentiate 1 lesson (4 groups) | $0.005-0.02 |
| Generate assessment | $0.001-0.003 |
| Generate rubric (with analysis) | $0.003-0.006 |
| Add audio to lesson (4 groups) | $0.50-0.80 |
| Generate graphic organizer | ~$0.001 |
| Translate content | ~$0.001-0.002 |
| **Full workflow (lesson + audio)** | **~$0.60-0.90** |

---

## 3. Competitive Differentiation

### What Competitors DON'T Have:

#### 3.1 AI-Resistant Assessment Framework
**No other tool offers:**
- Real-time AI vulnerability scoring (0-100)
- Auto-added verification criteria based on vulnerability analysis
- Process integrity requirements embedded in rubrics
- Teacher verification guides with red flag indicators
- "Beginning level = potentially AI-generated" language in all rubrics

**Why it matters:** Teachers can't currently verify if student work is authentic. Our system builds verification INTO the assessment design.

---

#### 3.2 Integrated Multilingual Audio Support
**No other tool combines:**
- 15+ language translation
- Bilingual vocabulary cards with audio pronunciation
- Section-specific voice optimization
- Storage and retrieval of generated audio
- Audio caching for cost optimization

**Why it matters:** ELL students need audio support in BOTH English AND their home language. Generic TTS tools don't understand educational contexts.

---

#### 3.3 Reading Level + Language + Accommodation Integration
**No other tool provides simultaneous:**
- Lexile-based reading level adaptation
- Home language translation
- IEP/504 accommodation integration
- ELL status consideration

**Why it matters:** Real differentiation requires considering ALL learner factors together, not separately.

---

#### 3.4 AI-Proof Rubric Language Library
**No other tool includes:**
- Pre-built AI-proof descriptors for research, reflection, local context
- Automatic insertion of verification criteria
- "Exhibits hallmarks of AI generation" in Beginning-level descriptors
- Authenticity verification guides

**Why it matters:** Teachers creating rubrics don't know how to word criteria to catch AI-generated work.

---

#### 3.5 Local Context Integration System
**No other tool embeds:**
- School/city/state-specific assessment requirements
- Named local sources requirements
- Community-based verification elements

**Why it matters:** Generic assessments can be answered by AI; local context cannot be faked.

---

#### 3.6 Complete Admin Suite
**No other educator tool includes:**
- AI cost tracking and optimization
- Feature flag management
- Comprehensive support ticket system
- User activity and session monitoring
- Role-based access control

**Why it matters:** Schools need enterprise-grade management capabilities.

---

## 4. Technology Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui components
- React Router for navigation
- React Query for data fetching
- Framer Motion for animations

### Backend (Lovable Cloud)
- PostgreSQL database with RLS
- 19 Edge Functions (Deno)
- Supabase Storage for audio/images
- Supabase Auth for user management
- Supabase Realtime for live updates

### AI Services
- Lovable AI Gateway (primary) → Google Gemini 2.5 Flash
- ElevenLabs API (audio generation)

### Payment Processing
- Stripe for subscriptions and payments

### Email
- Resend for transactional emails

---

## 5. Database Schema Overview

| Table | Purpose |
|-------|---------|
| `profiles` | User information, login tracking |
| `user_roles` | Role-based access control |
| `student_groups` | Learner profiles with reading levels, languages, accommodations |
| `class_folders` | Organization for student groups |
| `generated_lessons` | Saved differentiated lessons |
| `generated_rubrics` | Saved rubrics with AI-proof criteria |
| `generated_assessments` | Saved assessments with local context |
| `saved_assessments` | Assessment templates |
| `generated_audio` | Audio files metadata |
| `vocabulary_audio` | Bilingual vocabulary pronunciation |
| `audio_usage` | Cost tracking for TTS |
| `audio_cache` | Cached audio for reuse |
| `lesson_images` | Lesson image attachments |
| `lesson_audio_status` | Audio generation progress |
| `ai_cost_logs` | API cost tracking |
| `help_articles` | Help center content |
| `help_article_feedback` | Article feedback |
| `support_tickets` | Support ticket data |
| `support_ticket_replies` | Ticket conversation |
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

---

## 6. Key Metrics

### Differentiation Options Available
- 6 reading levels (Pre-K through Grade 11+)
- 15+ home languages
- 6 ELL status levels (Non-ELL through Bridging)
- 4 IEP/504 categories
- 6 accommodation types
- 4 learning preference options

### Assessment Components
- 6 vulnerability indicators tracked
- 6 strength indicators tracked
- 3 auto-verification criteria templates
- 5 red flag categories
- Multiple assessment method categories

### Platform Capabilities
- 19 Edge Functions
- 25+ Database Tables
- 4 User Roles
- 5 UI Languages
- 15+ Content Languages

---

## 7. User Journeys

### Teacher Creating Differentiated Lesson
1. Create student groups with reading levels and languages
2. Upload or paste lesson content
3. Generate differentiated versions
4. Add audio for ELL students
5. Generate graphic organizers
6. Export for LMS or print

### Teacher Creating AI-Resistant Assessment
1. Enter lesson title, subject, grade level
2. Define learning objectives
3. Add local context (school, city, state)
4. Select AI policy stance
5. Choose assessment method
6. Generate assessment with vulnerability analysis
7. Create matching rubric with verification criteria

### Administrator Managing Platform
1. View usage analytics and trends
2. Monitor AI costs
3. Manage support tickets
4. Update help center content
5. Toggle feature flags
6. Export user data
7. Review activity logs

---

## 8. Security & Compliance

### Data Protection
- Row Level Security (RLS) on all tables
- Role-based access control
- Session management and monitoring
- Account lockout protection
- Activity logging for audit trails

### Authentication
- Email/password authentication
- Auto-confirm for development
- Failed login tracking
- Session termination capabilities

---

## 9. Future Roadmap Considerations

1. **Classroom Sync**: Real-time collaboration between teachers
2. **Student Self-Assessment**: Verification checkpoints students complete
3. **LMS Integration**: Direct export to Canvas, Schoology, Google Classroom
4. **Analytics Dashboard**: Track differentiation patterns and outcomes
5. **AI Detection Integration**: Direct integration with AI detection tools
6. **Voice Cloning**: Teacher's own voice for audio content
7. **Mobile App**: Native mobile experience
8. **Offline Mode**: Work without internet connection
9. **Team Workspaces**: Shared resources between teachers
10. **Assessment Templates**: Pre-built assessment libraries

---

*Report generated for Let's Get REAL - An Educator Tools Suite*  
*Built at Lovable SheBuilds 48-Hour Buildathon 2025*  
*Last Updated: January 2026*
