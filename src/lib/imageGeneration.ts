import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a single lesson diagram image using Nano Banana
 */
export async function generateLessonImage(
  description: string,
  lessonId?: string,
  groupId?: string,
  subject?: string
): Promise<string | null> {
  try {
    console.log(`Generating image for: ${description}`);
    
    const { data, error } = await supabase.functions.invoke('generate-lesson-diagram', {
      body: {
        description,
        lessonId,
        groupId,
        subject,
      },
    });

    if (error) {
      console.error('Image generation function error:', error);
      return null;
    }

    if (data.error) {
      if (data.fallback) {
        console.warn('Image generation failed, using fallback:', data.error);
        return null;
      }
      throw new Error(data.error);
    }

    return data.imageUrl || null;
  } catch (error) {
    console.error('Image generation failed:', error);
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
): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>();
  
  if (visualDescriptions.length === 0) {
    return imageMap;
  }
  
  // Process in batches of 2 to avoid rate limits
  const batchSize = 2;
  let completed = 0;
  
  for (let i = 0; i < visualDescriptions.length; i += batchSize) {
    const batch = visualDescriptions.slice(i, i + batchSize);
    
    const results = await Promise.all(
      batch.map(async (desc) => {
        const url = await generateLessonImage(desc, lessonId, groupId, subject);
        return { desc, url };
      })
    );
    
    results.forEach(({ desc, url }) => {
      if (url) {
        imageMap.set(desc, url);
      }
      completed++;
      onProgress?.(completed, visualDescriptions.length);
    });
    
    // Small delay between batches to avoid rate limits
    if (i + batchSize < visualDescriptions.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return imageMap;
}
