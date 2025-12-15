import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Loader2,
  RefreshCcw,
  Headphones,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StudentGroup } from '@/types/studentGroup';
import { analyzeAudioNeeds, AudioRequirements } from '@/types/audioRequirements';
import { getStudentFriendlyName, getStudentFriendlyIcon } from '@/lib/readingLevelNames';
import { cn } from '@/lib/utils';
import { checkAudioBudget, estimateAudioCost, formatCurrency } from '@/hooks/useAudioUsage';

interface LessonAudioPlayerProps {
  group: StudentGroup & { id: string };
  lessonContent: string;
  groupContent: string;
  onAudioGenerated?: (audioUrl: string) => void;
}

export function LessonAudioPlayer({ 
  group, 
  lessonContent, 
  groupContent,
  onAudioGenerated
}: LessonAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const audioRequirements = analyzeAudioNeeds(group);

  // Don't render if no audio needed
  if (!audioRequirements.needsAudio) {
    return null;
  }

  // Clean up audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Generate audio from content
  const generateAudio = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check budget before generating
      const budget = await checkAudioBudget();
      if (!budget.canGenerate) {
        throw new Error(`Monthly audio budget exceeded. ${formatCurrency(budget.usageThisMonth)} used of ${formatCurrency(50)} limit.`);
      }

      const audioText = extractAudioContent(groupContent, group.homeLanguage);

      if (!audioText || audioText.length < 20) {
        throw new Error('Not enough content to generate audio');
      }

      // Warn if this generation would exceed budget
      const estimatedCost = estimateAudioCost(audioText.length);
      if (estimatedCost > budget.remainingBudget) {
        throw new Error(`This audio would cost ~${formatCurrency(estimatedCost)}, but only ${formatCurrency(budget.remainingBudget)} remains in budget.`);
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
            sectionType: 'content',
            groupName: group.groupName,
            sectionId: `${group.groupName}-full`,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate audio: ${response.status}`);
      }

      const audioDuration = parseFloat(response.headers.get('X-Audio-Duration') || '0');
      const chars = parseInt(response.headers.get('X-Characters-Used') || '0');
      const cost = parseFloat(response.headers.get('X-Estimated-Cost') || '0');
      
      setCharacterCount(chars);
      setEstimatedCost(cost);
      if (audioDuration > 0) {
        setDuration(audioDuration);
      }

      const blob = await response.blob();
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      // Notify parent component about the generated audio URL
      onAudioGenerated?.(url);

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
      const { currentTime: time, duration: dur } = audioRef.current;
      if (dur > 0) {
        setProgress((time / dur) * 100);
        setDuration(dur);
        setCurrentTime(time);
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * audioRef.current.duration;
    
    audioRef.current.currentTime = newTime;
    setProgress(percentage * 100);
    setCurrentTime(newTime);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleDownload = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${group.groupName.replace(/\s+/g, '-').toLowerCase()}-audio.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Downloaded',
        description: 'Audio file saved',
      });
    }
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
    <div className="lesson-audio-section">
      <div className="lesson-audio-header">
        <Headphones className="lesson-audio-icon" />
        <span className="lesson-audio-title">
          {getStudentFriendlyIcon(group.readingLevelLabel)} {getStudentFriendlyName(group.readingLevelLabel)}
        </span>
        <span className="audio-badge ml-auto">
          <Volume2 className="audio-badge-icon" />
          {getAudioTypeLabel(audioRequirements)}
        </span>
      </div>
      
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

      {/* Audio Controls */}
      <div className={cn("audio-controls", isLoading && "audio-loading")}>
        <button 
          onClick={togglePlay}
          disabled={isLoading}
          className={cn("audio-play-button", isPlaying && "is-playing")}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span className="audio-label">
            {isLoading ? 'Generating...' : isPlaying ? 'Pause' : audioUrl ? 'Play' : 'Listen'}
          </span>
        </button>
        
        {audioUrl && (
          <>
            <div 
              ref={progressRef}
              className="audio-progress"
              onClick={handleProgressClick}
              role="slider"
              aria-label="Audio progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              tabIndex={0}
            >
              <div 
                className="audio-progress-bar" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            
            <span className="audio-duration">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            <button
              onClick={toggleMute}
              className="audio-play-button-inline"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            
            <button
              onClick={handleDownload}
              className="audio-play-button-inline"
              aria-label="Download audio"
            >
              <Download className="h-4 w-4" />
            </button>
          </>
        )}
        
        {audioUrl && (
          <button
            onClick={generateAudio}
            disabled={isLoading}
            className="audio-play-button-inline"
            aria-label="Regenerate audio"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <p className="text-xs text-destructive mt-2">{error}</p>
      )}

      {/* Usage info */}
      {characterCount > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          {characterCount.toLocaleString()} characters • ~${estimatedCost.toFixed(4)} estimated
        </p>
      )}
    </div>
  );
}

/**
 * Extract key content for audio generation
 */
function extractAudioContent(content: string, language: string): string {
  const lines = content.split('\n');
  const sections: string[] = [];
  let currentSection = '';
  let inImportantSection = false;

  const importantKeywords = [
    'learning target', 'objetivo', 'meta',
    'instructions', 'instrucciones',
    'vocabulary', 'vocabulario',
    'directions', 'direcciones',
    'today you will', 'hoy aprenderás',
  ];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (importantKeywords.some(kw => lowerLine.includes(kw))) {
      if (currentSection) {
        sections.push(currentSection.trim());
      }
      currentSection = line;
      inImportantSection = true;
    } else if (inImportantSection) {
      if (line.startsWith('##') || line.startsWith('---')) {
        sections.push(currentSection.trim());
        currentSection = '';
        inImportantSection = false;
      } else {
        currentSection += '\n' + line;
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection.trim());
  }

  if (sections.length === 0) {
    return cleanTextForTTS(content.slice(0, 2000));
  }

  const combinedText = sections.join('\n\n');
  return cleanTextForTTS(combinedText.slice(0, 3000));
}

/**
 * Clean text for better TTS output
 */
function cleanTextForTTS(text: string): string {
  return text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[-*•]\s*/gm, '')
    .replace(/^\d+\.\s*/gm, '')
    .replace(/\[[ x]\]/gi, '')
    .replace(/\|/g, '')
    .replace(/-{3,}/g, '')
    .replace(/[📚🎯✨🔥✅☐]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
