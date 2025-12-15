import { useState, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonSectionWithAudio {
  id: string;
  type: 'learning-target' | 'instructions' | 'content' | 'vocabulary' | 'reflection-prompt';
  title: string;
  content: string;
  audio?: {
    url: string;
    duration: number;
  };
}

interface AudioEnabledSectionProps {
  section: LessonSectionWithAudio;
  className?: string;
}

const SECTION_ICONS: Record<string, string> = {
  'learning-target': '🎯',
  'instructions': '📋',
  'content': '📖',
  'vocabulary': '📚',
  'reflection-prompt': '💭',
};

const SECTION_LABELS: Record<string, string> = {
  'learning-target': 'Learning Target',
  'instructions': 'Instructions',
  'content': 'Lesson Content',
  'vocabulary': 'Vocabulary',
  'reflection-prompt': 'Reflection',
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioEnabledSection({ section, className }: AudioEnabledSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.currentTarget;
    const pct = (audio.currentTime / audio.duration) * 100;
    setProgress(pct);
    setCurrentTime(audio.currentTime);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !section.audio) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * audioRef.current.duration;
    
    audioRef.current.currentTime = newTime;
    setProgress(percentage * 100);
    setCurrentTime(newTime);
  };

  return (
    <div className={cn("audio-section", className)}>
      <div className="audio-section-header">
        <div className="audio-section-title">
          <span className="audio-section-icon">{SECTION_ICONS[section.type] || '📝'}</span>
          <h3>{section.title || SECTION_LABELS[section.type] || 'Section'}</h3>
        </div>
        
        {section.audio && (
          <div className="audio-controls">
            <button 
              onClick={handlePlayPause}
              className="audio-play-button"
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="audio-label">
                {isPlaying ? 'Pause' : 'Listen'}
              </span>
            </button>
            
            <div 
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
              {section.audio.duration > 0 
                ? `${formatDuration(currentTime)} / ${formatDuration(section.audio.duration)}`
                : formatDuration(currentTime)
              }
            </span>
            
            <audio
              ref={audioRef}
              src={section.audio.url}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onLoadedMetadata={(e) => {
                // Duration might be available now
              }}
              preload="metadata"
            />
          </div>
        )}
      </div>
      
      <div className="audio-section-content">
        {section.content}
      </div>
    </div>
  );
}

interface AudioControlsInlineProps {
  audioUrl: string;
  duration?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'pill';
}

export function AudioControlsInline({ 
  audioUrl, 
  duration = 0, 
  label = 'Listen',
  size = 'md',
  variant = 'default'
}: AudioControlsInlineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const sizeClasses = {
    sm: 'audio-controls-sm',
    md: 'audio-controls-md',
    lg: 'audio-controls-lg',
  };

  const variantClasses = {
    default: 'audio-controls-default',
    minimal: 'audio-controls-minimal',
    pill: 'audio-controls-pill',
  };

  return (
    <div className={cn(
      'audio-controls-inline',
      sizeClasses[size],
      variantClasses[variant]
    )}>
      <button 
        onClick={handlePlayPause}
        className="audio-play-button-inline"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="audio-icon" />
        ) : (
          <Play className="audio-icon" />
        )}
        {variant !== 'minimal' && (
          <span className="audio-label-inline">{isPlaying ? 'Pause' : label}</span>
        )}
      </button>
      
      {variant === 'default' && (
        <>
          <div className="audio-progress-inline">
            <div 
              className="audio-progress-bar-inline" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          
          {audioDuration > 0 && (
            <span className="audio-time-inline">
              {formatDuration(audioDuration)}
            </span>
          )}
        </>
      )}
      
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={(e) => {
          const pct = (e.currentTarget.currentTime / e.currentTarget.duration) * 100;
          setProgress(pct);
          setCurrentTime(e.currentTarget.currentTime);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
        }}
        onLoadedMetadata={(e) => {
          if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
            setAudioDuration(e.currentTarget.duration);
          }
        }}
        preload="metadata"
      />
    </div>
  );
}
