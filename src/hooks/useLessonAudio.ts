import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { StudentGroup } from '@/types/studentGroup';
import type { SectionAudio } from '@/components/BilingualAudioPlayer';
import type { BilingualVocabularyAudio } from '@/components/BilingualVocabularyCard';

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

export interface VocabularyAudioRecord {
  id: string;
  lesson_id: string;
  group_id: string;
  group_name: string;
  vocab_id: string;
  term: string;
  definition: string | null;
  english_term_audio_url: string | null;
  english_definition_audio_url: string | null;
  home_language: string;
  translated_term: string | null;
  translated_definition: string | null;
  home_language_term_audio_url: string | null;
  home_language_definition_audio_url: string | null;
  created_at: string;
}

export interface AudioGenerationResult {
  status: 'complete' | 'partial' | 'failed' | 'pending';
  generated: number;
  failed: number;
  audioRecords?: AudioRecord[];
}

export interface AudioStatusRecord {
  id: string;
  lesson_id: string;
  status: 'pending' | 'generating' | 'complete' | 'partial' | 'failed';
  total_sections: number;
  completed_sections: number;
  failed_sections: number;
  error_details: any[];
  started_at: string | null;
  completed_at: string | null;
}

export interface UseLessonAudioReturn {
  isGenerating: boolean;
  progress: { generated: number; total: number };
  audioRecords: AudioRecord[];
  vocabularyAudio: VocabularyAudioRecord[];
  audioStatus: AudioStatusRecord | null;
  generateAudio: (lessonId: string, content: string, groups: (StudentGroup & { id: string })[]) => Promise<AudioGenerationResult>;
  fetchLessonAudio: (lessonId: string) => Promise<AudioRecord[]>;
  fetchVocabularyAudio: (lessonId: string) => Promise<VocabularyAudioRecord[]>;
  fetchAudioStatus: (lessonId: string) => Promise<AudioStatusRecord | null>;
  getAudioForSection: (groupName: string, sectionType: string, language?: string) => AudioRecord | undefined;
  getBilingualAudioForSection: (groupName: string, sectionType: string) => SectionAudio;
  getVocabularyAudioForGroup: (groupName: string) => VocabularyAudioRecord[];
}

export function useLessonAudio(): UseLessonAudioReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ generated: 0, total: 0 });
  const [audioRecords, setAudioRecords] = useState<AudioRecord[]>([]);
  const [vocabularyAudio, setVocabularyAudio] = useState<VocabularyAudioRecord[]>([]);
  const [audioStatus, setAudioStatus] = useState<AudioStatusRecord | null>(null);

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

  const fetchVocabularyAudio = useCallback(async (lessonId: string): Promise<VocabularyAudioRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('vocabulary_audio')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const records = (data || []) as VocabularyAudioRecord[];
      setVocabularyAudio(records);
      return records;
    } catch (error) {
      console.error('Error fetching vocabulary audio:', error);
      return [];
    }
  }, []);

  const fetchAudioStatus = useCallback(async (lessonId: string): Promise<AudioStatusRecord | null> => {
    try {
      const { data, error } = await supabase
        .from('lesson_audio_status')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) throw error;
      
      setAudioStatus(data as AudioStatusRecord | null);
      return data as AudioStatusRecord | null;
    } catch (error) {
      console.error('Error fetching audio status:', error);
      return null;
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

    // First, fetch any existing audio (use what exists)
    console.log('Fetching existing audio before generation...');
    await Promise.all([
      fetchLessonAudio(lessonId),
      fetchVocabularyAudio(lessonId),
    ]);

    // Estimate total sections (rough estimate: ~8 sections per group, x2 for bilingual)
    const estimatedSections = audioGroups.reduce((acc, g) => {
      const multiplier = g.homeLanguage !== 'English' ? 2 : 1;
      return acc + (8 * multiplier);
    }, 0);
    
    setProgress({ generated: 0, total: estimatedSections });
    setIsGenerating(true);

    const totalResults = { generated: 0, failed: 0, audioRecords: [] as any[] };
    const MAX_RETRIES = 2;

    try {
      // Create initial status record
      await supabase.from('lesson_audio_status').upsert({
        lesson_id: lessonId,
        status: 'generating',
        total_sections: estimatedSections,
        completed_sections: 0,
        failed_sections: 0,
        started_at: new Date().toISOString(),
      }, { onConflict: 'lesson_id' });

      // Process ONE GROUP AT A TIME (chunked processing)
      for (let i = 0; i < audioGroups.length; i++) {
        const group = audioGroups[i];
        console.log(`Processing group ${i + 1}/${audioGroups.length}: ${group.groupName}`);
        
        let retries = 0;
        let groupSuccess = false;

        while (retries <= MAX_RETRIES && !groupSuccess) {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-group-audio`,
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
                  group: {
                    id: group.id,
                    groupName: group.groupName,
                    homeLanguage: group.homeLanguage,
                    accommodations: group.accommodations || [],
                  },
                  retryFailedOnly: retries > 0, // On retry, skip already generated
                }),
              }
            );

            if (!response.ok) {
              throw new Error(`Request failed with status ${response.status}`);
            }

            const result = await response.json();
            totalResults.generated += result.generated;
            totalResults.failed += result.failed;
            if (result.audioRecords) {
              totalResults.audioRecords.push(...result.audioRecords);
            }

            // Update progress
            setProgress(prev => ({ 
              generated: prev.generated + result.generated, 
              total: estimatedSections 
            }));

            // Update status record with progress
            await supabase.from('lesson_audio_status').update({
              completed_sections: totalResults.generated,
              failed_sections: totalResults.failed,
              updated_at: new Date().toISOString(),
            }).eq('lesson_id', lessonId);

            groupSuccess = result.status === 'complete' || result.failed === 0;
            
            if (!groupSuccess && retries < MAX_RETRIES) {
              console.log(`Group ${group.groupName} had failures, retrying... (attempt ${retries + 2})`);
              retries++;
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
            } else {
              break;
            }
          } catch (error) {
            console.error(`Error processing group ${group.groupName}:`, error);
            retries++;
            if (retries <= MAX_RETRIES) {
              console.log(`Retrying group ${group.groupName}... (attempt ${retries + 1})`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }

        // Small delay between groups to avoid overwhelming the API
        if (i < audioGroups.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Update final status
      const finalStatus = totalResults.failed === 0 ? 'complete' : 'partial';
      await supabase.from('lesson_audio_status').update({
        status: finalStatus,
        completed_sections: totalResults.generated,
        failed_sections: totalResults.failed,
        completed_at: new Date().toISOString(),
      }).eq('lesson_id', lessonId);

      // Fetch all the generated audio
      await Promise.all([
        fetchLessonAudio(lessonId),
        fetchVocabularyAudio(lessonId),
        fetchAudioStatus(lessonId),
      ]);

      if (finalStatus === 'complete') {
        toast({
          title: 'Audio generated successfully',
          description: `${totalResults.generated} audio files created for ${audioGroups.length} groups.`,
        });
      } else {
        toast({
          title: 'Audio partially generated',
          description: `${totalResults.generated} files created, ${totalResults.failed} failed. QR codes will use available audio.`,
          variant: 'default',
        });
      }

      return { 
        status: finalStatus as 'complete' | 'partial', 
        generated: totalResults.generated, 
        failed: totalResults.failed,
        audioRecords: totalResults.audioRecords,
      };
    } catch (error) {
      console.error('Error generating audio:', error);
      
      // Still try to use any existing audio
      await Promise.all([
        fetchLessonAudio(lessonId),
        fetchVocabularyAudio(lessonId),
      ]);
      
      await supabase.from('lesson_audio_status').update({
        status: totalResults.generated > 0 ? 'partial' : 'failed',
        completed_sections: totalResults.generated,
        completed_at: new Date().toISOString(),
        error_details: [{ message: error instanceof Error ? error.message : 'Unknown error' }],
      }).eq('lesson_id', lessonId);
      
      if (totalResults.generated > 0) {
        toast({
          title: 'Audio partially generated',
          description: `${totalResults.generated} files created before error. QR codes will use available audio.`,
          variant: 'default',
        });
        return { status: 'partial', generated: totalResults.generated, failed: totalResults.failed };
      }
      
      toast({
        title: 'Audio generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return { status: 'failed', generated: 0, failed: 0 };
    } finally {
      setIsGenerating(false);
    }
  }, [fetchLessonAudio, fetchVocabularyAudio, fetchAudioStatus]);

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

  // Get bilingual audio for a section (both English and home language)
  const getBilingualAudioForSection = useCallback((
    groupName: string,
    sectionType: string
  ): SectionAudio => {
    const englishAudio = audioRecords.find(record => 
      record.group_name === groupName &&
      record.section_type === sectionType &&
      record.language === 'English'
    );

    const homeLanguageAudio = audioRecords.find(record => 
      record.group_name === groupName &&
      record.section_type === sectionType &&
      record.language !== 'English'
    );

    return {
      english: englishAudio ? {
        url: englishAudio.audio_url,
        duration: englishAudio.duration_seconds,
      } : null,
      homeLanguage: homeLanguageAudio ? {
        language: homeLanguageAudio.language,
        url: homeLanguageAudio.audio_url,
        duration: homeLanguageAudio.duration_seconds,
      } : null,
    };
  }, [audioRecords]);

  // Get vocabulary audio for a specific group
  const getVocabularyAudioForGroup = useCallback((
    groupName: string
  ): VocabularyAudioRecord[] => {
    return vocabularyAudio.filter(record => record.group_name === groupName);
  }, [vocabularyAudio]);

  return {
    isGenerating,
    progress,
    audioRecords,
    vocabularyAudio,
    audioStatus,
    generateAudio,
    fetchLessonAudio,
    fetchVocabularyAudio,
    fetchAudioStatus,
    getAudioForSection,
    getBilingualAudioForSection,
    getVocabularyAudioForGroup,
  };
}
