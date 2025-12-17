import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LessonImage {
  id: string;
  lesson_id: string;
  group_id: string | null;
  storage_path: string;
  description: string | null;
  alt_text: string | null;
  file_size: number | null;
  created_at: string;
  signedUrl?: string;
}

interface UseLessonImagesDBReturn {
  images: LessonImage[];
  isLoading: boolean;
  error: string | null;
  fetchImages: (lessonId: string) => Promise<LessonImage[]>;
  refreshSignedUrl: (storagePath: string) => Promise<string | null>;
  fetchAllUserImages: () => Promise<LessonImage[]>;
}

export function useLessonImagesDB(): UseLessonImagesDBReturn {
  const [images, setImages] = useState<LessonImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSignedUrl = useCallback(async (storagePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('lesson-audio')
      .createSignedUrl(storagePath, 14400); // 4 hours

    if (error) {
      console.error('Error refreshing signed URL:', error);
      return null;
    }
    return data?.signedUrl || null;
  }, []);

  const fetchImages = useCallback(async (lessonId: string): Promise<LessonImage[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('lesson_images')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Generate signed URLs for each image
      const imagesWithUrls = await Promise.all(
        (data || []).map(async (img) => {
          const signedUrl = await refreshSignedUrl(img.storage_path);
          return { ...img, signedUrl: signedUrl || undefined };
        })
      );

      setImages(imagesWithUrls);
      return imagesWithUrls;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch images';
      setError(message);
      console.error('Error fetching lesson images:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [refreshSignedUrl]);

  const fetchAllUserImages = useCallback(async (): Promise<LessonImage[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('lesson_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Generate signed URLs for each image
      const imagesWithUrls = await Promise.all(
        (data || []).map(async (img) => {
          const signedUrl = await refreshSignedUrl(img.storage_path);
          return { ...img, signedUrl: signedUrl || undefined };
        })
      );

      setImages(imagesWithUrls);
      return imagesWithUrls;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch images';
      setError(message);
      console.error('Error fetching all user images:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [refreshSignedUrl]);

  return {
    images,
    isLoading,
    error,
    fetchImages,
    refreshSignedUrl,
    fetchAllUserImages,
  };
}
