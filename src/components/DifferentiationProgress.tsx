import React from 'react';
import { Check, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GenerationStatus {
  analyzing: boolean;
  analyzingDone: boolean;
  contentGenerating: boolean;
  contentDone: boolean;
  needsAudio: boolean;
  audioGenerating: boolean;
  audioDone: boolean;
  audioGroups: number;
  audioProgress?: {
    completed: number;
    total: number;
  };
  preparingDownloads: boolean;
  complete: boolean;
}

interface DifferentiationProgressProps {
  status: GenerationStatus;
}

const ProgressStep: React.FC<{
  completed: boolean;
  active: boolean;
  children: React.ReactNode;
  detail?: React.ReactNode;
}> = ({ completed, active, children, detail }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3 py-2 px-3 rounded-lg transition-colors',
        completed && 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/30',
        active && !completed && 'text-primary bg-primary/10',
        !completed && !active && 'text-muted-foreground'
      )}
    >
      <div className="flex-shrink-0">
        {completed ? (
          <Check className="h-5 w-5" />
        ) : active ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </div>
      <div className="flex-1">
        <span className="font-medium">{children}</span>
        {detail && (
          <span className="ml-2 text-sm opacity-75">{detail}</span>
        )}
      </div>
    </div>
  );
};

export const DifferentiationProgress: React.FC<DifferentiationProgressProps> = ({ status }) => {
  return (
    <div className="space-y-2 p-4 bg-card border rounded-lg">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Generating Differentiated Lesson
      </h3>
      
      <ProgressStep
        completed={status.analyzingDone}
        active={status.analyzing}
      >
        Analyzing student groups
      </ProgressStep>
      
      <ProgressStep
        completed={status.contentDone}
        active={status.contentGenerating}
      >
        Generating differentiated content
      </ProgressStep>
      
      {status.needsAudio && (
        <ProgressStep
          completed={status.audioDone}
          active={status.audioGenerating}
          detail={
            status.audioProgress && (
              <span>
                {status.audioProgress.completed}/{status.audioProgress.total} sections
              </span>
            )
          }
        >
          Creating audio for {status.audioGroups} group(s)
        </ProgressStep>
      )}
      
      <ProgressStep
        completed={status.complete}
        active={status.preparingDownloads}
      >
        Preparing downloads
      </ProgressStep>
      
      {status.complete && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-green-700 dark:text-green-400 text-center font-medium">
          ✓ Lesson ready!
        </div>
      )}
    </div>
  );
};

export const createInitialStatus = (): GenerationStatus => ({
  analyzing: false,
  analyzingDone: false,
  contentGenerating: false,
  contentDone: false,
  needsAudio: false,
  audioGenerating: false,
  audioDone: false,
  audioGroups: 0,
  audioProgress: undefined,
  preparingDownloads: false,
  complete: false,
});

export default DifferentiationProgress;
