import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  StudentGroup,
  READING_LEVELS,
  ELL_STATUSES,
  IEP_504_STATUSES,
  ACCOMMODATION_OPTIONS,
  LANGUAGES,
  LEARNING_PREFERENCES,
} from '@/types/studentGroup';
import {
  READING_LEVEL_DESCRIPTIONS,
  ELL_STATUS_DESCRIPTIONS,
  ACCOMMODATION_DESCRIPTIONS,
  LEARNING_PREFERENCE_DESCRIPTIONS,
  IEP_504_DESCRIPTIONS,
} from '@/lib/tooltipDescriptions';
import { getTeacherDisplayLabel, getTeacherDisplayIcon } from '@/lib/readingLevelNames';
import { Users, BookOpen, Languages, ClipboardList, Brain, HelpCircle } from 'lucide-react';

interface StudentGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: StudentGroup) => void;
  initialData?: StudentGroup;
  isLoading?: boolean;
}

export function StudentGroupFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading,
}: StudentGroupFormModalProps) {
  const [groupName, setGroupName] = useState('');
  const [numStudents, setNumStudents] = useState(1);
  const [readingLevelLabel, setReadingLevelLabel] = useState<StudentGroup['readingLevelLabel']>('On Grade');
  const [readingLevelLexile, setReadingLevelLexile] = useState('');
  const [homeLanguage, setHomeLanguage] = useState('English');
  const [ellStatus, setEllStatus] = useState<StudentGroup['ellStatus']>('None');
  const [iep504Status, setIep504Status] = useState<StudentGroup['iep504Status']>('None');
  const [learningPreferences, setLearningPreferences] = useState<string[]>([]);
  const [accommodations, setAccommodations] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setGroupName(initialData.groupName);
      setNumStudents(initialData.numStudents);
      setReadingLevelLabel(initialData.readingLevelLabel);
      setReadingLevelLexile(initialData.readingLevelLexile);
      setHomeLanguage(initialData.homeLanguage);
      setEllStatus(initialData.ellStatus);
      setIep504Status(initialData.iep504Status);
      setLearningPreferences(initialData.learningPreferences);
      setAccommodations(initialData.accommodations);
      setNotes(initialData.notes);
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setGroupName('');
    setNumStudents(1);
    setReadingLevelLabel('On Grade');
    setReadingLevelLexile('');
    setHomeLanguage('English');
    setEllStatus('None');
    setIep504Status('None');
    setLearningPreferences([]);
    setAccommodations([]);
    setNotes('');
  };

  const handleAccommodationToggle = (accommodation: string) => {
    setAccommodations((prev) =>
      prev.includes(accommodation)
        ? prev.filter((a) => a !== accommodation)
        : [...prev, accommodation]
    );
  };

  const handleLearningPrefToggle = (pref: string) => {
    setLearningPreferences((prev) =>
      prev.includes(pref)
        ? prev.filter((p) => p !== pref)
        : [...prev, pref]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      groupName,
      numStudents,
      readingLevelLabel,
      readingLevelLexile,
      homeLanguage,
      ellStatus,
      iep504Status,
      learningPreferences,
      accommodations,
      notes,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-display text-xl">
            {initialData ? 'Edit Student Group' : 'Create Student Group'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] px-6">
          <form onSubmit={handleSubmit} className="space-y-6 pb-6">
            {/* Student Group Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-display font-bold text-lg">Student Group</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    placeholder="e.g., Table 3, Spanish ELL Group"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numStudents">Number of Students</Label>
                  <Input
                    id="numStudents"
                    type="number"
                    min={1}
                    max={50}
                    value={numStudents}
                    onChange={(e) => setNumStudents(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Reading Level */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-foreground">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="font-display font-bold text-lg">Reading Level</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="readingLevel">Level</Label>
                  <Select value={readingLevelLabel} onValueChange={(v) => setReadingLevelLabel(v as StudentGroup['readingLevelLabel'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {READING_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center gap-2">
                            <span>{getTeacherDisplayIcon(level.value)}</span>
                            <span>{getTeacherDisplayLabel(level.value)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {READING_LEVEL_DESCRIPTIONS[readingLevelLabel] && (
                    <p className="text-xs text-muted-foreground">
                      {READING_LEVEL_DESCRIPTIONS[readingLevelLabel]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lexile">Lexile Score (optional)</Label>
                  <Input
                    id="lexile"
                    placeholder="e.g., 550, 800L"
                    value={readingLevelLexile}
                    onChange={(e) => setReadingLevelLexile(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Language Support */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-foreground">
                <Languages className="h-5 w-5 text-primary" />
                <h3 className="font-display font-bold text-lg">Language Support</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="homeLanguage">Home Language</Label>
                  <Select value={homeLanguage} onValueChange={setHomeLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="ellStatus">ELL Status</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">English Language Learner proficiency levels based on WIDA framework</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={ellStatus} onValueChange={(v) => setEllStatus(v as StudentGroup['ellStatus'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ELL_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {ellStatus !== 'None' && ELL_STATUS_DESCRIPTIONS[ellStatus] && (
                    <p className="text-xs text-muted-foreground">
                      {ELL_STATUS_DESCRIPTIONS[ellStatus]}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="iepStatus">IEP/504 Status</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">Individualized Education Program or Section 504 accommodations plan</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={iep504Status} onValueChange={(v) => setIep504Status(v as StudentGroup['iep504Status'])}>
                  <SelectTrigger className="w-full sm:w-1/2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IEP_504_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {iep504Status !== 'None' && IEP_504_DESCRIPTIONS[iep504Status] && (
                  <p className="text-xs text-muted-foreground">
                    {IEP_504_DESCRIPTIONS[iep504Status]}
                  </p>
                )}
              </div>
            </div>

            {/* Learning Preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-foreground">
                <Brain className="h-5 w-5 text-primary" />
                <h3 className="font-display font-bold text-lg">Learning Preferences</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {LEARNING_PREFERENCES.map((pref) => (
                  <Tooltip key={pref.value}>
                    <TooltipTrigger asChild>
                      <label
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={learningPreferences.includes(pref.value)}
                          onCheckedChange={() => handleLearningPrefToggle(pref.value)}
                        />
                        <span className="text-sm text-foreground">{pref.label}</span>
                      </label>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">{LEARNING_PREFERENCE_DESCRIPTIONS[pref.value]}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Accommodations */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-foreground">
                <ClipboardList className="h-5 w-5 text-primary" />
                <h3 className="font-display font-bold text-lg">Accommodations</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">Hover over each option for more details about the accommodation</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ACCOMMODATION_OPTIONS.map((accommodation) => (
                  <Tooltip key={accommodation}>
                    <TooltipTrigger asChild>
                      <label
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={accommodations.includes(accommodation)}
                          onCheckedChange={() => handleAccommodationToggle(accommodation)}
                          className="mt-0.5"
                        />
                        <span className="text-sm text-foreground">{accommodation}</span>
                      </label>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">{ACCOMMODATION_DESCRIPTIONS[accommodation]}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional context about this student group..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !groupName}>
                {isLoading ? 'Saving...' : initialData ? 'Save Changes' : 'Create Group'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
