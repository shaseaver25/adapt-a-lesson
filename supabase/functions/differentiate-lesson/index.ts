import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are an expert educator who specializes in differentiating instructional content for diverse learners. Your job is to rewrite lesson content to match specific reading levels while:

1. NEVER changing the learning objectives - students learn the same content
2. Adjusting vocabulary, sentence complexity, and text density appropriately
3. Adding scaffolds for lower reading levels
4. Adding extensions and deeper questions for higher levels
5. Preserving all key concepts and accurate information
6. Matching the requested reading level precisely
7. Including bilingual vocabulary supports for ELL students
8. Embedding specific IEP accommodations when requested

Format your output in clear markdown with appropriate headers and sections.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonContent, studentGroup } = await req.json();

    console.log("Differentiating lesson for:", studentGroup.groupName);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { readingLevelLabel, readingLevelLexile, ellStatus, homeLanguage, accommodations, notes } = studentGroup;

    // Build the differentiation instructions based on reading level
    let levelInstructions = "";
    
    if (readingLevelLabel === "Below Grade") {
      levelInstructions = `
- Use simpler vocabulary
- Shorter sentences (under 15 words)
- Add visual cue suggestions [VISUAL: description]
- Include inline definitions for key terms in parentheses
- Add "Check for Understanding" prompts after each section
- Use bullet points instead of long paragraphs
- Add sentence starters for responses`;
    } else if (readingLevelLabel === "Advanced" || readingLevelLabel === "Above Grade") {
      levelInstructions = `
- Use sophisticated vocabulary appropriate to the level
- Add extension questions that push thinking ("Go Deeper" challenges)
- Include connections to primary sources or advanced concepts
- Reduce scaffolding, assuming student independence
- Add "What if..." thought experiments`;
    } else {
      levelInstructions = `
- Maintain grade-level vocabulary
- Use clear, direct sentences
- Standard scaffolding appropriate for grade level`;
    }

    // ELL support
    let ellInstructions = "";
    if (ellStatus !== "None" && homeLanguage !== "English") {
      ellInstructions = `

ELL SUPPORT (${ellStatus} level, ${homeLanguage} speaker):
- Add a bilingual vocabulary box with 5-7 key terms showing English and ${homeLanguage} translations
- Include visual supports for abstract concepts
- Add sentence frames for verbal responses`;
    }

    // Accommodations
    let accommodationInstructions = "";
    if (accommodations && accommodations.length > 0) {
      accommodationInstructions = `

ACCOMMODATIONS TO APPLY:
${accommodations.map((a: string) => `- ${a}`).join("\n")}`;
    }

    // Notes
    let notesInstructions = "";
    if (notes) {
      notesInstructions = `

TEACHER NOTES TO CONSIDER:
${notes}`;
    }

    const userPrompt = `Rewrite this lesson content for a ${readingLevelLabel} reading level (approximately ${readingLevelLexile} Lexile).

DIFFERENTIATION REQUIREMENTS:
${levelInstructions}${ellInstructions}${accommodationInstructions}${notesInstructions}

ORIGINAL LESSON:
---
${lessonContent}
---

Create the REWRITTEN VERSION with all adaptations applied. Include a header showing who this is adapted for.`;

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
    const differentiatedLesson = data.choices?.[0]?.message?.content;

    if (!differentiatedLesson) {
      throw new Error("No differentiated lesson generated");
    }

    console.log("Differentiated lesson generated successfully");

    return new Response(
      JSON.stringify({ differentiatedLesson }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error differentiating lesson:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
