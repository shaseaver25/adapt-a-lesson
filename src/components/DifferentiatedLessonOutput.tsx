import { useState, useCallback, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, Check, ChevronDown, FileText, FolderArchive, Clipboard, BookOpen, GraduationCap, FileIcon, Save, Loader2, Headphones, QrCode, Printer, Volume2, Languages, AlertCircle, LayoutTemplate } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStudentFriendlyName, getStudentFriendlyIcon, getReadingLevelColor } from '@/lib/readingLevelNames';
import { OUTPUT_SECTION_DESCRIPTIONS } from '@/lib/tooltipDescriptions';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import type { StudentGroup } from '@/types/studentGroup';
import {
  exportAsDocx,
  exportAsSeparateDocx,
  exportTeacherGuideDocx,
  exportStudentHandoutsDocx,
  exportStudentHandoutsWithAudioDocx,
  exportBilingualHandoutDocx,
  type AudioSection,
  type BilingualSection,
  type ExtendedStudentGroupInfo,
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
import { AudioGenerationButton } from '@/components/AudioGenerationButton';
import { BilingualSideBySideLayout, parseBilingualSections } from '@/components/BilingualSideBySideLayout';

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
      // Build extended group info with audio and language data
      // Export works with or without audio - shows placeholder if audio not ready
      const groups = selectedGroups.map((g) => {
        // Get pre-generated audio for this group (may be empty)
        const groupAudio = preGeneratedAudio.filter(a => a.group_name === g.groupName);
        
        return {
          id: g.id,
          groupName: g.groupName,
          readingLevelLabel: g.readingLevelLabel,
          homeLanguage: g.homeLanguage,
          accommodations: g.accommodations,
          preGeneratedAudio: groupAudio.map(a => ({
            section_type: a.section_type,
            section_id: a.section_id,
            audio_url: a.audio_url,
            language: a.language,
          })),
        };
      });
      await exportStudentHandoutsDocx(content, lessonTitle, groups);
      
      const hasAudio = preGeneratedAudio.length > 0;
      toast({ 
        title: 'Downloaded', 
        description: hasAudio 
          ? 'Student Handouts with QR codes created (landscape)' 
          : 'Student Handouts created - use "Generate Audio" to add QR codes'
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({ 
        title: 'Export failed', 
        description: 'Could not generate Student Handouts document',
        variant: 'destructive'
      });
    }
  };
  
  // Callback when audio generation completes
  const handleAudioGenerated = useCallback(async () => {
    // Refresh audio data from database
    if (lessonId) {
      try {
        const { data: audioData } = await supabase
          .from('generated_audio')
          .select('*')
          .eq('lesson_id', lessonId);
        
        // Note: We can't directly set preGeneratedAudio since it's a prop
        // The parent component should refresh on save/generate
        toast({
          title: 'Audio ready',
          description: 'You can now export handouts with QR codes',
        });
      } catch (e) {
        console.error('Error refreshing audio:', e);
      }
    }
  }, [lessonId, toast]);

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

  // Export bilingual handout for non-English groups with proper side-by-side layout
  const handleExportBilingualDocx = async (group: StudentGroup & { id: string }) => {
    try {
      const groupContent = extractGroupContent(group.groupName);
      const groupAudio = preGeneratedAudio.filter(a => a.group_name === group.groupName);
      
      // Parse content into sections - look for bilingual markers or section headers
      const sections: BilingualSection[] = [];
      const sectionPatterns = [
        { type: 'learning-target', label: '🎯 Learning Target / Objetivo de Aprendizaje', pattern: /(?:learning target|objetivo|目標|học mục tiêu)/i },
        { type: 'instructions', label: '📋 Instructions / Instrucciones', pattern: /(?:instructions|instrucciones|指示|hướng dẫn)/i },
        { type: 'vocabulary', label: '📚 Vocabulary / Vocabulario', pattern: /(?:vocabulary|vocabulario|词汇|từ vựng)/i },
        { type: 'content', label: '📖 Content / Contenido', pattern: /(?:content|contenido|内容|nội dung|reading|lectura)/i },
        { type: 'practice', label: '✏️ Practice / Práctica', pattern: /(?:practice|práctica|练习|thực hành)/i },
        { type: 'reflection', label: '💭 Reflection / Reflexión', pattern: /(?:reflection|reflexión|反思|suy ngẫm)/i },
      ];
      
      // Try to find English and home language content blocks
      // The differentiated content should have both if properly generated
      const lines = groupContent.split('\n');
      let currentSection = { type: 'content', label: '📖 Content' };
      let englishBuffer: string[] = [];
      let homeLanguageBuffer: string[] = [];
      let isHomeLanguageBlock = false;
      
      for (const line of lines) {
        // Check for language markers
        if (line.includes(`(${group.homeLanguage})`) || line.includes(`[${group.homeLanguage}]`)) {
          isHomeLanguageBlock = true;
        } else if (line.includes('(English)') || line.includes('[English]')) {
          isHomeLanguageBlock = false;
        }
        
        const matched = sectionPatterns.find(p => p.pattern.test(line));
        if (matched && (englishBuffer.length > 0 || homeLanguageBuffer.length > 0)) {
          // Get audio for this section
          const engAudio = groupAudio.find(a => a.section_type === currentSection.type && a.language === 'English');
          const homeAudio = groupAudio.find(a => a.section_type === currentSection.type && a.language === group.homeLanguage);
          
          // If we only have content in one language, use it for both with translation note
          const engContent = englishBuffer.length > 0 ? englishBuffer.join('\n') : homeLanguageBuffer.join('\n');
          const homeContent = homeLanguageBuffer.length > 0 ? homeLanguageBuffer.join('\n') : englishBuffer.join('\n');
          
          if (engContent.trim() || homeContent.trim()) {
            sections.push({
              sectionType: currentSection.type,
              sectionLabel: currentSection.label,
              englishContent: engContent,
              homeLanguageContent: homeContent,
              englishAudioUrl: engAudio?.audio_url,
              homeLanguageAudioUrl: homeAudio?.audio_url,
            });
          }
          englishBuffer = [];
          homeLanguageBuffer = [];
        }
        
        if (matched) {
          currentSection = matched;
        }
        
        // Add line to appropriate buffer
        if (isHomeLanguageBlock) {
          homeLanguageBuffer.push(line);
        } else {
          englishBuffer.push(line);
        }
      }
      
      // Add final section
      if (englishBuffer.length > 0 || homeLanguageBuffer.length > 0) {
        const engAudio = groupAudio.find(a => a.section_type === currentSection.type && a.language === 'English');
        const homeAudio = groupAudio.find(a => a.section_type === currentSection.type && a.language === group.homeLanguage);
        
        const engContent = englishBuffer.length > 0 ? englishBuffer.join('\n') : homeLanguageBuffer.join('\n');
        const homeContent = homeLanguageBuffer.length > 0 ? homeLanguageBuffer.join('\n') : englishBuffer.join('\n');
        
        if (engContent.trim() || homeContent.trim()) {
          sections.push({
            sectionType: currentSection.type,
            sectionLabel: currentSection.label,
            englishContent: engContent,
            homeLanguageContent: homeContent,
            englishAudioUrl: engAudio?.audio_url,
            homeLanguageAudioUrl: homeAudio?.audio_url,
          });
        }
      }
      
      // If no sections were parsed properly, create a single section with all content
      if (sections.length === 0) {
        sections.push({
          sectionType: 'content',
          sectionLabel: '📖 Lesson Content',
          englishContent: groupContent,
          homeLanguageContent: groupContent, // Same content - translation should be embedded
          englishAudioUrl: groupAudio.find(a => a.language === 'English')?.audio_url,
          homeLanguageAudioUrl: groupAudio.find(a => a.language === group.homeLanguage)?.audio_url,
        });
      }
      
      await exportBilingualHandoutDocx(sections, {
        homeLanguage: group.homeLanguage,
        groupName: group.groupName,
        readingLevel: getStudentFriendlyName(group.readingLevelLabel),
      }, lessonTitle);
      
      const hasAudio = groupAudio.length > 0;
      toast({ 
        title: 'Downloaded', 
        description: hasAudio 
          ? `Bilingual handout for ${group.groupName} with QR codes created (landscape)`
          : `Bilingual handout for ${group.groupName} created - generate audio to add QR codes`
      });
    } catch (error) {
      console.error('Bilingual export error:', error);
      toast({ 
        title: 'Export failed', 
        description: 'Could not generate bilingual document',
        variant: 'destructive'
      });
    }
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
              
              {/* Primary Export Button - Downloads immediately without audio */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download DOCX
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-center gap-2">
                    <FileIcon className="h-3 w-3" />
                    Word Documents (.docx) - Instant Download
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleExportDocx} className="gap-2">
                    <FileIcon className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Combined Document</p>
                      <p className="text-xs text-muted-foreground">All groups with page breaks</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportSeparateDocx} className="gap-2">
                    <FolderArchive className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Separate Documents (ZIP)</p>
                      <p className="text-xs text-muted-foreground">Individual files per group</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportTeacherDocx} className="gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>Teacher Guide Only</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportStudentDocx} className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Student Handouts (Landscape)</p>
                      <p className="text-xs text-muted-foreground">
                        {preGeneratedAudio.length > 0 ? 'Includes QR codes' : 'Without QR codes'}
                      </p>
                    </div>
                  </DropdownMenuItem>
                  
                  {/* Bilingual Export Options */}
                  {selectedGroups.some(g => g.homeLanguage && g.homeLanguage !== 'English') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-center gap-2">
                        <Languages className="h-3 w-3" />
                        Bilingual Side-by-Side (Landscape)
                      </DropdownMenuLabel>
                      {selectedGroups
                        .filter(g => g.homeLanguage && g.homeLanguage !== 'English')
                        .map((group) => (
                          <DropdownMenuItem 
                            key={`bilingual-${group.id}`}
                            onClick={() => handleExportBilingualDocx(group)}
                            className="gap-2"
                          >
                            <Languages className="h-4 w-4" />
                            <div>
                              <p className="font-medium">{group.groupName}</p>
                              <p className="text-xs text-muted-foreground">
                                {group.homeLanguage} ↔ English • {preGeneratedAudio.length > 0 ? 'With' : 'Without'} QR
                              </p>
                            </div>
                          </DropdownMenuItem>
                        ))}
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Markdown Files
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleDownloadMarkdown} className="gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Complete Markdown</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadSeparateFiles} className="gap-2">
                    <FolderArchive className="h-4 w-4" />
                    <span>Separate Markdown Files</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
          
          {/* Audio Generation Section - Prominent placement */}
          {anyGroupNeedsAudio(selectedGroups) && (
            <div className="p-4 rounded-lg border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${preGeneratedAudio.length > 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
                    <Headphones className={`h-5 w-5 ${preGeneratedAudio.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {preGeneratedAudio.length > 0 
                        ? `✓ Audio Ready (${preGeneratedAudio.length} files)` 
                        : '🔊 Audio Support Available'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {preGeneratedAudio.length > 0 
                        ? 'QR codes will be included in exported documents' 
                        : 'Generate audio to add QR codes to printed handouts'}
                    </p>
                  </div>
                </div>
                
                {preGeneratedAudio.length === 0 && !isGeneratingAudio && (
                  <AudioGenerationButton
                    lessonId={lessonId || null}
                    differentiatedContent={content}
                    selectedGroups={selectedGroups}
                    onAudioGenerated={handleAudioGenerated}
                    disabled={!saved && !lessonId}
                  />
                )}
                
                {preGeneratedAudio.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowPrintQR(!showPrintQR)}
                    className="gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    {showPrintQR ? 'Hide' : 'Preview'} QR Codes
                  </Button>
                )}
              </div>
              
              {!saved && !lessonId && preGeneratedAudio.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Save the lesson first to enable audio generation
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Audio Players Card (shown when audio exists) */}
      {anyGroupNeedsAudio(selectedGroups) && preGeneratedAudio.length > 0 && (
        <Card className="border-accent/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Volume2 className="h-5 w-5 text-accent" />
              Audio Files
              <HelpTooltip content={OUTPUT_SECTION_DESCRIPTIONS['Audio Files']} />
              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full ml-2">
                {preGeneratedAudio.length} files ready
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pre-generated Audio Players with Bilingual Support */}
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

      {/* Content - with Bilingual Side-by-Side for non-English groups */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Check if we have bilingual groups */}
          {selectedGroups.some(g => g.homeLanguage && g.homeLanguage !== 'English') ? (
            <Tabs defaultValue="bilingual" className="w-full">
              <div className="border-b px-4 py-2 bg-muted/30">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="bilingual" className="gap-2">
                    <LayoutTemplate className="h-4 w-4" />
                    Side-by-Side View
                  </TabsTrigger>
                  <TabsTrigger value="raw" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Full Content
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="bilingual" className="mt-0 p-4 space-y-6">
                {/* Teacher Guide Section (always in English) */}
                <TeacherGuideSection content={content} />
                
                {/* Bilingual Student Handouts - Side by Side */}
                <div className="space-y-6">
                  <h2 className="text-xl font-display font-bold flex items-center gap-2 pb-3 border-b">
                    <Languages className="h-5 w-5 text-primary" />
                    Student Handouts (Bilingual)
                    <HelpTooltip content={OUTPUT_SECTION_DESCRIPTIONS['Student Handouts']} />
                  </h2>
                  
                  {selectedGroups
                    .filter(g => g.homeLanguage && g.homeLanguage !== 'English')
                    .map(group => {
                      const groupContent = extractGroupContent(group.groupName);
                      const groupAudio = preGeneratedAudio.filter(a => a.group_name === group.groupName);
                      
                      // Parse content into bilingual sections
                      const sections = parseBilingualContentForGroup(groupContent, group.homeLanguage);
                      
                      // Map audio data for the layout
                      const audioData = groupAudio.map(a => ({
                        sectionType: a.section_type,
                        englishAudioUrl: a.language === 'English' ? a.audio_url : undefined,
                        homeLanguageAudioUrl: a.language === group.homeLanguage ? a.audio_url : undefined,
                      }));
                      
                      return (
                        <BilingualSideBySideLayout
                          key={group.id}
                          group={group}
                          homeLanguage={group.homeLanguage}
                          sections={sections}
                          audioData={audioData}
                          showQRCodes={preGeneratedAudio.length > 0}
                        />
                      );
                    })}
                  
                  {/* English-only groups rendered normally */}
                  {selectedGroups
                    .filter(g => !g.homeLanguage || g.homeLanguage === 'English')
                    .map(group => (
                      <Card key={group.id} className="border-accent/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <span>{getStudentFriendlyIcon(group.readingLevelLabel)}</span>
                            {group.groupName}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {getStudentFriendlyName(group.readingLevelLabel)}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <article className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{extractGroupContent(group.groupName)}</ReactMarkdown>
                          </article>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
              
              <TabsContent value="raw" className="mt-0">
                <RawContentView content={content} />
              </TabsContent>
            </Tabs>
          ) : (
            <RawContentView content={content} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component to render Teacher Guide section
function TeacherGuideSection({ content }: { content: string }) {
  const teacherGuide = useMemo(() => {
    const lines = content.split('\n');
    let inTeacherGuide = false;
    const guideLines: string[] = [];
    
    for (const line of lines) {
      if (line.includes('TEACHER GUIDE') || line.includes('Teacher Guide')) {
        inTeacherGuide = true;
        guideLines.push(line);
      } else if (inTeacherGuide) {
        if (line.includes('STUDENT HANDOUTS') || line.includes('Student Handouts')) {
          break;
        }
        guideLines.push(line);
      }
    }
    
    return guideLines.join('\n');
  }, [content]);

  if (!teacherGuide.trim()) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-display font-bold flex items-center gap-2 pb-3 border-b">
        <GraduationCap className="h-5 w-5 text-primary" />
        Teacher Guide
        <HelpTooltip content={OUTPUT_SECTION_DESCRIPTIONS['Teacher Guide']} />
      </h2>
      <article className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{teacherGuide}</ReactMarkdown>
      </article>
    </div>
  );
}

// Helper component to render raw markdown content
function RawContentView({ content }: { content: string }) {
  return (
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
  );
}

// Parse differentiated content into bilingual sections
function parseBilingualContentForGroup(
  groupContent: string,
  homeLanguage: string
): Array<{
  sectionType: string;
  sectionLabel: string;
  englishContent: string;
  homeLanguageContent: string;
}> {
  const sections: Array<{
    sectionType: string;
    sectionLabel: string;
    englishContent: string;
    homeLanguageContent: string;
  }> = [];

  // Section patterns to identify content types
  const sectionPatterns = [
    { type: 'learning-target', label: '🎯 Learning Target', pattern: /(?:learning target|objetivo|bartilmaamaha|mục tiêu)/i },
    { type: 'reading', label: '📖 Reading', pattern: /(?:reading|lectura|akhri|đọc)/i },
    { type: 'vocabulary', label: '📚 Vocabulary', pattern: /(?:vocabulary|vocabulario|ereyga|từ vựng)/i },
    { type: 'instructions', label: '📋 Instructions', pattern: /(?:instructions|instrucciones|tilmaamaha|hướng dẫn)/i },
    { type: 'practice', label: '✏️ Practice', pattern: /(?:practice|práctica|ku tababar|thực hành)/i },
    { type: 'reflection', label: '💭 Reflection', pattern: /(?:reflection|reflexión|fikrad|suy ngẫm)/i },
    { type: 'content', label: '📄 Content', pattern: /(?:content|contenido|waxa ku jira)/i },
  ];

  const lines = groupContent.split('\n');
  let currentSection = { type: 'content', label: '📄 Lesson Content' };
  let englishBuffer: string[] = [];
  let homeLanguageBuffer: string[] = [];
  let isHomeLanguageBlock = false;

  // Language detection patterns
  const homeLangMarkers = [
    `(${homeLanguage})`,
    `[${homeLanguage}]`,
    `${homeLanguage}:`,
    // Add common language headers
    homeLanguage === 'Somali' ? /Soomaali/i : null,
    homeLanguage === 'Spanish' ? /Español/i : null,
  ].filter(Boolean);

  for (const line of lines) {
    // Check for language markers
    const isHomeLangLine = homeLangMarkers.some(marker => 
      marker instanceof RegExp ? marker.test(line) : line.includes(marker as string)
    );
    const isEnglishLine = line.includes('(English)') || line.includes('[English]') || /English:/i.test(line);

    if (isHomeLangLine) {
      isHomeLanguageBlock = true;
    } else if (isEnglishLine) {
      isHomeLanguageBlock = false;
    }

    // Check for section changes
    const matchedSection = sectionPatterns.find(p => p.pattern.test(line));
    if (matchedSection && (englishBuffer.length > 0 || homeLanguageBuffer.length > 0)) {
      // Save current section
      const engContent = englishBuffer.join('\n').trim();
      const homeContent = homeLanguageBuffer.join('\n').trim();
      
      if (engContent || homeContent) {
        sections.push({
          sectionType: currentSection.type,
          sectionLabel: currentSection.label,
          englishContent: engContent || homeContent,
          homeLanguageContent: homeContent || engContent,
        });
      }
      englishBuffer = [];
      homeLanguageBuffer = [];
    }

    if (matchedSection) {
      currentSection = matchedSection;
    }

    // Add line to appropriate buffer
    if (isHomeLanguageBlock) {
      homeLanguageBuffer.push(line);
    } else {
      englishBuffer.push(line);
    }
  }

  // Add final section
  const engContent = englishBuffer.join('\n').trim();
  const homeContent = homeLanguageBuffer.join('\n').trim();
  
  if (engContent || homeContent) {
    sections.push({
      sectionType: currentSection.type,
      sectionLabel: currentSection.label,
      englishContent: engContent || homeContent,
      homeLanguageContent: homeContent || engContent,
    });
  }

  // If no sections were parsed, create a single section
  if (sections.length === 0) {
    sections.push({
      sectionType: 'content',
      sectionLabel: '📄 Lesson Content',
      englishContent: groupContent,
      homeLanguageContent: groupContent,
    });
  }

  return sections;
}
