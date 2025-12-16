import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  generateAllLessonImages, 
  extractVisualDescriptions 
} from '@/lib/imageGeneration';

interface UseLessonImagesReturn {
  imageMap: Map<string, string>;
  isGenerating: boolean;
  progress: { completed: number; total: number };
  generateImages: (content: string, lessonId?: string, groupId?: string, subject?: string) => Promise<Map<string, string>>;
  hasVisuals: (content: string) => boolean;
}

export function useLessonImages(): UseLessonImagesReturn {
  const [imageMap, setImageMap] = useState<Map<string, string>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const hasVisuals = useCallback((content: string): boolean => {
    return extractVisualDescriptions(content).length > 0;
  }, []);

  const generateImages = useCallback(async (
    content: string,
    lessonId?: string,
    groupId?: string,
    subject?: string
  ): Promise<Map<string, string>> => {
    const descriptions = extractVisualDescriptions(content);
    
    if (descriptions.length === 0) {
      return new Map();
    }
    
    setIsGenerating(true);
    setProgress({ completed: 0, total: descriptions.length });
    
    try {
      toast.info(`Generating ${descriptions.length} diagram(s)...`);
      
      const result = await generateAllLessonImages(
        descriptions,
        lessonId,
        groupId,
        subject,
        (completed, total) => {
          setProgress({ completed, total });
        }
      );
      
      setImageMap(result);
      
      const successCount = result.size;
      const failCount = descriptions.length - successCount;
      
      if (successCount > 0 && failCount === 0) {
        toast.success(`Generated ${successCount} diagram(s) successfully!`);
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(`Generated ${successCount}/${descriptions.length} diagrams. ${failCount} failed.`);
      } else {
        toast.error('Could not generate diagrams. Images will show as placeholders.');
      }
      
      return result;
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error('Failed to generate diagrams');
      return new Map();
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    imageMap,
    isGenerating,
    progress,
    generateImages,
    hasVisuals
  };
}
