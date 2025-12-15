import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Users, BookOpen, Languages, ClipboardList, Brain } from 'lucide-react';

interface StudentGroupFormProps {
  onSubmit: (group: StudentGroup, lesson: string) => void;
  isLoading?: boolean;
}

export function StudentGroupForm({ onSubmit, isLoading }: StudentGroupFormProps) {
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
  const [lessonContent, setLessonContent] = useState('');

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
    const group: StudentGroup = {
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
    };
    onSubmit(group, lessonContent);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Student Group Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Student Group</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
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
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="readingLevel">Level</Label>
            <Select value={readingLevelLabel} onValueChange={(v) => setReadingLevelLabel(v as StudentGroup['readingLevelLabel'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {READING_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        
        <div className="grid grid-cols-2 gap-4">
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
            <Label htmlFor="ellStatus">ELL Status</Label>
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
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="iepStatus">IEP/504 Status</Label>
          <Select value={iep504Status} onValueChange={(v) => setIep504Status(v as StudentGroup['iep504Status'])}>
            <SelectTrigger className="w-full md:w-1/2">
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
        </div>
      </div>

      {/* Learning Preferences */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Learning Preferences</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {LEARNING_PREFERENCES.map((pref) => (
            <label
              key={pref.value}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={learningPreferences.includes(pref.value)}
                onCheckedChange={() => handleLearningPrefToggle(pref.value)}
              />
              <span className="text-sm text-foreground">{pref.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Accommodations */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Accommodations</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {ACCOMMODATION_OPTIONS.map((accommodation) => (
            <label
              key={accommodation}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={accommodations.includes(accommodation)}
                onCheckedChange={() => handleAccommodationToggle(accommodation)}
              />
              <span className="text-sm text-foreground">{accommodation}</span>
            </label>
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

      {/* Lesson Content */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-foreground">
          <BookOpen className="h-5 w-5 text-accent" />
          <h3 className="font-display font-bold text-lg">Original Lesson Content</h3>
        </div>
        
        <Textarea
          placeholder="Paste your lesson content here in markdown format..."
          value={lessonContent}
          onChange={(e) => setLessonContent(e.target.value)}
          rows={12}
          className="font-mono text-sm"
          required
        />
      </div>

      {/* Submit */}
      <Button 
        type="submit" 
        variant="hero" 
        size="lg" 
        className="w-full"
        disabled={isLoading || !groupName || !lessonContent}
      >
        {isLoading ? (
          <>
            <span className="animate-pulse-soft">Differentiating...</span>
          </>
        ) : (
          'Differentiate Lesson'
        )}
      </Button>
    </form>
  );
}
