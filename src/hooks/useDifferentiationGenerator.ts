import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { StudentGroup } from '@/types/studentGroup';
import { DifferentiationProgressState, createInitialProgressState } from '@/components/DifferentiationProgressModal';
import { DifferentiateInput } from '@/components/DifferentiateForm';

interface UseDifferentiationGeneratorReturn {
  differentiatedLesson: string | null;
  selectedGroups: (StudentGroup & { id: string })[];
  originalLessonContent: string;
  isDifferentiating: boolean;
  currentLessonId: string | null;
  progressStatus: DifferentiationProgressState;
  showProgressModal: boolean;
  lastDifferentiateInput: DifferentiateInput | null;
  differentiateError: string | null;
  isLessonSaved: boolean;
  handleDifferentiate: (input: DifferentiateInput, isRetry?: boolean) => Promise<void>;
  handleRetryDifferentiate: () => void;
  handleCancelGeneration: () => void;
  handleLessonSaved: () => void;
  handleResetDifferentiation: () => void;
  setShowProgressModal: (show: boolean) => void;
  setProgressStatus: React.Dispatch<React.SetStateAction<DifferentiationProgressState>>;
}

export function useDifferentiationGenerator(
  setCachedLessonContent: (content: string) => void,
  clearSelection: () => void,
  generateAudio: (lessonId: string, content: string, groups: (StudentGroup & { id: string })[]) => Promise<any>
): UseDifferentiationGeneratorReturn {
  const [differentiatedLesson, setDifferentiatedLesson] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<(StudentGroup & { id: string })[]>([]);
  const [originalLessonContent, setOriginalLessonContent] = useState<string>('');
  const [isDifferentiating, setIsDifferentiating] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [progressStatus, setProgressStatus] = useState<DifferentiationProgressState>(createInitialProgressState());
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [lastDifferentiateInput, setLastDifferentiateInput] = useState<DifferentiateInput | null>(null);
  const [differentiateError, setDifferentiateError] = useState<string | null>(null);
  const [isLessonSaved, setIsLessonSaved] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsDifferentiating(false);
      setShowProgressModal(false);
      setProgressStatus(createInitialProgressState());
      toast({
        title: 'Generation cancelled',
        description: 'Lesson differentiation was stopped.',
      });
    }
  }, []);

  const handleLessonSaved = useCallback(() => {
    setIsLessonSaved(true);
  }, []);

  const handleDifferentiate = async (input: DifferentiateInput, isRetry = false) => {
    setIsDifferentiating(true);
    setDifferentiateError(null);
    setSelectedGroups(input.selectedGroups);
    setOriginalLessonContent(input.lessonContent);
    setLastDifferentiateInput(input);
    setIsLessonSaved(false);

    // Determine audio needs
    const groupsNeedingAudio = input.selectedGroups.filter(g => 
      g.accommodations?.includes('Read Aloud') || g.homeLanguage !== 'English'
    );
    const audioLanguages = [...new Set(
      groupsNeedingAudio.flatMap(g => [
        'English',
        g.homeLanguage !== 'English' ? g.homeLanguage : null
      ].filter(Boolean) as string[])
    )];

    // Initialize progress state
    const initialProgress: DifferentiationProgressState = {
      contentStatus: 'generating',
      groupsProcessed: 0,
      totalGroups: input.selectedGroups.length,
      audioStatus: groupsNeedingAudio.length > 0 ? 'pending' : 'skipped',
      audioSectionsComplete: 0,
      audioSectionsTotal: groupsNeedingAudio.length * 5,
      audioSectionsFailed: 0,
      audioLanguages,
      isComplete: false,
    };
    setProgressStatus(initialProgress);
    setShowProgressModal(true);

    // Simulate content generation progress
    const progressTimer = setTimeout(() => {
      setProgressStatus(prev => ({ 
        ...prev, 
        groupsProcessed: Math.floor(prev.totalGroups / 2),
      }));
    }, 2000);

    try {
      abortControllerRef.current = new AbortController();
      
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

      setProgressStatus(prev => ({
        ...prev,
        contentStatus: 'complete',
        groupsProcessed: prev.totalGroups,
      }));

      const needsAudio = input.selectedGroups.some(g => 
        g.accommodations?.includes('Read Aloud') || g.homeLanguage !== 'English'
      );

      // Save lesson to database
      let lessonId: string | null = null;
      try {
        const { data: lessonData, error: lessonError } = await supabase
          .from('generated_lessons')
          .insert({
            original_content: input.lessonContent,
            lesson_title: input.lessonName || 'Untitled Lesson',
            group_ids: input.selectedGroups.map(g => g.id),
            teacher_guide: data.differentiatedLesson,
            differentiation_options: input.options as any,
          })
          .select('id')
          .single();

        if (!lessonError && lessonData) {
          lessonId = lessonData.id;
          setCurrentLessonId(lessonId);
        }
      } catch (saveError) {
        console.error('Error saving lesson for audio:', saveError);
      }

      // Generate audio if needed
      if (needsAudio && lessonId) {
        setProgressStatus(prev => ({
          ...prev,
          audioStatus: 'generating',
        }));

        generateAudio(lessonId, data.differentiatedLesson, input.selectedGroups)
          .then((result) => {
            console.log('Audio generation result:', result);
            setProgressStatus(prev => ({
              ...prev,
              audioStatus: 'complete',
              audioSectionsComplete: result?.generated || prev.audioSectionsTotal,
            }));
          })
          .catch((audioError) => {
            console.error('Audio generation error:', audioError);
            setProgressStatus(prev => ({
              ...prev,
              audioStatus: 'partial',
              audioSectionsFailed: prev.audioSectionsTotal - prev.audioSectionsComplete,
            }));
          });
      }

      setProgressStatus(prev => ({
        ...prev,
        isComplete: true,
        audioStatus: needsAudio ? prev.audioStatus : 'skipped',
      }));

      setDifferentiatedLesson(data.differentiatedLesson);
    } catch (error) {
      clearTimeout(progressTimer);
      console.error('Error differentiating lesson:', error);
      
      setShowProgressModal(false);
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
      abortControllerRef.current = null;
    }
  };

  const handleRetryDifferentiate = () => {
    if (lastDifferentiateInput) {
      handleDifferentiate(lastDifferentiateInput, true);
    }
  };

  const handleResetDifferentiation = () => {
    setDifferentiatedLesson(null);
    setSelectedGroups([]);
    setCachedLessonContent('');
    clearSelection();
    setIsLessonSaved(false);
    setCurrentLessonId(null);
    setDifferentiateError(null);
  };

  return {
    differentiatedLesson,
    selectedGroups,
    originalLessonContent,
    isDifferentiating,
    currentLessonId,
    progressStatus,
    showProgressModal,
    lastDifferentiateInput,
    differentiateError,
    isLessonSaved,
    handleDifferentiate,
    handleRetryDifferentiate,
    handleCancelGeneration,
    handleLessonSaved,
    handleResetDifferentiation,
    setShowProgressModal,
    setProgressStatus,
  };
}
