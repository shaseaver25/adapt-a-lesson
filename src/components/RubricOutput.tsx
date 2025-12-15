import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Copy, Download, Check, ChevronDown, FileText, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from '@/hooks/use-toast';
import { RubricExportOptions } from '@/types/rubric';

interface RubricOutputProps {
  content: string;
  assessmentTitle?: string;
  autoVerificationAdded?: boolean;
  autoVerificationCount?: number;
}

export function RubricOutput({ 
  content, 
  assessmentTitle = 'rubric',
  autoVerificationAdded,
  autoVerificationCount 
}: RubricOutputProps) {
  const [copied, setCopied] = useState(false);
  const [exportOptionsOpen, setExportOptionsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<RubricExportOptions['format']>('markdown');
  const [includeComponents, setIncludeComponents] = useState<RubricExportOptions['includeComponents']>({
    studentRubric: true,
    teacherRubric: true,
    verificationChecklist: true,
    processDocumentationTemplate: false,
    qaQuestionBank: false,
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Rubric copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const generateStudentVersion = (fullContent: string): string => {
    // Remove teacher-only sections
    const lines = fullContent.split('\n');
    const filteredLines: string[] = [];
    let skipSection = false;
    
    for (const line of lines) {
      // Skip verification guide and teacher-only sections
      if (
        line.includes('AUTHENTICITY VERIFICATION GUIDE') ||
        line.includes('For Teacher Use') ||
        line.includes('RED FLAGS') ||
        line.includes('IF RED FLAGS APPEAR')
      ) {
        skipSection = true;
      }
      
      // Resume after section ends (next major heading or separator)
      if (skipSection && (line.startsWith('---') || line.match(/^#{1,2}\s/))) {
        if (!line.includes('AUTHENTICITY') && !line.includes('RED FLAGS')) {
          skipSection = false;
        }
      }
      
      if (!skipSection) {
        filteredLines.push(line);
      }
    }
    
    return filteredLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  };

  const handleDownload = () => {
    let downloadContent = content;
    let filename = `${assessmentTitle.replace(/\s+/g, '-').toLowerCase()}`;
    
    if (includeComponents.studentRubric && !includeComponents.teacherRubric) {
      downloadContent = generateStudentVersion(content);
      filename += '-student';
    } else if (includeComponents.teacherRubric && !includeComponents.studentRubric) {
      filename += '-teacher';
    }
    
    filename += `-rubric.${exportFormat === 'markdown' ? 'md' : exportFormat}`;
    
    const blob = new Blob([downloadContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded!',
      description: `Rubric saved as ${exportFormat.toUpperCase()} file`,
    });
  };

  const updateIncludeComponent = (key: keyof RubricExportOptions['includeComponents'], value: boolean) => {
    setIncludeComponents(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Auto-verification indicator */}
      {autoVerificationAdded && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm text-foreground">
            <strong>{autoVerificationCount}</strong> AI-proof verification criteria auto-added based on vulnerability analysis
          </span>
        </div>
      )}

      <Card className="border-border shadow-medium">
        <CardContent className="p-6">
          {/* Export Options */}
          <Collapsible open={exportOptionsOpen} onOpenChange={setExportOptionsOpen}>
            <div className="flex items-center justify-between mb-4">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Options
                  <ChevronDown className={`h-4 w-4 transition-transform ${exportOptionsOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex items-center gap-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
            
            <CollapsibleContent>
              <Card className="mb-4 border-muted">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Export Settings</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as RubricExportOptions['format'])}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="markdown">Markdown (.md)</SelectItem>
                        <SelectItem value="docx" disabled>Word (.docx) - Coming Soon</SelectItem>
                        <SelectItem value="pdf" disabled>PDF - Coming Soon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Include Components</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="studentRubric"
                          checked={includeComponents.studentRubric}
                          onCheckedChange={(checked) => updateIncludeComponent('studentRubric', !!checked)}
                        />
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="studentRubric" className="text-sm cursor-pointer">
                            Student Rubric
                          </Label>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="teacherRubric"
                          checked={includeComponents.teacherRubric}
                          onCheckedChange={(checked) => updateIncludeComponent('teacherRubric', !!checked)}
                        />
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="teacherRubric" className="text-sm cursor-pointer">
                            Teacher Rubric (with verification guide)
                          </Label>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="verificationChecklist"
                          checked={includeComponents.verificationChecklist}
                          onCheckedChange={(checked) => updateIncludeComponent('verificationChecklist', !!checked)}
                        />
                        <Label htmlFor="verificationChecklist" className="text-sm cursor-pointer">
                          Verification Checklist
                        </Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="processDocumentationTemplate"
                          checked={includeComponents.processDocumentationTemplate}
                          onCheckedChange={(checked) => updateIncludeComponent('processDocumentationTemplate', !!checked)}
                        />
                        <Label htmlFor="processDocumentationTemplate" className="text-sm cursor-pointer">
                          Process Documentation Template
                        </Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="qaQuestionBank"
                          checked={includeComponents.qaQuestionBank}
                          onCheckedChange={(checked) => updateIncludeComponent('qaQuestionBank', !!checked)}
                        />
                        <Label htmlFor="qaQuestionBank" className="text-sm cursor-pointer">
                          Q&A Question Bank
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Student version excludes: verification guide, red flags section, teacher notes, and AI-proof indicators
                  </p>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-border text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-muted">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border border-border px-3 py-2 text-left font-semibold text-foreground">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-3 py-2 text-muted-foreground align-top">
                    {children}
                  </td>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-muted/50">{children}</tr>
                ),
                h1: ({ children }) => (
                  <h1 className="text-2xl font-display font-bold text-foreground mt-6 mb-4">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-display font-bold text-foreground mt-6 mb-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-display font-semibold text-foreground mt-4 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-muted-foreground mb-3 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside text-muted-foreground mb-3 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside text-muted-foreground mb-3 space-y-1">
                    {children}
                  </ol>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                hr: () => (
                  <hr className="my-6 border-border" />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
