import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Strengths-based naming system for student-facing materials
const STUDENT_LEVEL_NAMES: Record<string, { label: string; icon: string }> = {
  'Below Grade': { label: 'Embers', icon: '🔥' },
  'On Grade': { label: 'Flames', icon: '🔥' },
  'Above Grade': { label: 'Blazers', icon: '💫' },
  'Advanced': { label: 'Supernovas', icon: '🌟' },
};

function getStudentFriendlyName(level: string): string {
  return STUDENT_LEVEL_NAMES[level]?.label || level;
}

function getStudentFriendlyIcon(level: string): string {
  return STUDENT_LEVEL_NAMES[level]?.icon || '📖';
}

const systemPrompt = `You are an expert educator who specializes in differentiating instructional content for diverse learners. Your job is to create a comprehensive differentiated lesson plan with TWO DISTINCT SECTIONS:

1. TEACHER GUIDE - Professional reference document with all teaching directions
2. STUDENT HANDOUTS - Clean, printable materials for each student group

CRITICAL: USE STRENGTHS-BASED NAMING ONLY
- NEVER use "Below Grade Level" or any deficit-based language in student-facing content
- Use the following flame-based naming system:
  - "Embers" (🔥) = students who need additional scaffolding
  - "Flames" (🔥) = students at grade level
  - "Blazers" (💫) = students above grade level  
  - "Supernovas" (🌟) = advanced/gifted students

FORMATTING RULES:
- Teacher Guide: Include all pedagogical notes, pacing, assessment checkpoints
- Student Handouts: ONLY student-facing content, no teacher directions
- Use clear visual separators and professional formatting
- Each student group gets their own printable handout section

CORE DIFFERENTIATION RULES:
1. NEVER change the learning objectives - all students learn the same content
2. Adjust vocabulary, sentence complexity, and text density appropriately
3. Add scaffolds for Embers groups (more support)
4. Add extensions and deeper questions for Blazers/Supernovas
5. Include bilingual vocabulary supports for ELL students
6. Embed specific IEP accommodations when requested`;

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

// Graphic organizer templates
const GRAPHIC_ORGANIZER_TEMPLATES: Record<string, string> = {
  'venn-diagram': `
┌─────────────────────────────────────────────────────────────────┐
│                    📊 VENN DIAGRAM                              │
│                    [Topic Title]                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         ┌──────────────┐         ┌──────────────┐               │
│        │              │         │              │               │
│       │   [Topic A]   │         │   [Topic B]  │               │
│       │              │         │              │               │
│      │ _____________ ├─────────┤ _____________ │              │
│      │ _____________ │  BOTH   │ _____________ │              │
│      │ _____________ │ _______ │ _____________ │              │
│       │ _____________ │ _______ │ _____________│               │
│        │              │ _______ │              │               │
│         └──────────────┘         └──────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`,

  't-chart': `
┌─────────────────────────────────────────────────────────────────┐
│                      📋 T-CHART                                 │
│                    [Topic Title]                                │
├────────────────────────────┬────────────────────────────────────┤
│        [Category A]        │         [Category B]               │
├────────────────────────────┼────────────────────────────────────┤
│                            │                                    │
│ • _______________________  │ • _______________________          │
│                            │                                    │
│ • _______________________  │ • _______________________          │
│                            │                                    │
│ • _______________________  │ • _______________________          │
│                            │                                    │
│ • _______________________  │ • _______________________          │
│                            │                                    │
│ • _______________________  │ • _______________________          │
│                            │                                    │
└────────────────────────────┴────────────────────────────────────┘`,

  'flow-chart': `
┌─────────────────────────────────────────────────────────────────┐
│                      ➡️ FLOW CHART                               │
│                    [Process Title]                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ┌─────────────────────┐                                      │
│    │  Step 1: __________ │                                      │
│    └──────────┬──────────┘                                      │
│               │                                                 │
│               ▼                                                 │
│    ┌─────────────────────┐                                      │
│    │  Step 2: __________ │                                      │
│    └──────────┬──────────┘                                      │
│               │                                                 │
│               ▼                                                 │
│    ┌─────────────────────┐                                      │
│    │  Step 3: __________ │                                      │
│    └──────────┬──────────┘                                      │
│               │                                                 │
│               ▼                                                 │
│    ┌─────────────────────┐                                      │
│    │  Result: __________ │                                      │
│    └─────────────────────┘                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`,

  'cause-effect': `
┌─────────────────────────────────────────────────────────────────┐
│                 🔗 CAUSE & EFFECT CHAIN                         │
│                    [Topic Title]                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐  │
│  │   CAUSE 1   │──────▶│   EFFECT    │──────▶│   CAUSE 2   │  │
│  │ ___________ │        │ ___________ │        │ ___________ │  │
│  └─────────────┘        └─────────────┘        └─────────────┘  │
│                                │                                │
│                                ▼                                │
│                         ┌─────────────┐                         │
│                         │   EFFECT    │                         │
│                         │ ___________ │                         │
│                         └─────────────┘                         │
│                                                                 │
│  BECAUSE...                           SO...                     │
│  ________________________________     ________________________  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`,

  'web-diagram': `
┌─────────────────────────────────────────────────────────────────┐
│                    🕸️ WEB DIAGRAM                                │
│                    [Topic Title]                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              ┌──────────────┐                                   │
│              │   Detail 1   │                                   │
│              │ ____________ │                                   │
│              └──────┬───────┘                                   │
│                     │                                           │
│   ┌──────────────┐  │  ┌──────────────┐                        │
│   │   Detail 2   │──┼──│   Detail 3   │                        │
│   │ ____________ │  │  │ ____________ │                        │
│   └──────────────┘  │  └──────────────┘                        │
│                ┌────┴────┐                                      │
│                │  MAIN   │                                      │
│                │  IDEA   │                                      │
│                │ _______ │                                      │
│                └────┬────┘                                      │
│   ┌──────────────┐  │  ┌──────────────┐                        │
│   │   Detail 4   │──┼──│   Detail 5   │                        │
│   │ ____________ │  │  │ ____________ │                        │
│   └──────────────┘  │  └──────────────┘                        │
│                     │                                           │
│              ┌──────┴───────┐                                   │
│              │   Detail 6   │                                   │
│              │ ____________ │                                   │
│              └──────────────┘                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`,

  'frayer-model': `
┌─────────────────────────────────────────────────────────────────┐
│                    📚 FRAYER MODEL                              │
│              Vocabulary Deep-Dive                               │
├───────────────────────────────┬─────────────────────────────────┤
│         DEFINITION            │          CHARACTERISTICS        │
│   (in your own words)         │       (what makes it this?)     │
│                               │                                 │
│ _____________________________ │ _______________________________ │
│ _____________________________ │ _______________________________ │
│ _____________________________ │ _______________________________ │
│                               │                                 │
├───────────────────────────────┼─────────────────────────────────┤
│                               │                                 │
│              ┌────────────────┴────────────────┐                │
│              │                                 │                │
│              │     WORD: ________________      │                │
│              │                                 │                │
│              └────────────────┬────────────────┘                │
│                               │                                 │
├───────────────────────────────┼─────────────────────────────────┤
│          EXAMPLES             │         NON-EXAMPLES            │
│     (what IS this?)           │     (what is NOT this?)         │
│                               │                                 │
│ _____________________________ │ _______________________________ │
│ _____________________________ │ _______________________________ │
│ _____________________________ │ _______________________________ │
│                               │                                 │
└───────────────────────────────┴─────────────────────────────────┘`,

  'story-map': `
┌─────────────────────────────────────────────────────────────────┐
│                      📖 STORY MAP                               │
│                    [Story Title]                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ SETTING: Where? _____________ When? _____________       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ CHARACTERS: ____________________________________________│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PROBLEM: _______________________________________________│    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              ▼                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │  Event 1   │─▶│  Event 2   │─▶│  Event 3   │                 │
│  │ __________ │  │ __________ │  │ __________ │                 │
│  └────────────┘  └────────────┘  └────────────┘                 │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ SOLUTION: ______________________________________________│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ THEME/LESSON: __________________________________________│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`,

  'claim-evidence': `
┌─────────────────────────────────────────────────────────────────┐
│               ⚖️ CLAIM-EVIDENCE-REASONING                       │
│                    [Topic/Question]                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 📢 MY CLAIM (What I believe/argue):                     │    │
│  │                                                         │    │
│  │ _______________________________________________________ │    │
│  │ _______________________________________________________ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 📋 EVIDENCE (Facts/data that support my claim):         │    │
│  │                                                         │    │
│  │ 1. ___________________________________________________  │    │
│  │                                                         │    │
│  │ 2. ___________________________________________________  │    │
│  │                                                         │    │
│  │ 3. ___________________________________________________  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 💡 REASONING (How the evidence supports my claim):      │    │
│  │                                                         │    │
│  │ _______________________________________________________ │    │
│  │ _______________________________________________________ │    │
│  │ _______________________________________________________ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`
};

function getOrganizerGuidance(type: string): string {
  const typeDescriptions: Record<string, string> = {
    'auto': 'Analyze the lesson content and automatically select the most appropriate organizer type based on the content structure (compare/contrast = Venn, sequence = Flow Chart, vocabulary = Frayer, etc.)',
    'venn-diagram': 'Use for comparing and contrasting two concepts, ideas, or topics',
    't-chart': 'Use for two-sided comparisons, pros/cons, or before/after',
    'flow-chart': 'Use for sequences, processes, timelines, or step-by-step procedures',
    'cause-effect': 'Use for showing relationships between causes and their effects',
    'web-diagram': 'Use for main idea and supporting details, brainstorming, or concept mapping',
    'frayer-model': 'Use for deep vocabulary study with definition, characteristics, examples, and non-examples',
    'story-map': 'Use for narrative structure including setting, characters, problem, events, and solution',
    'claim-evidence': 'Use for argumentative writing and critical thinking with claims, evidence, and reasoning'
  };
  return typeDescriptions[type] || typeDescriptions['auto'];
}

function buildGroupInstructions(group: StudentGroup, options: DifferentiationOptions): string {
  const friendlyName = getStudentFriendlyName(group.readingLevelLabel);
  const friendlyIcon = getStudentFriendlyIcon(group.readingLevelLabel);
  
  let instructions = `\n### Group: ${group.groupName} (${group.numStudents} students)
- Student-Friendly Level: ${friendlyIcon} ${friendlyName}
- Internal Reading Level: ${group.readingLevelLabel}${group.readingLevelLexile ? ` (${group.readingLevelLexile} Lexile)` : ''}
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
    if (options.includeGraphicOrganizers) {
      const organizerType = options.graphicOrganizerType || 'auto';
      optionsSection += `- ✅ Generate graphic organizers for visual learners\n`;
      optionsSection += `  - Type: ${organizerType === 'auto' ? 'Auto-detect based on content' : organizerType}\n`;
      optionsSection += `  - Guidance: ${getOrganizerGuidance(organizerType)}\n`;
    }
    optionsSection += `- Output Format: ${options.outputFormat}\n`;

    // Build graphic organizer section for the prompt
    let graphicOrganizerInstructions = '';
    if (options.includeGraphicOrganizers) {
      const organizerType = options.graphicOrganizerType || 'auto';
      graphicOrganizerInstructions = `

## GRAPHIC ORGANIZER INSTRUCTIONS:
You MUST include a printable graphic organizer in each student handout.

${organizerType === 'auto' ? `
AUTOMATIC SELECTION: Analyze the lesson content and select the most appropriate organizer:
- Compare/Contrast content → Venn Diagram or T-Chart
- Sequence/Process content → Flow Chart
- Cause/Effect content → Cause & Effect Chain
- Main Idea content → Web Diagram
- Vocabulary focus → Frayer Model
- Narrative/Story content → Story Map
- Argumentative content → Claim-Evidence-Reasoning
` : `
SELECTED TYPE: ${organizerType}
Use the ${organizerType} organizer format for all groups.
`}

FORMAT: Use ASCII/Unicode box-drawing characters to create professional, printable organizers.
Include blank lines (____________) for student responses.

EXAMPLE TEMPLATE STRUCTURE:
${GRAPHIC_ORGANIZER_TEMPLATES[organizerType !== 'auto' ? organizerType : 'web-diagram'] || GRAPHIC_ORGANIZER_TEMPLATES['web-diagram']}

IMPORTANT:
- Customize the organizer labels/prompts based on the lesson content
- For Embers groups: Pre-fill some sections or add more scaffolding
- For Supernovas groups: Add additional challenge sections
- Make sure all text fits within the box boundaries
`;
    }

    const userPrompt = `Create a COMPREHENSIVE DIFFERENTIATED LESSON PLAN for the following student groups.

${groupsSection}

${optionsSection}
${graphicOrganizerInstructions}

ORIGINAL LESSON CONTENT:
---
${lessonContent}
---

OUTPUT STRUCTURE:
Create a comprehensive document with TWO MAIN SECTIONS:

═══════════════════════════════════════════════════════════════
# 📋 TEACHER GUIDE
## [Extract Lesson Title] - Differentiated Instruction Plan
═══════════════════════════════════════════════════════════════

**📅 Generated:** ${new Date().toLocaleDateString()}
**📊 Groups Included:** ${(selectedGroups as StudentGroup[]).map((g: StudentGroup) => `${getStudentFriendlyIcon(g.readingLevelLabel)} ${g.groupName} (${getStudentFriendlyName(g.readingLevelLabel)})`).join(", ")}

---

### 📑 Quick Reference: Group Accommodations

| Group Name | Level | Key Modifications |
|------------|-------|-------------------|
${(selectedGroups as StudentGroup[]).map((g: StudentGroup) => `| ${g.groupName} | ${getStudentFriendlyIcon(g.readingLevelLabel)} ${getStudentFriendlyName(g.readingLevelLabel)} | ${g.accommodations.slice(0, 3).map(a => '• ' + a).join(' ')}${g.ellStatus !== 'None' ? ' • ELL: ' + g.ellStatus : ''} |`).join('\n')}

---

### 🎯 Lesson Overview
[Extract and summarize objectives and standards from the original content]

### 📦 Materials Needed
[List all materials across all groups, noting group-specific items]

### ⏱️ Pacing Guide
[Suggested timing for each section]

### 🔄 Differentiation Strategy
[How to manage multiple groups simultaneously - specific actionable suggestions]

### ✅ Formative Assessment Checkpoints
[When and how to check understanding per group]

---

═══════════════════════════════════════════════════════════════
# 📄 STUDENT HANDOUTS
## Print from here for student distribution
═══════════════════════════════════════════════════════════════

[For EACH student group, create a separate printable handout:]

---

## ${getStudentFriendlyIcon((selectedGroups as StudentGroup[])[0]?.readingLevelLabel || 'On Grade')} [Group Name] Handout
### [Lesson Title] - ${getStudentFriendlyName((selectedGroups as StudentGroup[])[0]?.readingLevelLabel || 'On Grade')} Edition ✨

**Name:** _________________________ **Date:** _______________

---

#### 🎯 Learning Target
*Today you will learn to:* [Write in student-friendly language]

---

#### 📖 Lesson Content
[Full adapted lesson content for this group - NO teacher directions]

${options.includeVocabularyScaffolding ? `#### 📚 Key Words
| Word | What it means |
|------|---------------|
| [term 1] | [student-friendly definition] |
| [term 2] | [student-friendly definition] |
[For ELL students, add home language translations in a third column]

` : ''}${options.includeVisualPlaceholders ? `[VISUAL: Include appropriate visual support here]

` : ''}${options.includeGraphicOrganizers ? `#### 📊 Graphic Organizer
[Generate a complete, printable ASCII/Unicode graphic organizer customized for this lesson]
[Include blank lines (___________) for student responses]

` : ''}#### ✏️ Practice
[Differentiated practice activities appropriate for this group's level]

${options.generateComprehensionQuestions ? `#### 💭 Check Your Understanding
[3-5 level-appropriate questions]

` : ''}#### 🌟 Reflection
*What I learned today:* _________________________________
*One question I still have:* _________________________________

---
⭐ **You've got this!** ⭐

---

[REPEAT the above handout structure for EACH student group, with appropriate differentiation]

═══════════════════════════════════════════════════════════════
# 🎯 Cross-Group Teaching Notes
═══════════════════════════════════════════════════════════════

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
