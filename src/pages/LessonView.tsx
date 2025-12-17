import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LessonImageFrame from '@/components/LessonImageFrame';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Printer, 
  Copy, 
  Download, 
  Loader2, 
  Calendar, 
  Users,
  FileText,
  CheckCircle
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
    // CRITICAL: Wait for auth AND require user to be logged in
    enabled: !!id && !authLoading && !!user,
    retry: false,  // Don't retry on auth failures
  });

  // Debug logging
  console.log('=== LessonView Debug ===');
  console.log('URL id param:', id);
  console.log('Auth loading:', authLoading);
  console.log('User:', user?.id || 'No user');
  console.log('Query enabled:', !!id && !authLoading && !!user);
  console.log('Query isLoading:', isLoading);
  console.log('Query error:', error);
  console.log('Query data:', lesson);
  console.log('========================');

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

  const fullContent = getFullContent(lesson);

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
          }
          h1 { font-size: 18pt; page-break-after: avoid; }
          h2 { font-size: 14pt; page-break-after: avoid; }
          h3 { font-size: 12pt; page-break-after: avoid; }
          hr { page-break-after: always; }
        }
      `}</style>

      <div className="min-h-screen bg-background">
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
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handlePrint}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Lesson Content */}
        <main className="container mx-auto px-4 py-8">
          <article className="lesson-content max-w-4xl mx-auto bg-card border border-border rounded-xl p-6 md:p-10 shadow-sm">
            {/* Differentiation options badges - hidden on print */}
            {lesson.differentiation_options && (
              <div className="no-print flex flex-wrap gap-2 mb-6 pb-6 border-b border-border">
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

            {/* Markdown content with custom components */}
            <div className="max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {fullContent}
              </ReactMarkdown>
            </div>
          </article>
        </main>

        {/* Footer - hidden on print */}
        <footer className="no-print border-t border-border py-6 mt-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>Let's Get REAL — Responsive. Equitable. Adaptive. Learner.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
