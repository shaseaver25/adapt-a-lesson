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
import { Copy, Download, Check, ChevronDown, FileText, FolderArchive, Clipboard, BookOpen, GraduationCap, FileIcon, Save, Loader2, Headphones, QrCode, Printer, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStudentFriendlyName, getStudentFriendlyIcon, getReadingLevelColor } from '@/lib/readingLevelNames';
import type { StudentGroup } from '@/types/studentGroup';
import {
  exportAsDocx,
  exportAsSeparateDocx,
  exportTeacherGuideDocx,
  exportStudentHandoutsDocx,
  exportStudentHandoutsWithAudioDocx,
  type AudioSection,
} from '@/lib/documentExport';
import { supabase } from '@/integrations/supabase/client';
import { useDifferentiation } from '@/contexts/DifferentiationContext';
import { LessonAudioPlayer } from '@/components/LessonAudioPlayer';
import { BilingualVocabularyPlayer } from '@/components/BilingualVocabularyPlayer';
import { BilingualAudioPlayer, type SectionAudio } from '@/components/BilingualAudioPlayer';
import { 
  analyzeAudioNeeds, 
  anyGroupNeedsAudio, 
  anyGroupNeedsBilingualVocabulary,
  extractVocabularyFromContent 
} from '@/types/audioRequirements';
import { PrintableAudioQR, BilingualPrintableAudioQR } from '@/components/PrintableAudioQR';
import { AudioUsageDashboard } from '@/components/AudioUsageDashboard';

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
  content: string;
  selectedGroups: (StudentGroup & { id: string })[];
  lessonTitle?: string;
  originalContent?: string;
  onSaved?: () => void;
  lessonId?: string | null;
  preGeneratedAudio?: PreGeneratedAudioRecord[];
  preGeneratedVocabularyAudio?: PreGeneratedVocabularyAudioRecord[];
  isGeneratingAudio?: boolean;
}

export function DifferentiatedLessonOutput({ 
  content, 
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
  const [showPrintQR, setShowPrintQR] = useState(false);
  const [generatedAudioUrls, setGeneratedAudioUrls] = useState<Record<string, string>>({});
  const [audioSections, setAudioSections] = useState<AudioSection[]>([]);
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
      onSaved?.();
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

  // Get pre-generated audio for a specific group and section type
  const getPreGeneratedAudioForGroup = (groupName: string, sectionType?: string, language?: string) => {
    return preGeneratedAudio.filter(audio => 
      audio.group_name === groupName &&
      (!sectionType || audio.section_type === sectionType) &&
      (!language || audio.language === language)
    );
  };

  // Get all audio URLs for a group (for QR codes)
  const getGroupAudioUrls = (groupName: string): Record<string, string> => {
    const groupAudio = preGeneratedAudio.filter(a => a.group_name === groupName);
    const urls: Record<string, string> = {};
    groupAudio.forEach(audio => {
      urls[`${audio.section_id}-${audio.language}`] = audio.audio_url;
    });
    return urls;
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

  const handleExportStudentWithAudioDocx = async () => {
    if (audioSections.length === 0) {
      toast({ 
        title: 'No audio generated', 
        description: 'Generate audio for student groups first before exporting with audio',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const groups = selectedGroups.map((g) => ({
        id: g.id,
        groupName: g.groupName,
        readingLevelLabel: g.readingLevelLabel,
      }));
      await exportStudentHandoutsWithAudioDocx(content, lessonTitle, groups, audioSections);
      toast({ title: 'Downloaded', description: 'Student Handouts with audio QR codes created' });
    } catch (error) {
      toast({ 
        title: 'Export failed', 
        description: 'Could not generate document with audio',
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
                  {audioSections.length > 0 && (
                    <DropdownMenuItem onClick={handleExportStudentWithAudioDocx} className="gap-2">
                      <Headphones className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Student Handouts with Audio</p>
                        <p className="text-xs text-muted-foreground">Includes QR codes for audio access</p>
                      </div>
                    </DropdownMenuItem>
                  )}
                  
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
                {isGeneratingAudio && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full animate-pulse">
                    Generating...
                  </span>
                )}
                {preGeneratedAudio.length > 0 && !isGeneratingAudio && (
                  <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                    {preGeneratedAudio.length} files ready
                  </span>
                )}
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
            {/* Budget Indicator */}
            <AudioUsageDashboard compact />
            
            {/* Pre-generated Audio Players with Bilingual Support */}
            {preGeneratedAudio.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground">Pre-Generated Audio (Instant Playback)</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedGroups
                    .filter(group => analyzeAudioNeeds(group).needsAudio)
                    .map(group => {
                      const groupAudio = getPreGeneratedAudioForGroup(group.groupName);
                      const hasNonEnglish = group.homeLanguage !== 'English';
                      
                      if (groupAudio.length === 0) return null;
                      
                      // Group audio by section type
                      const sectionTypes = [...new Set(groupAudio.map(a => a.section_type))];
                      
                      return (
                        <div key={group.id} className="p-4 rounded-lg border bg-card space-y-3">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="secondary" className="text-xs">
                              {getStudentFriendlyIcon(group.readingLevelLabel)} {group.groupName}
                            </Badge>
                            {hasNonEnglish && (
                              <Badge variant="outline" className="text-xs">
                                Bilingual: EN + {group.homeLanguage}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Bilingual Audio Players for each section */}
                          <div className="space-y-3">
                            {sectionTypes.slice(0, 4).map(sectionType => {
                              const englishAudio = groupAudio.find(
                                a => a.section_type === sectionType && a.language === 'English'
                              );
                              const homeLanguageAudio = groupAudio.find(
                                a => a.section_type === sectionType && a.language !== 'English'
                              );
                              
                              const bilingualAudio: SectionAudio = {
                                english: englishAudio ? {
                                  url: englishAudio.audio_url,
                                  duration: englishAudio.duration_seconds,
                                } : null,
                                homeLanguage: homeLanguageAudio ? {
                                  language: homeLanguageAudio.language,
                                  url: homeLanguageAudio.audio_url,
                                  duration: homeLanguageAudio.duration_seconds,
                                } : null,
                              };
                              
                              return (
                                <div key={sectionType} className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground capitalize">
                                    {sectionType.replace(/-/g, ' ')}
                                  </p>
                                  <BilingualAudioPlayer 
                                    audio={bilingualAudio}
                                    sectionType={sectionType}
                                    compact
                                  />
                                </div>
                              );
                            })}
                            {sectionTypes.length > 4 && (
                              <p className="text-xs text-muted-foreground">+ {sectionTypes.length - 4} more sections available</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            
            {/* On-demand Audio Players (fallback when no pre-generated audio) */}
            {preGeneratedAudio.length === 0 && !isGeneratingAudio && (
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
                        // Store full audio section info for export
                        setAudioSections(prev => {
                          const filtered = prev.filter(a => a.groupId !== group.id);
                          return [...filtered, {
                            groupId: group.id,
                            groupName: group.groupName,
                            audioUrl: url,
                            language: group.homeLanguage
                          }];
                        });
                      }}
                    />
                  ))
                }
              </div>
            )}
            
            {/* Loading indicator */}
            {isGeneratingAudio && preGeneratedAudio.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-3">
                  <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Generating bilingual audio files...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This may take 1-2 minutes for multiple groups
                  </p>
                </div>
              </div>
            )}
            
            {/* Bilingual Vocabulary Section for ELL Students */}
            {anyGroupNeedsBilingualVocabulary(selectedGroups) && (
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-accent" />
                  Bilingual Vocabulary Audio
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    (Hear terms in English and home language)
                  </span>
                </h4>
                <div className="grid gap-6 md:grid-cols-2">
                  {selectedGroups
                    .filter(group => analyzeAudioNeeds(group).needsBilingualVocabulary)
                    .map(group => {
                      const vocabulary = extractVocabularyFromContent(
                        extractGroupContent(group.groupName),
                        group.homeLanguage
                      );
                      if (vocabulary.length === 0) return null;
                      return (
                        <BilingualVocabularyPlayer
                          key={group.id}
                          vocabulary={vocabulary}
                          groupName={group.groupName}
                        />
                      );
                    })}
                </div>
              </div>
            )}
            
            {/* Printable QR Codes Section */}
            {showPrintQR && (preGeneratedAudio.length > 0 || Object.keys(generatedAudioUrls).length > 0) && (
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
                <div className="space-y-6">
                  {selectedGroups.map(group => {
                    // Get pre-generated audio for this group
                    const groupAudio = preGeneratedAudio.filter(a => a.group_name === group.groupName);
                    const hasBilingual = group.homeLanguage && group.homeLanguage !== 'English';
                    
                    // Group audio by section type
                    const sectionTypes = [...new Set(groupAudio.map(a => a.section_type))];
                    
                    // Fall back to old generatedAudioUrls if no pre-generated audio
                    const fallbackAudioUrl = generatedAudioUrls[group.id];
                    
                    if (groupAudio.length === 0 && !fallbackAudioUrl) return null;
                    
                    return (
                      <div key={group.id} className="space-y-3">
                        <h5 className="font-medium text-sm flex items-center gap-2">
                          <span>{getStudentFriendlyIcon(group.readingLevelLabel)}</span>
                          {group.groupName}
                          {hasBilingual && (
                            <Badge variant="outline" className="text-xs">
                              {group.homeLanguage}
                            </Badge>
                          )}
                        </h5>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {groupAudio.length > 0 ? (
                            // Use pre-generated audio - group by section type and show bilingual QR codes
                            sectionTypes.map(sectionType => {
                              const englishAudio = groupAudio.find(a => a.section_type === sectionType && a.language === 'English');
                              const homeLanguageAudio = groupAudio.find(a => a.section_type === sectionType && a.language === group.homeLanguage);
                              
                              if (hasBilingual && (englishAudio || homeLanguageAudio)) {
                                return (
                                  <BilingualPrintableAudioQR
                                    key={`${group.id}-${sectionType}`}
                                    sectionType={sectionType}
                                    englishAudioUrl={englishAudio?.audio_url}
                                    homeLanguageAudioUrl={homeLanguageAudio?.audio_url}
                                    homeLanguage={group.homeLanguage}
                                    size="sm"
                                  />
                                );
                              } else if (englishAudio) {
                                return (
                                  <PrintableAudioQR
                                    key={`${group.id}-${sectionType}`}
                                    sectionType={sectionType}
                                    audioUrl={englishAudio.audio_url}
                                    language="English"
                                    size="md"
                                  />
                                );
                              }
                              return null;
                            })
                          ) : (
                            // Fall back to old on-demand audio
                            <PrintableAudioQR
                              sectionType={`${group.groupName} - Content`}
                              audioUrl={fallbackAudioUrl}
                              language={group.homeLanguage}
                              size="md"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {showPrintQR && preGeneratedAudio.length === 0 && Object.keys(generatedAudioUrls).length === 0 && (
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
