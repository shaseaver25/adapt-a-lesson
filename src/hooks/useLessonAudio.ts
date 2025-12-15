import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { StudentGroup } from '@/types/studentGroup';

export interface AudioRecord {
  id: string;
  lesson_id: string;
  group_id: string;
  group_name: string;
  section_type: string;
  section_id: string;
  audio_url: string;
  duration_seconds: number;
  language: string;
  characters_used: number;
  created_at: string;
}

export interface AudioGenerationResult {
  status: 'complete' | 'partial' | 'failed' | 'pending';
  generated: number;
  failed: number;
  audioRecords?: AudioRecord[];
}

export interface UseLessonAudioReturn {
  isGenerating: boolean;
  progress: { generated: number; total: number };
  audioRecords: AudioRecord[];
  generateAudio: (lessonId: string, content: string, groups: (StudentGroup & { id: string })[]) => Promise<AudioGenerationResult>;
  fetchLessonAudio: (lessonId: string) => Promise<AudioRecord[]>;
  getAudioForSection: (groupName: string, sectionType: string, language?: string) => AudioRecord | undefined;
}

export function useLessonAudio(): UseLessonAudioReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ generated: 0, total: 0 });
  const [audioRecords, setAudioRecords] = useState<AudioRecord[]>([]);

  const fetchLessonAudio = useCallback(async (lessonId: string): Promise<AudioRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('generated_audio')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const records = (data || []) as AudioRecord[];
      setAudioRecords(records);
      return records;
    } catch (error) {
      console.error('Error fetching lesson audio:', error);
      return [];
    }
  }, []);

  const generateAudio = useCallback(async (
    lessonId: string,
    content: string,
    groups: (StudentGroup & { id: string })[]
  ): Promise<AudioGenerationResult> => {
    // Check which groups need audio
    const audioGroups = groups.filter(group => 
      group.accommodations?.includes('Read Aloud') || group.homeLanguage !== 'English'
    );

    if (audioGroups.length === 0) {
      return { status: 'complete', generated: 0, failed: 0 };
    }

    // Estimate total sections (rough estimate)
    const estimatedSections = audioGroups.length * 5 * (audioGroups.some(g => g.homeLanguage !== 'English') ? 2 : 1);
    setProgress({ generated: 0, total: estimatedSections });
    setIsGenerating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-lesson-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            lessonId,
            differentiatedContent: content,
            selectedGroups: audioGroups.map(g => ({
              id: g.id,
              groupName: g.groupName,
              homeLanguage: g.homeLanguage,
              accommodations: g.accommodations || [],
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      const result = await response.json();
      
      setProgress({ generated: result.generated, total: result.generated + result.failed });

      // Fetch the updated audio records
      await fetchLessonAudio(lessonId);

      if (result.status === 'complete') {
        toast({
          title: 'Audio generated successfully',
          description: `${result.generated} audio files created for ${audioGroups.length} groups.`,
        });
      } else if (result.status === 'partial') {
        toast({
          title: 'Audio partially generated',
          description: `${result.generated} files created, ${result.failed} failed.`,
          variant: 'destructive',
        });
      }

      return result as AudioGenerationResult;
    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        title: 'Audio generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return { status: 'failed', generated: 0, failed: 0 };
    } finally {
      setIsGenerating(false);
    }
  }, [fetchLessonAudio]);

  const getAudioForSection = useCallback((
    groupName: string,
    sectionType: string,
    language?: string
  ): AudioRecord | undefined => {
    return audioRecords.find(record => 
      record.group_name === groupName &&
      record.section_type === sectionType &&
      (!language || record.language === language)
    );
  }, [audioRecords]);

  return {
    isGenerating,
    progress,
    audioRecords,
    generateAudio,
    fetchLessonAudio,
    getAudioForSection,
  };
}
