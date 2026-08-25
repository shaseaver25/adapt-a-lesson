import { supabase } from '@/integrations/supabase/client';
import type { VisualAssets } from '../../supabase/functions/_shared/lessonHtmlRenderer.ts';

export interface GeneratedLessonImage {
  url: string;
  /** Written by a vision model from the finished image; null when that call failed. */
  altText: string | null;
  /** Visible long description for data-bearing diagrams; null for simple images. */
  longDescription: string | null;
}

/**
 * Generate a single lesson diagram image using Nano Banana
 */
export async function generateLessonImage(
  description: string,
  lessonId?: string,
  groupId?: string,
  subject?: string
): Promise<GeneratedLessonImage | null> {
  try {
    console.log(`[ImageGen] Generating image for: "${description.substring(0, 100)}..."`);
    console.log(`[ImageGen] Calling edge function with params:`, { lessonId, groupId, subject });
    
    const { data, error } = await supabase.functions.invoke('generate-lesson-diagram', {
      body: {
        description,
        lessonId,
        groupId,
        subject,
      },
    });

    console.log(`[ImageGen] Edge function response:`, { data, error });

    if (error) {
      console.error('[ImageGen] Function invoke error:', error);
      return null;
    }

    if (data?.error) {
      console.error('[ImageGen] Edge function returned error:', data.error);
      if (data.fallback) {
        console.warn('[ImageGen] Using fallback due to:', data.error);
        return null;
      }
      throw new Error(data.error);
    }

    if (!data?.imageUrl) {
      console.error('[ImageGen] No imageUrl in response:', data);
      return null;
    }

    console.log(`[ImageGen] SUCCESS - Image URL received (${data.imageUrl.length} chars)`);
    return {
      url: data.imageUrl,
      altText: typeof data.altText === 'string' && data.altText.trim() ? data.altText.trim() : null,
      longDescription:
        typeof data.longDescription === 'string' && data.longDescription.trim()
          ? data.longDescription.trim()
          : null,
    };
  } catch (error) {
    console.error('[ImageGen] Generation failed:', error);
    return null;
  }
}

/**
 * Extract all [VISUAL: ...] descriptions from content
 */
export function extractVisualDescriptions(content: string): string[] {
  // Support both [VISUAL: ...] and [NANOBANANA: "..."] formats
  const visualRegex = /\[VISUAL:\s*(.+?)\]/g;
  const nanobananaRegex = /\[NANOBANANA:\s*"(.+?)"\]/g;
  const descriptions: string[] = [];
  let match;
  
  while ((match = visualRegex.exec(content)) !== null) {
    descriptions.push(match[1].trim());
  }
  
  while ((match = nanobananaRegex.exec(content)) !== null) {
    descriptions.push(match[1].trim());
  }
  
  return [...new Set(descriptions)]; // Return unique descriptions
}

/**
 * Generate images for all visual descriptions in lesson content
 * Processes in batches to avoid overwhelming the API
 */
export async function generateAllLessonImages(
  visualDescriptions: string[],
  lessonId?: string,
  groupId?: string,
  subject?: string,
  onProgress?: (completed: number, total: number) => void
): Promise<VisualAssets> {
  const imageMap = new Map<string, string>();
  const altTextMap = new Map<string, string>();
  const longDescriptionMap = new Map<string, string>();

  if (visualDescriptions.length === 0) {
    return { imageMap, altTextMap, longDescriptionMap };
  }
  
  // Process in batches of 2 to avoid rate limits
  const batchSize = 2;
  let completed = 0;
  
  for (let i = 0; i < visualDescriptions.length; i += batchSize) {
    const batch = visualDescriptions.slice(i, i + batchSize);
    
    const results = await Promise.all(
      batch.map(async (desc) => {
        const image = await generateLessonImage(desc, lessonId, groupId, subject);
        return { desc, image };
      })
    );

    results.forEach(({ desc, image }) => {
      if (image) {
        imageMap.set(desc, image.url);
        if (image.altText) altTextMap.set(desc, image.altText);
        if (image.longDescription) longDescriptionMap.set(desc, image.longDescription);
      }
      completed++;
      onProgress?.(completed, visualDescriptions.length);
    });
    
    // Small delay between batches to avoid rate limits
    if (i + batchSize < visualDescriptions.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return { imageMap, altTextMap, longDescriptionMap };
}
