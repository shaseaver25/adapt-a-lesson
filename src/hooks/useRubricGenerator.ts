import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { RubricInput } from '@/types/rubric';

interface UseRubricGeneratorReturn {
  generatedRubric: string | null;
  currentRubricInput: RubricInput | null;
  isGeneratingRubric: boolean;
  rubricAutoVerification: { added: boolean; count: number } | null;
  handleGenerateRubric: (input: RubricInput) => Promise<void>;
  handleResetRubric: () => void;
}

export function useRubricGenerator(): UseRubricGeneratorReturn {
  const [generatedRubric, setGeneratedRubric] = useState<string | null>(null);
  const [currentRubricInput, setCurrentRubricInput] = useState<RubricInput | null>(null);
  const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);
  const [rubricAutoVerification, setRubricAutoVerification] = useState<{ added: boolean; count: number } | null>(null);

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

  const handleResetRubric = () => {
    setGeneratedRubric(null);
    setCurrentRubricInput(null);
    setRubricAutoVerification(null);
  };

  return {
    generatedRubric,
    currentRubricInput,
    isGeneratingRubric,
    rubricAutoVerification,
    handleGenerateRubric,
    handleResetRubric,
  };
}
