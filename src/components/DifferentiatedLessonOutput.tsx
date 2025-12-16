import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, BookOpen, GraduationCap, Save, Loader2, Volume2, Languages, LayoutTemplate, FileText, ImageIcon, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStudentFriendlyName, getStudentFriendlyIcon, getReadingLevelColor } from '@/lib/readingLevelNames';
import { OUTPUT_SECTION_DESCRIPTIONS } from '@/lib/tooltipDescriptions';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import type { StudentGroup } from '@/types/studentGroup';
import type { DifferentiatedLessonData, StudentHandout } from '@/types/differentiatedLesson';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDifferentiation } from '@/contexts/DifferentiationContext';
import { anyGroupNeedsAudio } from '@/types/audioRequirements';
import { AudioGenerationButton } from '@/components/AudioGenerationButton';
import { ExportForLMSButton } from '@/components/export/ExportForLMSButton';
import { useLessonImages } from '@/hooks/useLessonImages';
import { extractVisualDescriptions } from '@/lib/imageGeneration';

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
  lessonData: DifferentiatedLessonData;
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

// Find image URL - now uses simple exact match since [VISUAL:] tags are always in English
const findImageUrl = (description: string, imageMap: Map<string, string>): string | undefined => {
  const trimmedDesc = description.trim();
  
  // Exact match (keys are now always English)
  if (imageMap.has(trimmedDesc)) {
    return imageMap.get(trimmedDesc);
  }
  
  // Fallback: case-insensitive match
  const lowerDesc = trimmedDesc.toLowerCase();
  for (const [key, url] of imageMap.entries()) {
    if (key.toLowerCase() === lowerDesc) {
      return url;
    }
  }
  
  return undefined;
};

// Process content to replace [VISUAL:] and [NANOBANANA:] tags with actual images
const processContentWithImages = (content: string, imageMap: Map<string, string>): string => {
  if (!content || imageMap.size === 0) return content;
  
  let processed = content;
  
  // Replace [VISUAL: description] with markdown image
  processed = processed.replace(/\[VISUAL:\s*(.+?)\]/gi, (match, description) => {
    const desc = description.trim();
    const imageUrl = findImageUrl(desc, imageMap);
    if (imageUrl) {
      return `\n\n![${desc}](${imageUrl})\n\n*${desc}*\n\n`;
    }
    return match; // Keep placeholder if no image
  });
  
  // Also handle [NANOBANANA: "..."] format
  processed = processed.replace(/\[NANOBANANA:\s*"(.+?)"\]/gi, (match, description) => {
    const desc = description.trim();
    const imageUrl = findImageUrl(desc, imageMap);
    if (imageUrl) {
      return `\n\n![${desc}](${imageUrl})\n\n*${desc}*\n\n`;
    }
    return match;
  });
  
  return processed;
};

export function DifferentiatedLessonOutput({ 
  lessonData,
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
  const { user } = useAuth();
  const { options } = useDifferentiation();
  const { imageMap, isGenerating: isGeneratingImages, progress: imageProgress, generateImages, hasVisuals } = useLessonImages();

  const { teacherGuide, studentHandouts } = lessonData;

  // Check if audio already exists for this lesson
  const hasExistingAudio = preGeneratedAudio.length > 0;

  // Check if any content has visual placeholders - with debugging
  const { contentHasVisuals, visualDescriptions } = useMemo(() => {
    const allContent = studentHandouts.map(h => h.content).join('\n');
    const descriptions = extractVisualDescriptions(allContent);
    console.log('[Visuals] Checking content for visuals:', {
      contentLength: allContent.length,
      foundDescriptions: descriptions.length,
      descriptions: descriptions.slice(0, 3), // Log first 3
      contentPreview: allContent.substring(0, 500)
    });
    return { contentHasVisuals: descriptions.length > 0, visualDescriptions: descriptions };
  }, [studentHandouts]);

  // Track if auto-generation has been attempted for THIS lesson
  const autoGenerationAttempted = useRef<string | null>(null);

  // Handle diagram generation
  const handleGenerateDiagrams = useCallback(async () => {
    const allContent = studentHandouts.map(h => h.content).join('\n');
    console.log('[Visuals] Manual generation triggered, content length:', allContent.length);
    const visuals = extractVisualDescriptions(allContent);
    console.log('[Visuals] Found visual descriptions:', visuals.length, visuals);
    
    if (visuals.length === 0) {
      console.warn('[Visuals] No visual descriptions found! Content preview:', allContent.substring(0, 1000));
      return;
    }
    
    await generateImages(allContent, lessonId || undefined, undefined, lessonTitle);
  }, [studentHandouts, generateImages, lessonId, lessonTitle]);

  // Create a unique identifier for this lesson content
  const lessonContentId = useMemo(() => {
    const content = studentHandouts.map(h => h.content).join('').slice(0, 500);
    return `${lessonId || 'new'}-${content.length}-${content.slice(0, 50)}`;
  }, [lessonId, studentHandouts]);

  // Auto-generate images when content has visuals and no images exist yet
  useEffect(() => {
    console.log('[Visuals] Auto-gen check:', {
      contentHasVisuals,
      visualCount: visualDescriptions.length,
      imageMapSize: imageMap.size,
      isGeneratingImages,
      lessonContentId: lessonContentId.substring(0, 50),
      attempted: autoGenerationAttempted.current?.substring(0, 50),
    });
    
    if (contentHasVisuals && imageMap.size === 0 && !isGeneratingImages && autoGenerationAttempted.current !== lessonContentId) {
      autoGenerationAttempted.current = lessonContentId;
      console.log('[Visuals] Starting auto-generation for:', lessonContentId.substring(0, 50));
      handleGenerateDiagrams();
    }
  }, [contentHasVisuals, visualDescriptions.length, imageMap.size, isGeneratingImages, handleGenerateDiagrams, lessonContentId]);

  // Get content for a specific group - now using structured data directly
  const getGroupContent = useCallback((groupName: string): string => {
    const handout = studentHandouts.find(
      h => h.groupName.toLowerCase() === groupName.toLowerCase()
    );
    return handout?.content || '';
  }, [studentHandouts]);

  // Get English content for bilingual groups
  const getGroupEnglishContent = useCallback((groupName: string): string => {
    const handout = studentHandouts.find(
      h => h.groupName.toLowerCase() === groupName.toLowerCase()
    );
    return handout?.englishContent || '';
  }, [studentHandouts]);

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
      if (!user?.id) throw new Error('You must be logged in to save lessons');
      const insertData = {
        original_content: originalContent || teacherGuide,
        lesson_title: lessonTitle,
        group_ids: selectedGroups.map((g) => g.id),
        teacher_guide: teacherGuide,
        student_handouts: JSON.parse(JSON.stringify(studentHandouts)),
        differentiation_options: JSON.parse(JSON.stringify(options)),
        user_id: user.id,
      };
      
      const { error } = await supabase
        .from('generated_lessons')
        .insert(insertData);

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

  // Combine all content for copy
  const fullContent = useMemo(() => {
    const handoutContents = studentHandouts.map(h => 
      `## ${h.groupName} (${h.level})\n\n${h.content}`
    ).join('\n\n---\n\n');
    return `# TEACHER GUIDE\n\n${teacherGuide}\n\n---\n\n# STUDENT HANDOUTS\n\n${handoutContents}`;
  }, [teacherGuide, studentHandouts]);

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(fullContent);
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
                getGroupContent={getGroupContent}
                getGroupEnglishContent={getGroupEnglishContent}
                imageMap={imageMap}
                isGeneratingImages={isGeneratingImages}
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
                  differentiatedContent={fullContent}
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
          
          {/* Diagram Generation Section */}
          {contentHasVisuals && (
            <div className="p-4 rounded-lg border bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 border-sky-200 dark:border-sky-800">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-sky-100 dark:bg-sky-900">
                    <ImageIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">📐 AI Diagram Generation</p>
                    <p className="text-xs text-muted-foreground">
                      {isGeneratingImages 
                        ? `Generating... (${imageProgress.completed}/${imageProgress.total})`
                        : imageMap.size > 0 
                          ? `✅ ${imageMap.size} diagram(s) ready`
                          : `${visualDescriptions.length} diagram(s) found in content`}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    console.log('[Visuals] Manual generate clicked');
                    autoGenerationAttempted.current = null; // Reset to allow regeneration
                    handleGenerateDiagrams();
                  }}
                  size="sm"
                  variant={imageMap.size > 0 ? "outline" : "default"}
                  className="gap-2"
                  disabled={isGeneratingImages}
                >
                  {isGeneratingImages ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : imageMap.size > 0 ? (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4" />
                      Generate Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Display */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="handouts" className="w-full">
            <div className="border-b px-4 py-2 bg-muted/30">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="handouts" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Student Handouts
                </TabsTrigger>
                <TabsTrigger value="teacher" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Teacher Guide
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Student Handouts - Now using structured data */}
            <TabsContent value="handouts" className="mt-0 p-4 space-y-6">
              {studentHandouts.length > 0 ? (
                <Tabs defaultValue={studentHandouts[0]?.groupId || ''} className="w-full">
                  {/* Group tabs */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <TabsList className="h-auto flex-wrap">
                      {studentHandouts.map((handout) => {
                        const group = selectedGroups.find(g => g.id === handout.groupId || g.groupName === handout.groupName);
                        return (
                          <TabsTrigger
                            key={handout.groupId}
                            value={handout.groupId}
                            className="gap-2"
                          >
                            <span>{getStudentFriendlyIcon(group?.readingLevelLabel || handout.level)}</span>
                            {handout.groupName}
                            {handout.language !== 'English' && (
                              <span className="text-xs">{getFlag(handout.language)}</span>
                            )}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </div>
                  
                  {/* Handout content */}
                  {studentHandouts.map((handout) => {
                    const isBilingual = handout.language !== 'English' && handout.englishContent;
                    const rtlLanguages = ['Arabic', 'Hebrew', 'Farsi', 'Urdu'];
                    const isRTL = rtlLanguages.some(lang => 
                      handout.language.toLowerCase().includes(lang.toLowerCase())
                    );
                    
                    return (
                      <TabsContent key={handout.groupId} value={handout.groupId} className="mt-0">
                        {isBilingual ? (
                          // Bilingual side-by-side layout
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Translated content (left) */}
                            <div className={`p-4 rounded-lg border-l-4 border-primary bg-primary/5 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 pb-2 border-b">
                                <span>🌍</span>
                                <span>{handout.language}</span>
                              </div>
                              <div className="prose prose-sm dark:prose-invert max-w-none [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_img]:mx-auto [&_img]:block [&_img]:shadow-md">
                                <ReactMarkdown>{processContentWithImages(handout.content, imageMap)}</ReactMarkdown>
                              </div>
                            </div>
                            
                            {/* English content (right) */}
                            <div className="p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 pb-2 border-b">
                                <span>🇺🇸</span>
                                <span>English</span>
                              </div>
                              <div className="prose prose-sm dark:prose-invert max-w-none [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_img]:mx-auto [&_img]:block [&_img]:shadow-md">
                                <ReactMarkdown>{processContentWithImages(handout.englishContent || '', imageMap)}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Single column for English-only
                          <div className="prose prose-sm dark:prose-invert max-w-none [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_img]:mx-auto [&_img]:block [&_img]:shadow-md">
                            <ReactMarkdown>{processContentWithImages(handout.content, imageMap)}</ReactMarkdown>
                          </div>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No student handouts generated</p>
                </div>
              )}
            </TabsContent>
            
            {/* Teacher Guide */}
            <TabsContent value="teacher" className="mt-0 p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_img]:mx-auto [&_img]:block [&_img]:shadow-md">
                <ReactMarkdown>{processContentWithImages(teacherGuide, imageMap)}</ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
