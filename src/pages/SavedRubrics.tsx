import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  TableProperties, 
  Trash2, 
  Eye, 
  Calendar, 
  Target,
  Loader2,
  FolderOpen,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

interface SavedRubric {
  id: string;
  assessment_description: string;
  learning_objectives: string[];
  rubric_content: string;
  num_criteria: number;
  grade_level: string | null;
  ai_vulnerability_score: number | null;
  ai_proof_criteria: any;
  ai_proof_settings: any;
  verification_checkpoints: string[] | null;
  auto_verification_added: boolean | null;
  auto_verification_count: number | null;
  created_at: string;
  updated_at: string;
}

export default function SavedRubrics() {
  const [selectedRubric, setSelectedRubric] = useState<SavedRubric | null>(null);
  const [rubricToDelete, setRubricToDelete] = useState<SavedRubric | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rubrics = [], isLoading } = useQuery({
    queryKey: ['saved-rubrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_rubrics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedRubric[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (rubricId: string) => {
      const { error } = await supabase
        .from('generated_rubrics')
        .delete()
        .eq('id', rubricId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-rubrics'] });
      toast({ title: 'Rubric deleted', description: 'The rubric has been removed.' });
      setRubricToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting rubric:', error);
      toast({
        title: 'Delete failed',
        description: 'Could not delete the rubric. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (rubricToDelete) {
      deleteMutation.mutate(rubricToDelete.id);
    }
  };

  const getVulnerabilityBadge = (score: number | null) => {
    if (score === null) return null;
    
    if (score <= 30) {
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Low Risk ({score})
        </Badge>
      );
    } else if (score <= 60) {
      return (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
          <ShieldAlert className="h-3 w-3 mr-1" />
          Medium Risk ({score})
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
          <ShieldAlert className="h-3 w-3 mr-1" />
          High Risk ({score})
        </Badge>
      );
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
                <h1 className="font-display font-bold text-xl">My Saved Rubrics</h1>
              </div>
            </div>
            <Badge variant="secondary" className="hidden sm:flex">
              {rubrics.length} rubric{rubrics.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your saved rubrics...</p>
          </div>
        ) : rubrics.length === 0 ? (
          <Card className="max-w-md mx-auto text-center py-12">
            <CardContent>
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display font-bold text-xl mb-2">No Saved Rubrics Yet</h2>
              <p className="text-muted-foreground mb-6">
                When you generate and save rubrics, they'll appear here for easy access.
              </p>
              <Link to="/studio?tab=rubric">
                <Button className="gap-2">
                  <TableProperties className="h-4 w-4" />
                  Create Your First Rubric
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rubrics.map((rubric) => (
              <Card 
                key={rubric.id} 
                className="group hover:border-primary/50 hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-display line-clamp-2">
                        {rubric.assessment_description.slice(0, 80)}
                        {rubric.assessment_description.length > 80 ? '...' : ''}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(rubric.created_at), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      <Target className="h-3 w-3 mr-1" />
                      {rubric.num_criteria}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Learning objectives preview */}
                  <div className="text-sm text-muted-foreground mb-3">
                    <span className="font-medium text-foreground">Objectives: </span>
                    {rubric.learning_objectives?.slice(0, 2).join(', ')}
                    {rubric.learning_objectives?.length > 2 && ` +${rubric.learning_objectives.length - 2} more`}
                  </div>

                  {/* Metadata badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {rubric.grade_level && (
                      <Badge variant="secondary" className="text-xs">
                        {rubric.grade_level}
                      </Badge>
                    )}
                    {getVulnerabilityBadge(rubric.ai_vulnerability_score)}
                    {rubric.auto_verification_added && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                        +{rubric.auto_verification_count} Auto Criteria
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-2"
                      onClick={() => setSelectedRubric(rubric)}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setRubricToDelete(rubric)}
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

      {/* View Rubric Dialog */}
      <Dialog open={!!selectedRubric} onOpenChange={() => setSelectedRubric(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display">
              Rubric Details
            </DialogTitle>
            <DialogDescription>
              Created on {selectedRubric && format(new Date(selectedRubric.created_at), 'MMMM d, yyyy')}
              {' · '}
              {selectedRubric?.num_criteria} criteria
              {selectedRubric?.grade_level && ` · ${selectedRubric.grade_level}`}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 mt-4">
            <article className="prose prose-sm dark:prose-invert max-w-none 
              prose-headings:font-display
              prose-h1:text-xl prose-h1:border-b prose-h1:border-border prose-h1:pb-2 prose-h1:mb-4
              prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3
              prose-h3:text-base prose-h3:text-primary
              prose-p:leading-relaxed
              prose-ul:my-2 prose-li:my-0.5
              prose-table:border prose-table:border-border
              prose-th:bg-muted prose-th:p-2 prose-th:text-left prose-th:border prose-th:border-border
              prose-td:p-2 prose-td:border prose-td:border-border
            ">
              {selectedRubric && (
                <>
                  <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Assessment Description</h3>
                    <p className="text-foreground">{selectedRubric.assessment_description}</p>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Learning Objectives</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedRubric.learning_objectives?.map((obj, idx) => (
                        <li key={idx} className="text-foreground">{obj}</li>
                      ))}
                    </ul>
                  </div>

                  {selectedRubric.ai_vulnerability_score !== null && (
                    <div className="mb-6 flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">AI Vulnerability Score:</span>
                      {getVulnerabilityBadge(selectedRubric.ai_vulnerability_score)}
                    </div>
                  )}
                  
                  <ReactMarkdown>{selectedRubric.rubric_content}</ReactMarkdown>
                </>
              )}
            </article>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!rubricToDelete} onOpenChange={() => setRubricToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this rubric?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the rubric for "{rubricToDelete?.assessment_description.slice(0, 50)}...". 
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
    </div>
  );
}
