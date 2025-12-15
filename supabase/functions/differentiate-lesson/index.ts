import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are an expert educator who specializes in differentiating instructional content for diverse learners. Your job is to create a comprehensive differentiated lesson plan that includes adapted versions for MULTIPLE student groups.

CORE RULES:
1. NEVER change the learning objectives - all students learn the same content
2. Adjust vocabulary, sentence complexity, and text density appropriately for each group
3. Add scaffolds for lower reading levels
4. Add extensions and deeper questions for higher levels
5. Preserve all key concepts and accurate information
6. Match each group's reading level precisely
7. Include bilingual vocabulary supports for ELL students
8. Embed specific IEP accommodations when requested

Format your output as a comprehensive markdown document with clear sections for each student group.`;

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
  outputFormat: string;
}

function buildGroupInstructions(group: StudentGroup, options: DifferentiationOptions): string {
  let instructions = `\n### Group: ${group.groupName} (${group.numStudents} students)
- Reading Level: ${group.readingLevelLabel}${group.readingLevelLexile ? ` (${group.readingLevelLexile} Lexile)` : ''}
- Home Language: ${group.homeLanguage}
- ELL Status: ${group.ellStatus}
- IEP/504: ${group.iep504Status}`;

  if (group.learningPreferences.length > 0) {
    instructions += `\n- Learning Preferences: ${group.learningPreferences.join(', ')}`;
  }

  if (group.accommodations.length > 0) {
    instructions += `\n- Required Accommodations: ${group.accommodations.join(', ')}`;
  }

  if (group.notes) {
    instructions += `\n- Teacher Notes: ${group.notes}`;
  }

  // Level-specific differentiation
  let levelGuidance = "\n\nDIFFERENTIATION APPROACH:";
  
  if (group.readingLevelLabel === "Below Grade") {
    levelGuidance += `
- Simplify vocabulary (define terms inline)
- Shorten sentences to max 15 words
- Add visual cues and icons [VISUAL: description]
- Include sentence starters for responses
- Chunk content into smaller sections
- Add "Check for Understanding" prompts`;
  } else if (group.readingLevelLabel === "Advanced" || group.readingLevelLabel === "Above Grade") {
    levelGuidance += `
- Maintain sophisticated vocabulary
- Add extension questions ("Go Deeper" challenges)
- Include primary source references or advanced connections
- Reduce scaffolding, assume student independence
- Add "What if..." thought experiments`;
  } else {
    levelGuidance += `
- Grade-level vocabulary
- Clear, direct sentences
- Standard scaffolding appropriate for grade level`;
  }

  instructions += levelGuidance;

  // ELL support
  if (group.ellStatus !== "None" && group.homeLanguage !== "English") {
    instructions += `

ELL SUPPORT:
- Add bilingual vocabulary box (English → ${group.homeLanguage}) for 5-7 key terms
- Include visual supports for abstract concepts
- Add sentence frames for verbal responses`;
  }

  return instructions;
}

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

    // Build comprehensive prompt for all groups
    let groupsSection = "## STUDENT GROUPS TO DIFFERENTIATE FOR:\n";
    for (const group of selectedGroups as StudentGroup[]) {
      groupsSection += buildGroupInstructions(group, options as DifferentiationOptions);
      groupsSection += "\n\n---\n";
    }

    // Build options section
    let optionsSection = "\n## DIFFERENTIATION OPTIONS:\n";
    if (options.includeVocabularyScaffolding) {
      optionsSection += "- ✅ Include vocabulary scaffolding with bilingual glossaries\n";
    }
    if (options.generateComprehensionQuestions) {
      optionsSection += "- ✅ Generate level-appropriate comprehension questions for each group\n";
    }
    if (options.includeVisualPlaceholders) {
      optionsSection += "- ✅ Include [VISUAL: description] placeholders for images/diagrams\n";
    }
    optionsSection += `- Output Format: ${options.outputFormat}\n`;

    const userPrompt = `Create a COMPREHENSIVE DIFFERENTIATED LESSON PLAN for the following student groups.

${groupsSection}

${optionsSection}

ORIGINAL LESSON CONTENT:
---
${lessonContent}
---

OUTPUT STRUCTURE:
Create a single, comprehensive document with this structure:

# [Extract Lesson Title from Content] - Differentiated Lesson Plan
**Generated:** ${new Date().toLocaleDateString()}  
**Groups Included:** ${(selectedGroups as StudentGroup[]).map((g: StudentGroup) => g.groupName).join(", ")}

---

[For EACH student group, create a section:]

## 📚 Group: [Group Name]
**Profile:** [Reading Level] | [ELL Status if not None] | [# Students]  
**Accommodations Applied:** [list as badges/tags]

### Adapted Content:
[Full lesson content adapted for this specific group]

${options.includeVocabularyScaffolding ? `### Vocabulary Support:
[Key terms with definitions, translations if ELL]

` : ''}${options.generateComprehensionQuestions ? `### Comprehension Questions:
[3-5 questions appropriate for this group's level]

` : ''}### Scaffolding Notes:
[Brief teacher guidance for supporting this group]

---

## 🎯 Cross-Group Teaching Notes
[AI-generated suggestions for:
- Managing instruction across multiple groups simultaneously
- Flexible grouping strategies
- Common misconceptions to address
- Extension activities for early finishers]`;

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

    console.log("Differentiated lesson generated successfully for", selectedGroups.length, "groups");

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
