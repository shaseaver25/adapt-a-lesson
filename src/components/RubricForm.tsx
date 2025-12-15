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
import { AIVulnerabilityAnalysis as AnalysisType } from '@/types/vulnerabilityAnalysis';
import { AIVulnerabilityAnalysis } from './AIVulnerabilityAnalysis';
import { FileText, GraduationCap, Plus, X, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RubricFormProps {
  onSubmit: (input: RubricInput) => void;
  isLoading?: boolean;
}

export function RubricForm({ onSubmit, isLoading }: RubricFormProps) {
  const [assessmentDescription, setAssessmentDescription] = useState('');
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [numCriteria, setNumCriteria] = useState('4');
  
  // Vulnerability analysis state
  const [analysis, setAnalysis] = useState<AnalysisType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([]);
  const [isApplyingEnhancements, setIsApplyingEnhancements] = useState(false);

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

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setAnalysis(null);
    setSelectedEnhancements([]);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-assessment-vulnerability', {
        body: {
          assessmentDescription,
          learningObjectives: objectives.filter((o) => o.trim() !== ''),
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Error analyzing assessment:', error);
      toast({
        title: 'Error analyzing assessment',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleEnhancement = (enhancement: string) => {
    setSelectedEnhancements(prev => 
      prev.includes(enhancement)
        ? prev.filter(e => e !== enhancement)
        : [...prev, enhancement]
    );
  };

  const handleApplyRecommendations = async (enhancements: string[]) => {
    setIsApplyingEnhancements(true);
    
    // Append selected recommendations to the assessment description
    const enhancedDescription = `${assessmentDescription}

REQUIRED AI-PROOF ELEMENTS:
${enhancements.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
    
    setAssessmentDescription(enhancedDescription);
    
    // Re-analyze with the enhanced description
    try {
      const { data, error } = await supabase.functions.invoke('analyze-assessment-vulnerability', {
        body: {
          assessmentDescription: enhancedDescription,
          learningObjectives: objectives.filter((o) => o.trim() !== ''),
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysis(data.analysis);
      setSelectedEnhancements([]);
      
      toast({
        title: 'Recommendations applied',
        description: 'Assessment updated with AI-resistant enhancements. Review the new analysis.',
      });
    } catch (error) {
      console.error('Error re-analyzing assessment:', error);
      toast({
        title: 'Error updating analysis',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsApplyingEnhancements(false);
    }
  };

  const handleGenerateAsIs = () => {
    const input: RubricInput = {
      assessmentDescription,
      learningObjectives: objectives.filter((o) => o.trim() !== ''),
      numCriteria: parseInt(numCriteria, 10),
    };
    onSubmit(input);
    // Reset analysis state after generating
    setAnalysis(null);
    setSelectedEnhancements([]);
  };

  const handleReset = () => {
    setAnalysis(null);
    setSelectedEnhancements([]);
  };

  const isValid = assessmentDescription.trim() !== '' && objectives.some((o) => o.trim() !== '');

  return (
    <div className="space-y-8">
      <form onSubmit={handleAnalyze} className="space-y-8">
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
              disabled={isAnalyzing || isLoading}
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
                  disabled={isAnalyzing || isLoading}
                />
                {objectives.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeObjective(index)}
                    className="shrink-0"
                    disabled={isAnalyzing || isLoading}
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
              disabled={isAnalyzing || isLoading}
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
            <Select value={numCriteria} onValueChange={setNumCriteria} disabled={isAnalyzing || isLoading}>
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

        {/* Analyze Button - only show if no analysis yet */}
        {!analysis && (
          <Button
            type="submit"
            variant="hero"
            size="lg"
            className="w-full"
            disabled={isAnalyzing || !isValid}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing for AI Vulnerabilities...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Analyze Assessment & Generate Rubric
              </>
            )}
          </Button>
        )}
      </form>

      {/* Vulnerability Analysis Display */}
      {analysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg">Assessment Analysis</h3>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              ← Edit Assessment
            </Button>
          </div>
          <AIVulnerabilityAnalysis
            analysis={analysis}
            onApplyRecommendations={handleApplyRecommendations}
            onGenerateAsIs={handleGenerateAsIs}
            isApplying={isApplyingEnhancements}
            isGenerating={isLoading}
            selectedEnhancements={selectedEnhancements}
            onToggleEnhancement={handleToggleEnhancement}
          />
        </div>
      )}
    </div>
  );
}
