import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import type { StudentGroup } from '@/types/studentGroup';

export interface AudioQRHeader {
  sectionTitle: string;
  studentGroup: string;
  audioLinks: {
    homeLanguage?: {
      language: string;
      qrDataUrl: string;
      shortUrl: string;
      label: string;
    };
    english?: {
      qrDataUrl: string;
      shortUrl: string;
      label: string;
    };
    readAloud?: {
      qrDataUrl: string;
      shortUrl: string;
      label: string;
    };
  };
}

const LANGUAGE_FLAGS: Record<string, string> = {
  'English': '🇺🇸',
  'Spanish': '🇪🇸',
  'Somali': '🇸🇴',
  'Hmong': '🇱🇦',
  'Vietnamese': '🇻🇳',
  'Arabic': '🇸🇦',
  'Karen': '🇲🇲',
  'Oromo': '🇪🇹',
  'Mandarin': '🇨🇳',
  'Chinese': '🇨🇳',
  'Russian': '🇷🇺',
  'Swahili': '🇹🇿',
  'French': '🇫🇷',
  'Portuguese': '🇧🇷',
  'Tagalog': '🇵🇭',
  'Korean': '🇰🇷',
  'Haitian Creole': '🇭🇹',
};

export function getLanguageFlag(language: string): string {
  return LANGUAGE_FLAGS[language] || '🌐';
}

/**
 * Generate a short URL for audio access
 * For now, returns the original URL - can be enhanced with URL shortener service
 */
function createShortUrl(audioUrl: string): string {
  // Truncate for display purposes while keeping functional
  // In production, integrate with a URL shortener service
  return audioUrl;
}

/**
 * Generate QR code as data URL
 */
async function generateQRCodeDataUrl(
  url: string, 
  options?: { color?: string; size?: number }
): Promise<string> {
  const { color = '#000000', size = 80 } = options || {};
  
  return QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: { 
      dark: color, 
      light: '#FFFFFF' 
    },
    errorCorrectionLevel: 'M'
  });
}

/**
 * Generate audio QR header for a specific section
 */
export async function generateAudioQRHeader(
  lessonId: string,
  groupId: string,
  sectionType: 'independent-practice' | 'exit-ticket' | 'learning-target' | 'instructions' | 'content' | 'vocabulary' | 'reflection-prompt',
  group: StudentGroup
): Promise<AudioQRHeader> {
  const audioLinks: AudioQRHeader['audioLinks'] = {};
  
  try {
    // Fetch pre-generated audio URLs from database
    const { data: audioFiles, error } = await supabase
      .from('generated_audio')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('group_id', groupId)
      .eq('section_type', sectionType);
    
    if (error) {
      console.error('Error fetching audio files:', error);
    }
    
    const englishAudio = audioFiles?.find(a => a.language === 'English');
    const homeLanguageAudio = audioFiles?.find(a => a.language === group.homeLanguage);
    
    // English QR (always present if available)
    if (englishAudio) {
      const shortUrl = createShortUrl(englishAudio.audio_url);
      audioLinks.english = {
        qrDataUrl: await generateQRCodeDataUrl(englishAudio.audio_url),
        shortUrl,
        label: '🇺🇸 Listen in English'
      };
    }
    
    // Home Language QR (if applicable)
    if (homeLanguageAudio && group.homeLanguage !== 'English') {
      const shortUrl = createShortUrl(homeLanguageAudio.audio_url);
      audioLinks.homeLanguage = {
        language: group.homeLanguage,
        qrDataUrl: await generateQRCodeDataUrl(homeLanguageAudio.audio_url),
        shortUrl,
        label: `${getLanguageFlag(group.homeLanguage)} Listen in ${group.homeLanguage}`
      };
    }
    
    // Read Aloud QR (if accommodation selected)
    if (group.accommodations?.includes('Read Aloud') && englishAudio) {
      // Read aloud uses English audio with slower speed indication
      const readAloudUrl = `${englishAudio.audio_url}#speed=0.85`;
      const shortUrl = createShortUrl(readAloudUrl);
      audioLinks.readAloud = {
        qrDataUrl: await generateQRCodeDataUrl(englishAudio.audio_url, { color: '#1E40AF' }),
        shortUrl,
        label: '🔊 Read Aloud (Slower)'
      };
    }
  } catch (error) {
    console.error('Error generating audio QR header:', error);
  }
  
  const sectionTitles: Record<string, string> = {
    'independent-practice': 'Independent Practice',
    'exit-ticket': 'Exit Ticket',
    'learning-target': 'Learning Target',
    'instructions': 'Instructions',
    'content': 'Content',
    'vocabulary': 'Vocabulary',
    'reflection-prompt': 'Reflection'
  };
  
  return {
    sectionTitle: sectionTitles[sectionType] || sectionType,
    studentGroup: group.groupName,
    audioLinks
  };
}

/**
 * Generate all audio QR headers for a bilingual document
 */
export async function generateAllAudioQRHeaders(
  lessonId: string,
  groupId: string,
  group: StudentGroup,
  sectionTypes: string[]
): Promise<AudioQRHeader[]> {
  const headers: AudioQRHeader[] = [];
  
  for (const sectionType of sectionTypes) {
    const header = await generateAudioQRHeader(
      lessonId,
      groupId,
      sectionType as any,
      group
    );
    
    // Only include if there's at least one audio link
    if (Object.keys(header.audioLinks).length > 0) {
      headers.push(header);
    }
  }
  
  return headers;
}

/**
 * Generate audio QR header directly from pre-generated audio records
 */
export async function generateAudioQRHeaderFromRecords(
  sectionType: string,
  groupName: string,
  englishAudioUrl?: string,
  homeLanguageAudioUrl?: string,
  homeLanguage?: string,
  hasReadAloud?: boolean
): Promise<AudioQRHeader> {
  const audioLinks: AudioQRHeader['audioLinks'] = {};
  
  // English QR
  if (englishAudioUrl) {
    audioLinks.english = {
      qrDataUrl: await generateQRCodeDataUrl(englishAudioUrl),
      shortUrl: englishAudioUrl,
      label: '🇺🇸 Listen in English'
    };
  }
  
  // Home Language QR
  if (homeLanguageAudioUrl && homeLanguage && homeLanguage !== 'English') {
    audioLinks.homeLanguage = {
      language: homeLanguage,
      qrDataUrl: await generateQRCodeDataUrl(homeLanguageAudioUrl),
      shortUrl: homeLanguageAudioUrl,
      label: `${getLanguageFlag(homeLanguage)} Listen in ${homeLanguage}`
    };
  }
  
  // Read Aloud QR
  if (hasReadAloud && englishAudioUrl) {
    audioLinks.readAloud = {
      qrDataUrl: await generateQRCodeDataUrl(englishAudioUrl, { color: '#1E40AF' }),
      shortUrl: englishAudioUrl,
      label: '🔊 Read Aloud (Slower)'
    };
  }
  
  const sectionTitles: Record<string, string> = {
    'independent-practice': 'Independent Practice',
    'exit-ticket': 'Exit Ticket',
    'learning-target': '🎯 Learning Target',
    'instructions': '📋 Instructions',
    'content': '📖 Content',
    'vocabulary': '📚 Vocabulary',
    'reflection-prompt': '💭 Reflection'
  };
  
  return {
    sectionTitle: sectionTitles[sectionType] || sectionType,
    studentGroup: groupName,
    audioLinks
  };
}
