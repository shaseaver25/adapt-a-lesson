import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Headphones, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { StudentGroup } from '@/types/studentGroup';

interface AudioGenerationButtonProps {
  lessonId: string | null;
  differentiatedContent: string;
  selectedGroups: (StudentGroup & { id: string })[];
  onAudioGenerated: () => void;
  disabled?: boolean;
}

interface GroupStatus {
  groupName: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
  sectionsComplete: number;
  totalSections: number;
  error?: string;
}

export function AudioGenerationButton({
  lessonId,
  differentiatedContent,
  selectedGroups,
  onAudioGenerated,
  disabled = false,
}: AudioGenerationButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [groupStatuses, setGroupStatuses] = useState<GroupStatus[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const { toast } = useToast();

  // Filter groups that need audio (Read Aloud or non-English)
  const groupsNeedingAudio = selectedGroups.filter(
    group => group.accommodations?.includes('Read Aloud') || group.homeLanguage !== 'English'
  );

  const handleGenerateAudio = async () => {
    if (!lessonId || groupsNeedingAudio.length === 0) {
      toast({
        title: 'Cannot generate audio',
        description: !lessonId 
          ? 'Please save the lesson first' 
          : 'No groups require audio support',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGroupStatuses(
      groupsNeedingAudio.map(g => ({
        groupName: g.groupName,
        status: 'pending',
        sectionsComplete: 0,
        totalSections: 0,
      }))
    );

    let completedGroups = 0;
    const totalGroups = groupsNeedingAudio.length;

    for (let i = 0; i < groupsNeedingAudio.length; i++) {
      const group = groupsNeedingAudio[i];
      
      // Update status to generating
      setGroupStatuses(prev => prev.map((gs, idx) => 
        idx === i ? { ...gs, status: 'generating' } : gs
      ));

      try {
        const response = await supabase.functions.invoke('generate-group-audio', {
          body: {
            lessonId,
            differentiatedContent,
            group: {
              id: group.id,
              groupName: group.groupName,
              homeLanguage: group.homeLanguage,
              accommodations: group.accommodations,
              readingLevelLabel: group.readingLevelLabel,
            },
            retryFailedOnly: false,
          },
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        // Update status to complete
        setGroupStatuses(prev => prev.map((gs, idx) => 
          idx === i 
            ? { 
                ...gs, 
                status: 'complete',
                sectionsComplete: response.data?.generated || 0,
                totalSections: response.data?.generated || 0,
              } 
            : gs
        ));

        completedGroups++;
        setOverallProgress(Math.round((completedGroups / totalGroups) * 100));

      } catch (error) {
        console.error(`Error generating audio for ${group.groupName}:`, error);
        
        setGroupStatuses(prev => prev.map((gs, idx) => 
          idx === i 
            ? { 
                ...gs, 
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
              } 
            : gs
        ));

        // Try to retry once
        try {
          const retryResponse = await supabase.functions.invoke('generate-group-audio', {
            body: {
              lessonId,
              differentiatedContent,
              group: {
                id: group.id,
                groupName: group.groupName,
                homeLanguage: group.homeLanguage,
                accommodations: group.accommodations,
                readingLevelLabel: group.readingLevelLabel,
              },
              retryFailedOnly: true,
            },
          });

          if (!retryResponse.error) {
            setGroupStatuses(prev => prev.map((gs, idx) => 
              idx === i 
                ? { 
                    ...gs, 
                    status: 'complete',
                    sectionsComplete: retryResponse.data?.generated || 0,
                    totalSections: retryResponse.data?.generated || 0,
                    error: undefined,
                  } 
                : gs
            ));
            completedGroups++;
            setOverallProgress(Math.round((completedGroups / totalGroups) * 100));
          }
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
    }

    setIsGenerating(false);
    
    const successCount = groupStatuses.filter(gs => gs.status === 'complete').length;
    if (successCount > 0) {
      toast({
        title: 'Audio generation complete',
        description: `Generated audio for ${successCount}/${totalGroups} groups`,
      });
      onAudioGenerated();
    } else {
      toast({
        title: 'Audio generation failed',
        description: 'Could not generate audio. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (groupsNeedingAudio.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          onClick={handleGenerateAudio}
          disabled={disabled || isGenerating || !lessonId}
          variant="secondary"
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Audio...
            </>
          ) : (
            <>
              <Headphones className="h-4 w-4" />
              Generate Audio ({groupsNeedingAudio.length} groups)
            </>
          )}
        </Button>
        
        {!lessonId && (
          <span className="text-xs text-muted-foreground">
            Save lesson first to enable audio
          </span>
        )}
      </div>

      {/* Progress display during generation */}
      {isGenerating && groupStatuses.length > 0 && (
        <div className="p-4 rounded-lg border bg-card space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Generating audio files...</span>
            <span className="text-muted-foreground">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          
          <div className="space-y-2 mt-3">
            {groupStatuses.map((gs, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                {gs.status === 'pending' && (
                  <div className="h-4 w-4 rounded-full border-2 border-muted" />
                )}
                {gs.status === 'generating' && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {gs.status === 'complete' && (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                )}
                {gs.status === 'error' && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className={gs.status === 'complete' ? 'text-success' : gs.status === 'error' ? 'text-destructive' : ''}>
                  {gs.groupName}
                </span>
                {gs.status === 'complete' && gs.sectionsComplete > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({gs.sectionsComplete} sections)
                  </span>
                )}
                {gs.status === 'error' && gs.error && (
                  <span className="text-xs text-destructive truncate max-w-[200px]">
                    {gs.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retry button if there were errors */}
      {!isGenerating && groupStatuses.some(gs => gs.status === 'error') && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateAudio}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Failed Groups
        </Button>
      )}
    </div>
  );
}
