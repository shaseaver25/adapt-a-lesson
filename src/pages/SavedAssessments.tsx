import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, ShieldCheck, Search, Trash2, Eye, Download, FileText, Globe, MoreVertical, Calendar, MapPin, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';

interface SavedAssessment {
  id: string;
  title: string;
  assessment_content: string;
  lesson_title: string | null;
  subject: string | null;
  grade_level: string | null;
  learning_objectives: string[] | null;
  method_category: string | null;
  method_name: string | null;
  school_name: string | null;
  city: string | null;
  state: string | null;
  local_context_details: string | null;
  storage_path: string | null;
  created_at: string;
}

const SavedAssessments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState<SavedAssessment | null>(null);
  const [assessmentToDelete, setAssessmentToDelete] = useState<SavedAssessment | null>(null);

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['saved-assessments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedAssessment[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (assessment: SavedAssessment) => {
      // Delete from storage if exists
      if (assessment.storage_path) {
        await supabase.storage
          .from('assessments')
          .remove([assessment.storage_path]);
      }
      
      // Delete from database
      const { error } = await supabase
        .from('generated_assessments')
        .delete()
        .eq('id', assessment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-assessments'] });
      toast({ title: 'Assessment deleted' });
      setAssessmentToDelete(null);
    },
    onError: () => {
      toast({
        title: 'Error deleting assessment',
        variant: 'destructive',
      });
    },
  });

  const filteredAssessments = assessments?.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.method_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWord = (assessment: SavedAssessment) => {
    const wordContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head>
  <meta charset="UTF-8">
  <title>${assessment.title}</title>
  <style>
    body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; }
    h1 { font-size: 18pt; color: #166534; }
    h2 { font-size: 14pt; color: #166534; }
    h3 { font-size: 12pt; color: #166534; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #000; padding: 6pt; }
  </style>
</head>
<body>
${assessment.assessment_content
  .replace(/^# (.*$)/gm, '<h1>$1</h1>')
  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
  .replace(/\n\n/g, '</p><p>')
  .replace(/\n/g, '<br>')}
</body>
</html>`;
    
    const blob = new Blob([wordContent], { type: 'application/msword' });
    downloadBlob(blob, `${assessment.title.replace(/\s+/g, '-').toLowerCase()}.doc`);
    toast({ title: 'Downloaded as Word document' });
  };

  const handleDownloadHTML = (assessment: SavedAssessment) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${assessment.title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1, h2, h3 { color: #166534; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
    th { background-color: #f8f9fa; }
  </style>
</head>
<body>
${assessment.assessment_content
  .replace(/^# (.*$)/gm, '<h1>$1</h1>')
  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
  .replace(/\n\n/g, '</p><p>')
  .replace(/\n/g, '<br>')}
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    downloadBlob(blob, `${assessment.title.replace(/\s+/g, '-').toLowerCase()}.html`);
    toast({ title: 'Downloaded as HTML' });
  };

  const getCategoryLabel = (category: string | null) => {
    const labels: Record<string, string> = {
      traditional: 'Written Assessment',
      livePerformance: 'Live Performance',
      processPortfolio: 'Process Portfolio',
      communityConnected: 'Community Connected',
      createAndDefend: 'Create & Defend',
    };
    return category ? labels[category] || category : null;
  };

  if (!user) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>Please log in to view your saved assessments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="w-full">Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/studio">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Studio
              </Button>
            </Link>
            <div>
              <h1 className="font-display font-bold text-xl text-primary flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                My Assessments
              </h1>
              <p className="text-sm text-muted-foreground">
                {assessments?.length || 0} saved assessment{assessments?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Assessments Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAssessments?.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 rounded-full bg-muted w-fit mb-2">
                <ShieldCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>No Assessments Yet</CardTitle>
              <CardDescription>
                Create your first authentic assessment to see it here.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/studio?tab=assessment">
                <Button>Create Assessment</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className={filteredAssessments && filteredAssessments.length >= 7 ? 'h-[calc(100vh-250px)]' : ''}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssessments?.map((assessment) => (
                <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-2">{assessment.title}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedAssessment(assessment)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadWord(assessment)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Download Word
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadHTML(assessment)}>
                            <Globe className="h-4 w-4 mr-2" />
                            Download HTML
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setAssessmentToDelete(assessment)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(assessment.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {assessment.subject && (
                        <Badge variant="outline" className="text-xs">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {assessment.subject}
                        </Badge>
                      )}
                      {assessment.grade_level && (
                        <Badge variant="secondary" className="text-xs">
                          {assessment.grade_level}
                        </Badge>
                      )}
                      {assessment.method_category && (
                        <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
                          {getCategoryLabel(assessment.method_category)}
                        </Badge>
                      )}
                    </div>
                    
                    {(assessment.city || assessment.state) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[assessment.city, assessment.state].filter(Boolean).join(', ')}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedAssessment(assessment)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownloadWord(assessment)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </main>

      {/* View Assessment Dialog */}
      <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedAssessment?.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {selectedAssessment && format(new Date(selectedAssessment.created_at), 'MMMM d, yyyy h:mm a')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAssessment && (
            <div className="space-y-4 overflow-hidden flex-1 flex flex-col">
              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                {selectedAssessment.subject && (
                  <Badge variant="outline">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {selectedAssessment.subject}
                  </Badge>
                )}
                {selectedAssessment.grade_level && (
                  <Badge variant="secondary">{selectedAssessment.grade_level}</Badge>
                )}
                {selectedAssessment.method_name && (
                  <Badge className="bg-primary/10 text-primary">{selectedAssessment.method_name}</Badge>
                )}
                {(selectedAssessment.city || selectedAssessment.state) && (
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    {[selectedAssessment.city, selectedAssessment.state].filter(Boolean).join(', ')}
                  </Badge>
                )}
              </div>

              {/* Learning Objectives */}
              {selectedAssessment.learning_objectives && selectedAssessment.learning_objectives.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Learning Objectives:</span>
                  <ul className="list-disc list-inside mt-1 text-muted-foreground">
                    {selectedAssessment.learning_objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Content */}
              <ScrollArea className="flex-1 border rounded-lg p-4">
                <div className="prose-lesson">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedAssessment.assessment_content}
                  </ReactMarkdown>
                </div>
              </ScrollArea>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => handleDownloadWord(selectedAssessment)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Download Word
                </Button>
                <Button variant="outline" onClick={() => handleDownloadHTML(selectedAssessment)}>
                  <Globe className="h-4 w-4 mr-2" />
                  Download HTML
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!assessmentToDelete} onOpenChange={() => setAssessmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{assessmentToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => assessmentToDelete && deleteMutation.mutate(assessmentToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SavedAssessments;
