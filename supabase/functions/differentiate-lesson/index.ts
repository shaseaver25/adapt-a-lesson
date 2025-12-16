import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Strengths-based naming system
const LEVEL_MAP: Record<string, string> = {
  'Below Grade': 'embers',
  'On Grade': 'flames',
  'Above Grade': 'blazers',
  'Advanced': 'supernovas',
};

const LEVEL_ICONS: Record<string, string> = {
  'Below Grade': '🔥',
  'On Grade': '🔥',
  'Above Grade': '💫',
  'Advanced': '🌟',
};

interface StudentGroup {
  id: string;
  groupName: string;
  numStudents: number;
  readingLevelLabel: string;
  readingLevelLexile: string;
  homeLanguage: string;
  ellStatus: string;
  iep504Status: string;
  learningPreferences: string[];
  accommodations: string[];
  notes: string;
}

interface DifferentiationOptions {
  includeVocabularyScaffolding: boolean;
  generateComprehensionQuestions: boolean;
  includeVisualPlaceholders: boolean;
  includeGraphicOrganizers: boolean;
  graphicOrganizerType: string;
  outputFormat: string;
}

const READING_LEVEL_ORDER: Record<string, number> = {
  'Below Grade': 1,
  'On Grade': 2,
  'Above Grade': 3,
  'Advanced': 4,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonContent, selectedGroups, options } = await req.json();

    console.log(`Differentiating lesson for ${selectedGroups.length} groups`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Sort groups from lowest to highest reading level
    const sortedGroups = [...(selectedGroups as StudentGroup[])].sort((a, b) => {
      const orderA = READING_LEVEL_ORDER[a.readingLevelLabel] || 2;
      const orderB = READING_LEVEL_ORDER[b.readingLevelLabel] || 2;
      return orderA - orderB;
    });

    // Build the structured prompt
    const systemPrompt = `You are an expert educator creating differentiated lesson content.

CRITICAL: You must respond with VALID JSON only. No markdown outside the JSON structure.

Output this exact JSON structure:
{
  "teacherGuide": "Complete teacher guide as markdown string",
  "studentHandouts": [
    {
      "groupId": "group-id-from-input",
      "groupName": "Exact group name from input",
      "level": "embers|sparks|flames|blazers|supernovas",
      "language": "English|Spanish|Arabic|Somali|etc",
      "content": "Complete student handout as markdown string",
      "englishContent": "English version of the same content (ONLY for non-English groups)"
    }
  ]
}

TEACHER GUIDE REQUIREMENTS (teacherGuide field):
- Always in English
- Include: Lesson Overview, Accommodations Summary Table, Materials Needed, Pacing Guide
- Include: Facilitation Guide with specific teacher language
- Include: Differentiation Strategies BY GROUP (detailed, actionable)
- Include: Formative Assessment Checkpoints
- Use markdown formatting

STUDENT HANDOUT REQUIREMENTS:

FOR ENGLISH GROUPS:
- content: The lesson in English
- englishContent: null or omit

FOR NON-ENGLISH GROUPS (CRITICAL - BILINGUAL OUTPUT):
- content: The FULL lesson translated into the group's home language
- englishContent: The SAME lesson content in English
- BOTH versions must have IDENTICAL STRUCTURE so they align side-by-side:
  - Same section headers (translated vs English)
  - Same number of practice problems
  - Same vocabulary terms
  - Same reflection prompts
- This enables side-by-side bilingual display

HANDOUT CONTENT STRUCTURE (both languages):
- Start with: **Name:** _____ **Date:** _____
- Include: 🎯 Learning Target (student-friendly)
- Include: Lesson content with [VISUAL: description] placeholders
- Include: Vocabulary box 
- Include: Practice section with answer lines
- Include: Reflection section
- Use markdown formatting
- NEVER include teacher directions, scaffolding strategies, or pacing notes
- Write TO the student: "You will..." not "Teacher will..."

LEVEL MAPPING:
- "Below Grade" → "embers"
- "On Grade" → "flames"  
- "Above Grade" → "blazers"
- "Advanced" → "supernovas"

ORDER: Always process groups from lowest to highest level (embers → supernovas).`;

    // Build group descriptions
    const groupDescriptions = sortedGroups.map((g: StudentGroup) => {
      const levelKey = LEVEL_MAP[g.readingLevelLabel] || 'flames';
      const icon = LEVEL_ICONS[g.readingLevelLabel] || '📖';
      
      let desc = `GROUP: "${g.groupName}"
- ID: ${g.id}
- Level: ${g.readingLevelLabel} (${levelKey}) ${icon}
- Students: ${g.numStudents}
- Language: ${g.homeLanguage}
- Lexile: ${g.readingLevelLexile || 'Not specified'}`;

      if (g.ellStatus !== 'None') {
        desc += `\n- ELL Status: ${g.ellStatus}`;
      }
      if (g.iep504Status !== 'None') {
        desc += `\n- IEP/504: ${g.iep504Status}`;
      }
      if (g.accommodations.length > 0) {
        desc += `\n- Accommodations: ${g.accommodations.join(', ')}`;
      }
      if (g.learningPreferences.length > 0) {
        desc += `\n- Learning Preferences: ${g.learningPreferences.join(', ')}`;
      }
      if (g.notes) {
        desc += `\n- Notes: ${g.notes}`;
      }
      
      return desc;
    }).join('\n\n');

    // Build options description
    let optionsDesc = 'OPTIONS:\n';
    if (options.includeVocabularyScaffolding) {
      optionsDesc += '- Include vocabulary scaffolding with bilingual glossaries\n';
    }
    if (options.generateComprehensionQuestions) {
      optionsDesc += '- Generate comprehension questions for each group\n';
    }
    if (options.includeVisualPlaceholders) {
      optionsDesc += '- Include [VISUAL: description] placeholders\n';
    }
    if (options.includeGraphicOrganizers) {
      optionsDesc += `- Include graphic organizers (type: ${options.graphicOrganizerType || 'auto'})\n`;
    }

    const userPrompt = `Create a differentiated lesson with structured output.

STUDENT GROUPS (ordered lowest to highest level):
${groupDescriptions}

${optionsDesc}

ORIGINAL LESSON CONTENT:
---
${lessonContent}
---

Remember:
1. Output ONLY valid JSON matching the schema
2. teacherGuide: Full teacher reference document in English (markdown)
3. studentHandouts: Array with one object per group, each with complete student-facing content
4. Non-English groups get fully translated handouts
5. Never put teacher directions in student handouts
6. Use groupId exactly as provided in the input`;

    console.log('Calling AI with structured JSON request...');

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
        response_format: { type: "json_object" },
        max_tokens: 32000, // Allow larger responses for multiple groups
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

    // Handle potentially empty or malformed response
    let aiResponse;
    try {
      const responseText = await response.text();
      console.log('Response text length:', responseText?.length || 0);
      
      if (!responseText || responseText.trim() === '') {
        throw new Error("Empty response from AI gateway");
      }
      
      aiResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI gateway response:', parseError);
      const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown parse error';
      throw new Error(`Failed to parse AI response: ${errorMsg}`);
    }

    const rawContent = aiResponse.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error('AI response structure:', JSON.stringify(aiResponse).substring(0, 500));
      throw new Error("No content generated from AI");
    }

    console.log('Raw AI response length:', rawContent.length);

    // Parse the JSON response with fallback handling
    let lessonData;
    try {
      // First, try direct parsing
      lessonData = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content preview:', rawContent.substring(0, 500));
      
      // Try to clean the content - sometimes there's markdown wrapper
      let cleanedContent = rawContent.trim();
      
      // Remove markdown code blocks if present
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7);
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      cleanedContent = cleanedContent.trim();
      
      try {
        lessonData = JSON.parse(cleanedContent);
      } catch (secondError) {
        // If still failing, try to extract teacherGuide at minimum
        console.error('Second parse attempt failed:', secondError);
        
        // Try to extract content using regex as last resort
        const teacherGuideMatch = rawContent.match(/"teacherGuide"\s*:\s*"([\s\S]*?)(?:","studentHandouts"|"\s*,\s*"studentHandouts")/);
        const studentHandoutsMatch = rawContent.match(/"studentHandouts"\s*:\s*\[([\s\S]*?)\]\s*}/);
        
        if (teacherGuideMatch) {
          console.log('Attempting regex extraction fallback...');
          // Create a minimal valid structure
          lessonData = {
            teacherGuide: teacherGuideMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\'),
            studentHandouts: []
          };
          
          // Try to parse studentHandouts array if found
          if (studentHandoutsMatch) {
            try {
              const handoutsStr = '[' + studentHandoutsMatch[1] + ']';
              // Fix common JSON issues
              const fixedHandouts = handoutsStr
                .replace(/,\s*]/g, ']')  // Remove trailing commas
                .replace(/,\s*,/g, ','); // Remove double commas
              lessonData.studentHandouts = JSON.parse(fixedHandouts);
            } catch (handoutsError) {
              console.error('Failed to parse studentHandouts:', handoutsError);
            }
          }
        } else {
          throw new Error('Failed to parse AI response as JSON - content may be truncated');
        }
      }
    }

    // Validate structure
    if (!lessonData.teacherGuide || !Array.isArray(lessonData.studentHandouts)) {
      console.error('Invalid structure:', Object.keys(lessonData));
      throw new Error('AI response missing required fields');
    }

    console.log(`Generated: teacherGuide (${lessonData.teacherGuide.length} chars), ${lessonData.studentHandouts.length} handouts`);

    // Return structured data
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          teacherGuide: lessonData.teacherGuide,
          studentHandouts: lessonData.studentHandouts,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error differentiating lesson:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
