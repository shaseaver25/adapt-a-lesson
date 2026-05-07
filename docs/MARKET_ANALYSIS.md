# Let's Get REAL — Market Analysis & Positioning

*Comparative analysis of Let's Get REAL (Adapt-a-Lesson) vs. the K-12 EdTech market.*

**Date:** May 2026
**Status:** Strategic memo, not a marketing asset

---

## 1. What this product actually is

A web app for K-12 teachers that does two jobs better than anything else on the market currently does together:

1. **Differentiates a lesson** for multiple learner profiles in one pass — Lexile band, ELL status, IEP/504 accommodations, home language — and produces a teacher guide, student handouts, vocabulary cards, graphic organizers, and bilingual TTS audio.
2. **Generates AI-resistant assessments and rubrics** — scoring assessments 0-100 for AI-vulnerability, embedding local-context and process-documentation requirements, and writing rubric language designed to surface AI-generated work.

Underlying stack: React/Vite + Supabase (Lovable Cloud), Gemini 2.5 Flash for text, ElevenLabs for audio, Stripe for billing. ~25 edge functions, 30+ tables, RLS-everywhere, PII-scrubbing pipeline before any data leaves for an LLM. Token-based pricing: $19 individual, $149 school team (10 seats), $2,000+ district.

Origin: built at the Lovable SheBuilds 48-Hour Buildathon 2025. That matters for adoption strategy — see §5.

---

## 2. Competitive landscape

The market splits into four buckets. Let's Get REAL straddles two of them, which is both the opportunity and the threat.

| Bucket | Examples | What they do | Overlap with us |
|---|---|---|---|
| **AI lesson assistants** | MagicSchool, Brisk Teaching, Diffit, Eduaide, SchoolAI, Curipod | Single-prompt generators for lesson plans, rewrites, leveled texts, quizzes | High — this is our core differentiation surface |
| **LMS / SIS** | Schoology (PowerSchool), Canvas (Instructure), Google Classroom, Clever | System-of-record for assignments, grades, rosters | None today — we are an island |
| **Assessment integrity** | Turnitin, GPTZero, Copyleaks, Pangram | Detect AI-generated submissions post-hoc | Adjacent — we *prevent*, they *detect* |
| **Specialty differentiation** | Newsela, ReadWorks, Lexia, Kami | Pre-built leveled libraries; fixed catalog | Indirect — we generate, they curate |

### Direct head-to-head (the closest five)

| | Let's Get REAL | MagicSchool | Brisk | Diffit | SchoolAI |
|---|---|---|---|---|---|
| Lesson differentiation | ✅ Multi-group simultaneous | ✅ Single output | ✅ Chrome extension on existing content | ✅ Reading-level focused | ⚠️ Chat-based |
| ELL + home language | ✅ 15 languages, bilingual audio | ⚠️ Translate tool, no audio | ⚠️ Translate, no audio | ✅ Multi-language | ⚠️ Limited |
| IEP/504 as generation rules | ✅ Encoded as constraints | ⚠️ Free-text prompt | ❌ | ❌ | ❌ |
| AI-resistant assessment design | ✅ Vulnerability scoring + verification scaffolding | ❌ | ❌ | ❌ | ❌ |
| Rubrics with AI-detection language | ✅ | ⚠️ Generic rubrics | ❌ | ❌ | ❌ |
| Local-context embedding | ✅ | ❌ | ❌ | ❌ | ❌ |
| LMS integration | ❌ | ✅ Schoology, Canvas, Google | ✅ Browser-native | ⚠️ Export | ✅ Several |
| District deals / SOC2 / SSO | ⚠️ Roadmap | ✅ | ✅ | ⚠️ | ✅ |
| Free tier | ❌ paid only | ✅ 60+ free tools | ✅ Free core | ✅ Free | ✅ Free tier |
| Funding / scale | Buildathon project | $15M Series A (2024) | $33M Series A (2024) | YC + seed | $11M seed |

**Reality check:** MagicSchool and Brisk each have hundreds of thousands of teacher accounts and active district contracts. They have GTM teams, conference presence, and integrations. Let's Get REAL has a superior pedagogical product on two specific axes — but no distribution, no integrations, and a paid-only model in a category where the incumbents run free + premium.

---

## 3. What makes it special

Three things, ranked by defensibility:

### 3.1 The AI-resistant assessment framework — genuinely novel
No competitor surveyed (MagicSchool, Brisk, Diffit, SchoolAI, Eduaide, Khanmigo, Curipod) ships a vulnerability scorer, an automatic verification-criteria injector, or rubric language explicitly designed to surface AI-generated work. The closest analog is Turnitin, but Turnitin is a *detector*, not a *designer*. Designing assessments that AI can't cleanly answer is a different and arguably better problem to solve, and right now it's an uncontested category.

This is the single most important strategic asset. It's also the most timely — every district in the US is currently grappling with this, and there is no incumbent answer.

### 3.2 Differentiation that treats learner factors as composable constraints
Most competitors do *one* axis at a time: rewrite at a reading level, OR translate, OR add accommodations. Let's Get REAL composes Lexile + home language + ELL stage + IEP accommodations + learning preference into a single generation. This is closer to how teachers actually plan, and it produces a teacher guide that maps groups to outputs — not a stack of disconnected artifacts.

### 3.3 FERPA-by-architecture
The PII detection layer + de-identification before LLM calls + compliance event log is more rigorous than what most $20M-funded competitors ship. This is undersold in the product but is a procurement-cycle advantage when selling to districts. Most AI ed tools are getting blocked at the legal review stage; this one was built to clear it.

**What is *not* defensible:** the lesson generation itself. Gemini 2.5 Flash + a good prompt is what every competitor is also doing. The moat lives in the framework around the model, not the model call.

---

## 4. What needs to be improved

In rough priority order:

### Adoption blockers (must fix to sell anything)
- **No LMS integration.** Teachers will not adopt a tool that requires copy-paste back to Schoology/Canvas/Google Classroom. This is roadmap item #3 — it should be #1. LTI 1.3 + Google Classroom share button covers ~85% of US K-12.
- **No free tier.** $19/mo with no free entry point, in a category where MagicSchool gives away 60+ tools, will not get past teacher word-of-mouth — which is the only growth channel that works in K-12.
- **Branding.** "Let's Get REAL" / "Adapt-a-Lesson" is two names in two places. Pick one. The product has a clear narrative ("differentiation + AI-resistant assessment") that the name does not signal.
- **Lovable provenance.** The README still says "Lovable project" with placeholder URLs and the package depends on the Lovable AI gateway. For a serious district sale this needs to be stripped and the AI gateway swapped to a direct provider relationship (Google AI Studio or Vertex) with a real DPA.

### Procurement blockers
- **No SOC 2, no signed DPAs, no SSO/SAML, no roster sync (Clever/ClassLink).** District IT will not approve without these. Roadmap mentions district-tier SSO; it needs to be real, not aspirational, with a vendor questionnaire pack ready.
- **State privacy law coverage (SOPPA, SHIELD, CSPC, NY Ed Law 2-d).** FERPA architecture is good; state-specific contracts are still required.
- **Audit trail of what data the AI saw.** The compliance_events table is a strong start. Districts will ask for an export.

### Product gaps
- **Outcome data.** There is no evidence the differentiated lessons actually move student outcomes. Even one peer-reviewed efficacy study, or an ESSA Level III/IV evidence claim, is worth more than ten features for district sales.
- **Teacher workflow integration.** No Word/Google Docs ingestion, no PDF parsing of existing lesson materials, no Chrome extension. Brisk's whole wedge is "use AI on the content you already have, where you already are." Let's Get REAL requires a context switch.
- **Student-facing surface.** Everything is teacher-side. The verification checkpoints, live defense components, and bilingual audio would all be more powerful with a lightweight student view (even read-only). Roadmap item #2; should be sooner.
- **Audio cost.** $0.60/lesson on ElevenLabs is the dominant unit cost and will compress margins at scale. Either swap to a cheaper TTS for the long-content sections (OpenAI TTS, Google WaveNet) and reserve ElevenLabs for vocabulary, or push aggressive caching/pre-generation.
- **The Stripe price IDs are stale.** PRODUCT_REPORT.md flags this — `src/lib/pricing.ts` references $10/mo and $99/yr legacy tiers that don't match the current pricing page. Fix before any sales push.

### Smaller things
- README is the Lovable boilerplate.
- 15 languages is generous but missing Hindi, Bengali, Urdu, Tigrinya — relevant for several large urban districts.
- No mobile app, no offline mode (item #7-8 on roadmap; legitimately lower priority).

---

## 5. What it takes to get adopted

K-12 EdTech has three viable GTM motions. Pick one and commit.

### Option A — Bottom-up teacher-led (the MagicSchool/Brisk playbook)
- **Free forever tier** with a generous core (e.g., 5 differentiations/month, no audio).
- **Single killer feature as the wedge.** The AI-resistant assessment generator is it — there's no competitor and every teacher feels the pain.
- **Distribution:** ISTE, ASCD, EdSurge, teacher TikTok/IG, /r/Teachers, Edutopia, state-level Twitter PLNs.
- **Conversion:** when a teacher's school sees N+ users, sales reaches out for a school/district contract.
- **Timeline to material revenue:** 18-30 months. Requires sustained content marketing and a community manager.
- **Cost:** ~$1.5-3M to do credibly. Free-tier compute cost is the killer; the $0.005-0.02 text cost is fine, the $0.60 audio cost is not — audio must be paid-only or heavily capped.

### Option B — Top-down district sales (the Newsela playbook)
- Hire 2-3 K-12 district AEs with relationships.
- Build the SSO + Clever/ClassLink + LTI + DPA/SOC 2 stack first.
- Lead with the AI-resistance and FERPA-by-architecture story to CIOs and Curriculum Directors who are currently panicking about AI.
- Pilot → district contract motion. ACVs $25-150K.
- **Timeline:** 12-18 months to first 5-10 district contracts.
- **Cost:** ~$2-4M for sales team + compliance.
- This is harder for a buildathon-origin product without case studies, but the AI-resistant angle has urgency that justifies a meeting.

### Option C — Embedded / OEM (sell the framework, not the app)
- License the AI-resistant assessment + rubric framework to an LMS or assessment vendor (Schoology, Canvas, Turnitin, Edmentum, Curriculum Associates).
- They distribute, you provide the IP and ongoing model work.
- Lower upside, faster cash, much less GTM work.
- See §6.

### Recommended sequence
1. **Now (0-3 months):** Fix the Stripe pricing bug, ship LTI 1.3 + Google Classroom export, strip Lovable branding, launch a free tier scoped to differentiation (gate audio + assessment vulnerability behind paid). Pick one name.
2. **3-9 months:** Run Option A in parallel with 5-10 hand-picked district pilots. Capture outcome data. Get SOC 2 Type 1, then Type 2.
3. **9-18 months:** Decide based on traction whether to raise for Option B or pursue Option C.

---

## 6. Should we sell it to Schoology?

**Short answer:** Not yet. Probably not to Schoology specifically. But seriously consider an OEM/license deal with Turnitin or a strategic acquirer in 12-18 months.

### Why not now
- Acquirers price on revenue + strategic fit. With near-zero ARR and no district logos, you'd be selling on tech and team — that's a $1-5M acquihire range at most. The product is worth more than that to build out for another 12-18 months and revisit.
- The AI-resistant assessment IP is the most valuable asset, and it's *most* valuable right now to acquirers because the problem is acute and unsolved. That value goes up if you can show even modest traction (10-20 districts, 50K teachers).

### Why not Schoology specifically
- Schoology is owned by PowerSchool, which was taken private by Bain in 2024 for $5.6B. Bain-era PowerSchool is in cost-discipline mode and is better characterized as a consolidator of cash-flowing assets than an acquirer of pre-revenue innovation. The strategic logic is there, but the buyer profile is poor for a small acquisition.
- If you go this direction, **Instructure (Canvas) is a better fit** — they're public (CNVS), have a stronger acquisition track record (Mastery Connect, Concentric Sky/Badgr, Parchment), and Canvas dominates higher-ed where the AI-resistance problem is most painful.
- **Turnitin/Advance Publications** is the most strategically aligned buyer. They sell *detection*; we sell *prevention by design*. That's a complete story for them and lets them differentiate against GPTZero/Copyleaks. Likely the best exit if you go that route.
- **Google for Education / Microsoft Education** are dark horses but historically prefer to build internally.

### Recommended posture
- Don't shop the company. Shop the *AI-resistant assessment module* as a licensable framework to Turnitin, Instructure, and possibly McGraw Hill / Curriculum Associates. A non-exclusive license at $200-500K/yr per partner is realistic and doesn't preclude building the standalone product.
- Revisit acquisition conversations in 12-18 months once you have either (a) 50K+ MAU teachers or (b) 10+ paying district contracts. At that point realistic outcomes are $20-80M depending on growth rate.
- If you must exit now: it's an acquihire, $2-5M, mostly for the team and the AI-resistance framework.

---

## 7. Bottom line

The product is genuinely differentiated on two axes — AI-resistant assessment design and composable differentiation — and the FERPA architecture is a procurement-cycle gift. The weaknesses are all GTM and integration, not product: no LMS bridge, no free tier, no compliance paperwork, no outcomes evidence, and a Lovable buildathon provenance that needs to be cleaned up before serious district conversations.

The honest path is: ship LTI integration and a free tier, get SOC 2, run district pilots, and use the next 12-18 months to either grow into a Series A-fundable company or a credible $20-80M acquisition target. Selling now leaves money on the table; selling to Schoology specifically is a structural mismatch.

If the team's appetite is for a fast exit rather than a multi-year build, the best move is **license the AI-resistant assessment framework to Turnitin** as a non-exclusive OEM deal — that monetizes the most novel asset without giving up the rest.
