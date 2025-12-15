import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AssessmentInput,
  AIPolicy,
  AI_POLICIES,
  SUBJECTS,
  GRADE_LEVELS,
} from '@/types/assessment';
import { FileCheck, GraduationCap, MapPin, Bot, Plus, X } from 'lucide-react';

interface AssessmentFormProps {
  onSubmit: (input: AssessmentInput) => void;
  isLoading?: boolean;
}

export function AssessmentForm({ onSubmit, isLoading }: AssessmentFormProps) {
  const [lessonTitle, setLessonTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [aiPolicy, setAiPolicy] = useState<AIPolicy>('limited_assist');
  const [schoolName, setSchoolName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [localContext, setLocalContext] = useState('');

  const addObjective = () => {
    setObjectives([...objectives, '']);
  };

  const removeObjective = (index: number) => {
    if (objectives.length > 1) {
      setObjectives(objectives.filter((_, i) => i !== index));
    }
  };

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: AssessmentInput = {
      lessonTitle,
      subject,
      gradeLevel,
      learningObjectives: objectives.filter((o) => o.trim() !== ''),
      aiPolicy,
      schoolName,
      city,
      state,
      localContext,
    };
    onSubmit(input);
  };

  const isValid = lessonTitle && subject && gradeLevel && objectives.some((o) => o.trim() !== '');

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Lesson Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <FileCheck className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Lesson Information</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lessonTitle">Lesson Title</Label>
            <Input
              id="lessonTitle"
              placeholder="e.g., Ecosystem Interactions"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Grade Level</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Objectives */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Learning Objectives</h3>
        </div>

        <div className="space-y-3">
          {objectives.map((objective, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Objective ${index + 1}`}
                value={objective}
                onChange={(e) => updateObjective(index, e.target.value)}
                required={index === 0}
              />
              {objectives.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeObjective(index)}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addObjective}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Objective
          </Button>
        </div>
      </div>

      {/* AI Policy */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">AI Policy</h3>
        </div>

        <div className="grid gap-3">
          {AI_POLICIES.map((policy) => (
            <label
              key={policy.value}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                aiPolicy === policy.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:bg-muted/50'
              }`}
            >
              <input
                type="radio"
                name="aiPolicy"
                value={policy.value}
                checked={aiPolicy === policy.value}
                onChange={(e) => setAiPolicy(e.target.value as AIPolicy)}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-foreground">{policy.label}</div>
                <div className="text-sm text-muted-foreground">{policy.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Local Context */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Local Context</h3>
          <span className="text-xs text-muted-foreground">(makes assessment AI-resistant)</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="schoolName">School Name</Label>
            <Input
              id="schoolName"
              placeholder="e.g., Lincoln Elementary"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="e.g., Portland"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              placeholder="e.g., Oregon"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="localContext">Additional Local Details</Label>
          <Textarea
            id="localContext"
            placeholder="e.g., Near the Willamette River, annual salmon run in November, local paper mill history..."
            value={localContext}
            onChange={(e) => setLocalContext(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        variant="hero"
        size="lg"
        className="w-full"
        disabled={isLoading || !isValid}
      >
        {isLoading ? (
          <span className="animate-pulse-soft">Generating Assessment...</span>
        ) : (
          'Generate AI-Resistant Assessment'
        )}
      </Button>
    </form>
  );
}
