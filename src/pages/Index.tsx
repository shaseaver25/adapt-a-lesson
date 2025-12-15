import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DifferentiateForm, DifferentiateInput } from '@/components/DifferentiateForm';
import { DifferentiatedLessonOutput } from '@/components/DifferentiatedLessonOutput';
import { AssessmentForm } from '@/components/AssessmentForm';
import { AssessmentOutput } from '@/components/AssessmentOutput';
import { RubricForm } from '@/components/RubricForm';
import { RubricOutput } from '@/components/RubricOutput';
import { AudioScriptForm } from '@/components/AudioScriptForm';
import { AudioScriptOutput } from '@/components/AudioScriptOutput';
import { Button } from '@/components/ui/button';
import { StudentGroup } from '@/types/studentGroup';
import { AssessmentInput } from '@/types/assessment';
import { RubricInput } from '@/types/rubric';
import { AudioScriptInput } from '@/types/audioScript';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, BookOpenCheck, ShieldCheck, TableProperties, FileAudio, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState('differentiate');
  
  // Differentiation state
  const [differentiatedLesson, setDifferentiatedLesson] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<(StudentGroup & { id: string })[]>([]);
  const [isDifferentiating, setIsDifferentiating] = useState(false);

  // Assessment state
  const [generatedAssessment, setGeneratedAssessment] = useState<string | null>(null);
  const [currentAssessmentInput, setCurrentAssessmentInput] = useState<AssessmentInput | null>(null);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);

  // Rubric state
  const [generatedRubric, setGeneratedRubric] = useState<string | null>(null);
  const [currentRubricInput, setCurrentRubricInput] = useState<RubricInput | null>(null);
  const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);

  // Audio Script state
  const [generatedAudioScript, setGeneratedAudioScript] = useState<string | null>(null);
  const [currentAudioScriptInput, setCurrentAudioScriptInput] = useState<AudioScriptInput | null>(null);
  const [isGeneratingAudioScript, setIsGeneratingAudioScript] = useState(false);

  const handleDifferentiate = async (input: DifferentiateInput) => {
    setIsDifferentiating(true);
    setSelectedGroups(input.selectedGroups);

    try {
      const { data, error } = await supabase.functions.invoke('differentiate-lesson', {
        body: {
          lessonContent: input.lessonContent,
          selectedGroups: input.selectedGroups,
          options: input.options,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setDifferentiatedLesson(data.differentiatedLesson);
    } catch (error) {
      console.error('Error differentiating lesson:', error);
      toast({
        title: 'Error differentiating lesson',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsDifferentiating(false);
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
  };

  const handleResetAssessment = () => {
    setGeneratedAssessment(null);
    setCurrentAssessmentInput(null);
  };

  const handleResetRubric = () => {
    setGeneratedRubric(null);
    setCurrentRubricInput(null);
  };

  const handleResetAudioScript = () => {
    setGeneratedAudioScript(null);
    setCurrentAudioScriptInput(null);
  };

  const handleGenerateAudioScript = async (input: AudioScriptInput) => {
    setIsGeneratingAudioScript(true);
    setCurrentAudioScriptInput(input);

    try {
      const { data, error } = await supabase.functions.invoke('generate-audio-script', {
        body: input,
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedAudioScript(data.audioScript);
    } catch (error) {
      console.error('Error generating audio script:', error);
      toast({
        title: 'Error generating audio script',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAudioScript(false);
    }
  };

  const handleReset = () => {
    if (differentiatedLesson) handleResetDifferentiation();
    else if (generatedAssessment) handleResetAssessment();
    else if (generatedRubric) handleResetRubric();
    else if (generatedAudioScript) handleResetAudioScript();
  };

  const showResults = differentiatedLesson || generatedAssessment || generatedRubric || generatedAudioScript;

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
          <div className="flex items-center gap-3">
            <Link to="/student-groups">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Student Groups</span>
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
              <TabsList className="grid w-full grid-cols-4 mb-6">
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
                <TabsTrigger value="audio" className="flex items-center gap-2">
                  <FileAudio className="h-4 w-4" />
                  <span className="hidden sm:inline">Audio</span>
                </TabsTrigger>
              </TabsList>

              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-medium">
                <TabsContent value="differentiate" className="mt-0">
                  <DifferentiateForm onSubmit={handleDifferentiate} isLoading={isDifferentiating} />
                </TabsContent>

                <TabsContent value="assessment" className="mt-0">
                  <AssessmentForm onSubmit={handleGenerateAssessment} isLoading={isGeneratingAssessment} />
                </TabsContent>

                <TabsContent value="rubric" className="mt-0">
                  <RubricForm onSubmit={handleGenerateRubric} isLoading={isGeneratingRubric} />
                </TabsContent>

                <TabsContent value="audio" className="mt-0">
                  <AudioScriptForm onSubmit={handleGenerateAudioScript} isLoading={isGeneratingAudioScript} />
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
              lessonTitle="lesson"
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
            />
          </div>
        ) : generatedAudioScript ? (
          <div className="max-w-4xl mx-auto animate-slide-up">
            {/* Audio Script result header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-success/10">
                <FileAudio className="h-5 w-5 text-success" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-foreground">
                  Audio Script Ready
                </h2>
                <p className="text-sm text-muted-foreground">
                  Prepared for {currentAudioScriptInput?.language} TTS
                </p>
              </div>
            </div>

            <AudioScriptOutput 
              content={generatedAudioScript} 
              language={currentAudioScriptInput?.language || 'English'} 
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
