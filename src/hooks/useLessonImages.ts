import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  generateAllLessonImages,
  extractVisualDescriptions
} from '@/lib/imageGeneration';
import type { VisualAssets } from '../../supabase/functions/_shared/lessonHtmlRenderer.ts';

function emptyAssets(): Required<VisualAssets> {
  return {
    imageMap: new Map<string, string>(),
    altTextMap: new Map<string, string>(),
    longDescriptionMap: new Map<string, string>(),
  };
}

interface UseLessonImagesReturn {
  assets: Required<VisualAssets>;
  imageMap: Map<string, string>;
  isGenerating: boolean;
  progress: { completed: number; total: number };
  generateImages: (content: string, lessonId?: string, groupId?: string, subject?: string) => Promise<VisualAssets>;
  hasVisuals: (content: string) => boolean;
}

export function useLessonImages(): UseLessonImagesReturn {
  const [assets, setAssets] = useState<Required<VisualAssets>>(emptyAssets);
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
  ): Promise<VisualAssets> => {
    const descriptions = extractVisualDescriptions(content);

    if (descriptions.length === 0) {
      return emptyAssets();
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

      const next: Required<VisualAssets> = {
        imageMap: result.imageMap ?? new Map(),
        altTextMap: result.altTextMap ?? new Map(),
        longDescriptionMap: result.longDescriptionMap ?? new Map(),
      };
      setAssets(next);

      const successCount = next.imageMap.size;
      const failCount = descriptions.length - successCount;
      const missingAltText = successCount - next.altTextMap.size;

      if (successCount > 0 && failCount === 0) {
        toast.success(`Generated ${successCount} diagram(s) successfully!`);
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(`Generated ${successCount}/${descriptions.length} diagrams. ${failCount} failed.`);
      } else {
        toast.error('Could not generate diagrams. Images will show as placeholders.');
      }

      if (missingAltText > 0) {
        toast.warning(
          `${missingAltText} diagram(s) could not be described automatically`,
          { description: 'Their alt text falls back to the prompt and needs review before export.' },
        );
      }

      return next;
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error('Failed to generate diagrams');
      return emptyAssets();
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    assets,
    imageMap: assets.imageMap,
    isGenerating,
    progress,
    generateImages,
    hasVisuals
  };
}
