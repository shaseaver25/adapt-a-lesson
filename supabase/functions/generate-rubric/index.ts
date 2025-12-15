import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_PROOF_LANGUAGE = {
  exemplary: {
    localSpecificity: "specific to [school/neighborhood/community] with named locations, people, or policies that would not apply elsewhere",
    personalConnection: "includes specific, verifiable details demonstrating firsthand experience (named individuals with permission, specific dates, observed incidents)",
    primaryResearch: "documented primary research with evidence of authentic interaction (recorded interview with transcript, signed release form, OR survey with raw response data from 10+ respondents)",
    processDocumentation: "provides comprehensive process documentation (dated research log, draft evolution via version history, photographic evidence of community engagement)",
    reflection: "references specific moments during the work process with timestamps, names real obstacles encountered, describes authentic emotional responses tied to documented events",
    presentation: "demonstrates authentic ownership through ability to answer spontaneous follow-up questions, natural unrehearsed moments showing deep content familiarity, and evidence of actual delivery to intended audience"
  },
  proficient: {
    localSpecificity: "clearly connected to local context with at least 2-3 specific, verifiable local details",
    personalConnection: "includes genuine personal connection with at least one specific, verifiable detail",
    primaryResearch: "primary research with evidence of actual interaction (interview notes with source name/role, OR survey summary with response count and method)",
    processDocumentation: "provides partial process documentation showing authentic engagement",
    reflection: "describes specific challenges and growth with some concrete details from the work process",
    presentation: "shows comfort with material and can respond to basic follow-up questions"
  },
  developing: {
    localSpecificity: "somewhat connected to local context but lacks specific, verifiable details",
    personalConnection: "superficial personal connection lacking verifiable specifics",
    primaryResearch: "primary research is informal or undocumented (e.g., 'I talked to someone')",
    processDocumentation: "limited or inconsistent process documentation",
    reflection: "generic reflection without specific process details or timestamps",
    presentation: "reads from script with limited ability to elaborate or answer questions"
  },
  beginning: {
    localSpecificity: "generic topic that could apply to any location; no local verification possible",
    personalConnection: "personal connection absent, fabricated, or entirely generic",
    primaryResearch: "no evidence of primary research or authentic source interaction",
    processDocumentation: "no process documentation; work appears potentially AI-generated",
    reflection: "absent, generic, or contains hallmarks of AI-generated content (vague, formulaic, no specific details)",
    presentation: "unable to answer basic questions about own work; suggests lack of authentic engagement"
  }
};

// Auto-generated verification criteria templates for assessments with AI-vulnerability score > 30
const VERIFICATION_CRITERIA_TEMPLATES = {
  processIntegrity: `**PROCESS INTEGRITY & AUTHENTICITY**
(Required for all assessments with AI-vulnerability score > 30)

| Exemplary (4) | Proficient (3) | Developing (2) | Beginning (1) |
|---------------|----------------|----------------|---------------|
| Provides comprehensive evidence of authentic work process: dated research/work log with 5+ entries showing evolution of thinking; interview recording/transcript OR survey with raw data; draft history showing substantive revisions (not just edits); photographic or documentary evidence of real-world engagement. Student can fluently discuss any aspect of their process when asked. | Provides adequate evidence of authentic work: dated log with 3+ entries; documented primary source interaction; evidence of at least one major revision based on feedback or new learning. Student can discuss most aspects of their process. | Provides minimal evidence of authentic work: sparse or undated log entries; informal or partially documented source interactions; limited evidence of revision or process. Student struggles to elaborate on process details. | Provides no credible evidence of authentic work process. Documentation is absent, fabricated, or inconsistent with submitted work. Student cannot answer basic questions about their own work process. Work exhibits hallmarks of AI generation. |`,

  localPersonalVerification: `**LOCAL SPECIFICITY & PERSONAL AUTHENTICITY**
(Auto-added when assessment involves personal experience or local context)

| Exemplary (4) | Proficient (3) | Developing (2) | Beginning (1) |
|---------------|----------------|----------------|---------------|
| Work is unmistakably grounded in specific local context with 5+ verifiable details (named locations, specific local policies, named community members with permission, dated local events). Personal elements include specific, verifiable firsthand experiences that could not be fabricated. Teacher could verify claims through quick local inquiry. | Work is clearly connected to local context with 3-4 specific details that demonstrate authentic local knowledge. Personal elements include at least 2 specific, plausible firsthand experiences. | Work has superficial local connection with only 1-2 generic local references. Personal elements are vague or could apply to anyone ("I care about this issue because..."). | Work could describe any location; no specific local details. Personal elements are absent, entirely generic, or contain implausible claims. Content reads as AI-generated with [location] placeholders filled in. |`,

  liveDefense: `**AUTHENTICITY VERIFICATION (Live Component)**
(Auto-added when assessment is written-only or high AI-vulnerability)

| Exemplary (4) | Proficient (3) | Developing (2) | Beginning (1) |
|---------------|----------------|----------------|---------------|
| During live Q&A, student demonstrates complete ownership: answers all spontaneous questions with specific details not in written work; elaborates naturally without hesitation; makes connections between different parts of their project; discusses dead-ends and pivots in their process; shows emotional investment in topic. | Student demonstrates solid ownership: answers most questions with reasonable detail; can elaborate on main points; shows familiarity with sources and process; minor hesitation on edge questions is natural. | Student demonstrates partial ownership: answers basic questions but struggles with specifics; relies heavily on re-reading from written work; cannot elaborate beyond what's written; significant gaps in process knowledge. | Student cannot demonstrate ownership: unable to answer basic questions; unfamiliar with own sources or claims; responses contradict written work; shows no evidence of authentic engagement with material. Suggests work was not authentically completed. |`
};

const systemPrompt = `You are generating an AI-resistant assessment rubric for K-12 education. Your rubric must:

1. ALIGN precisely to the provided learning objectives
2. USE observable, measurable criteria at each performance level
3. INCLUDE specific examples that distinguish between levels
4. INCORPORATE AI-proof verification language based on vulnerability analysis
5. HELP teachers distinguish between authentic student work and AI-generated submissions

AI-PROOF REQUIREMENTS (apply based on assessment type):

For ANY criterion involving RESEARCH:
- Include language about "documented sources," "evidence of authentic interaction," and "verifiable details"
- Exemplary: ${AI_PROOF_LANGUAGE.exemplary.primaryResearch}
- Proficient: ${AI_PROOF_LANGUAGE.proficient.primaryResearch}
- Developing: ${AI_PROOF_LANGUAGE.developing.primaryResearch}
- Beginning: ${AI_PROOF_LANGUAGE.beginning.primaryResearch}

For ANY criterion involving PERSONAL EXPERIENCE:
- Include language about "specific, verifiable firsthand experience" and "named individuals/locations/dates"
- Exemplary: ${AI_PROOF_LANGUAGE.exemplary.personalConnection}
- Proficient: ${AI_PROOF_LANGUAGE.proficient.personalConnection}
- Developing: ${AI_PROOF_LANGUAGE.developing.personalConnection}
- Beginning: ${AI_PROOF_LANGUAGE.beginning.personalConnection}

For ANY criterion involving LOCAL CONTEXT:
- Include language about "specific to [location] with details that would not apply elsewhere"
- Exemplary: ${AI_PROOF_LANGUAGE.exemplary.localSpecificity}
- Proficient: ${AI_PROOF_LANGUAGE.proficient.localSpecificity}
- Developing: ${AI_PROOF_LANGUAGE.developing.localSpecificity}
- Beginning: ${AI_PROOF_LANGUAGE.beginning.localSpecificity}

For ANY criterion involving REFLECTION:
- Include language about "specific moments during the process," "timestamps," and "documented obstacles"
- Exemplary: ${AI_PROOF_LANGUAGE.exemplary.reflection}
- Proficient: ${AI_PROOF_LANGUAGE.proficient.reflection}
- Developing: ${AI_PROOF_LANGUAGE.developing.reflection}
- Beginning: ${AI_PROOF_LANGUAGE.beginning.reflection}

For ANY criterion involving PROCESS DOCUMENTATION:
- Exemplary: ${AI_PROOF_LANGUAGE.exemplary.processDocumentation}
- Proficient: ${AI_PROOF_LANGUAGE.proficient.processDocumentation}
- Developing: ${AI_PROOF_LANGUAGE.developing.processDocumentation}
- Beginning: ${AI_PROOF_LANGUAGE.beginning.processDocumentation}

For ANY criterion involving PRESENTATION/DEFENSE:
- Exemplary: ${AI_PROOF_LANGUAGE.exemplary.presentation}
- Proficient: ${AI_PROOF_LANGUAGE.proficient.presentation}
- Developing: ${AI_PROOF_LANGUAGE.developing.presentation}
- Beginning: ${AI_PROOF_LANGUAGE.beginning.presentation}

LEVEL DIFFERENTIATION (always use these 4 levels):
- Exemplary (4 points): Exceeds expectations with sophisticated, verified, specific work
- Proficient (3 points): Meets expectations with adequate verification and specificity
- Developing (2 points): Partially meets expectations with gaps in verification or specificity
- Beginning (1 point): Does not meet expectations; may lack authenticity markers

CRITICAL BEGINNING LEVEL REQUIREMENT:
- At the BEGINNING level: ALWAYS include "work appears potentially AI-generated" or "exhibits hallmarks of AI generation" as a descriptor when other criteria aren't met

OUTPUT FORMAT:
- Use clear markdown table format with descriptive headers
- Create 4-6 criteria aligned to learning objectives (use numCriteria parameter)
- Each criterion should be a row, each performance level should be a column
- Include point values in headers
- Avoid vague language ("good", "adequate", "some")
- Use concrete, observable, measurable descriptors

IMPORTANT: The rubric must remain fair and focused on learning outcomes while helping teachers identify authentic student work.`;


// Helper function to determine which auto-verification criteria to add
function getAutoVerificationCriteria(vulnerabilityAnalysis: any): string[] {
  const criteria: string[] = [];
  
  if (!vulnerabilityAnalysis || vulnerabilityAnalysis.aiVulnerabilityScore <= 30) {
    return criteria;
  }
  
  const score = vulnerabilityAnalysis.aiVulnerabilityScore;
  const vulnerabilities = vulnerabilityAnalysis.vulnerabilities || {};
  const strengths = vulnerabilityAnalysis.strengths || {};
  
  // Always add Process Integrity for score > 30
  criteria.push(VERIFICATION_CRITERIA_TEMPLATES.processIntegrity);
  
  // Add Local/Personal Verification if relevant vulnerabilities exist
  if (
    vulnerabilities.genericPersonalConnection ||
    vulnerabilities.nonLocalTopic ||
    (!strengths.localSpecificityRequired && score > 40)
  ) {
    criteria.push(VERIFICATION_CRITERIA_TEMPLATES.localPersonalVerification);
  }
  
  // Add Live Defense if written-only or high vulnerability
  if (
    vulnerabilities.writtenOnlyOutput ||
    (!strengths.requiresLivePresentation && score > 50)
  ) {
    criteria.push(VERIFICATION_CRITERIA_TEMPLATES.liveDefense);
  }
  
  return criteria;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assessmentDescription, learningObjectives, numCriteria, vulnerabilityAnalysis } = await req.json();

    console.log("Generating rubric for:", { 
      assessmentDescription, 
      learningObjectives, 
      numCriteria,
      vulnerabilityScore: vulnerabilityAnalysis?.aiVulnerabilityScore 
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Determine auto-verification criteria to add
    const autoVerificationCriteria = getAutoVerificationCriteria(vulnerabilityAnalysis);
    const hasAutoVerification = autoVerificationCriteria.length > 0;
    
    let autoVerificationSection = "";
    if (hasAutoVerification) {
      autoVerificationSection = `

AUTO-ADDED VERIFICATION CRITERIA (AI-Vulnerability Score: ${vulnerabilityAnalysis.aiVulnerabilityScore}/100):
These additional verification criteria MUST be included in the rubric AFTER your custom criteria:

${autoVerificationCriteria.join("\n\n")}

Include these verification criteria tables in your rubric output EXACTLY as provided above, after the custom criteria you create.`;
    }

    const userPrompt = `CREATE AN ANALYTIC RUBRIC for this assessment:

ASSESSMENT DESCRIPTION:
${assessmentDescription}

LEARNING OBJECTIVES:
${learningObjectives.map((obj: string) => `- ${obj}`).join("\n")}

RUBRIC REQUIREMENTS:
- Number of custom criteria: ${numCriteria} (create exactly this many criteria for the learning objectives)
- Performance levels: Exemplary (4), Proficient (3), Developing (2), Beginning (1)
- Include point values
- Be specific and observable
- Use concrete examples of what each level looks like
- Avoid vague terms like "good", "adequate", "some"
${autoVerificationSection}

Format as a markdown table with clear descriptions for each cell.${hasAutoVerification ? " After your custom criteria, include the auto-added verification criteria tables exactly as provided." : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let rubric = data.choices?.[0]?.message?.content;

    if (!rubric) {
      throw new Error("No rubric generated");
    }

    // Append the Authenticity Verification Guide for teacher use
    const verificationGuide = `

---

## 🛡️ AUTHENTICITY VERIFICATION GUIDE
**(For Teacher Use - Do Not Distribute to Students)**

---

This rubric includes AI-proof verification elements. Use these checkpoints to ensure authentic student work:

### BEFORE GRADING - Collect These Artifacts:
- [ ] Process documentation (research log, drafts, version history)
- [ ] Primary research evidence (recordings, transcripts, raw survey data)
- [ ] Photographic evidence of real-world engagement (if applicable)

### DURING/AFTER GRADING - Verification Questions:
Ask 2-3 of these questions to verify authentic engagement:

**For Research-Based Work:**
- "Tell me more about what [source/interviewee] said about [specific detail]."
- "How did you find [specific source]? What search led you there?"
- "What did [interviewee] say that surprised you most?"

**For Personal/Reflective Work:**
- "Walk me through what happened on [date mentioned in reflection]."
- "You mentioned [specific challenge]—what did you try first?"
- "What almost made you change your topic/approach?"

**For Solution/Proposal Work:**
- "If [stakeholder] said no to this, what would you try next?"
- "What's the weakest part of your proposal? How would you fix it?"
- "Who pushed back on your idea when you shared it? What did they say?"

### ⚠️ RED FLAGS - Signs of Potential AI Generation:
- Cannot answer basic questions about own work
- Written work contains specific details student can't explain
- No process documentation or documentation doesn't match final work
- "Personal" experiences are vague or generic
- Local details are surface-level or easily searchable
- Writing style inconsistent with student's previous work
- Perfect grammar/structure unusual for this student

### IF RED FLAGS APPEAR:
1. Ask more specific follow-up questions
2. Request additional process documentation
3. Compare to student's previous work samples
4. Consider requiring revision with documented process

---
`;

    rubric = rubric + verificationGuide;

    console.log("Rubric generated successfully", {
      autoVerificationCriteriaAdded: autoVerificationCriteria.length
    });

    return new Response(
      JSON.stringify({ 
        rubric,
        autoVerificationAdded: hasAutoVerification,
        autoVerificationCount: autoVerificationCriteria.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating rubric:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
