import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Loader2, Volume2, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BilingualVocabularyCard, type BilingualVocabularyItem } from './BilingualVocabularyCard';

interface VocabularyItem {
  englishTerm: string;
  translatedTerm: string;
  definition?: string;
  translatedDefinition?: string;
  language: string;
}

interface PreGeneratedVocabAudio {
  vocabId: string;
  englishTermUrl?: string;
  englishDefinitionUrl?: string;
  homeLanguageTermUrl?: string;
  homeLanguageDefinitionUrl?: string;
}

interface BilingualVocabularyPlayerProps {
  vocabulary: VocabularyItem[];
  groupName: string;
  preGeneratedAudio?: PreGeneratedVocabAudio[];
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

export function BilingualVocabularyPlayer({ 
  vocabulary, 
  groupName,
  preGeneratedAudio = []
}: BilingualVocabularyPlayerProps) {
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [playingItem, setPlayingItem] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Convert vocabulary items to BilingualVocabularyItem format with pre-generated audio
  const vocabItems: BilingualVocabularyItem[] = vocabulary.map((item, index) => {
    const preGenAudio = preGeneratedAudio.find(a => a.vocabId === `vocab-${index}`);
    
    return {
      id: `vocab-${index}`,
      term: item.englishTerm,
      definition: item.definition || '',
      translatedTerm: item.translatedTerm,
      translatedDefinition: item.translatedDefinition,
      homeLanguage: item.language !== 'English' ? item.language : undefined,
      audio: preGenAudio ? {
        englishTermUrl: preGenAudio.englishTermUrl,
        englishDefinitionUrl: preGenAudio.englishDefinitionUrl,
        homeLanguageTermUrl: preGenAudio.homeLanguageTermUrl,
        homeLanguageDefinitionUrl: preGenAudio.homeLanguageDefinitionUrl,
      } : undefined,
    };
  });

  // On-demand audio generation fallback
  const generateAudio = useCallback(async (text: string, language: string): Promise<string> => {
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
    return URL.createObjectURL(blob);
  }, []);

  const getLanguageCode = (language: string) => {
    return LANGUAGE_CODES[language] || language.slice(0, 2).toUpperCase();
  };

  if (!vocabulary.length) return null;

  // If we have pre-generated audio, use the card-based layout
  const hasPreGeneratedAudio = preGeneratedAudio.length > 0;

  if (hasPreGeneratedAudio) {
    return (
      <div className="bilingual-vocabulary-player space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="h-4 w-4 text-accent" />
          <h4 className="font-semibold text-sm">Bilingual Vocabulary Audio</h4>
          <span className="text-xs text-muted-foreground">({groupName})</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {vocabItems.map((item) => (
            <BilingualVocabularyCard
              key={item.id}
              vocab={item}
              onGenerateAudio={generateAudio}
            />
          ))}
        </div>
      </div>
    );
  }

  // Fallback to simpler on-demand layout
  return (
    <div className="bilingual-vocabulary-player space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="h-4 w-4 text-accent" />
        <h4 className="font-semibold text-sm">Bilingual Vocabulary Audio</h4>
        <span className="text-xs text-muted-foreground">({groupName})</span>
      </div>

      <div className="grid gap-3">
        {vocabItems.map((item) => (
          <BilingualVocabularyCard
            key={item.id}
            vocab={item}
            onGenerateAudio={generateAudio}
          />
        ))}
      </div>
    </div>
  );
}

export default BilingualVocabularyPlayer;
