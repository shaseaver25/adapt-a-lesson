import { useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DifferentiateForm, DifferentiateInput } from '@/components/DifferentiateForm';
import { DifferentiatedLessonOutput } from '@/components/DifferentiatedLessonOutput';
import { AssessmentForm } from '@/components/AssessmentForm';
import { AssessmentOutput } from '@/components/AssessmentOutput';
import { RubricForm } from '@/components/RubricForm';
import { RubricOutput } from '@/components/RubricOutput';
import { Button } from '@/components/ui/button';
import { StudentGroup } from '@/types/studentGroup';
import { AssessmentInput } from '@/types/assessment';
import { RubricInput } from '@/types/rubric';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, BookOpenCheck, ShieldCheck, TableProperties, Users, FolderOpen, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useDifferentiation } from '@/contexts/DifferentiationContext';
import { DifferentiationProgress, GenerationStatus, createInitialStatus } from '@/components/DifferentiationProgress';

const Index = () => {
  const [searchParams] = useSearchParams();
  const { setCachedLessonContent, clearSelection } = useDifferentiation();
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam && ['differentiate', 'assessment', 'rubric'].includes(tabParam) 
      ? tabParam 
      : 'differentiate';
  });
  
  // Differentiation state
  const [differentiatedLesson, setDifferentiatedLesson] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<(StudentGroup & { id: string })[]>([]);
  const [originalLessonContent, setOriginalLessonContent] = useState<string>('');
  const [isDifferentiating, setIsDifferentiating] = useState(false);
  const [progressStatus, setProgressStatus] = useState<GenerationStatus>(createInitialStatus());
  const [lastDifferentiateInput, setLastDifferentiateInput] = useState<DifferentiateInput | null>(null);
  const [differentiateError, setDifferentiateError] = useState<string | null>(null);

  // Assessment state
  const [generatedAssessment, setGeneratedAssessment] = useState<string | null>(null);
  const [currentAssessmentInput, setCurrentAssessmentInput] = useState<AssessmentInput | null>(null);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);

  // Rubric state
  const [generatedRubric, setGeneratedRubric] = useState<string | null>(null);
  const [currentRubricInput, setCurrentRubricInput] = useState<RubricInput | null>(null);
  const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);
  const [rubricAutoVerification, setRubricAutoVerification] = useState<{ added: boolean; count: number } | null>(null);

  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleDifferentiate = async (input: DifferentiateInput, isRetry = false) => {
    setIsDifferentiating(true);
    setDifferentiateError(null);
    setSelectedGroups(input.selectedGroups);
    setOriginalLessonContent(input.lessonContent);
    setLastDifferentiateInput(input);

    // Reset and start progress
    const status = createInitialStatus();
    status.analyzing = true;
    status.needsAudio = input.selectedGroups.some(g => 
      g.accommodations?.includes('Read Aloud') || g.homeLanguage !== 'English'
    );
    status.audioGroups = input.selectedGroups.filter(g => 
      g.accommodations?.includes('Read Aloud') || g.homeLanguage !== 'English'
    ).length;
    setProgressStatus(status);

    // Simulate progress updates
    const progressTimer = setTimeout(() => {
      setProgressStatus(prev => ({ ...prev, analyzing: false, analyzingDone: true, contentGenerating: true }));
    }, 3000);

    try {
      // Create abort controller for timeout
      abortControllerRef.current = new AbortController();
      
      // Use fetch directly with extended timeout (5 minutes)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/differentiate-lesson`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            lessonContent: input.lessonContent,
            selectedGroups: input.selectedGroups,
            options: input.options,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      clearTimeout(progressTimer);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update progress to complete
      setProgressStatus(prev => ({
        ...prev,
        analyzing: false,
        analyzingDone: true,
        contentGenerating: false,
        contentDone: true,
        audioGenerating: false,
        audioDone: prev.needsAudio,
        preparingDownloads: false,
        complete: true,
      }));

      setDifferentiatedLesson(data.differentiatedLesson);
    } catch (error) {
      clearTimeout(progressTimer);
      console.error('Error differentiating lesson:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Please try again later.';
      const isTimeout = errorMessage.includes('abort') || errorMessage.includes('timeout') || errorMessage.includes('connection');
      
      setDifferentiateError(isTimeout 
        ? 'The request took too long. This can happen with long lessons or many student groups. Click "Retry" to try again.'
        : errorMessage
      );
      
      toast({
        title: isTimeout ? 'Request timed out' : 'Error differentiating lesson',
        description: isTimeout 
          ? 'Large lessons may take longer to process. Try again or reduce the number of groups.'
          : errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsDifferentiating(false);
      setProgressStatus(createInitialStatus());
      abortControllerRef.current = null;
    }
  };

  const handleRetryDifferentiate = () => {
    if (lastDifferentiateInput) {
      handleDifferentiate(lastDifferentiateInput, true);
    }
  };

  const handleGenerateAssessment = async (input: AssessmentInput) => {
    setIsGeneratingAssessment(true);
    setCurrentAssessmentInput(input);

    try {
      const { data, error } = await supabase.functions.invoke('generate-assessment', {
        body: input,
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedAssessment(data.assessment);
    } catch (error) {
      console.error('Error generating assessment:', error);
      toast({
        title: 'Error generating assessment',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAssessment(false);
    }
  };

  const handleGenerateRubric = async (input: RubricInput) => {
    setIsGeneratingRubric(true);
    setCurrentRubricInput(input);

    try {
      const { data, error } = await supabase.functions.invoke('generate-rubric', {
        body: input,
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedRubric(data.rubric);
      setRubricAutoVerification({
        added: data.autoVerificationAdded || false,
        count: data.autoVerificationCount || 0,
      });
    } catch (error) {
      console.error('Error generating rubric:', error);
      toast({
        title: 'Error generating rubric',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingRubric(false);
    }
  };

  const handleResetDifferentiation = () => {
    setDifferentiatedLesson(null);
    setSelectedGroups([]);
    setCachedLessonContent('');
    clearSelection();
  };

  const handleResetAssessment = () => {
    setGeneratedAssessment(null);
    setCurrentAssessmentInput(null);
  };

  const handleResetRubric = () => {
    setGeneratedRubric(null);
    setCurrentRubricInput(null);
    setRubricAutoVerification(null);
  };

  const handleReset = () => {
    if (differentiatedLesson) handleResetDifferentiation();
    else if (generatedAssessment) handleResetAssessment();
    else if (generatedRubric) handleResetRubric();
  };

  const showResults = differentiatedLesson || generatedAssessment || generatedRubric;

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-warm shadow-soft">
              <BookOpenCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-foreground">
                Educator Tools
              </h1>
              <p className="text-xs text-muted-foreground">
                AI-powered differentiation & assessment
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/saved-lessons">
              <Button variant="ghost" size="sm" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Lessons</span>
              </Button>
            </Link>
            <Link to="/saved-rubrics">
              <Button variant="ghost" size="sm" className="gap-2">
                <TableProperties className="h-4 w-4" />
                <span className="hidden sm:inline">Rubrics</span>
              </Button>
            </Link>
            <Link to="/student-groups">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Student Groups</span>
              </Button>
            </Link>
            <Link to="/audio-usage">
              <Button variant="ghost" size="sm" className="gap-2">
                <Volume2 className="h-4 w-4" />
                <span className="hidden sm:inline">Audio</span>
              </Button>
            </Link>
            {showResults && (
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                ← Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!showResults ? (
          <div className="max-w-3xl mx-auto">
            {/* Hero section */}
            <div className="text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                AI-Powered Teaching Tools
              </div>
              <h2 className="font-display font-extrabold text-3xl md:text-4xl text-foreground mb-3">
                Differentiate & Assess with Confidence
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Create personalized lessons for every learner and design authentic, 
                AI-resistant assessments that reveal genuine student thinking.
              </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="differentiate" className="flex items-center gap-2">
                  <BookOpenCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Differentiate</span>
                </TabsTrigger>
                <TabsTrigger value="assessment" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Assessment</span>
                </TabsTrigger>
                <TabsTrigger value="rubric" className="flex items-center gap-2">
                  <TableProperties className="h-4 w-4" />
                  <span className="hidden sm:inline">Rubric</span>
                </TabsTrigger>
              </TabsList>

              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-medium">
                <TabsContent value="differentiate" className="mt-0">
                  <DifferentiateForm 
                    onSubmit={handleDifferentiate} 
                    isLoading={isDifferentiating}
                    error={differentiateError}
                    onRetry={handleRetryDifferentiate}
                  />
                </TabsContent>

                <TabsContent value="assessment" className="mt-0">
                  <AssessmentForm onSubmit={handleGenerateAssessment} isLoading={isGeneratingAssessment} />
                </TabsContent>

                <TabsContent value="rubric" className="mt-0">
                  <RubricForm onSubmit={handleGenerateRubric} isLoading={isGeneratingRubric} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        ) : differentiatedLesson ? (
          <div className="max-w-4xl mx-auto animate-slide-up">
            {/* Differentiation result header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-success/10">
                <BookOpenCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-foreground">
                  Differentiated Lesson Ready
                </h2>
                <p className="text-sm text-muted-foreground">
                  Customized for {selectedGroups.length} student group{selectedGroups.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <DifferentiatedLessonOutput 
              content={differentiatedLesson} 
              selectedGroups={selectedGroups}
              lessonTitle="Differentiated Lesson"
              originalContent={originalLessonContent}
            />
          </div>
        ) : generatedAssessment ? (
          <div className="max-w-4xl mx-auto animate-slide-up">
            {/* Assessment result header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-success/10">
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-foreground">
                  AI-Resistant Assessment Ready
                </h2>
                <p className="text-sm text-muted-foreground">
                  For lesson: <span className="font-medium text-foreground">{currentAssessmentInput?.lessonTitle}</span>
                </p>
              </div>
            </div>

            <AssessmentOutput 
              content={generatedAssessment} 
              lessonTitle={currentAssessmentInput?.lessonTitle || 'assessment'} 
            />
          </div>
        ) : generatedRubric ? (
          <div className="max-w-4xl mx-auto animate-slide-up">
            {/* Rubric result header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-success/10">
                <TableProperties className="h-5 w-5 text-success" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-foreground">
                  Analytic Rubric Ready
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentRubricInput?.numCriteria} criteria with 4 performance levels
                </p>
              </div>
            </div>

            <RubricOutput 
              content={generatedRubric} 
              assessmentTitle={currentRubricInput?.assessmentDescription.slice(0, 50) || 'rubric'}
              autoVerificationAdded={rubricAutoVerification?.added}
              autoVerificationCount={rubricAutoVerification?.count}
              rubricInput={currentRubricInput || undefined}
              vulnerabilityAnalysis={currentRubricInput?.vulnerabilityAnalysis}
            />
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Built for educators who believe every student deserves access to the curriculum.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
