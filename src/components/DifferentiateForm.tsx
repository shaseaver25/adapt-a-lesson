import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
import { Users, BookOpen, Settings2, ExternalLink, CheckSquare, XSquare, HelpCircle, Sparkles } from 'lucide-react';
import { useDifferentiation } from '@/contexts/DifferentiationContext';
import { READING_LEVEL_DESCRIPTIONS, ELL_STATUS_DESCRIPTIONS } from '@/lib/tooltipDescriptions';
import { getStudentFriendlyName, getStudentFriendlyIcon, getReadingLevelColor } from '@/lib/readingLevelNames';
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
}

export interface DifferentiateInput {
  lessonContent: string;
  selectedGroups: (StudentGroup & { id: string })[];
  options: {
    includeVocabularyScaffolding: boolean;
    generateComprehensionQuestions: boolean;
    includeVisualPlaceholders: boolean;
    outputFormat: 'markdown' | 'pdf-ready' | 'google-docs';
  };
}

interface DifferentiateFormProps {
  onSubmit: (input: DifferentiateInput) => void;
  isLoading?: boolean;
}

function dbToStudentGroup(db: DBStudentGroup): StudentGroup & { id: string } {
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
  };
}

export function DifferentiateForm({ onSubmit, isLoading }: DifferentiateFormProps) {
  const {
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

  // Show cache notice if there's cached content
  useEffect(() => {
    if (cachedLessonContent && cachedLessonContent.length > 0) {
      setShowCacheNotice(true);
      const timer = setTimeout(() => setShowCacheNotice(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedGroups = groups.filter((g) => selectedGroupIds.includes(g.id));
    onSubmit({
      lessonContent: cachedLessonContent,
      selectedGroups,
      options,
    });
  };

  const wordCount = cachedLessonContent.trim().split(/\s+/).filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Select Student Groups */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-display font-bold text-lg">Select Student Groups</h3>
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
            <h3 className="font-display font-bold text-lg">Original Lesson Content</h3>
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

        <Textarea
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

      {/* Section 3: Differentiation Options */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <Settings2 className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Differentiation Options</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors">
            <Checkbox
              checked={options.includeVocabularyScaffolding}
              onCheckedChange={(checked) => setOptions({ includeVocabularyScaffolding: !!checked })}
              className="mt-0.5"
            />
            <div>
              <span className="text-sm font-medium text-foreground">📚 Vocabulary Scaffolding</span>
              <p className="text-xs text-muted-foreground mt-0.5">Bilingual glossaries and key term definitions</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors">
            <Checkbox
              checked={options.generateComprehensionQuestions}
              onCheckedChange={(checked) => setOptions({ generateComprehensionQuestions: !!checked })}
              className="mt-0.5"
            />
            <div>
              <span className="text-sm font-medium text-foreground">❓ Comprehension Questions</span>
              <p className="text-xs text-muted-foreground mt-0.5">Level-appropriate check-for-understanding questions</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors">
            <Checkbox
              checked={options.includeVisualPlaceholders}
              onCheckedChange={(checked) => setOptions({ includeVisualPlaceholders: !!checked })}
              className="mt-0.5"
            />
            <div>
              <span className="text-sm font-medium text-foreground">🖼️ Visual Placeholders</span>
              <p className="text-xs text-muted-foreground mt-0.5">Add [VISUAL: description] markers for images</p>
            </div>
          </label>

          <div className="p-3 rounded-lg border border-border bg-background">
            <Label htmlFor="outputFormat" className="text-sm font-medium text-foreground">📄 Output Format</Label>
            <Select 
              value={options.outputFormat} 
              onValueChange={(v) => setOptions({ outputFormat: v as typeof options.outputFormat })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="pdf-ready">PDF-Ready</SelectItem>
                <SelectItem value="google-docs">Google Docs Format</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        variant="hero"
        size="lg"
        className="w-full"
        disabled={isLoading || selectedGroupIds.length === 0 || !cachedLessonContent.trim()}
      >
        {isLoading ? (
          <span className="animate-pulse-soft">Differentiating for {selectedGroupIds.length} group{selectedGroupIds.length !== 1 ? 's' : ''}...</span>
        ) : selectedGroupIds.length === 0 ? (
          'Select at least one group to continue'
        ) : (
          `✨ Differentiate Lesson for ${selectedGroupIds.length} Group${selectedGroupIds.length !== 1 ? 's' : ''}`
        )}
      </Button>
    </form>
  );
}
