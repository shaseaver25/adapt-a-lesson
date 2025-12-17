import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Copy, Download, Check, RotateCcw, Save, FileText, Globe } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AssessmentInput } from '@/hooks/useAssessmentGenerator';

interface AssessmentOutputProps {
  content: string;
  lessonTitle: string;
  assessmentInput?: AssessmentInput | null;
  onReset?: () => void;
}

export function AssessmentOutput({ content, lessonTitle, assessmentInput, onReset }: AssessmentOutputProps) {
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
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
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1, h2, h3 { color: #166534; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
    th { background-color: #f8f9fa; }
    ul, ol { padding-left: 1.5rem; }
    blockquote { border-left: 4px solid #166534; margin: 1rem 0; padding-left: 1rem; color: #555; }
  </style>
</head>
<body>
  ${content.replace(/^# /gm, '<h1>').replace(/^## /gm, '<h2>').replace(/^### /gm, '<h3>').replace(/\n/g, '<br>')}
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    downloadBlob(blob, generateFileName('html'));
    toast({
      title: 'Downloaded',
      description: 'Your assessment has been saved as an HTML file.',
    });
  };

  const handleDownloadWord = () => {
    // Create a simple Word-compatible HTML document
    const wordContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
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
    body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; }
    h1 { font-size: 18pt; color: #166534; }
    h2 { font-size: 14pt; color: #166534; }
    h3 { font-size: 12pt; color: #166534; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #000; padding: 6pt; }
    th { background-color: #f0f0f0; }
  </style>
</head>
<body>
${content.replace(/^# (.*$)/gm, '<h1>$1</h1>')
  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
  .replace(/^\* (.*$)/gm, '<li>$1</li>')
  .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
  .replace(/\n\n/g, '</p><p>')
  .replace(/\n/g, '<br>')}
</body>
</html>`;
    
    const blob = new Blob([wordContent], { type: 'application/msword' });
    downloadBlob(blob, generateFileName('doc'));
    toast({
      title: 'Downloaded',
      description: 'Your assessment has been saved as a Word document.',
    });
  };

  const handleDownloadGoogleDoc = () => {
    // For Google Docs, we create an HTML file that can be imported
    // Users can then upload to Google Drive and convert
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${assessmentInput?.lessonContext?.title || 'Assessment'}</title>
</head>
<body>
${content.replace(/^# (.*$)/gm, '<h1>$1</h1>')
  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
  .replace(/^\* (.*$)/gm, '<li>$1</li>')
  .replace(/\n\n/g, '</p><p>')}
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    downloadBlob(blob, generateFileName('html'));
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
      toast({
        title: 'Login required',
        description: 'Please log in to save assessments.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const title = assessmentInput?.lessonContext?.title || lessonTitle || 'Untitled Assessment';
      const fileName = `${user.id}/${Date.now()}-${title.replace(/\s+/g, '-').toLowerCase()}.md`;

      // Upload to storage
      const { error: storageError } = await supabase.storage
        .from('assessments')
        .upload(fileName, content, {
          contentType: 'text/markdown',
        });

      if (storageError) {
        throw storageError;
      }

      // Save metadata to database
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

      toast({
        title: 'Assessment saved',
        description: 'Your assessment has been saved to My Assessments.',
      });
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        title: 'Error saving assessment',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleDownloadWord}>
                <FileText className="h-4 w-4 mr-2" />
                Microsoft Word (.doc)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadGoogleDoc}>
                <Globe className="h-4 w-4 mr-2" />
                Google Docs (HTML)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadHTML}>
                <FileText className="h-4 w-4 mr-2" />
                HTML File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSaveAssessment}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Assessment'}
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={handleStartOver}>
          <RotateCcw className="h-4 w-4" />
          Start New Assessment
        </Button>
      </div>

      {/* Rendered content */}
      <div className="prose-lesson bg-card border border-border rounded-xl p-6 shadow-soft max-h-[calc(100vh-16rem)] overflow-y-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
