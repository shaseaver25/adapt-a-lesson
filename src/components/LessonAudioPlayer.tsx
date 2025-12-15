import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Loader2,
  RefreshCcw,
  Headphones
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StudentGroup } from '@/types/studentGroup';
import { analyzeAudioNeeds, AudioRequirements } from '@/types/audioRequirements';
import { getStudentFriendlyName, getStudentFriendlyIcon } from '@/lib/readingLevelNames';

interface LessonAudioPlayerProps {
  group: StudentGroup & { id: string };
  lessonContent: string;
  groupContent: string;
}

export function LessonAudioPlayer({ 
  group, 
  lessonContent, 
  groupContent 
}: LessonAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const audioRequirements = analyzeAudioNeeds(group);

  // Don't render if no audio needed
  if (!audioRequirements.needsAudio) {
    return null;
  }

  // Clean up audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Generate audio from content
  const generateAudio = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Extract key content for audio (learning targets, instructions, vocabulary)
      const audioText = extractAudioContent(groupContent, group.homeLanguage);

      if (!audioText || audioText.length < 20) {
        throw new Error('Not enough content to generate audio');
      }

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
            text: audioText,
            language: group.homeLanguage,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate audio: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Create and set up audio element
      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
        setIsPlaying(true);
      }

      toast({
        title: 'Audio ready',
        description: `Playing audio for ${group.groupName}`,
      });
    } catch (err) {
      console.error('Error generating audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
      toast({
        title: 'Audio generation failed',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (!audioUrl) {
      await generateAudio();
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      await audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      if (duration > 0) {
        setProgress((currentTime / duration) * 100);
        setDuration(duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAudioTypeLabel = (req: AudioRequirements) => {
    if (req.audioType === 'both') return 'Read Aloud + Multilingual';
    if (req.audioType === 'multilingual') return `${req.language} Audio`;
    return 'Read Aloud';
  };

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Headphones className="h-4 w-4 text-accent" />
          <span>{getStudentFriendlyIcon(group.readingLevelLabel)} {getStudentFriendlyName(group.readingLevelLabel)} Audio</span>
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            {getAudioTypeLabel(audioRequirements)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
            }
          }}
        />

        {/* Progress bar */}
        {audioUrl && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime((progress / 100) * duration)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={audioUrl ? 'default' : 'outline'}
            size="sm"
            onClick={togglePlay}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : isPlaying ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : audioUrl ? (
              <>
                <Play className="h-4 w-4" />
                Play
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Generate Audio
              </>
            )}
          </Button>

          {audioUrl && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateAudio}
                disabled={isLoading}
                title="Regenerate audio"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Error display */}
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        {/* Info text */}
        <p className="text-xs text-muted-foreground">
          {audioRequirements.audioType === 'both' 
            ? `Audio support for Read Aloud accommodation in ${group.homeLanguage}`
            : audioRequirements.audioType === 'multilingual'
            ? `Audio generated in ${group.homeLanguage} for native language support`
            : 'Audio support for Read Aloud accommodation'
          }
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Extract key content for audio generation
 * Prioritizes learning targets, instructions, and vocabulary
 */
function extractAudioContent(content: string, language: string): string {
  const lines = content.split('\n');
  const sections: string[] = [];
  let currentSection = '';
  let inImportantSection = false;

  // Keywords that indicate important sections to read aloud
  const importantKeywords = [
    'learning target', 'objetivo', 'meta',
    'instructions', 'instrucciones',
    'vocabulary', 'vocabulario',
    'directions', 'direcciones',
  ];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Check if entering an important section
    if (importantKeywords.some(kw => lowerLine.includes(kw))) {
      if (currentSection) {
        sections.push(currentSection.trim());
      }
      currentSection = line;
      inImportantSection = true;
    } else if (inImportantSection) {
      // Check if we're leaving the section (new major heading)
      if (line.startsWith('##') || line.startsWith('---')) {
        sections.push(currentSection.trim());
        currentSection = '';
        inImportantSection = false;
      } else {
        currentSection += '\n' + line;
      }
    }
  }

  // Add any remaining section
  if (currentSection) {
    sections.push(currentSection.trim());
  }

  // If no specific sections found, use first 2000 chars of content
  if (sections.length === 0) {
    return cleanTextForTTS(content.slice(0, 2000));
  }

  // Join sections and clean for TTS
  return cleanTextForTTS(sections.join('\n\n'));
}

/**
 * Clean text for better TTS output
 */
function cleanTextForTTS(text: string): string {
  return text
    // Remove markdown formatting
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    // Remove bullet points and convert to spoken format
    .replace(/^[-*•]\s*/gm, '')
    .replace(/^\d+\.\s*/gm, '')
    // Remove checkboxes
    .replace(/\[[ x]\]/gi, '')
    // Remove table formatting
    .replace(/\|/g, '')
    .replace(/-{3,}/g, '')
    // Remove special characters
    .replace(/[📚🎯✨🔥✅☐]/g, '')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
