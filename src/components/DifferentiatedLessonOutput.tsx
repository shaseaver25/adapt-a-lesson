import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Copy, Download, Check, ChevronDown, FileText, FolderArchive, Clipboard, BookOpen, GraduationCap, FileIcon, Save, Loader2, Headphones, QrCode, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStudentFriendlyName, getStudentFriendlyIcon, getReadingLevelColor } from '@/lib/readingLevelNames';
import type { StudentGroup } from '@/types/studentGroup';
import {
  exportAsDocx,
  exportAsSeparateDocx,
  exportTeacherGuideDocx,
  exportStudentHandoutsDocx,
} from '@/lib/documentExport';
import { supabase } from '@/integrations/supabase/client';
import { useDifferentiation } from '@/contexts/DifferentiationContext';
import { LessonAudioPlayer } from '@/components/LessonAudioPlayer';
import { analyzeAudioNeeds, anyGroupNeedsAudio } from '@/types/audioRequirements';
import { PrintableAudioQR } from '@/components/PrintableAudioQR';

interface DifferentiatedLessonOutputProps {
  content: string;
  selectedGroups: (StudentGroup & { id: string })[];
  lessonTitle?: string;
  originalContent?: string;
}

export function DifferentiatedLessonOutput({ 
  content, 
  selectedGroups, 
  lessonTitle = 'Lesson',
  originalContent = ''
}: DifferentiatedLessonOutputProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPrintQR, setShowPrintQR] = useState(false);
  const [generatedAudioUrls, setGeneratedAudioUrls] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { options } = useDifferentiation();

  // Save lesson to database
  const handleSaveLesson = async () => {
    if (saved) return;
    
    setSaving(true);
    try {
      // Extract teacher guide section
      const teacherGuide = extractSection('TEACHER GUIDE', 'STUDENT HANDOUTS');
      
      // Build student handouts as JSON
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
      toast({ 
        title: 'Lesson saved!', 
        description: 'Your differentiated lesson has been saved for future access.' 
      });
      
      // Reset saved state after 3 seconds
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

  // Extract content for a specific group from the full content
  const extractGroupContent = (groupName: string): string => {
    const lines = content.split('\n');
    let inGroup = false;
    let groupContent: string[] = [];
    
    for (const line of lines) {
      // Look for group section markers
      if (line.includes(groupName) && (line.includes('Edition') || line.includes('Edición') || line.includes('✨'))) {
        inGroup = true;
        groupContent.push(line);
      } else if (inGroup) {
        // End when we hit the next group or major section
        if ((line.includes('Edition') || line.includes('Edición')) && line.includes('✨') && !line.includes(groupName)) {
          break;
        }
        groupContent.push(line);
      }
    }
    
    return groupContent.join('\n');
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ title: 'Copied to clipboard', description: 'Full lesson plan copied as markdown' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonTitle.replace(/\s+/g, '-').toLowerCase()}-differentiated-all-groups.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Complete lesson plan file' });
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

  const handleDownloadTeacherGuide = () => {
    const teacherContent = extractSection('TEACHER GUIDE', 'STUDENT HANDOUTS');
    const blob = new Blob([teacherContent || content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonTitle.replace(/\s+/g, '-').toLowerCase()}-teacher-guide.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Teacher Guide file' });
  };

  const handleDownloadStudentHandouts = () => {
    const studentContent = extractSection('STUDENT HANDOUTS', 'Cross-Group Teaching Notes');
    const blob = new Blob([studentContent || content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonTitle.replace(/\s+/g, '-').toLowerCase()}-student-handouts.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Student Handouts file' });
  };

  const handleDownloadSeparateFiles = async () => {
    // Parse content to find group sections
    const groupSections: { name: string; content: string }[] = [];
    const lines = content.split('\n');
    let currentGroup = '';
    let currentContent: string[] = [];
    let headerContent: string[] = [];
    let inHeader = true;
    
    for (const line of lines) {
      // Check for group headers (## Group: or ## 📚 Group:)
      const groupMatch = line.match(/^##\s*(?:📚\s*)?Group:\s*(.+)$/);
      if (groupMatch) {
        if (currentGroup) {
          groupSections.push({ name: currentGroup, content: [...headerContent, ...currentContent].join('\n') });
        }
        currentGroup = groupMatch[1].trim();
        currentContent = [line];
        inHeader = false;
      } else if (inHeader) {
        headerContent.push(line);
      } else if (currentGroup) {
        // Check if we hit the cross-group section
        if (line.match(/^##\s*(?:🎯\s*)?Cross-Group/)) {
          groupSections.push({ name: currentGroup, content: [...headerContent, ...currentContent].join('\n') });
          currentGroup = '';
          currentContent = [];
        } else {
          currentContent.push(line);
        }
      }
    }
    
    // Add last group if exists
    if (currentGroup) {
      groupSections.push({ name: currentGroup, content: [...headerContent, ...currentContent].join('\n') });
    }

    if (groupSections.length === 0) {
      // Fallback: download as single file
      handleDownloadMarkdown();
      return;
    }

    // Create zip-like download (multiple sequential downloads)
    for (const section of groupSections) {
      const blob = new Blob([section.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lessonTitle.replace(/\s+/g, '-').toLowerCase()}-${section.name.replace(/\s+/g, '-').toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between downloads
    }
    
    toast({ 
      title: 'Downloaded', 
      description: `${groupSections.length} separate files created` 
    });
  };

  // DOCX export handlers
  const handleExportDocx = async () => {
    try {
      const groups = selectedGroups.map((g) => ({
        id: g.id,
        groupName: g.groupName,
        readingLevelLabel: g.readingLevelLabel,
      }));
      await exportAsDocx(content, lessonTitle, groups);
      toast({ title: 'Downloaded', description: 'Word document (.docx) created' });
    } catch (error) {
      toast({ 
        title: 'Export failed', 
        description: 'Could not generate Word document',
        variant: 'destructive'
      });
    }
  };

  const handleExportSeparateDocx = async () => {
    try {
      const groups = selectedGroups.map((g) => ({
        id: g.id,
        groupName: g.groupName,
        readingLevelLabel: g.readingLevelLabel,
      }));
      await exportAsSeparateDocx(content, lessonTitle, groups);
      toast({ title: 'Downloaded', description: 'ZIP file with separate Word documents created' });
    } catch (error) {
      toast({ 
        title: 'Export failed', 
        description: 'Could not generate separate Word documents',
        variant: 'destructive'
      });
    }
  };

  const handleExportTeacherDocx = async () => {
    try {
      await exportTeacherGuideDocx(content, lessonTitle);
      toast({ title: 'Downloaded', description: 'Teacher Guide Word document created' });
    } catch (error) {
      toast({ 
        title: 'Export failed', 
        description: 'Could not generate Teacher Guide document',
        variant: 'destructive'
      });
    }
  };

  const handleExportStudentDocx = async () => {
    try {
      const groups = selectedGroups.map((g) => ({
        id: g.id,
        groupName: g.groupName,
        readingLevelLabel: g.readingLevelLabel,
      }));
      await exportStudentHandoutsDocx(content, lessonTitle, groups);
      toast({ title: 'Downloaded', description: 'Student Handouts Word document created' });
    } catch (error) {
      toast({ 
        title: 'Export failed', 
        description: 'Could not generate Student Handouts document',
        variant: 'destructive'
      });
    }
  };

  const handleCopyGroupSection = async (groupName: string) => {
    const lines = content.split('\n');
    let inGroup = false;
    let groupContent: string[] = [];
    
    for (const line of lines) {
      const groupMatch = line.match(/^##\s*(?:📚\s*)?Group:\s*(.+)$/);
      if (groupMatch) {
        if (inGroup) break; // End of current group
        if (groupMatch[1].trim() === groupName) {
          inGroup = true;
          groupContent.push(line);
        }
      } else if (inGroup) {
        if (line.match(/^##\s/)) break; // Next section
        groupContent.push(line);
      }
    }
    
    await navigator.clipboard.writeText(groupContent.join('\n'));
    toast({ title: 'Copied', description: `${groupName} section copied to clipboard` });
  };

  // Use centralized reading level colors

  return (
    <div className="space-y-6">
      {/* Header with actions */}
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Word Documents (.docx)
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleExportDocx} className="gap-2">
                    <FileIcon className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Combined Word Document</p>
                      <p className="text-xs text-muted-foreground">All groups with page breaks</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportSeparateDocx} className="gap-2">
                    <FolderArchive className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Separate Word Documents</p>
                      <p className="text-xs text-muted-foreground">ZIP with individual files per group</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportTeacherDocx} className="gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Teacher Guide (.docx)</p>
                      <p className="text-xs text-muted-foreground">Pacing, strategies, assessment tips</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportStudentDocx} className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Student Handouts (.docx)</p>
                      <p className="text-xs text-muted-foreground">Print-ready for distribution</p>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Markdown Files
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleDownloadMarkdown} className="gap-2">
                    <FileText className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Complete Markdown</p>
                      <p className="text-xs text-muted-foreground">Teacher guide + all handouts</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadTeacherGuide} className="gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>Teacher Guide (.md)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadStudentHandouts} className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Student Handouts (.md)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadSeparateFiles} className="gap-2">
                    <FolderArchive className="h-4 w-4" />
                    <span>Separate Markdown Files</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Copy to Clipboard
                  </DropdownMenuLabel>
                  {selectedGroups.map((group) => (
                    <DropdownMenuItem 
                      key={group.id} 
                      onClick={() => handleCopyGroupSection(group.groupName)}
                      className="gap-2"
                    >
                      <Clipboard className="h-4 w-4" />
                      <span className="truncate">Copy: {group.groupName}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Audio Players for groups that need audio support */}
      {anyGroupNeedsAudio(selectedGroups) && (
        <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Headphones className="h-5 w-5 text-accent" />
                Audio Support
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (for Read Aloud accommodations & multilingual students)
                </span>
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPrintQR(!showPrintQR)}
                className="gap-2"
              >
                <QrCode className="h-4 w-4" />
                {showPrintQR ? 'Hide' : 'Show'} Print QR Codes
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Audio Players */}
            <div className="grid gap-4 md:grid-cols-2">
              {selectedGroups
                .filter(group => analyzeAudioNeeds(group).needsAudio)
                .map(group => (
                  <LessonAudioPlayer
                    key={group.id}
                    group={group}
                    lessonContent={content}
                    groupContent={extractGroupContent(group.groupName)}
                    onAudioGenerated={(url) => {
                      setGeneratedAudioUrls(prev => ({
                        ...prev,
                        [group.id]: url
                      }));
                    }}
                  />
                ))
              }
            </div>
            
            {/* Printable QR Codes Section */}
            {showPrintQR && Object.keys(generatedAudioUrls).length > 0 && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    QR Codes for Printed Handouts
                  </h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => window.print()}
                    className="gap-2 print:hidden"
                  >
                    <Printer className="h-4 w-4" />
                    Print QR Codes
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Add these QR codes to printed student handouts. Students can scan to access audio.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedGroups
                    .filter(group => generatedAudioUrls[group.id])
                    .map(group => {
                      const audioNeeds = analyzeAudioNeeds(group);
                      return (
                        <PrintableAudioQR
                          key={group.id}
                          sectionType={`${group.groupName} - Content`}
                          audioUrl={generatedAudioUrls[group.id]}
                          language={group.homeLanguage}
                          size="md"
                        />
                      );
                    })}
                </div>
              </div>
            )}
            
            {showPrintQR && Object.keys(generatedAudioUrls).length === 0 && (
              <div className="border-t pt-6">
                <p className="text-sm text-muted-foreground text-center py-4">
                  Generate audio for student groups above to see QR codes for printing.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <article className="
            differentiated-output
            prose prose-base dark:prose-invert max-w-none
            
            /* Base typography */
            [&]:leading-relaxed [&]:text-foreground
            
            /* Section spacing */
            [&>*]:px-6 [&>*]:py-4
            [&>*:first-child]:pt-6
            [&>*:last-child]:pb-8
            
            /* Headings */
            prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight
            
            /* H1 - Main section headers */
            prose-h1:text-2xl prose-h1:mt-0 prose-h1:mb-6 prose-h1:pb-4
            prose-h1:border-b-2 prose-h1:border-primary/30
            prose-h1:bg-gradient-to-r prose-h1:from-primary/10 prose-h1:via-primary/5 prose-h1:to-transparent
            prose-h1:px-6 prose-h1:py-4 prose-h1:-mx-6 prose-h1:rounded-none
            
            /* H2 - Section dividers with visual break */
            prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3
            prose-h2:border-b prose-h2:border-border
            prose-h2:bg-gradient-to-r prose-h2:from-muted prose-h2:to-transparent
            prose-h2:px-6 prose-h2:py-3 prose-h2:-mx-6 prose-h2:rounded-none
            
            /* H3 - Subsection headers */
            prose-h3:text-lg prose-h3:text-primary prose-h3:mt-8 prose-h3:mb-4
            prose-h3:font-semibold
            
            /* H4 - Minor headers */
            prose-h4:text-base prose-h4:font-semibold prose-h4:mt-6 prose-h4:mb-3
            prose-h4:text-foreground/90
            
            /* Paragraphs */
            prose-p:leading-7 prose-p:mb-4
            
            /* Lists */
            prose-ul:my-4 prose-ul:space-y-2
            prose-ol:my-4 prose-ol:space-y-2
            prose-li:my-1 prose-li:leading-7
            
            /* Tables - Accommodations summary */
            prose-table:my-6 prose-table:w-full
            prose-table:border prose-table:border-border prose-table:rounded-lg prose-table:overflow-hidden
            prose-th:bg-muted prose-th:p-4 prose-th:text-left prose-th:font-semibold prose-th:text-sm
            prose-td:p-4 prose-td:border-t prose-td:border-border prose-td:align-top
            
            /* Pre/Code blocks - for ASCII tables */
            prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border 
            prose-pre:rounded-lg prose-pre:p-4 prose-pre:my-6
            prose-pre:overflow-x-auto prose-pre:text-sm prose-pre:leading-relaxed
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-code:before:content-none prose-code:after:content-none
            
            /* Strong/Bold */
            prose-strong:text-primary prose-strong:font-semibold
            
            /* Blockquotes - for callouts */
            prose-blockquote:border-l-4 prose-blockquote:border-l-primary 
            prose-blockquote:bg-primary/5 prose-blockquote:py-4 prose-blockquote:px-6 
            prose-blockquote:rounded-r-lg prose-blockquote:my-6
            prose-blockquote:not-italic
            
            /* Horizontal rules - group dividers */
            prose-hr:my-10 prose-hr:border-t-2 prose-hr:border-dashed prose-hr:border-primary/30
            
            /* Links */
            prose-a:text-primary prose-a:underline prose-a:underline-offset-2
          ">
            <ReactMarkdown>{content}</ReactMarkdown>
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
