import React, { useState, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, PlayCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Language flag mapping
const LANGUAGE_FLAGS: Record<string, string> = {
  'English': '🇺🇸',
  'Spanish': '🇪🇸',
  'Mandarin': '🇨🇳',
  'Vietnamese': '🇻🇳',
  'Arabic': '🇸🇦',
  'Somali': '🇸🇴',
  'French': '🇫🇷',
  'Portuguese': '🇧🇷',
  'Russian': '🇷🇺',
  'Korean': '🇰🇷',
  'Tagalog': '🇵🇭',
  'Hmong': '🏔️',
  'Swahili': '🇰🇪',
  'Haitian Creole': '🇭🇹',
  'Karen': '🏔️',
  'Oromo': '🇪🇹',
};

function getLanguageFlag(language: string): string {
  return LANGUAGE_FLAGS[language] || '🌐';
}

export interface BilingualVocabularyAudio {
  englishTermUrl?: string;
  englishDefinitionUrl?: string;
  homeLanguageTermUrl?: string;
  homeLanguageDefinitionUrl?: string;
}

export interface BilingualVocabularyItem {
  id: string;
  term: string;
  definition: string;
  translatedTerm?: string;
  translatedDefinition?: string;
  homeLanguage?: string;
  audio?: BilingualVocabularyAudio;
}

interface BilingualVocabularyCardProps {
  vocab: BilingualVocabularyItem;
  onGenerateAudio?: (text: string, language: string) => Promise<string>;
  className?: string;
}

function playAudioAndWait(url: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => resolve(); // Continue even if one fails
    audio.play().catch(() => resolve());
  });
}

export function BilingualVocabularyCard({ 
  vocab, 
  onGenerateAudio,
  className 
}: BilingualVocabularyCardProps) {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const hasHomeLanguage = !!vocab.homeLanguage && vocab.homeLanguage !== 'English';
  const hasPreGeneratedAudio = !!(
    vocab.audio?.englishTermUrl || 
    vocab.audio?.englishDefinitionUrl
  );

  const stopAllAudio = useCallback(() => {
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    setPlayingTrack(null);
    setIsPlayingAll(false);
  }, []);

  const playTrack = useCallback(async (trackId: string, url?: string, text?: string, language?: string) => {
    // Stop any currently playing track
    stopAllAudio();

    // If no URL but we have text and can generate, do so
    if (!url && text && language && onGenerateAudio) {
      setLoadingTrack(trackId);
      try {
        url = await onGenerateAudio(text, language);
      } catch (error) {
        console.error('Error generating audio:', error);
        setLoadingTrack(null);
        return;
      }
      setLoadingTrack(null);
    }

    if (!url) return;

    // Create or reuse audio element
    if (!audioRefs.current[trackId]) {
      audioRefs.current[trackId] = new Audio(url);
    } else {
      audioRefs.current[trackId].src = url;
    }

    const audio = audioRefs.current[trackId];
    audio.onended = () => setPlayingTrack(null);
    audio.onerror = () => setPlayingTrack(null);

    try {
      await audio.play();
      setPlayingTrack(trackId);
    } catch (error) {
      console.error('Playback error:', error);
      setPlayingTrack(null);
    }
  }, [stopAllAudio, onGenerateAudio]);

  const handlePlayAll = useCallback(async () => {
    if (isPlayingAll) {
      stopAllAudio();
      return;
    }

    setIsPlayingAll(true);

    const tracks: { url?: string; text?: string; language: string }[] = [
      { 
        url: vocab.audio?.englishTermUrl, 
        text: vocab.term, 
        language: 'English' 
      },
      { 
        url: vocab.audio?.englishDefinitionUrl, 
        text: vocab.definition, 
        language: 'English' 
      },
    ];

    if (hasHomeLanguage) {
      tracks.push(
        { 
          url: vocab.audio?.homeLanguageTermUrl, 
          text: vocab.translatedTerm || vocab.term, 
          language: vocab.homeLanguage! 
        },
        { 
          url: vocab.audio?.homeLanguageDefinitionUrl, 
          text: vocab.translatedDefinition || vocab.definition, 
          language: vocab.homeLanguage! 
        }
      );
    }

    for (const track of tracks) {
      if (!isPlayingAll) break;
      
      let audioUrl = track.url;
      
      // Generate audio if not pre-generated
      if (!audioUrl && track.text && onGenerateAudio) {
        try {
          audioUrl = await onGenerateAudio(track.text, track.language);
        } catch {
          continue;
        }
      }

      if (audioUrl) {
        await playAudioAndWait(audioUrl);
      }
    }

    setIsPlayingAll(false);
  }, [vocab, hasHomeLanguage, isPlayingAll, stopAllAudio, onGenerateAudio]);

  const renderAudioButton = (
    trackId: string, 
    url?: string, 
    text?: string, 
    language?: string,
    label?: string
  ) => {
    const isPlaying = playingTrack === trackId;
    const isLoading = loadingTrack === trackId;
    const canPlay = url || (text && onGenerateAudio);

    if (!canPlay) return null;

    return (
      <button
        className={cn(
          "flex-shrink-0 p-1.5 rounded-full transition-all",
          isPlaying 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        )}
        onClick={() => {
          if (isPlaying) {
            stopAllAudio();
          } else {
            playTrack(trackId, url, text, language);
          }
        }}
        disabled={isLoading}
        aria-label={label || `Play ${trackId}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>
    );
  };

  return (
    <div className={cn(
      "bilingual-vocabulary-card rounded-lg border border-border bg-card overflow-hidden",
      className
    )}>
      {/* English Section */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span>{getLanguageFlag('English')}</span>
          <span>English</span>
        </div>
        
        {/* English Term */}
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-foreground">{vocab.term}</span>
          {renderAudioButton(
            'en-term', 
            vocab.audio?.englishTermUrl, 
            vocab.term, 
            'English',
            `Hear "${vocab.term}" in English`
          )}
        </div>
        
        {/* English Definition */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-muted-foreground flex-1">{vocab.definition}</p>
          {renderAudioButton(
            'en-def', 
            vocab.audio?.englishDefinitionUrl, 
            vocab.definition, 
            'English',
            'Hear definition in English'
          )}
        </div>
      </div>

      {/* Home Language Section */}
      {hasHomeLanguage && (
        <div className="p-3 space-y-2 bg-muted/30 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span>{getLanguageFlag(vocab.homeLanguage!)}</span>
            <span>{vocab.homeLanguage}</span>
          </div>
          
          {/* Translated Term */}
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-foreground">
              {vocab.translatedTerm || vocab.term}
            </span>
            {renderAudioButton(
              'hl-term', 
              vocab.audio?.homeLanguageTermUrl, 
              vocab.translatedTerm || vocab.term, 
              vocab.homeLanguage,
              `Hear term in ${vocab.homeLanguage}`
            )}
          </div>
          
          {/* Translated Definition */}
          {vocab.translatedDefinition && (
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-muted-foreground flex-1">
                {vocab.translatedDefinition}
              </p>
              {renderAudioButton(
                'hl-def', 
                vocab.audio?.homeLanguageDefinitionUrl, 
                vocab.translatedDefinition, 
                vocab.homeLanguage,
                `Hear definition in ${vocab.homeLanguage}`
              )}
            </div>
          )}
        </div>
      )}

      {/* Play All Button */}
      <div className="p-2 border-t border-border bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full gap-2",
            isPlayingAll && "bg-primary/10 text-primary"
          )}
          onClick={handlePlayAll}
        >
          {isPlayingAll ? (
            <>
              <Pause className="h-4 w-4" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              <span>Listen to All</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default BilingualVocabularyCard;