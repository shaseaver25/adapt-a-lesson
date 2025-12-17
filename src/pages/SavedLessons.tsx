import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  BookOpen, 
  Trash2, 
  Eye, 
  Calendar, 
  Users, 
  Loader2,
  FolderOpen,
  Pencil,
  Image as ImageIcon,
  Headphones
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { LessonImageBrowser } from '@/components/LessonImageBrowser';

interface SavedLesson {
  id: string;
  lesson_title: string | null;
  original_content: string;
  teacher_guide: string | null;
  student_handouts: any;
  differentiation_options: any;
  group_ids: string[];
  created_at: string;
  updated_at: string;
}

export default function SavedLessons() {
  const [lessonToDelete, setLessonToDelete] = useState<SavedLesson | null>(null);
  const [lessonToEdit, setLessonToEdit] = useState<SavedLesson | null>(null);
  const [lessonForImages, setLessonForImages] = useState<SavedLesson | null>(null);
  const [editName, setEditName] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['saved-lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_lessons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedLesson[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase
        .from('generated_lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-lessons'] });
      toast({ title: 'Lesson deleted', description: 'The lesson has been removed.' });
      setLessonToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting lesson:', error);
      toast({
        title: 'Delete failed',
        description: 'Could not delete the lesson. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('generated_lessons')
        .update({ lesson_title: name })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-lessons'] });
      toast({ title: 'Lesson renamed', description: 'The lesson name has been updated.' });
      setLessonToEdit(null);
      setEditName('');
    },
    onError: (error) => {
      console.error('Error renaming lesson:', error);
      toast({
        title: 'Rename failed',
        description: 'Could not rename the lesson. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (lessonToDelete) {
      deleteMutation.mutate(lessonToDelete.id);
    }
  };

  const handleStartEdit = (lesson: SavedLesson) => {
    setLessonToEdit(lesson);
    setEditName(lesson.lesson_title || '');
  };

  const handleSaveEdit = () => {
    if (lessonToEdit && editName.trim()) {
      renameMutation.mutate({ id: lessonToEdit.id, name: editName.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Tools
                </Button>
              </Link>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h1 className="font-display font-bold text-xl">My Saved Lessons</h1>
              </div>
            </div>
            <Badge variant="secondary" className="hidden sm:flex">
              {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your saved lessons...</p>
          </div>
        ) : lessons.length === 0 ? (
          <Card className="max-w-md mx-auto text-center py-12">
            <CardContent>
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display font-bold text-xl mb-2">No Saved Lessons Yet</h2>
              <p className="text-muted-foreground mb-6">
                When you generate and save differentiated lessons, they'll appear here for easy access.
              </p>
              <Link to="/">
                <Button className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Create Your First Lesson
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map((lesson) => (
              <Card 
                key={lesson.id} 
                className="group hover:border-primary/50 hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-display truncate">
                        {lesson.lesson_title || 'Untitled Lesson'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(lesson.created_at), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      <Users className="h-3 w-3 mr-1" />
                      {lesson.group_ids?.length || 0}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Preview snippet */}
                  <div className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[4rem]">
                    {lesson.original_content?.slice(0, 150)}
                    {lesson.original_content && lesson.original_content.length > 150 ? '...' : ''}
                  </div>

                  {/* Differentiation options badges */}
                  {lesson.differentiation_options && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {lesson.differentiation_options.includeVocabularyScaffolding && (
                        <Badge variant="secondary" className="text-xs">📚 Vocab</Badge>
                      )}
                      {lesson.differentiation_options.generateComprehensionQuestions && (
                        <Badge variant="secondary" className="text-xs">❓ Questions</Badge>
                      )}
                      {lesson.differentiation_options.includeGraphicOrganizers && (
                        <Badge variant="secondary" className="text-xs">📊 Organizers</Badge>
                      )}
                      {lesson.differentiation_options.includeVisualPlaceholders && (
                        <Badge variant="secondary" className="text-xs">🖼️ Visuals</Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-2"
                      onClick={() => window.open(`/lesson/${lesson.id}`, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/lesson/${lesson.id}/audio`, '_blank')}
                      title="Audio Files"
                    >
                      <Headphones className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLessonForImages(lesson)}
                      title="View Images"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit(lesson)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setLessonToDelete(lesson)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!lessonToDelete} onOpenChange={() => setLessonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{lessonToDelete?.lesson_title || 'Untitled Lesson'}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Name Dialog */}
      <Dialog open={!!lessonToEdit} onOpenChange={() => { setLessonToEdit(null); setEditName(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Lesson</DialogTitle>
            <DialogDescription>
              Enter a new name for this lesson.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Lesson Name</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter lesson name..."
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setLessonToEdit(null); setEditName(''); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={!editName.trim() || renameMutation.isPending}
            >
              {renameMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Browser Dialog */}
      <Dialog open={!!lessonForImages} onOpenChange={() => setLessonForImages(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Images for "{lessonForImages?.lesson_title || 'Lesson'}"
            </DialogTitle>
          </DialogHeader>
          {lessonForImages && (
            <LessonImageBrowser 
              lessonId={lessonForImages.id}
              lessonTitle={lessonForImages.lesson_title || undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
