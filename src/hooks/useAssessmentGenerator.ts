import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LessonContext, LocalContext, MethodOutput } from '@/types/assessmentMethods';

export interface AssessmentInput {
  lessonContext: LessonContext;
  localContext: LocalContext;
  selectedCategory: string;
  selectedMethod: string;
  methodDetails: MethodOutput;
}

interface UseAssessmentGeneratorReturn {
  generatedAssessment: string | null;
  isGeneratingAssessment: boolean;
  handleGenerateAssessment: (input: AssessmentInput) => Promise<void>;
  handleResetAssessment: () => void;
}

export function useAssessmentGenerator(): UseAssessmentGeneratorReturn {
  const [generatedAssessment, setGeneratedAssessment] = useState<string | null>(null);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);

  const handleGenerateAssessment = async (input: AssessmentInput) => {
    setIsGeneratingAssessment(true);

    try {
      const assessmentInput = {
        lessonTitle: input.lessonContext.title,
        subject: input.lessonContext.subject,
        gradeLevel: input.lessonContext.gradeLevel,
        learningObjectives: input.lessonContext.objectives.filter(o => o.trim() !== ''),
        aiPolicy: 'limited_assist' as const,
        schoolName: input.localContext.schoolName,
        city: input.localContext.city,
        state: input.localContext.state,
        localContext: input.localContext.details,
        assessmentMethod: input.selectedMethod,
        methodCategory: input.selectedCategory,
        methodOutputs: input.methodDetails.outputs || [],
      };

      const { data, error } = await supabase.functions.invoke('generate-assessment', {
        body: assessmentInput,
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

  const handleResetAssessment = () => {
    setGeneratedAssessment(null);
  };

  return {
    generatedAssessment,
    isGeneratingAssessment,
    handleGenerateAssessment,
    handleResetAssessment,
  };
}
