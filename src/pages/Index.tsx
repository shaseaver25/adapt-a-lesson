import { useState } from 'react';
import { StudentGroupForm } from '@/components/StudentGroupForm';
import { LessonOutput } from '@/components/LessonOutput';
import { AssessmentForm } from '@/components/AssessmentForm';
import { AssessmentOutput } from '@/components/AssessmentOutput';
import { generateDifferentiatedLesson } from '@/lib/differentiation';
import { StudentGroup } from '@/types/studentGroup';
import { AssessmentInput } from '@/types/assessment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, BookOpenCheck, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState('differentiate');
  
  // Differentiation state
  const [differentiatedLesson, setDifferentiatedLesson] = useState<string | null>(null);
  const [currentGroup, setCurrentGroup] = useState<StudentGroup | null>(null);
  const [isDifferentiating, setIsDifferentiating] = useState(false);

  // Assessment state
  const [generatedAssessment, setGeneratedAssessment] = useState<string | null>(null);
  const [currentAssessmentInput, setCurrentAssessmentInput] = useState<AssessmentInput | null>(null);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);

  const handleDifferentiate = async (group: StudentGroup, lesson: string) => {
    setIsDifferentiating(true);
    setCurrentGroup(group);
    
    // Simulate processing time (will be replaced with AI call)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const result = generateDifferentiatedLesson(lesson, group);
    setDifferentiatedLesson(result);
    setIsDifferentiating(false);
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

  const handleResetDifferentiation = () => {
    setDifferentiatedLesson(null);
    setCurrentGroup(null);
  };

  const handleResetAssessment = () => {
    setGeneratedAssessment(null);
    setCurrentAssessmentInput(null);
  };

  const showResults = differentiatedLesson || generatedAssessment;

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
          {showResults && (
            <button
              onClick={differentiatedLesson ? handleResetDifferentiation : handleResetAssessment}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              ← Start Over
            </button>
          )}
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
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="differentiate" className="flex items-center gap-2">
                  <BookOpenCheck className="h-4 w-4" />
                  Differentiate Lesson
                </TabsTrigger>
                <TabsTrigger value="assessment" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Generate Assessment
                </TabsTrigger>
              </TabsList>

              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-medium">
                <TabsContent value="differentiate" className="mt-0">
                  <StudentGroupForm onSubmit={handleDifferentiate} isLoading={isDifferentiating} />
                </TabsContent>

                <TabsContent value="assessment" className="mt-0">
                  <AssessmentForm onSubmit={handleGenerateAssessment} isLoading={isGeneratingAssessment} />
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
                  Customized for: <span className="font-medium text-foreground">{currentGroup?.groupName}</span>
                </p>
              </div>
            </div>

            <LessonOutput 
              content={differentiatedLesson} 
              groupName={currentGroup?.groupName || 'lesson'} 
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
