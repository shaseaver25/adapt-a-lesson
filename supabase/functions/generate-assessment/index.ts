import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an assessment design expert specializing in authentic, AI-resistant assessments. You create assessments that require genuine student thinking and cannot be easily completed by AI tools.

CORE PRINCIPLES:
1. Process over product - assess HOW students think, not just final answers
2. Hyper-local context - reference specific, local details AI wouldn't know
3. Personal connection - require reflection on student's own experience
4. Artifact requirements - physical evidence that can't be faked
5. Iteration tracking - show evolution of thinking

ASSESSMENT COMPONENTS TO INCLUDE:
1. Process Checkpoints (3): Questions students answer DURING the work
2. Artifact Requirement (1): Physical or documented evidence
3. Reflection Prompt (1): Personal metacognitive reflection
4. AI Disclosure (1): Statement about AI tool usage

AVOID:
- Questions with single "correct" answers easily found online
- Generic prompts that AI could answer well
- Assessments focused only on final products

Format the output as clean markdown with clear sections and emoji icons for visual organization.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      lessonTitle, 
      subject, 
      gradeLevel, 
      learningObjectives, 
      aiPolicy, 
      schoolName, 
      city, 
      state, 
      localContext 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build AI policy description
    const aiPolicyDescriptions: Record<string, string> = {
      prohibited: "Students should not use AI tools",
      limited_assist: "AI okay for brainstorming only",
      encouraged_with_citation: "AI okay if documented",
    };

    const userPrompt = `CREATE AN AI-RESISTANT ASSESSMENT for this lesson:

LESSON INFORMATION:
- Title: ${lessonTitle}
- Subject: ${subject}
- Grade Level: ${gradeLevel}
- Learning Objectives:
${learningObjectives.map((obj: string) => `  - ${obj}`).join("\n")}

AI POLICY FOR THIS CLASS: ${aiPolicy} (${aiPolicyDescriptions[aiPolicy] || aiPolicy})

LOCAL CONTEXT (use these details to make questions hyper-local):
- School: ${schoolName || "Not specified"}
- City: ${city || "Not specified"}
- State: ${state || "Not specified"}
- Other local details: ${localContext || "None provided"}

Generate an assessment with:

1. THREE PROCESS CHECKPOINTS
   - Questions students answer WHILE working (not after)
   - Should reveal student thinking process
   - Cannot be answered by AI without doing the actual work

2. ONE ARTIFACT REQUIREMENT
   - Physical evidence (photo, sketch, data collection, interview notes)
   - Something AI cannot produce
   - Connected to learning objectives

3. ONE REFLECTION PROMPT
   - Personal metacognitive question
   - References student's specific experience with THIS task
   - Requires genuine self-reflection

4. ONE AI DISCLOSURE PROMPT
   - Based on the AI policy specified above
   - Specific questions about tool usage

Format as markdown with clear sections.`;

    console.log("Generating AI-resistant assessment for:", lessonTitle);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Handle potentially empty or malformed response
    let data;
    try {
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        throw new Error("Empty response from AI gateway");
      }
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown parse error';
      throw new Error(`Failed to parse AI response: ${errorMsg}`);
    }

    const generatedContent = data.choices?.[0]?.message?.content;

    if (!generatedContent) {
      console.error('AI response structure:', JSON.stringify(data).substring(0, 500));
      throw new Error("No content generated from AI");
    }

    console.log("Assessment generated successfully");

    return new Response(JSON.stringify({ assessment: generatedContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating assessment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
