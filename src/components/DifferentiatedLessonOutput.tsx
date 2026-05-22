import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Check, BookOpen, GraduationCap, Save, Loader2, Volume2, Languages, LayoutTemplate, FileText, ImageIcon, RefreshCw, Headphones } from 'lucide-react';
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
import { useLessonImageVariations } from '@/hooks/useLessonImageVariations';
import { extractVisualDescriptions } from '@/lib/imageGeneration';
import LessonImageFrame from '@/components/LessonImageFrame';
import { LessonImageBrowser } from '@/components/LessonImageBrowser';
import { ImageVariationPicker } from '@/components/ImageVariationPicker';
import { getISOCode } from '@/lib/languageCodes';

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

// Shared markdown component mappings for consistent HTML rendering
const createMarkdownComponents = (
  imageMap: Map<string, string>,
  onRegenerateImage?: (description: string) => void,
  isRegenerating?: boolean
) => ({
  img: ({ src, alt }: { src?: string; alt?: string }) => {
    // If there's a callback for regeneration, wrap the image with hover UI
    if (onRegenerateImage && alt) {
      return (
        <figure className="my-6 mx-auto max-w-[600px] group relative">
          <div className="relative w-full aspect-[3/2] bg-muted border-4 border-primary/20 rounded-lg shadow-soft overflow-hidden">
            <img
              src={src || ''}
              alt={alt || 'Lesson diagram'}
              className="absolute inset-0 w-full h-full object-contain p-2"
            />
            {/* Hover overlay with regenerate button */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => onRegenerateImage(alt)}
                disabled={isRegenerating}
                className="flex items-center gap-2 px-3 py-2 bg-white text-gray-900 rounded-md text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                Try Different Options
              </button>
            </div>
          </div>
          {alt && (
            <figcaption className="text-center text-sm text-muted-foreground mt-2 italic">{alt}</figcaption>
          )}
        </figure>
      );
    }
    return <LessonImageFrame src={src || ''} alt={alt || ''} />;
  },
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-2xl font-display font-bold text-foreground mt-6 mb-4 pb-2 border-b border-border">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-xl font-display font-semibold text-foreground mt-5 mb-3">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-lg font-display font-medium text-foreground mt-4 mb-2">{children}</h3>,
  h4: ({ children }: { children?: React.ReactNode }) => <h4 className="text-base font-semibold text-foreground mt-3 mb-2">{children}</h4>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="text-foreground/90 leading-relaxed mb-3">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-inside space-y-1.5 mb-4 ml-2">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-inside space-y-1.5 mb-4 ml-2">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="text-foreground/90">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic text-foreground/80">{children}</em>,
  blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-4 bg-primary/5 rounded-r-md italic">{children}</blockquote>,
  hr: () => <hr className="my-6 border-border" />,
  table: ({ children }: { children?: React.ReactNode }) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse border border-border rounded-lg">{children}</table></div>,
  thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-muted/50">{children}</thead>,
  tbody: ({ children }: { children?: React.ReactNode }) => <tbody className="divide-y divide-border">{children}</tbody>,
  tr: ({ children }: { children?: React.ReactNode }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
  th: ({ children }: { children?: React.ReactNode }) => <th className="px-4 py-2 text-left font-semibold text-foreground border border-border">{children}</th>,
  td: ({ children }: { children?: React.ReactNode }) => <td className="px-4 py-2 text-foreground/90 border border-border">{children}</td>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => <a href={href} className="text-primary hover:text-primary/80 underline underline-offset-2" target="_blank" rel="noopener noreferrer">{children}</a>,
  code: ({ children }: { children?: React.ReactNode }) => <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">{children}</code>,
  pre: ({ children }: { children?: React.ReactNode }) => <pre className="p-4 bg-muted rounded-lg overflow-x-auto my-4">{children}</pre>,
});

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
  const [showImageBrowser, setShowImageBrowser] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { options } = useDifferentiation();
  const { imageMap, isGenerating: isGeneratingImages, progress: imageProgress, generateImages, hasVisuals } = useLessonImages();
  const { 
    variationsState, 
    selectedImages, 
    isGenerating: isGeneratingVariations, 
    generateVariations, 
    selectImage, 
    clearVariations 
  } = useLessonImageVariations();

  const { teacherGuide, studentHandouts } = lessonData;

  // Combine base imageMap with user-selected variations (selected takes precedence)
  const combinedImageMap = useMemo(() => {
    const combined = new Map(imageMap);
    selectedImages.forEach((url, desc) => {
      combined.set(desc, url);
    });
    return combined;
  }, [imageMap, selectedImages]);

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

  // Handle generating variations for a specific image
  const handleGenerateVariations = useCallback((description: string) => {
    generateVariations(description, lessonId || undefined, undefined, lessonTitle);
  }, [generateVariations, lessonId, lessonTitle]);

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
              <CardTitle className="font-display text-xl">{lessonTitle}</CardTitle>
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
                imageMap={combinedImageMap}
                isGeneratingImages={isGeneratingImages || isGeneratingVariations}
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
          
          {/* Audio & Images Review Section */}
          {(hasExistingAudio || imageMap.size > 0) && lessonId && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-green-700 dark:text-green-300">✅ Media Ready</p>
                    <p className="text-xs text-muted-foreground">
                      {hasExistingAudio && `${preGeneratedAudio.length} audio file(s)`}
                      {hasExistingAudio && imageMap.size > 0 && ' • '}
                      {imageMap.size > 0 && `${imageMap.size} image(s)`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {hasExistingAudio && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(`/lesson/${lessonId}/audio`, '_blank')}
                    >
                      <Headphones className="h-4 w-4" />
                      Review Audio
                    </Button>
                  )}
                  {imageMap.size > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowImageBrowser(true)}
                    >
                      <ImageIcon className="h-4 w-4" />
                      Review Images
                    </Button>
                  )}
                </div>
              </div>
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
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={createMarkdownComponents(combinedImageMap, handleGenerateVariations, isGeneratingVariations)}>
                                  {processContentWithImages(handout.content, combinedImageMap)}
                                </ReactMarkdown>
                              </div>
                            </div>
                            
                            {/* English content (right) */}
                            <div className="p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 pb-2 border-b">
                                <span>🇺🇸</span>
                                <span>English</span>
                              </div>
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={createMarkdownComponents(combinedImageMap, handleGenerateVariations, isGeneratingVariations)}>
                                  {processContentWithImages(handout.englishContent || '', combinedImageMap)}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Single column for English-only
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={createMarkdownComponents(combinedImageMap, handleGenerateVariations, isGeneratingVariations)}>
                              {processContentWithImages(handout.content, combinedImageMap)}
                            </ReactMarkdown>
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
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={createMarkdownComponents(combinedImageMap, handleGenerateVariations, isGeneratingVariations)}>
                  {processContentWithImages(teacherGuide, combinedImageMap)}
                </ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Image Browser Dialog */}
      {lessonId && (
        <Dialog open={showImageBrowser} onOpenChange={setShowImageBrowser}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lesson Images</DialogTitle>
            </DialogHeader>
            <LessonImageBrowser lessonId={lessonId} />
          </DialogContent>
        </Dialog>
      )}

      {/* Image Variation Picker Modal */}
      {variationsState && variationsState.variations.length > 0 && (
        <ImageVariationPicker
          description={variationsState.description}
          variations={variationsState.variations}
          isOpen={true}
          onClose={clearVariations}
          onSelect={(url) => selectImage(variationsState.description, url)}
          onRegenerate={() => handleGenerateVariations(variationsState.description)}
          isRegenerating={variationsState.isGenerating}
        />
      )}
    </div>
  );
}
