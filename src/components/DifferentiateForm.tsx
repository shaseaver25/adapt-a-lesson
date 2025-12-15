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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, BookOpen, Languages, Settings2, ExternalLink, CheckSquare, XSquare } from 'lucide-react';
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
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [lessonContent, setLessonContent] = useState('');
  const [includeVocabularyScaffolding, setIncludeVocabularyScaffolding] = useState(true);
  const [generateComprehensionQuestions, setGenerateComprehensionQuestions] = useState(false);
  const [includeVisualPlaceholders, setIncludeVisualPlaceholders] = useState(true);
  const [outputFormat, setOutputFormat] = useState<'markdown' | 'pdf-ready' | 'google-docs'>('markdown');

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

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const selectAll = () => {
    setSelectedGroupIds(groups.map((g) => g.id));
  };

  const clearSelection = () => {
    setSelectedGroupIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedGroups = groups.filter((g) => selectedGroupIds.includes(g.id));
    onSubmit({
      lessonContent,
      selectedGroups,
      options: {
        includeVocabularyScaffolding,
        generateComprehensionQuestions,
        includeVisualPlaceholders,
        outputFormat,
      },
    });
  };

  const wordCount = lessonContent.trim().split(/\s+/).filter(Boolean).length;
  const readingLevelColor = (level: string) => ({
    'Below Grade': 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
    'On Grade': 'bg-green-500/20 text-green-700 dark:text-green-400',
    'Above Grade': 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    'Advanced': 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  }[level] || 'bg-muted text-muted-foreground');

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Select Student Groups */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
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
          <div className="text-center py-8 border border-dashed border-border rounded-lg">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground mb-3">No student groups saved yet</p>
            <Link to="/student-groups">
              <Button variant="outline" size="sm">
                Create Your First Group
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <Button type="button" variant="outline" size="sm" onClick={selectAll} className="gap-1">
                <CheckSquare className="h-4 w-4" />
                Select All
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearSelection} className="gap-1">
                <XSquare className="h-4 w-4" />
                Clear
              </Button>
              <span className="text-sm text-muted-foreground ml-auto self-center">
                {selectedGroupIds.length} of {groups.length} selected
              </span>
            </div>

            <ScrollArea className="h-[200px] border border-border rounded-lg">
              <div className="p-2 space-y-2">
                {groups.map((group) => {
                  const isSelected = selectedGroupIds.includes(group.id);
                  return (
                    <label
                      key={group.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/5 border-primary/50'
                          : 'bg-background border-border hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleGroup(group.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{group.groupName}</span>
                          <span className="text-xs text-muted-foreground">
                            ({group.numStudents} student{group.numStudents !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="secondary" className={`text-xs ${readingLevelColor(group.readingLevelLabel)}`}>
                            {group.readingLevelLabel}
                          </Badge>
                          {group.ellStatus !== 'None' && (
                            <Badge variant="secondary" className="text-xs bg-sky-500/20 text-sky-700 dark:text-sky-400">
                              ELL: {group.ellStatus}
                            </Badge>
                          )}
                          {group.homeLanguage !== 'English' && (
                            <Badge variant="outline" className="text-xs">
                              {group.homeLanguage}
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-display font-bold text-lg">Original Lesson Content</h3>
          </div>
          <span className="text-sm text-muted-foreground">{wordCount} words</span>
        </div>

        <Textarea
          placeholder="Paste your lesson content here in markdown format..."
          value={lessonContent}
          onChange={(e) => setLessonContent(e.target.value)}
          rows={12}
          className="font-mono text-sm"
          required
        />
      </div>

      {/* Section 3: Differentiation Options */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <Settings2 className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Differentiation Options</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors">
            <Checkbox
              checked={includeVocabularyScaffolding}
              onCheckedChange={(checked) => setIncludeVocabularyScaffolding(!!checked)}
            />
            <div>
              <span className="text-sm font-medium text-foreground">Vocabulary Scaffolding</span>
              <p className="text-xs text-muted-foreground">Include bilingual glossaries and key term definitions</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors">
            <Checkbox
              checked={generateComprehensionQuestions}
              onCheckedChange={(checked) => setGenerateComprehensionQuestions(!!checked)}
            />
            <div>
              <span className="text-sm font-medium text-foreground">Comprehension Questions</span>
              <p className="text-xs text-muted-foreground">Generate level-appropriate check questions</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors">
            <Checkbox
              checked={includeVisualPlaceholders}
              onCheckedChange={(checked) => setIncludeVisualPlaceholders(!!checked)}
            />
            <div>
              <span className="text-sm font-medium text-foreground">Visual Placeholders</span>
              <p className="text-xs text-muted-foreground">Add [VISUAL: description] markers for images</p>
            </div>
          </label>

          <div className="p-3 rounded-lg border border-border bg-background">
            <Label htmlFor="outputFormat" className="text-sm font-medium text-foreground">Output Format</Label>
            <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as typeof outputFormat)}>
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
        disabled={isLoading || selectedGroupIds.length === 0 || !lessonContent.trim()}
      >
        {isLoading ? (
          <span className="animate-pulse-soft">Differentiating for {selectedGroupIds.length} group{selectedGroupIds.length !== 1 ? 's' : ''}...</span>
        ) : (
          `Differentiate Lesson for ${selectedGroupIds.length} Group${selectedGroupIds.length !== 1 ? 's' : ''}`
        )}
      </Button>
    </form>
  );
}
