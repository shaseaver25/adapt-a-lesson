import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, BookOpen, Settings2, ExternalLink, CheckSquare, XSquare, HelpCircle, Sparkles, FolderOpen, RefreshCw, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDifferentiation, type GraphicOrganizerType } from '@/contexts/DifferentiationContext';
import { READING_LEVEL_DESCRIPTIONS, ELL_STATUS_DESCRIPTIONS, SECTION_DESCRIPTIONS, DIFFERENTIATION_OPTION_DESCRIPTIONS, FIELD_DESCRIPTIONS } from '@/lib/tooltipDescriptions';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { getStudentFriendlyName, getStudentFriendlyIcon, getReadingLevelColor } from '@/lib/readingLevelNames';
import { usePIIGuard } from '@/hooks/compliance/usePIIGuard';
import { PIIWarningModal } from '@/components/compliance/PIIWarningModal';
import type { StudentGroup } from '@/types/studentGroup';

interface DBStudentGroup {
  id: string;
  group_name: string;
  num_students: number;
  reading_level_label: string;
  reading_level_lexile: string | null;
  home_language: string;
  ell_status: string;
  iep_504_status: string;
  learning_preferences: string[];
  accommodations: string[];
  notes: string | null;
  folder_id: string | null;
}

interface ClassFolder {
  id: string;
  folder_name: string;
  color: string;
}

export interface DifferentiateInput {
  lessonName: string;
  lessonContent: string;
  selectedGroups: (StudentGroup & { id: string })[];
  options: {
    includeVocabularyScaffolding: boolean;
    generateComprehensionQuestions: boolean;
    includeVisualPlaceholders: boolean;
    includeGraphicOrganizers: boolean;
    graphicOrganizerType: GraphicOrganizerType;
  };
}

interface DifferentiateFormProps {
  onSubmit: (input: DifferentiateInput) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

function dbToStudentGroup(db: DBStudentGroup): StudentGroup & { id: string; folderId: string | null } {
  return {
    id: db.id,
    groupName: db.group_name,
    numStudents: db.num_students,
    readingLevelLabel: db.reading_level_label as StudentGroup['readingLevelLabel'],
    readingLevelLexile: db.reading_level_lexile || '',
    homeLanguage: db.home_language,
    ellStatus: db.ell_status as StudentGroup['ellStatus'],
    iep504Status: db.iep_504_status as StudentGroup['iep504Status'],
    learningPreferences: db.learning_preferences || [],
    accommodations: db.accommodations || [],
    notes: db.notes || '',
    folderId: db.folder_id,
  };
}

export function DifferentiateForm({ onSubmit, isLoading, error, onRetry, onCancel }: DifferentiateFormProps) {
  const {
    lessonName,
    setLessonName,
    cachedLessonContent,
    setCachedLessonContent,
    selectedGroupIds,
    setSelectedGroupIds,
    toggleGroup,
    selectAllGroups,
    clearSelection,
    options,
    setOptions,
  } = useDifferentiation();

  const { checkText, modalState, handleEdit, handleOverride, isChecking } = usePIIGuard();
  const [showCacheNotice, setShowCacheNotice] = useState(false);

  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['student-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as DBStudentGroup[]).map(dbToStudentGroup);
    },
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['class-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClassFolder[];
    },
  });

  const getFolderForGroup = (folderId: string | null) => 
    folders.find((f) => f.id === folderId);

  // Show cache notice if there's cached content
  useEffect(() => {
    if (cachedLessonContent && cachedLessonContent.length > 0) {
      setShowCacheNotice(true);
      const timer = setTimeout(() => setShowCacheNotice(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check lesson name for PII if provided
    if (lessonName.trim()) {
      const nameCheck = await checkText({
        text: lessonName,
        fieldName: 'lesson_name',
        entityType: 'lesson',
        entityId: null,
      });
      if (!nameCheck.proceed) return;
    }
    
    // Check lesson content for PII
    const contentCheck = await checkText({
      text: cachedLessonContent,
      fieldName: 'lesson_content',
      entityType: 'lesson',
      entityId: null,
    });
    if (!contentCheck.proceed) return;
    
    const selectedGroups = groups.filter((g) => selectedGroupIds.includes(g.id));
    onSubmit({
      lessonName: lessonName.trim() || 'Untitled Lesson',
      lessonContent: cachedLessonContent,
      selectedGroups,
      options,
    });
  };

  const wordCount = cachedLessonContent.trim().split(/\s+/).filter(Boolean).length;

  // Estimate generation time based on complexity
  const getTimeEstimate = () => {
    const numGroups = selectedGroupIds.length;
    const hasEll = groups.filter(g => selectedGroupIds.includes(g.id) && g.homeLanguage !== 'English').length;
    const baseMinutes = Math.ceil(wordCount / 500) + (numGroups * 0.5) + (hasEll * 0.5);
    return Math.max(1, Math.min(5, Math.round(baseMinutes)));
  };

  return (
    <div className="space-y-8">
      {/* View Saved Lessons Button */}
      <div className="flex justify-end">
        <Link to="/saved-lessons">
          <Button variant="outline" size="sm" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            View Saved Lessons
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Select Student Groups */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-display font-bold text-lg">Select Student Groups</h3>
            <HelpTooltip content={SECTION_DESCRIPTIONS['Select Student Groups']} />
          </div>
          <Link to="/student-groups" className="text-sm text-primary hover:underline flex items-center gap-1">
            Manage Groups <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {isLoadingGroups ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-lg bg-muted/20">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground mb-1">No student groups saved yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Create groups to save time on future lessons
            </p>
            <Link to="/student-groups">
              <Button variant="default" size="sm" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Create Your First Group
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              <Button type="button" variant="outline" size="sm" onClick={() => selectAllGroups(groups)} className="gap-1">
                <CheckSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Select All</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearSelection} className="gap-1">
                <XSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
              <span className="text-sm text-muted-foreground ml-auto self-center">
                {selectedGroupIds.length} of {groups.length} selected
              </span>
            </div>

            <ScrollArea className="h-[220px] border border-border rounded-lg bg-muted/10">
              <div className="p-2 space-y-2">
                {groups.map((group) => {
                  const isSelected = selectedGroupIds.includes(group.id);
                  const folder = getFolderForGroup(group.folderId);
                  const folderColorClasses: Record<string, string> = {
                    blue: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
                    green: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
                    purple: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
                    orange: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
                    red: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
                    teal: 'bg-teal-500/20 text-teal-700 dark:text-teal-400 border-teal-500/30',
                  };
                  return (
                    <label
                      key={group.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-primary/5 border-primary/50 shadow-sm'
                          : 'bg-background border-border hover:bg-muted/50 hover:border-muted-foreground/20'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleGroup(group.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{group.groupName}</span>
                          <span className="text-xs text-muted-foreground">
                            ({group.numStudents} student{group.numStudents !== 1 ? 's' : ''})
                          </span>
                          {folder && (
                            <Badge variant="outline" className={`text-xs border ${folderColorClasses[folder.color] || folderColorClasses.blue}`}>
                              <FolderOpen className="h-3 w-3 mr-1" />
                              {folder.folder_name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className={`text-xs border ${getReadingLevelColor(group.readingLevelLabel)}`}>
                                <span className="mr-1">{getStudentFriendlyIcon(group.readingLevelLabel)}</span>
                                {getStudentFriendlyName(group.readingLevelLabel)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-sm">{READING_LEVEL_DESCRIPTIONS[group.readingLevelLabel]}</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          {group.ellStatus !== 'None' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="text-xs bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/30">
                                  🌐 ELL: {group.ellStatus}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="text-sm">{ELL_STATUS_DESCRIPTIONS[group.ellStatus]}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          {group.homeLanguage !== 'English' && (
                            <Badge variant="outline" className="text-xs">
                              🗣️ {group.homeLanguage}
                            </Badge>
                          )}
                          
                          {group.accommodations.length > 0 && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              {group.accommodations.length} accommodation{group.accommodations.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {/* Section 2: Original Lesson Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-foreground">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-display font-bold text-lg">Lesson Details</h3>
            <HelpTooltip content={SECTION_DESCRIPTIONS['Lesson Details']} />
          </div>
          <div className="flex items-center gap-3">
            {showCacheNotice && cachedLessonContent && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 animate-fade-in">
                ✓ Previous lesson restored
              </span>
            )}
            <span className="text-sm text-muted-foreground">{wordCount} words</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lessonName" className="text-sm font-medium">Lesson Name</Label>
          <Input
            id="lessonName"
            placeholder="e.g., Photosynthesis Introduction, Civil War Causes..."
            value={lessonName}
            onChange={(e) => setLessonName(e.target.value)}
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">
            This name will be used when saving the differentiated lesson.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lessonContent" className="text-sm font-medium">Lesson Content</Label>
          <Textarea
            id="lessonContent"
            placeholder="Paste your lesson content here in markdown format..."
            value={cachedLessonContent}
            onChange={(e) => setCachedLessonContent(e.target.value)}
            rows={10}
            className="font-mono text-sm resize-y min-h-[200px]"
            required
          />
          <p className="text-xs text-muted-foreground">
            💡 Your lesson content is automatically saved and will be here when you return.
          </p>
        </div>
      </div>

      {/* Section 3: Differentiation Options */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <Settings2 className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Differentiation Options</h3>
          <HelpTooltip content={SECTION_DESCRIPTIONS['Differentiation Options']} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors">
            <Checkbox
              checked={options.includeVocabularyScaffolding}
              onCheckedChange={(checked) => setOptions({ includeVocabularyScaffolding: !!checked })}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">📚 Vocabulary Scaffolding</span>
                <HelpTooltip content={DIFFERENTIATION_OPTION_DESCRIPTIONS['Vocabulary Scaffolding']} side="right" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Bilingual glossaries and key term definitions</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors">
            <Checkbox
              checked={options.generateComprehensionQuestions}
              onCheckedChange={(checked) => setOptions({ generateComprehensionQuestions: !!checked })}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">❓ Comprehension Questions</span>
                <HelpTooltip content={DIFFERENTIATION_OPTION_DESCRIPTIONS['Comprehension Questions']} side="right" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Level-appropriate check-for-understanding questions</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors">
            <Checkbox
              checked={options.includeVisualPlaceholders}
              onCheckedChange={(checked) => setOptions({ includeVisualPlaceholders: !!checked })}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">🖼️ Visual Placeholders</span>
                <HelpTooltip content={DIFFERENTIATION_OPTION_DESCRIPTIONS['Visual Placeholders']} side="right" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Add [VISUAL: description] markers for images</p>
            </div>
          </label>

          <div className="p-3 rounded-lg border border-border bg-background space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={options.includeGraphicOrganizers}
                onCheckedChange={(checked) => setOptions({ includeGraphicOrganizers: !!checked })}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">📊 Graphic Organizers</span>
                  <HelpTooltip content={DIFFERENTIATION_OPTION_DESCRIPTIONS['Graphic Organizers']} side="right" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Generate printable organizers for visual learners</p>
              </div>
            </label>
            
            {options.includeGraphicOrganizers && (
              <div className="ml-6">
                <Label htmlFor="organizerType" className="text-xs text-muted-foreground">Organizer Type</Label>
                <Select 
                  value={options.graphicOrganizerType} 
                  onValueChange={(v) => setOptions({ graphicOrganizerType: v as GraphicOrganizerType })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">🤖 Auto-detect (based on content)</SelectItem>
                    <SelectItem value="venn-diagram">⭕ Venn Diagram (compare/contrast)</SelectItem>
                    <SelectItem value="t-chart">📋 T-Chart (two sides)</SelectItem>
                    <SelectItem value="flow-chart">➡️ Flow Chart (sequences)</SelectItem>
                    <SelectItem value="cause-effect">🔗 Cause & Effect Chain</SelectItem>
                    <SelectItem value="web-diagram">🕸️ Web Diagram (main idea)</SelectItem>
                    <SelectItem value="frayer-model">📚 Frayer Model (vocabulary)</SelectItem>
                    <SelectItem value="story-map">📖 Story Map (narrative)</SelectItem>
                    <SelectItem value="claim-evidence">⚖️ Claim-Evidence-Reasoning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Error with Retry */}
      {error && !isLoading && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            {onRetry && (
              <Button type="button" variant="outline" size="sm" onClick={onRetry} className="gap-2 shrink-0">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State with Time Estimate */}
      {isLoading && (
        <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="font-medium text-foreground">
                Differentiating for {selectedGroupIds.length} group{selectedGroupIds.length !== 1 ? 's' : ''}...
              </span>
            </div>
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-muted-foreground hover:text-destructive"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Estimated time: {getTimeEstimate()}-{getTimeEstimate() + 2} minutes</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Large lessons with multiple groups or translations may take longer. Please don't close this page.
          </p>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="hero"
        size="lg"
        className="w-full"
        disabled={isLoading || isChecking || selectedGroupIds.length === 0 || !cachedLessonContent.trim()}
      >
        {isLoading || isChecking ? (
          <span className="animate-pulse-soft">Processing...</span>
        ) : selectedGroupIds.length === 0 ? (
          'Select at least one group to continue'
        ) : (
          `✨ Differentiate Lesson for ${selectedGroupIds.length} Group${selectedGroupIds.length !== 1 ? 's' : ''}`
        )}
      </Button>
      </form>
      
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
