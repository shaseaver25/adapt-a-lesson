import { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download,
  RotateCcw,
  Languages
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export interface SectionAudio {
  english: {
    url: string;
    duration: number;
  } | null;
  homeLanguage?: {
    language: string;
    url: string;
    duration: number;
  } | null;
}

interface BilingualAudioPlayerProps {
  audio: SectionAudio;
  sectionType?: string;
  className?: string;
  compact?: boolean;
}

export function BilingualAudioPlayer({ 
  audio, 
  sectionType,
  className,
  compact = false
}: BilingualAudioPlayerProps) {
  const [activeLanguage, setActiveLanguage] = useState<'english' | 'homeLanguage'>('english');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const currentAudio = activeLanguage === 'english' 
    ? audio.english 
    : audio.homeLanguage;

  const hasHomeLanguage = !!audio.homeLanguage?.url;

  // Update audio source when language changes
  useEffect(() => {
    if (audioRef.current && currentAudio?.url) {
      const wasPlaying = isPlaying;
      audioRef.current.pause();
      audioRef.current.src = currentAudio.url;
      audioRef.current.load();
      setProgress(0);
      setCurrentTime(0);
      if (wasPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(false);
      }
    }
  }, [activeLanguage, currentAudio?.url]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlay = async () => {
    if (!audioRef.current || !currentAudio?.url) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Playback error:', error);
        setIsPlaying(false);
      }
    }
  };

  const handleLanguageSwitch = (lang: 'english' | 'homeLanguage') => {
    if (lang === activeLanguage) return;
    setActiveLanguage(lang);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime: time, duration: dur } = audioRef.current;
      if (dur > 0 && !isNaN(dur)) {
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
    const percentage = Math.max(0, Math.min(1, clickX / width));
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

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5];
    const currentIndex = speeds.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      setCurrentTime(0);
    }
  };

  const handleDownload = () => {
    if (currentAudio?.url) {
      const a = document.createElement('a');
      a.href = currentAudio.url;
      a.download = `audio-${sectionType || 'section'}-${activeLanguage}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Don't render if no audio available
  if (!audio.english?.url && !audio.homeLanguage?.url) {
    return null;
  }

  return (
    <div className={cn(
      "bilingual-audio-player rounded-lg border border-border bg-card p-3",
      compact && "p-2",
      className
    )}>
      {/* Language Toggle - Only show if home language exists */}
      {hasHomeLanguage && (
        <div className="flex gap-2 mb-3">
          <button
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              activeLanguage === 'english'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            onClick={() => handleLanguageSwitch('english')}
            aria-pressed={activeLanguage === 'english'}
          >
            <span>{getLanguageFlag('English')}</span>
            <span>English</span>
          </button>
          <button
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              activeLanguage === 'homeLanguage'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            onClick={() => handleLanguageSwitch('homeLanguage')}
            aria-pressed={activeLanguage === 'homeLanguage'}
          >
            <span>{getLanguageFlag(audio.homeLanguage!.language)}</span>
            <span>{audio.homeLanguage!.language}</span>
          </button>
        </div>
      )}

      {/* Audio Controls */}
      <div className="flex items-center gap-2">
        {/* Play/Pause Button */}
        <button
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all",
            isPlaying 
              ? "bg-primary text-primary-foreground" 
              : "bg-primary/10 text-primary hover:bg-primary/20"
          )}
          onClick={handlePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          disabled={!currentAudio?.url}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>

        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="flex-1 h-2 bg-muted rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleProgressClick}
          role="slider"
          aria-label="Audio progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          tabIndex={0}
        >
          <div 
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time Display */}
        <span className="text-xs text-muted-foreground tabular-nums min-w-[70px] text-right">
          {formatTime(currentTime)} / {formatTime(duration || currentAudio?.duration || 0)}
        </span>

        {/* Speed Control */}
        <button
          className="px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted rounded transition-colors min-w-[40px]"
          onClick={handleSpeedChange}
          aria-label={`Playback speed: ${speed}x`}
        >
          {speed}x
        </button>

        {/* Mute Button */}
        <button
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>

        {/* Restart Button */}
        <button
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleRestart}
          aria-label="Restart"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Download Button */}
        {currentAudio?.url && (
          <button
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleDownload}
            aria-label="Download audio"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentAudio?.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onCanPlayThrough={() => {
          // Audio is ready - pre-generated so no loading needed
        }}
        preload="auto"
      />

      {/* Bilingual Hint */}
      {hasHomeLanguage && (
        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
          <Languages className="h-3.5 w-3.5" />
          <span>
            🎧 Listen in {activeLanguage === 'english' ? audio.homeLanguage!.language : 'English'} too!
          </span>
        </p>
      )}
    </div>
  );
}

export default BilingualAudioPlayer;