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

const systemPrompt = `You are an expert in AI-resistant assessment design. Create clear, specific analytic rubrics that:
1. Use observable, measurable criteria that are VERIFIABLE
2. Distinguish clearly between performance levels with AI-proof language
3. Avoid vague language ("good", "adequate", "some")
4. Include specific verification requirements at each level
5. Align directly to the learning objectives
6. Make it difficult for AI tools to fake authentic work

PERFORMANCE LEVELS (always use these):
- Exemplary (4 points)
- Proficient (3 points)
- Developing (2 points)
- Beginning (1 point)

AI-PROOF VERIFICATION LANGUAGE TO INCORPORATE:

For LOCAL SPECIFICITY criteria:
- Exemplary: ${AI_PROOF_LANGUAGE.exemplary.localSpecificity}
- Proficient: ${AI_PROOF_LANGUAGE.proficient.localSpecificity}
- Developing: ${AI_PROOF_LANGUAGE.developing.localSpecificity}
- Beginning: ${AI_PROOF_LANGUAGE.beginning.localSpecificity}

For PERSONAL CONNECTION criteria:
- Exemplary: ${AI_PROOF_LANGUAGE.exemplary.personalConnection}
- Proficient: ${AI_PROOF_LANGUAGE.proficient.personalConnection}
- Developing: ${AI_PROOF_LANGUAGE.developing.personalConnection}
- Beginning: ${AI_PROOF_LANGUAGE.beginning.personalConnection}

For PRIMARY RESEARCH criteria:
- Exemplary: ${AI_PROOF_LANGUAGE.exemplary.primaryResearch}
- Proficient: ${AI_PROOF_LANGUAGE.proficient.primaryResearch}
- Developing: ${AI_PROOF_LANGUAGE.developing.primaryResearch}
- Beginning: ${AI_PROOF_LANGUAGE.beginning.primaryResearch}

For PROCESS DOCUMENTATION criteria:
- Exemplary: ${AI_PROOF_LANGUAGE.exemplary.processDocumentation}
- Proficient: ${AI_PROOF_LANGUAGE.proficient.processDocumentation}
- Developing: ${AI_PROOF_LANGUAGE.developing.processDocumentation}
- Beginning: ${AI_PROOF_LANGUAGE.beginning.processDocumentation}

For REFLECTION criteria:
- Exemplary: ${AI_PROOF_LANGUAGE.exemplary.reflection}
- Proficient: ${AI_PROOF_LANGUAGE.proficient.reflection}
- Developing: ${AI_PROOF_LANGUAGE.developing.reflection}
- Beginning: ${AI_PROOF_LANGUAGE.beginning.reflection}

For PRESENTATION criteria:
- Exemplary: ${AI_PROOF_LANGUAGE.exemplary.presentation}
- Proficient: ${AI_PROOF_LANGUAGE.proficient.presentation}
- Developing: ${AI_PROOF_LANGUAGE.developing.presentation}
- Beginning: ${AI_PROOF_LANGUAGE.beginning.presentation}

Use the appropriate verification language above based on what criteria the assessment requires. Not all criteria types will apply to every assessment - select and adapt the relevant ones.

Format the rubric as a markdown table with clear descriptions for each cell. Each criterion should be a row, and each performance level should be a column.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assessmentDescription, learningObjectives, numCriteria } = await req.json();

    console.log("Generating rubric for:", { assessmentDescription, learningObjectives, numCriteria });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `CREATE AN ANALYTIC RUBRIC for this assessment:

ASSESSMENT DESCRIPTION:
${assessmentDescription}

LEARNING OBJECTIVES:
${learningObjectives.map((obj: string) => `- ${obj}`).join("\n")}

RUBRIC REQUIREMENTS:
- Number of criteria: ${numCriteria} (create exactly this many)
- Performance levels: Exemplary (4), Proficient (3), Developing (2), Beginning (1)
- Include point values
- Be specific and observable
- Use concrete examples of what each level looks like
- Avoid vague terms like "good", "adequate", "some"

Format as a markdown table with clear descriptions for each cell.`;

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
    const rubric = data.choices?.[0]?.message?.content;

    if (!rubric) {
      throw new Error("No rubric generated");
    }

    console.log("Rubric generated successfully");

    return new Response(
      JSON.stringify({ rubric }),
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
