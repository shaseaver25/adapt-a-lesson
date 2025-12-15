import { StudentGroup } from '@/types/studentGroup';

export function generateDifferentiatedLesson(
  originalLesson: string,
  studentGroup: StudentGroup
): string {
  const { readingLevelLabel, ellStatus, homeLanguage, accommodations } = studentGroup;

  let output = '';

  // Add bilingual header if ELL
  if (ellStatus !== 'None' && homeLanguage !== 'English') {
    output += `## Differentiated Lesson for: ${studentGroup.groupName}\n\n`;
    output += `> 📚 **Adapted for:** ${readingLevelLabel} readers | ${ellStatus} ELL | ${homeLanguage} speakers\n\n`;
    output += `---\n\n`;
  } else {
    output += `## Differentiated Lesson for: ${studentGroup.groupName}\n\n`;
    output += `> 📚 **Adapted for:** ${readingLevelLabel} readers\n\n`;
    output += `---\n\n`;
  }

  // Add vocabulary box for ELL
  if (ellStatus !== 'None' && homeLanguage !== 'English') {
    output += `### 📖 Key Vocabulary / Vocabulario Clave\n\n`;
    output += `| English | ${homeLanguage} | Definition |\n`;
    output += `|---------|-----------|------------|\n`;
    output += `| *Key terms will be extracted from your lesson* | *Translations* | *Simple definitions* |\n\n`;
    output += `---\n\n`;
  }

  // Add scaffolding section for below grade
  if (readingLevelLabel === 'Below Grade') {
    output += `### 🎯 Learning Goal (Simplified)\n\n`;
    output += `*The main learning objective from your lesson will be simplified here.*\n\n`;
    output += `---\n\n`;
    output += `### ✅ Check for Understanding\n\n`;
    output += `Before we start, can you tell me:\n`;
    output += `- What do you already know about this topic?\n`;
    output += `- What questions do you have?\n\n`;
    output += `---\n\n`;
  }

  // Process original content
  output += `### 📝 Lesson Content\n\n`;
  
  if (readingLevelLabel === 'Below Grade') {
    output += `*Your lesson content will be adapted with:*\n`;
    output += `- ✓ Simplified vocabulary (defined inline)\n`;
    output += `- ✓ Shorter sentences (max 15 words)\n`;
    output += `- ✓ Visual cues and icons\n`;
    output += `- ✓ Content chunked into smaller sections\n\n`;
  } else if (readingLevelLabel === 'Above Grade' || readingLevelLabel === 'Advanced') {
    output += `*Your lesson content will be enhanced with:*\n`;
    output += `- ✓ Sophisticated vocabulary maintained\n`;
    output += `- ✓ Extension questions for deeper thinking\n`;
    output += `- ✓ Primary source connections\n`;
    output += `- ✓ Reduced scaffolding for independence\n\n`;
  } else {
    output += `*Your lesson content will be adapted to grade-level expectations.*\n\n`;
  }

  // Add original content with markers
  output += `---\n\n`;
  output += `#### Original Content (To Be Differentiated):\n\n`;
  output += `${originalLesson}\n\n`;
  output += `---\n\n`;

  // Add accommodations section
  if (accommodations.length > 0) {
    output += `### ♿ Accommodations Applied\n\n`;
    
    if (accommodations.includes('Visual Supports')) {
      output += `**Visual Supports:**\n`;
      output += `- [VISUAL: Diagram/image placeholders will be added]\n`;
      output += `- Bullet points and clear formatting throughout\n\n`;
    }
    
    if (accommodations.includes('Chunked Instructions')) {
      output += `**Chunked Instructions:**\n`;
      output += `- ☐ Step 1: [First instruction]\n`;
      output += `- ☐ Step 2: [Second instruction]\n`;
      output += `- ☐ Step 3: [Third instruction]\n\n`;
    }
    
    if (accommodations.includes('Sentence Starters')) {
      output += `**Sentence Starters for Responses:**\n`;
      output += `- "I think that..."\n`;
      output += `- "This is important because..."\n`;
      output += `- "I noticed that..."\n\n`;
    }
    
    if (accommodations.includes('Read Aloud')) {
      output += `**Read Aloud:** 🔊 *Text is formatted for easy reading aloud*\n\n`;
    }

    output += `---\n\n`;
  }

  // Add extension for advanced
  if (readingLevelLabel === 'Above Grade' || readingLevelLabel === 'Advanced') {
    output += `### 🚀 Go Deeper\n\n`;
    output += `**Extension Questions:**\n`;
    output += `1. How does this concept connect to real-world applications?\n`;
    output += `2. What would happen if we changed one key variable?\n`;
    output += `3. Can you create your own example using this concept?\n\n`;
    output += `**Challenge:**\n`;
    output += `Research a related topic and prepare a 2-minute presentation for the class.\n\n`;
  }

  // Footer
  output += `---\n\n`;
  output += `*This differentiated lesson was generated for ${studentGroup.numStudents} student(s) in the "${studentGroup.groupName}" group.*\n`;
  
  if (studentGroup.notes) {
    output += `\n**Teacher Notes:** ${studentGroup.notes}\n`;
  }

  return output;
}
