import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  Save, 
  FolderOpen, 
  ChevronDown, 
  FileText, 
  Trash2, 
  Loader2,
  FileUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SavedAssessment {
  id: string;
  title: string;
  assessment_description: string;
  grade_level: string | null;
  subject: string | null;
  created_at: string;
}

interface SavedAssessmentSelectorProps {
  currentDescription: string;
  onSelectAssessment: (description: string) => void;
  disabled?: boolean;
}

export function SavedAssessmentSelector({
  currentDescription,
  onSelectAssessment,
  disabled,
}: SavedAssessmentSelectorProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedAssessments = [], isLoading } = useQuery({
    queryKey: ['saved-assessments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedAssessment[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; subject?: string; gradeLevel?: string }) => {
      const { error } = await supabase.from('saved_assessments').insert({
        title: data.title,
        assessment_description: data.description,
        subject: data.subject || null,
        grade_level: data.gradeLevel || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-assessments'] });
      toast({
        title: 'Assessment saved',
        description: 'You can now reuse this assessment description.',
      });
      setSaveDialogOpen(false);
      setTitle('');
      setSubject('');
      setGradeLevel('');
    },
    onError: (error) => {
      toast({
        title: 'Error saving assessment',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saved_assessments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-assessments'] });
      toast({
        title: 'Assessment deleted',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting assessment',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!title.trim() || !currentDescription.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide a title and assessment description.',
        variant: 'destructive',
      });
      return;
    }
    saveMutation.mutate({
      title: title.trim(),
      description: currentDescription.trim(),
      subject: subject.trim(),
      gradeLevel: gradeLevel.trim(),
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      onSelectAssessment(text);
      setUploadDialogOpen(false);
      toast({
        title: 'File uploaded',
        description: 'Assessment description extracted from file.',
      });
    } catch (error) {
      toast({
        title: 'Error reading file',
        description: 'Could not read the file. Please try a text-based file.',
        variant: 'destructive',
      });
    }
    
    // Reset the input
    event.target.value = '';
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Load Saved Assessment Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" disabled={disabled}>
            <FolderOpen className="h-4 w-4" />
            Load Saved
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : savedAssessments.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No saved assessments yet</p>
              <p className="text-xs mt-1">Save your current assessment to reuse it later</p>
            </div>
          ) : (
            <ScrollArea className="max-h-64">
              {savedAssessments.map((assessment) => (
                <div key={assessment.id} className="group relative">
                  <DropdownMenuItem
                    className="cursor-pointer pr-10"
                    onSelect={() => onSelectAssessment(assessment.assessment_description)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{assessment.title}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {assessment.assessment_description.slice(0, 60)}...
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(assessment.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(assessment.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </ScrollArea>
          )}
          {savedAssessments.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                {savedAssessments.length} saved assessment{savedAssessments.length !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Upload File Button */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" disabled={disabled}>
            <FileUp className="h-4 w-4" />
            Upload File
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Assessment File</DialogTitle>
            <DialogDescription>
              Upload a text file (.txt, .md) containing your assessment description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary hover:underline">Click to upload</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                TXT, MD files supported
              </p>
              <Input
                id="file-upload"
                type="file"
                accept=".txt,.md,.text"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Current Button */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2" 
            disabled={disabled || !currentDescription.trim()}
          >
            <Save className="h-4 w-4" />
            Save Current
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Assessment</DialogTitle>
            <DialogDescription>
              Save this assessment description for future use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assessment-title">Title *</Label>
              <Input
                id="assessment-title"
                placeholder="e.g., Food Web Poster Project"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assessment-subject">Subject</Label>
                <Input
                  id="assessment-subject"
                  placeholder="e.g., Science"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assessment-grade">Grade Level</Label>
                <Input
                  id="assessment-grade"
                  placeholder="e.g., 5th Grade"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="bg-muted/50 rounded-md p-3 text-sm max-h-32 overflow-auto">
                {currentDescription || 'No description to save'}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
