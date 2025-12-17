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
import { Copy, Download, Check, ChevronDown, FileText, Users, Save, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from '@/hooks/use-toast';
import { RubricExportOptions, RubricInput, AIProofSettings, VerificationCheckpoints } from '@/types/rubric';
import { AIVulnerabilityAnalysis } from '@/types/vulnerabilityAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RubricOutputProps {
  content: string;
  assessmentTitle?: string;
  autoVerificationAdded?: boolean;
  autoVerificationCount?: number;
  rubricInput?: RubricInput;
  vulnerabilityAnalysis?: AIVulnerabilityAnalysis | null;
}

export function RubricOutput({ 
  content, 
  assessmentTitle = 'rubric',
  autoVerificationAdded,
  autoVerificationCount,
  rubricInput,
  vulnerabilityAnalysis,
}: RubricOutputProps) {
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [exportOptionsOpen, setExportOptionsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<RubricExportOptions['format']>('markdown');
  const [includeComponents, setIncludeComponents] = useState<RubricExportOptions['includeComponents']>({
    studentRubric: true,
    teacherRubric: true,
    verificationChecklist: true,
    processDocumentationTemplate: false,
    qaQuestionBank: false,
  });
  const { user } = useAuth();

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

  const handleSave = async () => {
    if (!rubricInput) {
      toast({
        title: 'Cannot save',
        description: 'Missing rubric input data',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'Cannot save',
        description: 'You must be logged in to save rubrics',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Build verification checkpoints array from the input
      const checkpointsList: string[] = [];
      if (rubricInput.verificationCheckpoints) {
        const cp = rubricInput.verificationCheckpoints;
        if (cp.processLog) checkpointsList.push('process_log');
        if (cp.primaryResearchEvidence) checkpointsList.push('primary_research_evidence');
        if (cp.draftHistory) checkpointsList.push('draft_history');
        if (cp.photoDocumentation) checkpointsList.push('photo_documentation');
        if (cp.liveQA) checkpointsList.push('live_qa');
        if (cp.peerVerification) checkpointsList.push('peer_verification');
      }

      const { error } = await supabase.from('generated_rubrics').insert([{
        assessment_description: rubricInput.assessmentDescription,
        learning_objectives: rubricInput.learningObjectives,
        rubric_content: content,
        num_criteria: rubricInput.numCriteria,
        grade_level: rubricInput.gradeLevel || null,
        ai_vulnerability_score: vulnerabilityAnalysis?.aiVulnerabilityScore || null,
        ai_proof_criteria: vulnerabilityAnalysis ? {
          vulnerabilities: vulnerabilityAnalysis.vulnerabilities,
          strengths: vulnerabilityAnalysis.strengths,
          suggestedEnhancements: vulnerabilityAnalysis.suggestedEnhancements,
        } : null,
        verification_checkpoints: checkpointsList.length > 0 ? checkpointsList : null,
        ai_proof_settings: rubricInput.aiProofSettings ? JSON.parse(JSON.stringify(rubricInput.aiProofSettings)) : null,
        auto_verification_added: autoVerificationAdded || false,
        auto_verification_count: autoVerificationCount || 0,
        user_id: user.id,
      }]);

      if (error) throw error;

      setIsSaved(true);
      toast({
        title: 'Rubric saved!',
        description: 'Your rubric has been saved and can be accessed from My Lessons.',
      });
    } catch (error) {
      console.error('Error saving rubric:', error);
      toast({
        title: 'Error saving rubric',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Auto-verification indicator */}
      {autoVerificationAdded && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm text-foreground">
            <strong>{autoVerificationCount}</strong> authenticity verification criteria auto-added based on vulnerability analysis
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
                {rubricInput && (
                  <Button
                    variant={isSaved ? "secondary" : "default"}
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || isSaved}
                    className="flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : isSaved ? (
                      <>
                        <Check className="h-4 w-4" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Rubric
                      </>
                    )}
                  </Button>
                )}
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
                    Student version excludes: verification guide, red flags section, teacher notes, and authenticity indicators
                  </p>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-display font-bold text-primary mt-6 mb-4 pb-2 border-b border-border">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-display font-semibold text-primary/90 mt-5 mb-3">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-display font-medium text-primary/80 mt-4 mb-2">{children}</h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-base font-semibold text-foreground mt-3 mb-2">{children}</h4>
                ),
                p: ({ children }) => (
                  <p className="text-foreground/90 leading-relaxed mb-3">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1.5 mb-4 ml-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1.5 mb-4 ml-2">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-foreground/90">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-foreground/80">{children}</em>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-4 bg-primary/5 rounded-r-md italic">{children}</blockquote>
                ),
                hr: () => <hr className="my-6 border-border" />,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="w-full border-collapse border border-border rounded-lg">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-muted/50">{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-border">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-2 text-left font-semibold text-foreground border border-border">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-2 text-foreground/90 border border-border">{children}</td>
                ),
                a: ({ href, children }) => (
                  <a href={href} className="text-primary hover:text-primary/80 underline underline-offset-2" target="_blank" rel="noopener noreferrer">{children}</a>
                ),
                code: ({ children }) => (
                  <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto my-4">{children}</pre>
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
