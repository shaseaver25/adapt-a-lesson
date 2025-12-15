import { StudentGroup } from '@/types/studentGroup';

export type AudioType = 'read-aloud' | 'multilingual' | 'both';
export type AudioSectionType = 'learning-target' | 'instructions' | 'content' | 'vocabulary' | 'reflection-prompt';
export type AudioPriority = 'required' | 'recommended' | 'optional';

export interface AudioSection {
  id: string;
  type: AudioSectionType;
  text: string;
  language: string;
  priority: AudioPriority;
}

export interface VocabularyAudioItem {
  englishTerm: string;
  translatedTerm: string;
  definition?: string;
  translatedDefinition?: string;
  language: string;
}

export interface AudioRequirements {
  needsAudio: boolean;
  audioType: AudioType | null;
  language: string;
  sections: AudioSection[];
  needsBilingualVocabulary: boolean;
}

export interface GroupAudioRequirements {
  groupId: string;
  groupName: string;
  requirements: AudioRequirements;
}

/**
 * Analyze a student group to determine audio requirements
 */
export function analyzeAudioNeeds(group: StudentGroup): AudioRequirements {
  const hasReadAloud = group.accommodations.includes('Read Aloud');
  const needsTranslation = group.homeLanguage !== 'English';

  if (!hasReadAloud && !needsTranslation) {
    return { 
      needsAudio: false, 
      audioType: null, 
      language: 'English', 
      sections: [],
      needsBilingualVocabulary: false
    };
  }

  return {
    needsAudio: true,
    audioType: hasReadAloud && needsTranslation ? 'both' : 
               hasReadAloud ? 'read-aloud' : 'multilingual',
    language: group.homeLanguage,
    sections: identifyAudioSections(group),
    needsBilingualVocabulary: needsTranslation, // ELL students need bilingual vocabulary
  };
}

/**
 * Identify which sections need audio based on student group profile
 */
function identifyAudioSections(group: StudentGroup): AudioSection[] {
  const language = group.homeLanguage;
  
  // Prioritize what students interact with most
  return [
    { 
      id: `${group.groupName}-learning-target`,
      type: 'learning-target', 
      text: '', // Will be populated with actual content
      language,
      priority: 'required' 
    },
    { 
      id: `${group.groupName}-instructions`,
      type: 'instructions', 
      text: '',
      language,
      priority: 'required' 
    },
    { 
      id: `${group.groupName}-vocabulary`,
      type: 'vocabulary', 
      text: '',
      language,
      priority: 'required' 
    },
    { 
      id: `${group.groupName}-content`,
      type: 'content', 
      text: '',
      language,
      priority: 'recommended' 
    },
    { 
      id: `${group.groupName}-reflection`,
      type: 'reflection-prompt', 
      text: '',
      language,
      priority: 'optional' 
    },
  ];
}

/**
 * Get audio requirements for multiple student groups
 */
export function analyzeGroupsAudioNeeds(groups: StudentGroup[]): GroupAudioRequirements[] {
  return groups.map(group => ({
    groupId: (group as StudentGroup & { id: string }).id || group.groupName,
    groupName: group.groupName,
    requirements: analyzeAudioNeeds(group),
  }));
}

/**
 * Check if any groups need audio support
 */
export function anyGroupNeedsAudio(groups: StudentGroup[]): boolean {
  return groups.some(group => analyzeAudioNeeds(group).needsAudio);
}

/**
 * Check if any groups need bilingual vocabulary audio
 */
export function anyGroupNeedsBilingualVocabulary(groups: StudentGroup[]): boolean {
  return groups.some(group => analyzeAudioNeeds(group).needsBilingualVocabulary);
}

/**
 * Extract vocabulary items from lesson content for bilingual audio
 */
export function extractVocabularyFromContent(
  content: string, 
  homeLanguage: string
): VocabularyAudioItem[] {
  const vocabularyItems: VocabularyAudioItem[] = [];
  
  // Look for vocabulary sections in the content
  // Common patterns: "Vocabulary Box", "Key Terms", "Vocabulario"
  const vocabPatterns = [
    /(?:vocabulary|vocabulario|key terms|términos clave)[:\s]*\n([\s\S]*?)(?:\n\n|\n---|\n##|$)/gi,
    /\*\*([^*]+)\*\*\s*[-–:]\s*([^\n]+)/g, // **Term** - Definition
    /•\s*([^:–-]+)\s*[-–:]\s*([^\n]+)/g,   // • Term - Definition
  ];

  // Try to extract vocabulary items
  const lines = content.split('\n');
  let inVocabSection = false;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('vocabulary') || lowerLine.includes('vocabulario') || 
        lowerLine.includes('key terms') || lowerLine.includes('términos')) {
      inVocabSection = true;
      continue;
    }
    
    if (inVocabSection) {
      // End of vocab section
      if (line.startsWith('##') || line.startsWith('---') || line.trim() === '') {
        if (vocabularyItems.length > 0) break;
        continue;
      }
      
      // Try to parse vocabulary item
      // Pattern: **English Term** - Translation / Definition
      const boldMatch = line.match(/\*\*([^*]+)\*\*\s*[-–:]\s*(.+)/);
      if (boldMatch) {
        vocabularyItems.push({
          englishTerm: boldMatch[1].trim(),
          translatedTerm: boldMatch[2].trim(),
          language: homeLanguage
        });
        continue;
      }
      
      // Pattern: • English Term - Translation
      const bulletMatch = line.match(/[•\-]\s*([^:–-]+)\s*[-–:]\s*(.+)/);
      if (bulletMatch) {
        vocabularyItems.push({
          englishTerm: bulletMatch[1].trim(),
          translatedTerm: bulletMatch[2].trim(),
          language: homeLanguage
        });
      }
    }
  }
  
  return vocabularyItems;
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(code: string): string {
  const names: Record<string, string> = {
    'en': 'English',
    'es': 'Español',
    'zh': '中文',
    'vi': 'Tiếng Việt',
    'ar': 'العربية',
    'so': 'Soomaali',
    'hmn': 'Hmoob',
    'ru': 'Русский',
    'fr': 'Français',
    'pt': 'Português',
    'ko': '한국어',
    'tl': 'Tagalog',
    'sw': 'Kiswahili',
    'ht': 'Kreyòl Ayisyen',
  };
  return names[code.toLowerCase()] || code;
}
