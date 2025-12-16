// Tooltip descriptions for ELL statuses
export const ELL_STATUS_DESCRIPTIONS: Record<string, string> = {
  'None': 'Student is a native English speaker or has reached full English proficiency.',
  'Emerging': 'Beginning English learner. Understands some words and phrases. Needs substantial support.',
  'Developing': 'Early intermediate level. Can communicate basic needs. Still building vocabulary and grammar.',
  'Expanding': 'Intermediate level. Can participate in academic discussions with support. Developing academic language.',
  'Bridging': 'Advanced level. Near-fluent. May still need occasional support with academic vocabulary.',
};

// Tooltip descriptions for accommodations
export const ACCOMMODATION_DESCRIPTIONS: Record<string, string> = {
  'Visual Supports': 'Include diagrams, charts, images, and graphic organizers to support comprehension.',
  'Read Aloud': 'Content designed to be read aloud to the student. Include pauses and emphasis cues.',
  'Extended Time': 'Allow additional time for processing. Break content into manageable chunks.',
  'Chunked Instructions': 'Break instructions into numbered steps. One instruction per line with checkboxes.',
  'Bilingual Glossary': 'Provide key vocabulary in both English and the student\'s home language.',
  'Graphic Organizers': 'Include visual frameworks for organizing information and ideas.',
  'Sentence Starters': 'Provide sentence frames and starters to support written and verbal responses.',
  'Reduced Text Density': 'Use more white space, larger text, shorter paragraphs, and bullet points.',
  'Preferential Seating': 'Include notes about optimal seating for focus and support access.',
  'Check for Understanding': 'Add frequent comprehension checks throughout the lesson content.',
  'Choice Board': 'Provide multiple options for demonstrating learning, allowing students to choose how they show understanding.',
  'Enrichment Extension': 'Add deeper challenges, extension activities, and advanced connections for students ready for more.',
};

// Tooltip descriptions for reading levels (teacher-facing context with strengths-based names)
export const READING_LEVEL_DESCRIPTIONS: Record<string, string> = {
  'Below Grade': 'Embers — Students warming up who need additional support and scaffolding to build confidence.',
  'On Grade': 'Flames — Students building momentum at their expected grade level with standard materials.',
  'Above Grade': 'Blazers — Students burning bright above grade level who benefit from enrichment opportunities.',
  'Advanced': 'Supernovas — Students with explosive excellence, significantly above grade level, who need challenging extensions.',
};

// Tooltip descriptions for learning preferences
export const LEARNING_PREFERENCE_DESCRIPTIONS: Record<string, string> = {
  'Visual': 'Learns best through images, diagrams, charts, and visual representations.',
  'Hands-on': 'Learns best through physical activities, manipulatives, and kinesthetic experiences.',
  'Mixed': 'Benefits from a variety of learning modalities and instructional approaches.',
  'Verbal': 'Learns best through discussion, explanation, and verbal instruction.',
  'Independent': 'Prefers self-directed learning with minimal direct instruction.',
};

// Tooltip descriptions for IEP/504 status
export const IEP_504_DESCRIPTIONS: Record<string, string> = {
  'None': 'No formal learning plan in place.',
  'IEP': 'Individualized Education Program - formal special education plan with specific goals and services.',
  '504 Plan': 'Section 504 accommodations plan - provides classroom modifications without special education services.',
};

// Section header descriptions
export const SECTION_DESCRIPTIONS: Record<string, string> = {
  'Select Student Groups': 'Choose which pre-saved student groups will receive differentiated versions of this lesson. Groups you select will each get their own customized handout.',
  'Lesson Details': 'Enter the lesson content you want to differentiate. This should be your original, grade-level lesson material.',
  'Differentiation Options': 'Configure how the AI should adapt your lesson. These options control scaffolding, visual supports, and output formatting.',
};

// Form field descriptions
export const FIELD_DESCRIPTIONS: Record<string, string> = {
  'Group Name': 'A descriptive name for this student group (e.g., "Table 3", "Spanish ELL Group", "Advanced Readers").',
  'Number of Students': 'How many students are in this group. Used for planning and resource allocation.',
  'Reading Level': 'The approximate reading level of students in this group. Determines vocabulary complexity and sentence structure.',
  'Lexile Score': 'Optional Lexile measure (e.g., 550L, 800L) for more precise reading level targeting.',
  'Home Language': 'The primary language spoken at home. Non-English languages trigger bilingual vocabulary and translated handouts.',
  'Lesson Name': 'A descriptive title for this lesson. Used when saving and organizing differentiated lessons.',
  'Lesson Content': 'Paste your original lesson content here. Supports markdown formatting. The AI will adapt this content for each selected student group.',
};

// Differentiation option descriptions
export const DIFFERENTIATION_OPTION_DESCRIPTIONS: Record<string, string> = {
  'Vocabulary Scaffolding': 'Adds a bilingual vocabulary box with 5-7 key terms. For ELL students, includes translations in their home language with phonetic guides.',
  'Comprehension Questions': 'Inserts level-appropriate check-for-understanding questions throughout the lesson. Questions are scaffolded based on reading level.',
  'Visual Placeholders': 'Adds [VISUAL: description] markers where images, diagrams, or charts would support comprehension. Useful for planning visual supplements.',
  'Graphic Organizers': 'Generates actual graphic organizers (Venn diagrams, T-charts, flow charts, etc.) matched to the lesson content. AI-powered image generation creates print-ready visuals.',
};

// Graphic organizer type descriptions
export const GRAPHIC_ORGANIZER_DESCRIPTIONS: Record<string, string> = {
  'auto': 'AI automatically selects the most appropriate organizer type based on lesson content analysis.',
  'venn': 'Venn Diagram — Best for comparing and contrasting two or more concepts, showing similarities and differences.',
  't-chart': 'T-Chart — Organizes information into two columns. Great for pros/cons, cause/effect, or before/after comparisons.',
  'flow': 'Flow Chart — Shows sequences, processes, or step-by-step procedures with directional arrows.',
  'cause-effect': 'Cause & Effect Chain — Illustrates how one event leads to another. Ideal for historical events or scientific processes.',
  'web': 'Web/Cluster Diagram — Central idea with connected supporting details. Perfect for brainstorming and main idea analysis.',
  'frayer': 'Frayer Model — Four-quadrant vocabulary tool with definition, characteristics, examples, and non-examples.',
  'story': 'Story Map — Narrative structure with characters, setting, problem, events, and solution sections.',
  'claim-evidence': 'Claim-Evidence-Reasoning Chart — Argument structure for persuasive writing and critical analysis.',
};

// Output format descriptions
export const OUTPUT_FORMAT_DESCRIPTIONS: Record<string, string> = {
  'markdown': 'Standard markdown format. Best for digital viewing and copying into other platforms.',
  'pdf-ready': 'Optimized for PDF export with page breaks and print-friendly formatting.',
  'google-docs': 'Formatted for easy pasting into Google Docs with proper heading hierarchy.',
};

// Action button descriptions
export const ACTION_DESCRIPTIONS: Record<string, string> = {
  'Select All': 'Select all saved student groups for differentiation.',
  'Clear': 'Deselect all currently selected student groups.',
  'Manage Groups': 'Open the Student Groups page to create, edit, or organize your saved groups.',
  'Differentiate Lesson': 'Generate differentiated versions of your lesson for all selected student groups. Estimated time varies based on lesson length and number of groups.',
  'Generate Audio': 'Create text-to-speech audio files for groups with Read Aloud accommodations or non-English home languages.',
  'Save Lesson': 'Save this differentiated lesson to your library for future use.',
  'Export DOCX': 'Download as a Microsoft Word document with proper formatting, tables, and embedded QR codes.',
};

// Output component descriptions
export const OUTPUT_SECTION_DESCRIPTIONS: Record<string, string> = {
  'Teacher Guide': 'Contains ALL teaching directions, facilitation notes, answer keys, and pacing guidance. For teacher use only — not shared with students.',
  'Student Handouts': 'Print-ready materials for students. Contains learning targets, differentiated content, vocabulary, and activities. Zero teacher directions.',
  'Accommodations Summary': 'Quick-reference table showing all groups, their reading levels, and key modifications at a glance.',
  'Audio Generation': 'Progress indicator for text-to-speech audio generation. Audio is created for groups with Read Aloud accommodation or non-English home languages.',
};
