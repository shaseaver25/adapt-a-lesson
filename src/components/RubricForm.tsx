import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RubricInput } from '@/types/rubric';
import { FileText, GraduationCap, Plus, X } from 'lucide-react';

interface RubricFormProps {
  onSubmit: (input: RubricInput) => void;
  isLoading?: boolean;
}

export function RubricForm({ onSubmit, isLoading }: RubricFormProps) {
  const [assessmentDescription, setAssessmentDescription] = useState('');
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [numCriteria, setNumCriteria] = useState('4');

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
    const input: RubricInput = {
      assessmentDescription,
      learningObjectives: objectives.filter((o) => o.trim() !== ''),
      numCriteria: parseInt(numCriteria, 10),
    };
    onSubmit(input);
  };

  const isValid = assessmentDescription.trim() !== '' && objectives.some((o) => o.trim() !== '');

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Assessment Description */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Assessment Description</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assessmentDescription">
            Describe the assessment this rubric will evaluate
          </Label>
          <Textarea
            id="assessmentDescription"
            placeholder="e.g., Students will create a food web poster showing at least 10 organisms from their local ecosystem, including producers, primary consumers, secondary consumers, and decomposers. They must include arrows showing energy flow and write a paragraph explaining one example of interdependence."
            value={assessmentDescription}
            onChange={(e) => setAssessmentDescription(e.target.value)}
            rows={4}
            required
          />
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

      {/* Rubric Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Rubric Settings</h3>
        </div>

        <div className="space-y-2 max-w-xs">
          <Label htmlFor="numCriteria">Number of Criteria</Label>
          <Select value={numCriteria} onValueChange={setNumCriteria}>
            <SelectTrigger>
              <SelectValue placeholder="Select number" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Criteria</SelectItem>
              <SelectItem value="4">4 Criteria</SelectItem>
              <SelectItem value="5">5 Criteria</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Each criterion will have 4 performance levels: Exemplary, Proficient, Developing, Beginning
          </p>
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
          <span className="animate-pulse-soft">Generating Rubric...</span>
        ) : (
          'Generate Analytic Rubric'
        )}
      </Button>
    </form>
  );
}
