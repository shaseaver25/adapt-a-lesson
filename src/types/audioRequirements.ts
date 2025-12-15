import { StudentGroup } from './studentGroup';

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

export interface AudioRequirements {
  needsAudio: boolean;
  audioType: AudioType | null;
  language: string;
  sections: AudioSection[];
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
      sections: [] 
    };
  }

  return {
    needsAudio: true,
    audioType: hasReadAloud && needsTranslation ? 'both' : 
               hasReadAloud ? 'read-aloud' : 'multilingual',
    language: group.homeLanguage,
    sections: identifyAudioSections(group),
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
