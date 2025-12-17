import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
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

export default function LessonView() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
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
    enabled: !!id,
  });

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

  if (isLoading) {
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

            {/* Markdown content */}
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none 
              prose-headings:font-display prose-headings:text-foreground
              prose-h1:text-2xl prose-h1:border-b prose-h1:border-border prose-h1:pb-3 prose-h1:mb-6 prose-h1:text-primary
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-primary/90
              prose-h3:text-lg prose-h3:text-primary/80
              prose-p:leading-relaxed prose-p:text-foreground/90
              prose-ul:my-3 prose-li:my-1
              prose-strong:text-foreground
              prose-hr:border-border prose-hr:my-8
              prose-table:border-collapse prose-table:w-full
              prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted
              prose-td:border prose-td:border-border prose-td:p-2
            ">
              <ReactMarkdown>{fullContent}</ReactMarkdown>
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
