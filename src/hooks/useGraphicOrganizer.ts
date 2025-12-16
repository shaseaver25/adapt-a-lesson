import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { GraphicOrganizerType } from '@/contexts/DifferentiationContext';

interface GraphicOrganizerResult {
  imageUrl: string;
  organizerType: string;
  topic: string;
  labels: string[];
}

interface UseGraphicOrganizerReturn {
  generateOrganizer: (
    organizerType: GraphicOrganizerType,
    topic: string,
    language?: string,
    lessonId?: string,
    groupId?: string
  ) => Promise<GraphicOrganizerResult | null>;
  isGenerating: boolean;
  error: string | null;
}

export function useGraphicOrganizer(): UseGraphicOrganizerReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateOrganizer = useCallback(async (
    organizerType: GraphicOrganizerType,
    topic: string,
    language: string = 'English',
    lessonId?: string,
    groupId?: string
  ): Promise<GraphicOrganizerResult | null> => {
    if (organizerType === 'none' || organizerType === 'auto') {
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log(`Generating ${organizerType} graphic organizer for: ${topic}`);

      const { data, error: fnError } = await supabase.functions.invoke('generate-graphic-organizer', {
        body: {
          organizerType,
          topic,
          language,
          lessonId,
          groupId,
        },
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        if (data.fallback) {
          // API failed but we can continue without image
          console.warn('Graphic organizer generation failed, using fallback:', data.error);
          return null;
        }
        throw new Error(data.error);
      }

      console.log('Graphic organizer generated successfully:', data.imageUrl?.substring(0, 100));

      return {
        imageUrl: data.imageUrl,
        organizerType: data.organizerType,
        topic: data.topic || topic,
        labels: data.labels || [],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate graphic organizer';
      console.error('Graphic organizer error:', message);
      setError(message);
      
      // Don't show toast for rate limits - they're expected
      if (!message.includes('Rate limit') && !message.includes('credits')) {
        toast.error('Could not generate graphic organizer image');
      }
      
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateOrganizer,
    isGenerating,
    error,
  };
}

// Helper to determine best organizer type based on content
export function suggestOrganizerType(lessonContent: string): GraphicOrganizerType {
  const content = lessonContent.toLowerCase();
  
  if (content.includes('compare') || content.includes('contrast') || content.includes('similar') || content.includes('different')) {
    return 'venn-diagram';
  }
  if (content.includes('cause') || content.includes('effect') || content.includes('result') || content.includes('because')) {
    return 'cause-effect';
  }
  if (content.includes('sequence') || content.includes('process') || content.includes('steps') || content.includes('first') && content.includes('then')) {
    return 'flow-chart';
  }
  if (content.includes('vocabulary') || content.includes('definition') || content.includes('word')) {
    return 'frayer-model';
  }
  if (content.includes('story') || content.includes('character') || content.includes('setting') || content.includes('plot')) {
    return 'story-map';
  }
  if (content.includes('claim') || content.includes('evidence') || content.includes('argument') || content.includes('prove')) {
    return 'claim-evidence';
  }
  if (content.includes('pros') || content.includes('cons') || content.includes('advantages') || content.includes('disadvantages')) {
    return 't-chart';
  }
  
  // Default to web diagram for general topics
  return 'web-diagram';
}
