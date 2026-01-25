import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageVariation {
  url: string;
  index: number;
}

interface VariationState {
  description: string;
  variations: ImageVariation[];
  isGenerating: boolean;
}

interface UseLessonImageVariationsReturn {
  variationsState: VariationState | null;
  selectedImages: Map<string, string>;
  isGenerating: boolean;
  generateVariations: (
    description: string,
    lessonId?: string,
    groupId?: string,
    subject?: string
  ) => Promise<void>;
  selectImage: (description: string, url: string) => void;
  clearVariations: () => void;
}

export function useLessonImageVariations(): UseLessonImageVariationsReturn {
  const [variationsState, setVariationsState] = useState<VariationState | null>(null);
  const [selectedImages, setSelectedImages] = useState<Map<string, string>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);

  const generateVariations = useCallback(async (
    description: string,
    lessonId?: string,
    groupId?: string,
    subject?: string
  ) => {
    setIsGenerating(true);
    setVariationsState({
      description,
      variations: [],
      isGenerating: true,
    });

    try {
      toast.info('Generating 3 image options...');

      // Generate 3 variations in parallel
      const variationPromises = [0, 1, 2].map(async (index) => {
        const { data, error } = await supabase.functions.invoke('generate-lesson-diagram', {
          body: {
            description,
            lessonId,
            groupId,
            subject,
            variationIndex: index, // Pass index for prompt variation
          },
        });

        if (error) {
          console.error(`[Variations] Error generating option ${index + 1}:`, error);
          return null;
        }

        if (data?.imageUrl) {
          return { url: data.imageUrl, index };
        }
        return null;
      });

      const results = await Promise.all(variationPromises);
      const successfulVariations = results.filter((v): v is ImageVariation => v !== null);

      if (successfulVariations.length === 0) {
        toast.error('Could not generate image options. Please try again.');
        setVariationsState(null);
        return;
      }

      // Sort by index to maintain order
      successfulVariations.sort((a, b) => a.index - b.index);

      setVariationsState({
        description,
        variations: successfulVariations,
        isGenerating: false,
      });

      toast.success(`Generated ${successfulVariations.length} options - choose your favorite!`);
    } catch (error) {
      console.error('[Variations] Generation failed:', error);
      toast.error('Failed to generate image options');
      setVariationsState(null);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const selectImage = useCallback((description: string, url: string) => {
    setSelectedImages(prev => {
      const next = new Map(prev);
      next.set(description, url);
      return next;
    });
    setVariationsState(null);
    toast.success('Image selected!');
  }, []);

  const clearVariations = useCallback(() => {
    setVariationsState(null);
  }, []);

  return {
    variationsState,
    selectedImages,
    isGenerating,
    generateVariations,
    selectImage,
    clearVariations,
  };
}
