import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Loader2, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VocabularyItem {
  englishTerm: string;
  translatedTerm: string;
  definition?: string;
  translatedDefinition?: string;
  language: string;
}

interface BilingualVocabularyPlayerProps {
  vocabulary: VocabularyItem[];
  groupName: string;
}

const LANGUAGE_CODES: Record<string, string> = {
  'English': 'EN',
  'Spanish': 'ES',
  'Somali': 'SO',
  'Hmong': 'HM',
  'Vietnamese': 'VI',
  'Arabic': 'AR',
  'Karen': 'KA',
  'Oromo': 'OR',
  'Mandarin': 'ZH',
  'Chinese Simplified': 'ZH',
  'Russian': 'RU',
  'Swahili': 'SW',
  'French': 'FR',
  'Portuguese': 'PT',
  'Korean': 'KO',
  'Tagalog': 'TL',
  'Haitian Creole': 'HT',
};

export function BilingualVocabularyPlayer({ vocabulary, groupName }: BilingualVocabularyPlayerProps) {
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [playingItem, setPlayingItem] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const generateAndPlayAudio = async (text: string, language: string, itemKey: string) => {
    if (playingItem === itemKey) {
      // Stop current playback
      audioRef.current?.pause();
      setPlayingItem(null);
      return;
    }

    setLoadingItem(itemKey);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text,
            language,
            sectionType: 'vocabulary',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setPlayingItem(null);
        URL.revokeObjectURL(url);
      };
      
      audio.onerror = () => {
        setPlayingItem(null);
        toast({
          title: 'Playback error',
          description: 'Could not play audio',
          variant: 'destructive',
        });
      };

      await audio.play();
      setPlayingItem(itemKey);
    } catch (error) {
      console.error('Audio generation error:', error);
      toast({
        title: 'Audio error',
        description: 'Could not generate audio',
        variant: 'destructive',
      });
    } finally {
      setLoadingItem(null);
    }
  };

  const getLanguageCode = (language: string) => {
    return LANGUAGE_CODES[language] || language.slice(0, 2).toUpperCase();
  };

  if (!vocabulary.length) return null;

  return (
    <div className="bilingual-vocabulary-player space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="h-4 w-4 text-accent" />
        <h4 className="font-semibold text-sm">Bilingual Vocabulary Audio</h4>
        <span className="text-xs text-muted-foreground">({groupName})</span>
      </div>

      <div className="grid gap-3">
        {vocabulary.map((item, index) => {
          const englishKey = `${index}-en`;
          const translatedKey = `${index}-${item.language}`;
          const isEnglishLoading = loadingItem === englishKey;
          const isTranslatedLoading = loadingItem === translatedKey;
          const isEnglishPlaying = playingItem === englishKey;
          const isTranslatedPlaying = playingItem === translatedKey;

          return (
            <div 
              key={index}
              className="vocab-item p-3 rounded-lg border border-border bg-card/50"
            >
              {/* English Term */}
              <div className="vocab-term flex items-center justify-between gap-3 mb-2">
                <div className="flex-1">
                  <span className="font-medium text-foreground">{item.englishTerm}</span>
                  {item.definition && (
                    <p className="text-sm text-muted-foreground mt-0.5">{item.definition}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateAndPlayAudio(
                    item.definition ? `${item.englishTerm}. ${item.definition}` : item.englishTerm,
                    'English',
                    englishKey
                  )}
                  disabled={isEnglishLoading}
                  className={cn(
                    "gap-1.5 min-w-[70px]",
                    isEnglishPlaying && "bg-accent text-accent-foreground"
                  )}
                >
                  {isEnglishLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isEnglishPlaying ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  EN
                </Button>
              </div>

              {/* Translated Term */}
              <div className="vocab-definition flex items-center justify-between gap-3 pt-2 border-t border-border/50">
                <div className="flex-1">
                  <span className="text-foreground">{item.translatedTerm}</span>
                  {item.translatedDefinition && (
                    <p className="text-sm text-muted-foreground mt-0.5">{item.translatedDefinition}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateAndPlayAudio(
                    item.translatedDefinition 
                      ? `${item.translatedTerm}. ${item.translatedDefinition}` 
                      : item.translatedTerm,
                    item.language,
                    translatedKey
                  )}
                  disabled={isTranslatedLoading}
                  className={cn(
                    "gap-1.5 min-w-[70px]",
                    isTranslatedPlaying && "bg-accent text-accent-foreground"
                  )}
                >
                  {isTranslatedLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isTranslatedPlaying ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  {getLanguageCode(item.language)}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BilingualVocabularyPlayer;
