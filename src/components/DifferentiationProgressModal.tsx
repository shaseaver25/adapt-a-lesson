import React from 'react';
import { Check, Circle, Loader2, AlertTriangle, CheckCircle, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export interface DifferentiationProgressState {
  // Content generation
  contentStatus: 'pending' | 'generating' | 'complete';
  groupsProcessed: number;
  totalGroups: number;
  
  // Audio generation
  audioStatus: 'pending' | 'generating' | 'complete' | 'partial' | 'skipped';
  audioSectionsComplete: number;
  audioSectionsTotal: number;
  audioSectionsFailed: number;
  audioLanguages: string[];
  
  // Document preparation
  documentsStatus: 'pending' | 'generating' | 'complete';
  
  // Overall state
  isComplete: boolean;
}

interface DifferentiationProgressModalProps {
  isOpen: boolean;
  progress: DifferentiationProgressState;
  onViewLesson?: () => void;
  onRetryFailed?: () => void;
  onClose?: () => void;
}

const getLanguageFlag = (language: string): string => {
  const flags: Record<string, string> = {
    'English': '🇺🇸',
    'Spanish': '🇪🇸',
    'Somali': '🇸🇴',
    'Hmong': '🇱🇦',
    'Vietnamese': '🇻🇳',
    'Arabic': '🇸🇦',
    'Karen': '🇲🇲',
    'Oromo': '🇪🇹',
    'Mandarin': '🇨🇳',
    'Chinese': '🇨🇳',
    'Russian': '🇷🇺',
    'Swahili': '🇹🇿',
    'French': '🇫🇷',
    'Portuguese': '🇧🇷',
  };
  return flags[language] || '🌐';
};

const ProgressStep: React.FC<{
  status: 'pending' | 'generating' | 'complete' | 'partial' | 'skipped';
  title: string;
  detail?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ status, title, detail, children }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'complete': return 'text-success bg-success/10';
      case 'generating': return 'text-primary bg-primary/10';
      case 'partial': return 'text-warning bg-warning/10';
      case 'skipped': return 'text-muted-foreground bg-muted/10';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn(
      'flex items-start gap-4 py-3 px-4 rounded-lg transition-all',
      getStatusColor()
    )}>
      <div className="flex-shrink-0 mt-0.5">
        {status === 'complete' ? (
          <CheckCircle className="h-5 w-5 text-success" />
        ) : status === 'generating' ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : status === 'partial' ? (
          <AlertTriangle className="h-5 w-5 text-warning" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{title}</span>
          {detail && <span className="text-sm opacity-75">{detail}</span>}
        </div>
        {children}
      </div>
    </div>
  );
};

export const DifferentiationProgressModal: React.FC<DifferentiationProgressModalProps> = ({
  isOpen,
  progress,
  onViewLesson,
  onRetryFailed,
  onClose,
}) => {
  const audioProgressPercent = progress.audioSectionsTotal > 0
    ? (progress.audioSectionsComplete / progress.audioSectionsTotal) * 100
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {progress.isComplete ? (
              <>
                <CheckCircle className="h-5 w-5 text-success" />
                Lesson Ready!
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Creating Your Differentiated Lesson
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {/* Content Generation */}
          <ProgressStep
            status={progress.contentStatus}
            title="Generating differentiated content"
            detail={`${progress.groupsProcessed}/${progress.totalGroups} student groups`}
          />

          {/* Audio Generation - only show if there's audio to generate */}
          {progress.audioSectionsTotal > 0 && (
            <ProgressStep
              status={progress.audioStatus}
              title="🔊 Generating audio files"
              detail={`${progress.audioSectionsComplete}/${progress.audioSectionsTotal} sections`}
            >
              {progress.audioStatus === 'generating' && (
                <div className="space-y-2">
                  <Progress value={audioProgressPercent} className="h-2" />
                  
                  {/* Language badges */}
                  {progress.audioLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {progress.audioLanguages.map(lang => (
                        <span
                          key={lang}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background text-xs font-medium"
                        >
                          {getLanguageFlag(lang)} {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {progress.audioStatus === 'complete' && progress.audioLanguages.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {progress.audioLanguages.map(lang => (
                    <span
                      key={lang}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium"
                    >
                      {getLanguageFlag(lang)} {lang}
                    </span>
                  ))}
                </div>
              )}
            </ProgressStep>
          )}

          {/* Document Preparation */}
          <ProgressStep
            status={progress.documentsStatus}
            title="Preparing downloadable documents"
            detail="With embedded audio links"
          />
        </div>

        {/* Completion Message */}
        {progress.isComplete && (
          <div className="mt-6 p-4 bg-success/10 rounded-lg text-center space-y-3">
            <CheckCircle className="h-10 w-10 text-success mx-auto" />
            <div>
              <h3 className="font-semibold text-foreground">Lesson Ready!</h3>
              {progress.audioSectionsComplete > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Audio is pre-loaded for {progress.audioSectionsComplete} sections
                  {progress.audioLanguages.length > 1 && (
                    <> in {progress.audioLanguages.join(' and ')}</>
                  )}
                </p>
              )}
            </div>
            <Button onClick={onViewLesson} className="w-full gap-2">
              <PlayCircle className="h-4 w-4" />
              View Differentiated Lesson
            </Button>
          </div>
        )}

        {/* Partial Completion Warning */}
        {progress.audioStatus === 'partial' && progress.audioSectionsFailed > 0 && (
          <div className="mt-4 p-4 bg-warning/10 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Some audio files couldn't be generated
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Students can still access text content.
                </p>
              </div>
            </div>
            {onRetryFailed && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetryFailed}
                className="w-full"
              >
                Retry Failed ({progress.audioSectionsFailed})
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const createInitialProgressState = (): DifferentiationProgressState => ({
  contentStatus: 'pending',
  groupsProcessed: 0,
  totalGroups: 0,
  audioStatus: 'pending',
  audioSectionsComplete: 0,
  audioSectionsTotal: 0,
  audioSectionsFailed: 0,
  audioLanguages: [],
  documentsStatus: 'pending',
  isComplete: false,
});

export default DifferentiationProgressModal;
