import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You prepare educational text for text-to-speech conversion. Your job is to:
1. Convert markdown to spoken text (remove formatting symbols like **, ##, etc.)
2. Spell out abbreviations (e.g., "Dr." becomes "Doctor", "etc." becomes "et cetera")
3. Add natural pauses using periods and commas
4. Convert tables to spoken descriptions (e.g., "The table shows...")
5. Remove or describe visual elements (e.g., "[VISUAL: diagram]" becomes "As shown in the diagram...")
6. Keep language natural and conversational
7. Maintain the same content and reading level

Do NOT summarize or shorten - convert the FULL content to speakable text.

Format the output as plain text ready for text-to-speech, with no markdown or special formatting.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonContent, language, readingLevel } = await req.json();

    console.log("Generating audio script for:", { language, readingLevel, contentLength: lessonContent?.length });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `CONVERT THIS LESSON TO AUDIO SCRIPT:

Target Language: ${language}
Reading Level: ${readingLevel}

LESSON CONTENT:
---
${lessonContent}
---

Convert to a natural audio script that a ${language} speaker would read aloud to students. Maintain the educational content and reading level. Do not summarize - include ALL the content.`;

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
    const audioScript = data.choices?.[0]?.message?.content;

    if (!audioScript) {
      throw new Error("No audio script generated");
    }

    console.log("Audio script generated successfully");

    return new Response(
      JSON.stringify({ audioScript }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating audio script:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
