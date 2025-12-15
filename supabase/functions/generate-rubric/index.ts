import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are an expert in assessment design. Create clear, specific analytic rubrics that:
1. Use observable, measurable criteria
2. Distinguish clearly between performance levels
3. Avoid vague language ("good", "adequate", "some")
4. Include specific examples of what each level looks like
5. Align directly to the learning objectives

PERFORMANCE LEVELS (always use these):
- Exemplary (4 points)
- Proficient (3 points)
- Developing (2 points)
- Beginning (1 point)

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
