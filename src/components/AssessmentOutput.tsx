import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Copy, Download, Check, RotateCcw, Save, FileText, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAssessmentPIICheck } from '@/hooks/compliance/useAssessmentPIICheck';
import { PIIWarningModal } from '@/components/compliance/PIIWarningModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AssessmentInput } from '@/hooks/useAssessmentGenerator';
import type { Components } from 'react-markdown';

interface AssessmentOutputProps {
  content: string;
  lessonTitle: string;
  assessmentInput?: AssessmentInput | null;
  onReset?: () => void;
}

export function AssessmentOutput({ content, lessonTitle, assessmentInput, onReset }: AssessmentOutputProps) {
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkAssessmentFields, modalState, handleEdit, handleOverride, isChecking } = useAssessmentPIICheck();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Announce status changes to screen readers
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setStatusMessage('Assessment copied to clipboard');
    toast({
      title: 'Copied to clipboard',
      description: 'The assessment has been copied.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const generateFileName = (extension: string) => {
    const title = assessmentInput?.lessonContext?.title || lessonTitle || 'assessment';
    return `${title.replace(/\s+/g, '-').toLowerCase()}-assessment.${extension}`;
  };

  const handleDownloadHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${assessmentInput?.lessonContext?.title || 'Assessment'}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #2A1E17; }
    h1, h2, h3 { color: #166534; }
    h1 { font-size: 1.75rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
    th { background-color: #f8f9fa; }
    ul, ol { padding-left: 1.5rem; }
    blockquote { border-left: 4px solid #166534; margin: 1rem 0; padding-left: 1rem; color: #555; }
    a:focus { outline: 2px solid #D97706; outline-offset: 2px; }
    @media print {
      body { max-width: 100%; padding: 1rem; }
      a[href]:after { content: " (" attr(href) ")"; }
    }
  </style>
</head>
<body>
  <main role="main">
    <article>
      ${content.replace(/^# /gm, '<h1>').replace(/^## /gm, '<h2>').replace(/^### /gm, '<h3>').replace(/\n/g, '<br>')}
    </article>
  </main>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    downloadBlob(blob, generateFileName('html'));
    setStatusMessage('Assessment downloaded as HTML file');
    toast({
      title: 'Downloaded',
      description: 'Your assessment has been saved as an HTML file.',
    });
  };

  const handleDownloadWord = () => {
    const wordContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' lang="en">
<head>
  <meta charset="UTF-8">
  <title>${assessmentInput?.lessonContext?.title || 'Assessment'}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; color: #2A1E17; }
    h1 { font-size: 18pt; color: #166534; }
    h2 { font-size: 14pt; color: #166534; }
    h3 { font-size: 12pt; color: #166534; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #000; padding: 6pt; }
    th { background-color: #f0f0f0; }
  </style>
</head>
<body>
<main role="main">
<article>
${content.replace(/^# (.*$)/gm, '<h1>$1</h1>')
  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
  .replace(/^\* (.*$)/gm, '<li>$1</li>')
  .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
  .replace(/\n\n/g, '</p><p>')
  .replace(/\n/g, '<br>')}
</article>
</main>
</body>
</html>`;
    
    const blob = new Blob([wordContent], { type: 'application/msword' });
    downloadBlob(blob, generateFileName('doc'));
    setStatusMessage('Assessment downloaded as Word document');
    toast({
      title: 'Downloaded',
      description: 'Your assessment has been saved as a Word document.',
    });
  };

  const handleDownloadGoogleDoc = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${assessmentInput?.lessonContext?.title || 'Assessment'}</title>
</head>
<body>
<main role="main">
<article>
${content.replace(/^# (.*$)/gm, '<h1>$1</h1>')
  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
  .replace(/^\* (.*$)/gm, '<li>$1</li>')
  .replace(/\n\n/g, '</p><p>')}
</article>
</main>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    downloadBlob(blob, generateFileName('html'));
    setStatusMessage('Assessment downloaded for Google Docs. Upload to Google Drive to convert.');
    toast({
      title: 'Downloaded for Google Docs',
      description: 'Upload this HTML file to Google Drive and open with Google Docs to convert.',
    });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStartOver = () => {
    if (onReset) {
      onReset();
    }
    navigate('/studio?tab=assessment');
  };

  const handleSaveAssessment = async () => {
    if (!user) {
      setStatusMessage('Login required to save assessments');
      toast({
        title: 'Login required',
        description: 'Please log in to save assessments.',
        variant: 'destructive',
      });
      return;
    }

    // Check for PII before saving if we have the input context
    if (assessmentInput?.lessonContext && assessmentInput?.localContext) {
      const { proceed } = await checkAssessmentFields({
        lessonContext: assessmentInput.lessonContext,
        localContext: assessmentInput.localContext,
      });
      
      if (!proceed) return;
    }

    setIsSaving(true);
    setStatusMessage('Saving assessment...');
    try {
      const title = assessmentInput?.lessonContext?.title || lessonTitle || 'Untitled Assessment';
      const fileName = `${user.id}/${Date.now()}-${title.replace(/\s+/g, '-').toLowerCase()}.md`;

      const { error: storageError } = await supabase.storage
        .from('assessments')
        .upload(fileName, content, {
          contentType: 'text/markdown',
        });

      if (storageError) {
        throw storageError;
      }

      const { error: dbError } = await supabase
        .from('generated_assessments')
        .insert({
          user_id: user.id,
          title,
          assessment_content: content,
          lesson_title: assessmentInput?.lessonContext?.title || null,
          subject: assessmentInput?.lessonContext?.subject || null,
          grade_level: assessmentInput?.lessonContext?.gradeLevel || null,
          learning_objectives: assessmentInput?.lessonContext?.objectives?.filter(o => o.trim()) || [],
          method_category: assessmentInput?.selectedCategory || null,
          method_name: assessmentInput?.selectedMethod || null,
          method_outputs: assessmentInput?.methodDetails?.outputs || null,
          school_name: assessmentInput?.localContext?.schoolName || null,
          city: assessmentInput?.localContext?.city || null,
          state: assessmentInput?.localContext?.state || null,
          local_context_details: assessmentInput?.localContext?.details || null,
          storage_path: fileName,
        });

      if (dbError) {
        throw dbError;
      }

      setStatusMessage('Assessment saved successfully');
      toast({
        title: 'Assessment saved',
        description: 'Your assessment has been saved to My Assessments.',
      });
    } catch (error) {
      console.error('Error saving assessment:', error);
      setStatusMessage('Error saving assessment. Please try again.');
      toast({
        title: 'Error saving assessment',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Skip link handler
  const skipToContent = () => {
    mainContentRef.current?.focus();
  };

  // Accessible custom components for ReactMarkdown
  const markdownComponents: Components = {
    h1: ({ children, ...props }) => (
      <h1 className="text-2xl font-bold text-primary mb-4 mt-6 first:mt-0" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-xl font-semibold text-primary mb-3 mt-5" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-lg font-medium text-primary mb-2 mt-4" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="text-base font-medium text-foreground mb-2 mt-3" {...props}>
        {children}
      </h4>
    ),
    p: ({ children, ...props }) => (
      <p className="text-foreground mb-3 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="list-disc list-outside ml-6 mb-4 space-y-1 text-foreground" role="list" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal list-outside ml-6 mb-4 space-y-1 text-foreground" role="list" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="text-foreground" {...props}>
        {children}
      </li>
    ),
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto mb-4" role="region" aria-label="Data table">
        <table className="w-full border-collapse border border-border" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-muted" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th className="border border-border px-4 py-2 text-left font-semibold text-foreground" scope="col" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border border-border px-4 py-2 text-foreground" {...props}>
        {children}
      </td>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote 
        className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground" 
        role="note"
        {...props}
      >
        {children}
      </blockquote>
    ),
    a: ({ href, children, ...props }) => (
      <a 
        href={href} 
        className="text-primary underline hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
        {href?.startsWith('http') && (
          <span className="sr-only"> (opens in new tab)</span>
        )}
      </a>
    ),
    img: ({ src, alt, ...props }) => (
      <figure className="my-4">
        <img 
          src={src} 
          alt={alt || 'Assessment image'} 
          className="max-w-full h-auto rounded-lg border border-border"
          {...props}
        />
        {alt && (
          <figcaption className="text-sm text-muted-foreground mt-2 italic">
            {alt}
          </figcaption>
        )}
      </figure>
    ),
    code: ({ children, className, ...props }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
            {children}
          </code>
        );
      }
      return (
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
          <code className="text-sm font-mono" {...props}>
            {children}
          </code>
        </pre>
      );
    },
    hr: (props) => (
      <hr className="my-6 border-t border-border" role="separator" {...props} />
    ),
  };

  const assessmentTitle = assessmentInput?.lessonContext?.title || lessonTitle || 'Assessment';

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Skip link for keyboard navigation */}
      <a
        href="#assessment-content"
        onClick={(e) => {
          e.preventDefault();
          skipToContent();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-card focus:p-4 focus:shadow-lg focus:rounded-lg focus:text-foreground focus:outline-2 focus:outline-primary"
      >
        Skip to assessment content
      </a>

      {/* Screen reader status announcements */}
      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      {/* Header with title */}
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-primary" id="assessment-title">
          {assessmentTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          Generated assessment ready for review and download
        </p>
      </header>

      {/* Action buttons - toolbar */}
      <nav 
        className="flex flex-wrap gap-3 justify-between items-center border-b border-border pb-4"
        aria-label="Assessment actions"
      >
        <div className="flex gap-3" role="group" aria-label="Primary actions">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopy}
            aria-pressed={copied}
            aria-label={copied ? 'Assessment copied to clipboard' : 'Copy assessment to clipboard'}
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                <span>Copy</span>
              </>
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="secondary" 
                size="sm"
                aria-haspopup="menu"
                aria-label="Download assessment - choose format"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Download</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover">
              <DropdownMenuItem onClick={handleDownloadWord}>
                <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                <span>Microsoft Word (.doc)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadGoogleDoc}>
                <Globe className="h-4 w-4 mr-2" aria-hidden="true" />
                <span>Google Docs (HTML)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadHTML}>
                <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                <span>HTML File</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSaveAssessment}
            disabled={isSaving || isChecking}
            className="bg-primary hover:bg-primary/90"
            aria-busy={isSaving || isChecking}
            aria-label={isSaving || isChecking ? 'Saving assessment...' : 'Save assessment to My Assessments'}
          >
            {isSaving || isChecking ? (
              <>
                <span className="animate-spin" aria-hidden="true">⏳</span>
                <span>{isChecking ? 'Checking...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden="true" />
                <span>Save Assessment</span>
              </>
            )}
          </Button>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleStartOver}
          aria-label="Start a new assessment"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Start New Assessment</span>
        </Button>
      </nav>

      {/* Main content area */}
      <main 
        id="assessment-content"
        ref={mainContentRef}
        tabIndex={-1}
        className="focus:outline-none"
        aria-labelledby="assessment-title"
      >
        <article className="prose-lesson bg-card border border-border rounded-xl p-6 shadow-soft max-h-[calc(100vh-20rem)] overflow-y-auto">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </article>
      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          .prose-lesson {
            max-height: none !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          nav[aria-label="Assessment actions"],
          a[href="#assessment-content"] {
            display: none !important;
          }
          article {
            page-break-inside: auto;
          }
          h1, h2, h3, h4 {
            page-break-after: avoid;
          }
          table, figure {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* PII Warning Modal */}
      <PIIWarningModal
        open={modalState.open}
        riskLevel={modalState.riskLevel}
        findings={modalState.findings}
        onEdit={handleEdit}
        onOverride={handleOverride}
      />
    </div>
  );
}
