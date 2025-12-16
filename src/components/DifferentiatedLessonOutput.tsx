import { useState, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, BookOpen, GraduationCap, Save, Loader2, Volume2, Languages, LayoutTemplate, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStudentFriendlyName, getStudentFriendlyIcon, getReadingLevelColor } from '@/lib/readingLevelNames';
import { OUTPUT_SECTION_DESCRIPTIONS } from '@/lib/tooltipDescriptions';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import type { StudentGroup } from '@/types/studentGroup';
import { supabase } from '@/integrations/supabase/client';
import { useDifferentiation } from '@/contexts/DifferentiationContext';
import { anyGroupNeedsAudio } from '@/types/audioRequirements';
import { AudioGenerationButton } from '@/components/AudioGenerationButton';
import { ExportForLMSButton } from '@/components/export/ExportForLMSButton';

interface PreGeneratedAudioRecord {
  id: string;
  lesson_id: string;
  group_id: string;
  group_name: string;
  section_type: string;
  section_id: string;
  audio_url: string;
  duration_seconds: number;
  language: string;
  characters_used: number;
  created_at: string;
}

interface PreGeneratedVocabularyAudioRecord {
  id: string;
  lesson_id: string;
  group_id: string;
  group_name: string;
  vocab_id: string;
  term: string;
  definition: string | null;
  english_term_audio_url: string | null;
  english_definition_audio_url: string | null;
  home_language: string;
  translated_term: string | null;
  translated_definition: string | null;
  home_language_term_audio_url: string | null;
  home_language_definition_audio_url: string | null;
  created_at: string;
}

interface DifferentiatedLessonOutputProps {
  content: string;
  selectedGroups: (StudentGroup & { id: string })[];
  lessonTitle?: string;
  originalContent?: string;
  onSaved?: () => void;
  lessonId?: string | null;
  preGeneratedAudio?: PreGeneratedAudioRecord[];
  preGeneratedVocabularyAudio?: PreGeneratedVocabularyAudioRecord[];
  isGeneratingAudio?: boolean;
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
};

const getFlag = (language: string): string => LANGUAGE_FLAGS[language] || '🌐';

export function DifferentiatedLessonOutput({ 
  content, 
  selectedGroups, 
  lessonTitle = 'Lesson',
  originalContent = '',
  onSaved,
  lessonId,
  preGeneratedAudio = [],
  preGeneratedVocabularyAudio = [],
  isGeneratingAudio = false
}: DifferentiatedLessonOutputProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const { toast } = useToast();
  const { options } = useDifferentiation();

  // Check if audio already exists for this lesson
  const hasExistingAudio = preGeneratedAudio.length > 0;

  // Extract content for a specific group from the full content (STUDENT HANDOUTS only)
  const extractGroupContent = useCallback((groupName: string): string => {
    if (!content) return '';
    
    const allLines = content.split('\n');
    
    // STEP 1: Find STUDENT HANDOUTS section (skip teacher guide entirely)
    let studentSectionStart = -1;
    const studentMarkers = [
      'STUDENT HANDOUTS',
      'Student Handouts',
      'PRINT FROM HERE',
      'Print from here'
    ];
    
    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i].toUpperCase();
      if (studentMarkers.some(marker => line.includes(marker.toUpperCase()))) {
        studentSectionStart = i;
        console.log(`Found STUDENT HANDOUTS section at line ${i}`);
        break;
      }
    }
    
    // Use only the student section
    const lines = studentSectionStart > 0 
      ? allLines.slice(studentSectionStart)
      : allLines;
    
    // STEP 2: Normalize group name for matching
    const normalizedGroupName = groupName
      .toLowerCase()
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/readers?$/i, 'reader')
      .replace(/[-_]/g, ' ')
      .trim();
    
    console.log(`Looking for group: "${groupName}" (normalized: "${normalizedGroupName}")`);
    
    // STEP 3: Find ALL candidate headers for this group
    const candidates: { index: number; level: number; line: string }[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (!headerMatch) continue;
      
      const headerLevel = headerMatch[1].length;
      const headerText = headerMatch[2];
      
      const normalizedHeader = headerText
        .toLowerCase()
        .replace(/[🔥✨📚🎯⭐💫🌟]/g, '')
        .replace(/\s*\(.*?\)\s*/g, '')
        .replace(/readers?/gi, 'reader')
        .replace(/[-_]/g, ' ')
        .replace(/edition|edición/gi, '')
        .trim();
      
      const isMatch = normalizedHeader.includes(normalizedGroupName) || 
                      normalizedGroupName.includes(normalizedHeader.split(/\s+/).slice(0, 2).join(' '));
      
      if (isMatch) {
        candidates.push({ index: i, level: headerLevel, line });
      }
    }
    
    // STEP 4: Find the candidate followed by STUDENT content, NOT teacher scaffolding
    // Teacher content: "Scaffolding Strategies", "Pacing", "What to Say"
    // Student content: "Name:", "Learning Target", "🎯", practice sections
    const teacherKeywords = ['scaffolding strategies', 'pacing adjustment', 'what to say', 'vocabulary support:'];
    const studentKeywords = ['name:', '**name:**', 'learning target', '🎯', '✏️', 'practice', 'reflection'];
    
    let bestCandidate: { index: number; level: number; line: string } | null = null;
    
    for (const candidate of candidates) {
      // Look at the next 15 lines after this header
      const nextLines = lines.slice(candidate.index + 1, candidate.index + 15).join('\n').toLowerCase();
      
      const hasTeacherContent = teacherKeywords.some(kw => nextLines.includes(kw));
      const hasStudentContent = studentKeywords.some(kw => nextLines.includes(kw));
      
      console.log(`Candidate at line ${candidate.index + studentSectionStart}: teacher=${hasTeacherContent}, student=${hasStudentContent}, "${candidate.line.substring(0, 60)}"`);
      
      // Prefer sections with student content and NO teacher content
      if (hasStudentContent && !hasTeacherContent) {
        bestCandidate = candidate;
        console.log(`Selected STUDENT section at line ${candidate.index + studentSectionStart}`);
        break;
      } else if (!bestCandidate && !hasTeacherContent) {
        bestCandidate = candidate;
      }
    }
    
    if (!bestCandidate) {
      console.warn(`Could not find student section for group: ${groupName}`);
      return '';
    }
    
    // STEP 5: Find the end of this section (next same-level or higher header)
    let endIndex = lines.length;
    for (let i = bestCandidate.index + 1; i < lines.length; i++) {
      const headerMatch = lines[i].match(/^(#{1,4})\s+/);
      if (headerMatch && headerMatch[1].length <= bestCandidate.level) {
        endIndex = i;
        console.log(`Found end at line ${i + studentSectionStart}: ${lines[i].substring(0, 50)}`);
        break;
      }
    }
    
    const extracted = lines.slice(bestCandidate.index, endIndex).join('\n').trim();
    console.log(`Extracted ${endIndex - bestCandidate.index} lines (${extracted.length} chars) for ${groupName}`);
    
    return extracted;
  }, [content]);

  // Get audio for a specific group and language
  const getAudioUrl = useCallback((groupName: string, language: string): string | null => {
    const audio = preGeneratedAudio.find(
      a => a.group_name === groupName && a.language === language
    );
    return audio?.audio_url || null;
  }, [preGeneratedAudio]);

  // Play audio
  const handlePlayAudio = useCallback((audioUrl: string, label: string) => {
    const audio = new Audio(audioUrl);
    setPlayingAudio(label);
    audio.onended = () => setPlayingAudio(null);
    audio.onerror = () => {
      setPlayingAudio(null);
      toast({ title: 'Audio Error', description: 'Could not play audio', variant: 'destructive' });
    };
    audio.play();
  }, [toast]);

  // Save lesson to database
  const handleSaveLesson = async () => {
    if (saved) return;
    
    setSaving(true);
    try {
      const teacherGuide = extractSection('TEACHER GUIDE', 'STUDENT HANDOUTS');
      const studentHandouts = selectedGroups.map((group) => ({
        groupId: group.id,
        groupName: group.groupName,
        readingLevel: group.readingLevelLabel,
        content: extractGroupContent(group.groupName),
      }));

      const { error } = await supabase
        .from('generated_lessons')
        .insert({
          original_content: originalContent || content,
          lesson_title: lessonTitle,
          group_ids: selectedGroups.map((g) => g.id),
          teacher_guide: teacherGuide,
          student_handouts: studentHandouts as unknown as Record<string, unknown>,
          differentiation_options: options as unknown as Record<string, unknown>,
        } as any);

      if (error) throw error;

      setSaved(true);
      onSaved?.();
      toast({ 
        title: 'Lesson saved!', 
        description: 'Your differentiated lesson has been saved.' 
      });
      
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast({ 
        title: 'Save failed', 
        description: 'Could not save lesson. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const extractSection = (sectionMarker: string, endMarker?: string): string => {
    const lines = content.split('\n');
    let inSection = false;
    let sectionContent: string[] = [];
    
    for (const line of lines) {
      if (line.includes(sectionMarker)) {
        inSection = true;
        sectionContent.push(line);
      } else if (inSection) {
        if (endMarker && line.includes(endMarker)) {
          break;
        }
        sectionContent.push(line);
      }
    }
    
    return sectionContent.join('\n');
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ title: 'Copied to clipboard', description: 'Full lesson plan copied' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAudioGenerated = useCallback(async () => {
    if (lessonId) {
      toast({
        title: 'Audio ready',
        description: 'Audio files are now available for playback',
      });
    }
  }, [lessonId, toast]);

  // Get teacher guide content
  const teacherGuide = useMemo(() => {
    const lines = content.split('\n');
    let inTeacherGuide = false;
    const guideLines: string[] = [];
    
    for (const line of lines) {
      if (line.includes('TEACHER GUIDE') || line.includes('Teacher Guide')) {
        inTeacherGuide = true;
        guideLines.push(line);
      } else if (inTeacherGuide) {
        if (line.includes('STUDENT HANDOUTS') || line.includes('Student Handouts')) {
          break;
        }
        guideLines.push(line);
      }
    }
    
    return guideLines.join('\n');
  }, [content]);

  // Check if we have bilingual groups
  const hasBilingualGroups = selectedGroups.some(g => g.homeLanguage && g.homeLanguage !== 'English');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="font-display text-xl">Differentiated Lesson Plan</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Generated for {selectedGroups.length} student group{selectedGroups.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={saved ? "default" : "outline"} 
                size="sm" 
                onClick={handleSaveLesson} 
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Lesson'}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy All'}
              </Button>

              {/* Export for LMS */}
              <ExportForLMSButton
                groups={selectedGroups}
                lessonTitle={lessonTitle}
                getGroupContent={extractGroupContent}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Group summary badges */}
          <div className="flex flex-wrap gap-2">
            {selectedGroups.map((group) => (
              <Badge
                key={group.id}
                variant="outline"
                className={getReadingLevelColor(group.readingLevelLabel)}
              >
                <span className="mr-1">{getStudentFriendlyIcon(group.readingLevelLabel)}</span>
                {group.groupName}
                <span className="ml-1 opacity-70">({group.numStudents})</span>
              </Badge>
            ))}
          </div>
          
          {/* Audio Generation - Only show if audio doesn't exist */}
          {anyGroupNeedsAudio(selectedGroups) && !hasExistingAudio && !isGeneratingAudio && (
            <div className="p-4 rounded-lg border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                    <Volume2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">🔊 Audio Support Available</p>
                    <p className="text-xs text-muted-foreground">
                      Generate audio for student listening support
                    </p>
                  </div>
                </div>
                <AudioGenerationButton
                  lessonId={lessonId || null}
                  differentiatedContent={content}
                  selectedGroups={selectedGroups}
                  onAudioGenerated={handleAudioGenerated}
                  disabled={!saved && !lessonId}
                />
              </div>
            </div>
          )}
          
          {/* Audio Ready indicator */}
          {hasExistingAudio && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Audio ready ({preGeneratedAudio.length} files)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Display */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {hasBilingualGroups ? (
            <Tabs defaultValue="bilingual" className="w-full">
              <div className="border-b px-4 py-2 bg-muted/30">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="bilingual" className="gap-2">
                    <LayoutTemplate className="h-4 w-4" />
                    Side-by-Side View
                  </TabsTrigger>
                  <TabsTrigger value="raw" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Full Content
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="bilingual" className="mt-0 p-4 space-y-6">
                {/* Teacher Guide Section */}
                {teacherGuide.trim() && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-display font-bold flex items-center gap-2 pb-3 border-b">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Teacher Guide
                      <HelpTooltip content={OUTPUT_SECTION_DESCRIPTIONS['Teacher Guide']} />
                    </h2>
                    <article className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{teacherGuide}</ReactMarkdown>
                    </article>
                  </div>
                )}
                
                {/* Bilingual Student Handouts */}
                <div className="space-y-6">
                  <h2 className="text-xl font-display font-bold flex items-center gap-2 pb-3 border-b">
                    <Languages className="h-5 w-5 text-primary" />
                    Student Handouts (Bilingual)
                    <HelpTooltip content={OUTPUT_SECTION_DESCRIPTIONS['Student Handouts']} />
                  </h2>
                  
                  {selectedGroups
                    .filter(g => g.homeLanguage && g.homeLanguage !== 'English')
                    .map(group => {
                      const groupContent = extractGroupContent(group.groupName);
                      const englishAudioUrl = getAudioUrl(group.groupName, 'English');
                      const homeAudioUrl = getAudioUrl(group.groupName, group.homeLanguage);
                      
                      return (
                        <BilingualLessonCard
                          key={group.id}
                          group={group}
                          content={groupContent}
                          englishAudioUrl={englishAudioUrl}
                          homeLanguageAudioUrl={homeAudioUrl}
                          playingAudio={playingAudio}
                          onPlayAudio={handlePlayAudio}
                        />
                      );
                    })}
                  
                  {/* English-only groups */}
                  {selectedGroups
                    .filter(g => !g.homeLanguage || g.homeLanguage === 'English')
                    .map(group => {
                      const groupContent = extractGroupContent(group.groupName);
                      const audioUrl = getAudioUrl(group.groupName, 'English');
                      
                      return (
                        <Card key={group.id} className="border-accent/20">
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-lg">
                                <span>{getStudentFriendlyIcon(group.readingLevelLabel)}</span>
                                {group.groupName}
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {getStudentFriendlyName(group.readingLevelLabel)}
                                </Badge>
                              </div>
                              {audioUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePlayAudio(audioUrl, `${group.groupName}-english`)}
                                  className="gap-2"
                                >
                                  <Volume2 className={`h-4 w-4 ${playingAudio === `${group.groupName}-english` ? 'animate-pulse text-primary' : ''}`} />
                                  Listen
                                </Button>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <article className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown>{groupContent}</ReactMarkdown>
                            </article>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </TabsContent>
              
              <TabsContent value="raw" className="mt-0">
                <RawContentView content={content} />
              </TabsContent>
            </Tabs>
          ) : (
            <RawContentView content={content} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Bilingual lesson card with two-column layout
interface BilingualLessonCardProps {
  group: StudentGroup & { id: string };
  content: string;
  englishAudioUrl: string | null;
  homeLanguageAudioUrl: string | null;
  playingAudio: string | null;
  onPlayAudio: (url: string, label: string) => void;
}

function BilingualLessonCard({
  group,
  content,
  englishAudioUrl,
  homeLanguageAudioUrl,
  playingAudio,
  onPlayAudio,
}: BilingualLessonCardProps) {
  // Split content by language markers if present, otherwise use same content for both
  const { englishContent, homeLanguageContent } = useMemo(() => {
    // Try to find language-specific sections
    const lines = content.split('\n');
    let englishLines: string[] = [];
    let homeLines: string[] = [];
    let currentLang: 'english' | 'home' | null = null;
    
    for (const line of lines) {
      if (line.includes('(English)') || line.includes('[English]')) {
        currentLang = 'english';
        continue;
      }
      if (line.includes(`(${group.homeLanguage})`) || line.includes(`[${group.homeLanguage}]`)) {
        currentLang = 'home';
        continue;
      }
      
      if (currentLang === 'english') {
        englishLines.push(line);
      } else if (currentLang === 'home') {
        homeLines.push(line);
      } else {
        // If no language marker, add to both
        englishLines.push(line);
        homeLines.push(line);
      }
    }
    
    return {
      englishContent: englishLines.length > 0 ? englishLines.join('\n') : content,
      homeLanguageContent: homeLines.length > 0 ? homeLines.join('\n') : content,
    };
  }, [content, group.homeLanguage]);

  return (
    <Card className="border-accent/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-accent/10 to-transparent pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>{getStudentFriendlyIcon(group.readingLevelLabel)}</span>
          {group.groupName}
          <Badge variant="outline" className="ml-2 text-xs">
            Bilingual: {group.homeLanguage} / English
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Two-column bilingual layout */}
        <div className="grid grid-cols-2 min-h-[300px]">
          {/* LEFT: Translated Content */}
          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 border-r border-border">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getFlag(group.homeLanguage)}</span>
                <span className="font-medium text-amber-700 dark:text-amber-300">{group.homeLanguage}</span>
              </div>
              {homeLanguageAudioUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPlayAudio(homeLanguageAudioUrl, `${group.groupName}-home`)}
                  className="h-8 px-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900"
                >
                  <Volume2 className={`h-4 w-4 mr-1 ${playingAudio === `${group.groupName}-home` ? 'animate-pulse' : ''}`} />
                  Listen
                </Button>
              )}
            </div>
            <article className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{homeLanguageContent}</ReactMarkdown>
            </article>
          </div>
          
          {/* RIGHT: English Content */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getFlag('English')}</span>
                <span className="font-medium text-blue-700 dark:text-blue-300">English</span>
              </div>
              {englishAudioUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPlayAudio(englishAudioUrl, `${group.groupName}-english`)}
                  className="h-8 px-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <Volume2 className={`h-4 w-4 mr-1 ${playingAudio === `${group.groupName}-english` ? 'animate-pulse' : ''}`} />
                  Listen
                </Button>
              )}
            </div>
            <article className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{englishContent}</ReactMarkdown>
            </article>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Raw markdown content view
function RawContentView({ content }: { content: string }) {
  return (
    <article className="prose prose-base dark:prose-invert max-w-none p-6
      prose-headings:font-display prose-headings:font-bold
      prose-h1:text-2xl prose-h1:border-b prose-h1:pb-3 prose-h1:mb-4
      prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
      prose-h3:text-lg prose-h3:text-primary
      prose-table:border prose-table:rounded-lg
      prose-th:bg-muted prose-th:p-3
      prose-td:p-3 prose-td:border-t
    ">
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  );
}

export default DifferentiatedLessonOutput;
