import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QrCode, Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import { BilingualAudioPlayer, type SectionAudio } from '@/components/BilingualAudioPlayer';
import { MultipleAudioQRHeaders } from '@/components/AudioQRHeaderDisplay';
import { getStudentFriendlyIcon } from '@/lib/readingLevelNames';
import { generateAudioQRHeaderFromRecords, type AudioQRHeader } from '@/lib/audioQRHeader';
import type { StudentGroup } from '@/types/studentGroup';

interface AudioData {
  sectionType: string;
  englishAudioUrl?: string;
  homeLanguageAudioUrl?: string;
}

interface BilingualContent {
  sectionType: string;
  sectionLabel: string;
  englishContent: string;
  homeLanguageContent: string;
}

interface BilingualSideBySideLayoutProps {
  group: StudentGroup & { id: string };
  homeLanguage: string;
  sections: BilingualContent[];
  audioData?: AudioData[];
  showQRCodes?: boolean;
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

const getFlag = (language: string): string => LANGUAGE_FLAGS[language] || '🌐';

export function BilingualSideBySideLayout({
  group,
  homeLanguage,
  sections,
  audioData = [],
  showQRCodes = true,
}: BilingualSideBySideLayoutProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showAllQR, setShowAllQR] = useState(false);
  const [qrHeaders, setQrHeaders] = useState<AudioQRHeader[]>([]);

  // Generate QR headers when audio data changes
  useEffect(() => {
    async function generateHeaders() {
      const hasReadAloud = group.accommodations?.includes('Read Aloud') || false;
      const headers = await Promise.all(
        audioData.map(audio => 
          generateAudioQRHeaderFromRecords(
            audio.sectionType,
            group.groupName,
            audio.englishAudioUrl,
            audio.homeLanguageAudioUrl,
            homeLanguage,
            hasReadAloud
          )
        )
      );
      setQrHeaders(headers);
    }
    
    if (audioData.length > 0) {
      generateHeaders();
    }
  }, [audioData, group.groupName, group.accommodations, homeLanguage]);

  const toggleSection = (sectionType: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionType]: !prev[sectionType],
    }));
  };

  const getAudioForSection = (sectionType: string): AudioData | undefined => {
    return audioData.find(a => a.sectionType === sectionType);
  };

  return (
    <Card className="border-accent/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-accent/10 to-transparent pb-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span>{getStudentFriendlyIcon(group.readingLevelLabel)}</span>
              {group.groupName}
              <Badge variant="outline" className="ml-2 text-xs">
                Bilingual Layout
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {getFlag(homeLanguage)} {homeLanguage} / {getFlag('English')} English
            </p>
          </div>
          {showQRCodes && audioData.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllQR(!showAllQR)}
              className="gap-2"
            >
              <QrCode className="h-4 w-4" />
              {showAllQR ? 'Hide' : 'Show'} Audio QR Codes
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Audio QR Codes Header - At TOP of assignment */}
        {showAllQR && qrHeaders.length > 0 && (
          <div className="p-4 border-b">
            <MultipleAudioQRHeaders 
              headers={qrHeaders}
              title={`Audio for ${group.groupName}`}
            />
          </div>
        )}

        {/* Bilingual Content Sections */}
        <div className="divide-y divide-border">
          {sections.map((section) => {
            const audio = getAudioForSection(section.sectionType);
            const isExpanded = expandedSections[section.sectionType] ?? true;
            
            const bilingualAudio: SectionAudio | null = audio ? {
              english: audio.englishAudioUrl ? { url: audio.englishAudioUrl, duration: null } : null,
              homeLanguage: audio.homeLanguageAudioUrl ? {
                language: homeLanguage,
                url: audio.homeLanguageAudioUrl,
                duration: null,
              } : null,
            } : null;

            return (
              <div key={section.sectionType} className="relative">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.sectionType)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{section.sectionLabel}</span>
                    {audio && (
                      <Badge variant="secondary" className="text-xs">
                        <Volume2 className="h-3 w-3 mr-1" />
                        Audio
                      </Badge>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {/* Inline Audio Player */}
                    {bilingualAudio && (
                      <BilingualAudioPlayer
                        audio={bilingualAudio}
                        sectionType={section.sectionType}
                        compact
                      />
                    )}
                    
                    {/* Side-by-Side Content */}
                    <div className="grid grid-cols-2 gap-4 border rounded-lg overflow-hidden">
                      {/* Home Language (LEFT) */}
                      <div className="bg-muted/30 p-4 border-r">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                          <span className="text-lg">{getFlag(homeLanguage)}</span>
                          <span className="font-medium text-sm">{homeLanguage}</span>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {section.homeLanguageContent.split('\n').map((line, i) => (
                            <p key={i} className="mb-2 leading-relaxed text-sm">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* English (RIGHT) */}
                      <div className="bg-background p-4">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                          <span className="text-lg">{getFlag('English')}</span>
                          <span className="font-medium text-sm">English</span>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {section.englishContent.split('\n').map((line, i) => (
                            <p key={i} className="mb-2 leading-relaxed text-sm">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Parse differentiated lesson content into bilingual sections
 */
export function parseBilingualSections(
  englishContent: string,
  translatedContent: string,
  homeLanguage: string
): BilingualContent[] {
  const sections: BilingualContent[] = [];
  
  // Common section patterns
  const sectionPatterns = [
    { type: 'learning-target', label: '🎯 Learning Target', pattern: /(?:learning target|objetivo|目標)/i },
    { type: 'instructions', label: '📋 Instructions', pattern: /(?:instructions|instrucciones|指示)/i },
    { type: 'vocabulary', label: '📚 Vocabulary', pattern: /(?:vocabulary|vocabulario|词汇)/i },
    { type: 'content', label: '📖 Content', pattern: /(?:content|contenido|内容)/i },
    { type: 'practice', label: '✏️ Practice', pattern: /(?:practice|práctica|练习)/i },
    { type: 'reflection-prompt', label: '💭 Reflection', pattern: /(?:reflection|reflexión|反思)/i },
  ];

  // Simple paragraph-by-paragraph alignment
  const englishLines = englishContent.split('\n\n').filter(p => p.trim());
  const translatedLines = translatedContent.split('\n\n').filter(p => p.trim());

  // Group content into sections
  let currentSection = 'content';
  let currentLabel = '📖 Content';
  let engBuffer: string[] = [];
  let transBuffer: string[] = [];

  englishLines.forEach((engPara, index) => {
    const transPara = translatedLines[index] || '';
    
    // Check if this paragraph starts a new section
    const matchedSection = sectionPatterns.find(sp => 
      sp.pattern.test(engPara) || sp.pattern.test(transPara)
    );
    
    if (matchedSection && engBuffer.length > 0) {
      // Save previous section
      sections.push({
        sectionType: currentSection,
        sectionLabel: currentLabel,
        englishContent: engBuffer.join('\n\n'),
        homeLanguageContent: transBuffer.join('\n\n'),
      });
      engBuffer = [];
      transBuffer = [];
    }
    
    if (matchedSection) {
      currentSection = matchedSection.type;
      currentLabel = matchedSection.label;
    }
    
    engBuffer.push(engPara);
    transBuffer.push(transPara);
  });

  // Add final section
  if (engBuffer.length > 0) {
    sections.push({
      sectionType: currentSection,
      sectionLabel: currentLabel,
      englishContent: engBuffer.join('\n\n'),
      homeLanguageContent: transBuffer.join('\n\n'),
    });
  }

  return sections;
}
