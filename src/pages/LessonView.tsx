import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LessonImageFrame from '@/components/LessonImageFrame';
import { LessonValidationBanner } from '@/components/LessonValidationBanner';
import { LessonValidationBadge } from '@/components/LessonValidationBadge';
import { format } from 'date-fns';
import { getStudentFriendlyIcon, getReadingLevelColor } from '@/lib/readingLevelNames';
import type { StudentHandout } from '@/types/differentiatedLesson';
import { useLessonImagesDB } from '@/hooks/useLessonImagesDB';
import { PushToCanvasDialog } from '@/components/PushToCanvasDialog';
import { 
  ArrowLeft, 
  Printer, 
  Copy, 
  Download, 
  Loader2, 
  Calendar, 
  Users,
  FileText,
  CheckCircle,
  BookOpen,
  GraduationCap,
  Upload
} from 'lucide-react';

interface SavedLesson {
  id: string;
  lesson_title: string | null;
  original_content: string;
  teacher_guide: string | null;
  student_handouts: any;
  differentiation_options: any;
  group_ids: string[];
  created_at: string;
  updated_at: string;
}

// Language flags mapping
const LANGUAGE_FLAGS: Record<string, string> = {
  'English': '🇺🇸',
  'Spanish': '🇪🇸',
  'Somali': '🇸🇴',
  'Vietnamese': '🇻🇳',
  'Mandarin': '🇨🇳',
  'Chinese': '🇨🇳',
  'Arabic': '🇸🇦',
  'Hmong': '🌏',
  'Karen': '🌏',
  'Oromo': '🇪🇹',
  'Russian': '🇷🇺',
  'Swahili': '🇰🇪',
  'French': '🇫🇷',
  'Portuguese': '🇧🇷',
  'Tagalog': '🇵🇭',
  'Korean': '🇰🇷',
  'Japanese': '🇯🇵',
  'Hindi': '🇮🇳',
  'Urdu': '🇵🇰',
  'Punjabi': '🇮🇳',
  'Bengali': '🇧🇩',
  'Nepali': '🇳🇵',
  'Burmese': '🇲🇲',
};

const getFlag = (language: string): string => LANGUAGE_FLAGS[language] || '🌐';

// RTL languages for proper text direction
const RTL_LANGUAGES = ['Arabic', 'Hebrew', 'Urdu', 'Persian', 'Farsi'];

// Custom markdown component mappings for enhanced HTML rendering
const markdownComponents = {
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <LessonImageFrame src={src || ''} alt={alt || ''} />
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-2xl font-display font-bold text-primary mt-6 mb-4 pb-2 border-b border-border">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-xl font-display font-semibold text-primary/90 mt-5 mb-3">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-lg font-display font-medium text-primary/80 mt-4 mb-2">{children}</h3>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="text-base font-semibold text-foreground mt-3 mb-2">{children}</h4>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-foreground/90 leading-relaxed mb-3">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-inside space-y-1.5 mb-4 ml-2">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal list-inside space-y-1.5 mb-4 ml-2">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-foreground/90">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-foreground/80">{children}</em>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-4 bg-primary/5 rounded-r-md italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-6 border-border" />,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse border border-border rounded-lg">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-muted/50">{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody className="divide-y divide-border">{children}</tbody>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-4 py-2 text-left font-semibold text-foreground border border-border">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-4 py-2 text-foreground/90 border border-border">{children}</td>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="text-primary hover:text-primary/80 underline underline-offset-2" target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">{children}</code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="p-4 bg-muted rounded-lg overflow-x-auto my-4">{children}</pre>
  ),
};

export default function LessonView() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { loading: authLoading, user } = useAuthContext();
  const [copied, setCopied] = useState(false);
  const [printMode, setPrintMode] = useState<'teacher' | 'handouts' | null>(null);
  const [activeGroupTab, setActiveGroupTab] = useState<string>('');
  const [pushOpen, setPushOpen] = useState(false);

  const { data: hasCanvas } = useQuery({
    queryKey: ['canvas-connection', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('canvas_connections')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ['lesson', id],
    queryFn: async () => {
      if (!id) throw new Error('No lesson ID provided');
      
      const { data, error } = await supabase
        .from('generated_lessons')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as SavedLesson;
    },
    enabled: !!id && !authLoading && !!user,
    retry: false,
  });

  // Latest validation result for this lesson (best-effort).
  const { data: validation } = useQuery({
    queryKey: ['lesson-validation', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('lesson_validation_results')
        .select('passed, hard_check_results, regen_attempts')
        .eq('lesson_id', id)
        .order('validated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!id && !authLoading && !!user,
  });

  const failedChecks = (() => {
    if (!validation || validation.passed) return [];
    const hc = (validation.hard_check_results ?? {}) as Record<string, { passed: boolean; details?: string }>;
    return Object.entries(hc)
      .filter(([, r]) => !r.passed)
      .map(([name, r]) => ({ name, details: r.details }));
  })();

  // Image fetching
  const { fetchImages } = useLessonImagesDB();
  const [imageMap, setImageMap] = useState<Map<string, string>>(new Map());
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Process content to replace [VISUAL:] and [NANOBANANA:] tags with actual images
  const processContentWithImages = useCallback((content: string): string => {
    if (!content || imageMap.size === 0) return content;
    
    let processed = content;
    
    // Replace [VISUAL: description] with markdown image
    processed = processed.replace(/\[VISUAL:\s*(.+?)\]/gi, (match, description) => {
      const desc = description.trim();
      const imageUrl = imageMap.get(desc);
      if (imageUrl) {
        return `\n\n![${desc}](${imageUrl})\n\n*${desc}*\n\n`;
      }
      return match;
    });
    
    // Also handle [NANOBANANA: "..."] format
    processed = processed.replace(/\[NANOBANANA:\s*"(.+?)"\]/gi, (match, description) => {
      const desc = description.trim();
      const imageUrl = imageMap.get(desc);
      if (imageUrl) {
        return `\n\n![${desc}](${imageUrl})\n\n*${desc}*\n\n`;
      }
      return match;
    });
    
    return processed;
  }, [imageMap]);

  // Set default active group tab when lesson loads
  useEffect(() => {
    if (lesson?.student_handouts && Array.isArray(lesson.student_handouts) && lesson.student_handouts.length > 0) {
      setActiveGroupTab(lesson.student_handouts[0].groupId || '0');
    }
  }, [lesson]);

  // Fetch images when lesson loads
  useEffect(() => {
    if (lesson?.id) {
      fetchImages(lesson.id).then((images) => {
        const map = new Map<string, string>();
        images.forEach((img) => {
          if (img.description && img.signedUrl) {
            map.set(img.description, img.signedUrl);
          }
        });
        setImageMap(map);
        setImagesLoaded(true);
      });
    }
  }, [lesson?.id, fetchImages]);

  // Handle unauthenticated state
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to view this lesson</p>
          <Button onClick={() => window.location.href = `/?redirect=/lesson/${id}`}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  // Get typed student handouts
  const getStudentHandouts = (): StudentHandout[] => {
    if (!lesson?.student_handouts || !Array.isArray(lesson.student_handouts)) return [];
    return lesson.student_handouts as StudentHandout[];
  };

  // Combine teacher guide and student handouts for full view
  const getFullContent = (lesson: SavedLesson): string => {
    let content = '';
    
    if (lesson.teacher_guide) {
      content += lesson.teacher_guide + '\n\n';
    }
    
    if (lesson.student_handouts && Array.isArray(lesson.student_handouts)) {
      content += '# STUDENT HANDOUTS\n\n';
      lesson.student_handouts.forEach((handout: any) => {
        content += `## ${handout.groupName}\n\n${handout.content}\n\n---\n\n`;
      });
    }
    
    return content || lesson.original_content;
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintTeacher = () => {
    setPrintMode('teacher');
    setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 100);
  };

  const handlePrintHandouts = () => {
    setPrintMode('handouts');
    setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 100);
  };

  const handleCopy = async () => {
    if (!lesson) return;
    
    try {
      await navigator.clipboard.writeText(getFullContent(lesson));
      setCopied(true);
      toast({ title: 'Copied!', description: 'Lesson content copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ 
        title: 'Copy failed', 
        description: 'Could not copy to clipboard.',
        variant: 'destructive' 
      });
    }
  };

  const handleDownloadMarkdown = () => {
    if (!lesson) return;
    
    const content = getFullContent(lesson);
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(lesson.lesson_title || 'Lesson').replace(/[^a-z0-9]/gi, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Downloaded!', description: 'Lesson saved as markdown file.' });
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display font-bold text-xl mb-2">Lesson Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This lesson may have been deleted or you don't have permission to view it.
          </p>
          <Link to="/saved-lessons">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to My Lessons
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const studentHandouts = getStudentHandouts();
  const hasTeacherGuide = !!lesson.teacher_guide;
  const hasHandouts = studentHandouts.length > 0;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { 
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
            background: #fff;
          }
          .lesson-content {
            max-width: 100% !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          h1 { font-size: 18pt; page-break-after: avoid; }
          h2 { font-size: 14pt; page-break-after: avoid; }
          h3 { font-size: 12pt; page-break-after: avoid; }
          hr { page-break-after: always; }
          .print-teacher-only .handouts-section { display: none !important; }
          .print-handouts-only .teacher-section { display: none !important; }
        }
      `}</style>

      <div className={`min-h-screen bg-background ${printMode === 'teacher' ? 'print-teacher-only' : ''} ${printMode === 'handouts' ? 'print-handouts-only' : ''}`}>
        {/* Header - hidden on print */}
        <header className="no-print border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Link to="/saved-lessons">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to My Lessons
                  </Button>
                </Link>
                <div className="h-6 w-px bg-border hidden sm:block" />
                <div>
                  <h1 className="font-display font-bold text-lg text-primary">
                    {lesson.lesson_title || 'Untitled Lesson'}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(lesson.created_at), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {lesson.group_ids?.length || 0} group{(lesson.group_ids?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadMarkdown}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                {hasCanvas && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setPushOpen(true)}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Push to Canvas
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <PushToCanvasDialog
          open={pushOpen}
          onOpenChange={setPushOpen}
          lessonTitle={lesson.lesson_title || 'Untitled Lesson'}
          markdownSections={[
            ...(lesson.teacher_guide ? [{ heading: 'Teacher Guide', content: processContentWithImages(lesson.teacher_guide) }] : []),
            ...studentHandouts.map((h) => ({
              heading: `${h.groupName}${h.language && h.language !== 'English' ? ` (${h.language})` : ''}`,
              content: processContentWithImages(h.content || ''),
            })),
          ]}
          imageUrls={Array.from(imageMap.values())}
        />

        {/* Lesson Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {validation && !validation.passed && (
              <div className="no-print">
                <LessonValidationBanner failedChecks={failedChecks} />
              </div>
            )}
          </div>
          <article className="lesson-content max-w-5xl mx-auto bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            {/* Differentiation options badges - hidden on print */}
            {lesson.differentiation_options && (
              <div className="no-print flex flex-wrap gap-2 p-4 border-b border-border bg-muted/30">
                {validation && (
                  <LessonValidationBadge
                    passed={validation.passed}
                    failedChecks={failedChecks.map((c) => c.name)}
                    regenAttempts={validation.regen_attempts ?? 0}
                  />
                )}
                {lesson.differentiation_options.includeVocabularyScaffolding && (
                  <Badge variant="secondary">📚 Vocabulary Scaffolding</Badge>
                )}
                {lesson.differentiation_options.generateComprehensionQuestions && (
                  <Badge variant="secondary">❓ Comprehension Questions</Badge>
                )}
                {lesson.differentiation_options.includeGraphicOrganizers && (
                  <Badge variant="secondary">📊 Graphic Organizers</Badge>
                )}
                {lesson.differentiation_options.includeVisualPlaceholders && (
                  <Badge variant="secondary">🖼️ Visual Placeholders</Badge>
                )}
              </div>
            )}

            {/* Main Tabs - Teacher Guide vs Student Handouts */}
            <Tabs defaultValue="handouts" className="w-full">
              {/* Tab Navigation - hidden on print */}
              <div className="no-print border-b border-border px-4 py-3 bg-muted/20">
                <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
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

              {/* Student Handouts Tab */}
              <TabsContent value="handouts" className="handouts-section mt-0">
                {hasHandouts ? (
                  <>
                    {/* Print button for handouts */}
                    <div className="no-print flex justify-end p-4 border-b border-border">
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handlePrintHandouts}
                        className="gap-2 bg-primary hover:bg-primary/90"
                      >
                        <Printer className="h-4 w-4" />
                        Print Handouts
                      </Button>
                    </div>

                    {/* Nested tabs for each student group */}
                    <Tabs value={activeGroupTab} onValueChange={setActiveGroupTab} className="w-full">
                      {/* Group tabs - hidden on print */}
                      <div className="no-print border-b border-border bg-muted/10 px-4 py-2 overflow-x-auto">
                        <TabsList className="inline-flex h-auto gap-2 bg-transparent p-0">
                          {studentHandouts.map((handout, index) => {
                            const levelIcon = getStudentFriendlyIcon(handout.level || 'On Grade');
                            const flag = getFlag(handout.language);
                            const levelColor = getReadingLevelColor(handout.level || 'On Grade');
                            
                            return (
                              <TabsTrigger 
                                key={handout.groupId || index} 
                                value={handout.groupId || index.toString()}
                                className={`gap-2 px-3 py-2 rounded-lg border data-[state=active]:border-primary data-[state=active]:bg-primary/5 ${levelColor}`}
                              >
                                <span>{levelIcon}</span>
                                <span className="font-medium">{handout.groupName}</span>
                                {handout.language !== 'English' && (
                                  <span>{flag}</span>
                                )}
                              </TabsTrigger>
                            );
                          })}
                        </TabsList>
                      </div>

                      {/* Group content */}
                      {studentHandouts.map((handout, index) => {
                        const isNonEnglish = handout.language !== 'English';
                        const hasBilingual = isNonEnglish && handout.englishContent;
                        const isRTL = RTL_LANGUAGES.includes(handout.language);
                        
                        return (
                          <TabsContent 
                            key={handout.groupId || index} 
                            value={handout.groupId || index.toString()}
                            className="p-6 md:p-8"
                          >
                            {/* Group header for print */}
                            <div className="mb-6 pb-4 border-b border-border">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{getStudentFriendlyIcon(handout.level || 'On Grade')}</span>
                                <h2 className="text-xl font-display font-bold text-primary">
                                  {handout.groupName}
                                </h2>
                                {isNonEnglish && (
                                  <Badge variant="outline" className="gap-1">
                                    {getFlag(handout.language)} {handout.language}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Bilingual side-by-side layout */}
                            {hasBilingual ? (
                              <div className="grid md:grid-cols-2 gap-6">
                                {/* Home language column */}
                                <div className={`border border-border rounded-lg p-4 bg-muted/5 ${isRTL ? 'rtl' : ''}`}>
                                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                                    <span className="text-lg">{getFlag(handout.language)}</span>
                                    <span className="font-semibold text-foreground">{handout.language}</span>
                                  </div>
                                  <div className="max-w-none" dir={isRTL ? 'rtl' : 'ltr'}>
                                    <ReactMarkdown 
                                      remarkPlugins={[remarkGfm]}
                                      components={markdownComponents}
                                    >
                                      {processContentWithImages(handout.content)}
                                    </ReactMarkdown>
                                  </div>
                                </div>

                                {/* English column */}
                                <div className="border border-border rounded-lg p-4 bg-muted/5">
                                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                                    <span className="text-lg">🇺🇸</span>
                                    <span className="font-semibold text-foreground">English</span>
                                  </div>
                                  <div className="max-w-none">
                                    <ReactMarkdown 
                                      remarkPlugins={[remarkGfm]}
                                      components={markdownComponents}
                                    >
                                      {processContentWithImages(handout.englishContent || '')}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Single column layout for English or non-bilingual */
                              <div className={`max-w-none ${isRTL ? 'rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={markdownComponents}
                                >
                                  {processContentWithImages(handout.content)}
                                </ReactMarkdown>
                              </div>
                            )}
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  </>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No student handouts available for this lesson.</p>
                  </div>
                )}
              </TabsContent>

              {/* Teacher Guide Tab */}
              <TabsContent value="teacher" className="teacher-section mt-0">
                {hasTeacherGuide ? (
                  <>
                    {/* Print button for teacher guide */}
                    <div className="no-print flex justify-end p-4 border-b border-border">
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handlePrintTeacher}
                        className="gap-2 bg-primary hover:bg-primary/90"
                      >
                        <Printer className="h-4 w-4" />
                        Print Teacher Guide
                      </Button>
                    </div>

                    <div className="p-6 md:p-8">
                      <div className="max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {processContentWithImages(lesson.teacher_guide || '')}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No teacher guide available for this lesson.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </article>
        </main>

        {/* Footer - hidden on print */}
        <footer className="no-print border-t border-border py-6 mt-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>RealPath Learning — WCAG 2.1 AA compliant differentiation for every learner</p>
          </div>
        </footer>
      </div>
    </>
  );
}
