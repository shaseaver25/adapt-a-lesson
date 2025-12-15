import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RubricInput, AIProofSettings, VerificationCheckpoints } from '@/types/rubric';
import { AIVulnerabilityAnalysis as AnalysisType } from '@/types/vulnerabilityAnalysis';
import { AIVulnerabilityAnalysis } from './AIVulnerabilityAnalysis';
import { SavedAssessmentSelector } from './SavedAssessmentSelector';
import { FileText, GraduationCap, Plus, X, Shield, Loader2, ChevronDown, Settings2, ClipboardCheck, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RubricFormProps {
  onSubmit: (input: RubricInput) => void;
  isLoading?: boolean;
}

const DEFAULT_AI_PROOF_SETTINGS: AIProofSettings = {
  enableAIProofAnalysis: true,
  requireProcessDocumentation: true,
  includeLiveVerification: true,
  localSpecificityRequired: false,
  generateTeacherVerificationGuide: true,
};

const DEFAULT_VERIFICATION_CHECKPOINTS: VerificationCheckpoints = {
  processLog: true,
  primaryResearchEvidence: false,
  draftHistory: true,
  photoDocumentation: false,
  liveQA: false,
  peerVerification: false,
};

export function RubricForm({ onSubmit, isLoading }: RubricFormProps) {
  const [assessmentDescription, setAssessmentDescription] = useState('');
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [numCriteria, setNumCriteria] = useState('4');
  const [gradeLevel, setGradeLevel] = useState('');
  
  // AI-Proof Settings
  const [aiProofSettings, setAiProofSettings] = useState<AIProofSettings>(DEFAULT_AI_PROOF_SETTINGS);
  const [verificationCheckpoints, setVerificationCheckpoints] = useState<VerificationCheckpoints>(DEFAULT_VERIFICATION_CHECKPOINTS);
  const [aiProofOpen, setAiProofOpen] = useState(false);
  const [checkpointsOpen, setCheckpointsOpen] = useState(false);
  
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

  const updateAiProofSetting = (key: keyof AIProofSettings, value: boolean) => {
    setAiProofSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateCheckpoint = (key: keyof VerificationCheckpoints, value: boolean) => {
    setVerificationCheckpoints(prev => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aiProofSettings.enableAIProofAnalysis) {
      // Skip analysis and go straight to generation
      handleGenerateAsIs();
      return;
    }
    
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
      
      // Auto-update settings based on analysis
      if (data.analysis.aiVulnerabilityScore > 30) {
        setAiProofSettings(prev => ({
          ...prev,
          requireProcessDocumentation: true,
        }));
      }
      if (data.analysis.vulnerabilities?.writtenOnlyOutput) {
        setAiProofSettings(prev => ({
          ...prev,
          includeLiveVerification: true,
        }));
      }
      if (data.analysis.vulnerabilities?.nonLocalTopic === false) {
        setAiProofSettings(prev => ({
          ...prev,
          localSpecificityRequired: true,
        }));
      }
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
    
    const enhancedDescription = `${assessmentDescription}

REQUIRED AI-PROOF ELEMENTS:
${enhancements.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
    
    setAssessmentDescription(enhancedDescription);
    
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
      gradeLevel: gradeLevel || undefined,
      vulnerabilityAnalysis: analysis || undefined,
      aiProofSettings,
      verificationCheckpoints,
    };
    onSubmit(input);
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
      {/* View Saved Rubrics Button */}
      <div className="flex justify-end">
        <Link to="/saved-rubrics">
          <Button variant="outline" size="sm" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            View Saved Rubrics
          </Button>
        </Link>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-8">
        {/* Assessment Description */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-display font-bold text-lg">Assessment Description</h3>
            </div>
            <SavedAssessmentSelector
              currentDescription={assessmentDescription}
              onSelectAssessment={setAssessmentDescription}
              disabled={isAnalyzing || isLoading}
            />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
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
                Each criterion will have 4 performance levels
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Grade Level (Optional)</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel} disabled={isAnalyzing || isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="K-2">K-2</SelectItem>
                  <SelectItem value="3-5">3-5</SelectItem>
                  <SelectItem value="6-8">6-8</SelectItem>
                  <SelectItem value="9-12">9-12</SelectItem>
                  <SelectItem value="Higher Ed">Higher Ed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* AI-Proof Settings */}
        <Collapsible open={aiProofOpen} onOpenChange={setAiProofOpen}>
          <Card className="border-border">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg font-display">AI-Proof Settings</CardTitle>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${aiProofOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="enableAIProofAnalysis"
                      checked={aiProofSettings.enableAIProofAnalysis}
                      onCheckedChange={(checked) => updateAiProofSetting('enableAIProofAnalysis', !!checked)}
                      disabled={isAnalyzing || isLoading}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="enableAIProofAnalysis" className="text-sm font-medium cursor-pointer">
                        Enable AI-Proof Analysis
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Analyze assessment for AI vulnerabilities before generating rubric
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="requireProcessDocumentation"
                      checked={aiProofSettings.requireProcessDocumentation}
                      onCheckedChange={(checked) => updateAiProofSetting('requireProcessDocumentation', !!checked)}
                      disabled={isAnalyzing || isLoading}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="requireProcessDocumentation" className="text-sm font-medium cursor-pointer">
                        Require Process Documentation
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Add criteria for work logs, drafts, and revision history
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="includeLiveVerification"
                      checked={aiProofSettings.includeLiveVerification}
                      onCheckedChange={(checked) => updateAiProofSetting('includeLiveVerification', !!checked)}
                      disabled={isAnalyzing || isLoading}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="includeLiveVerification" className="text-sm font-medium cursor-pointer">
                        Include Live Verification
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Add live Q&A component to verify student ownership
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="localSpecificityRequired"
                      checked={aiProofSettings.localSpecificityRequired}
                      onCheckedChange={(checked) => updateAiProofSetting('localSpecificityRequired', !!checked)}
                      disabled={isAnalyzing || isLoading}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="localSpecificityRequired" className="text-sm font-medium cursor-pointer">
                        Require Local Specificity
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Add criteria for verifiable local context and details
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 md:col-span-2">
                    <Checkbox
                      id="generateTeacherVerificationGuide"
                      checked={aiProofSettings.generateTeacherVerificationGuide}
                      onCheckedChange={(checked) => updateAiProofSetting('generateTeacherVerificationGuide', !!checked)}
                      disabled={isAnalyzing || isLoading}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="generateTeacherVerificationGuide" className="text-sm font-medium cursor-pointer">
                        Generate Teacher Verification Guide
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Include verification questions, red flags, and checklist for teachers
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Verification Checkpoints */}
        <Collapsible open={checkpointsOpen} onOpenChange={setCheckpointsOpen}>
          <Card className="border-border">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg font-display">Verification Checkpoints</CardTitle>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${checkpointsOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  Select which verification artifacts students should provide:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="processLog"
                      checked={verificationCheckpoints.processLog}
                      onCheckedChange={(checked) => updateCheckpoint('processLog', !!checked)}
                      disabled={isAnalyzing || isLoading}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="processLog" className="text-sm font-medium cursor-pointer">
                        Process/Research Log
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Dated entries showing evolution of thinking
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="primaryResearchEvidence"
                      checked={verificationCheckpoints.primaryResearchEvidence}
                      onCheckedChange={(checked) => updateCheckpoint('primaryResearchEvidence', !!checked)}
                      disabled={isAnalyzing || isLoading}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="primaryResearchEvidence" className="text-sm font-medium cursor-pointer">
                        Primary Research Evidence
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Interview recordings, survey data, observation notes
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="draftHistory"
                      checked={verificationCheckpoints.draftHistory}
                      onCheckedChange={(checked) => updateCheckpoint('draftHistory', !!checked)}
                      disabled={isAnalyzing || isLoading}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="draftHistory" className="text-sm font-medium cursor-pointer">
                        Draft History
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Multiple drafts showing substantive revisions
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="photoDocumentation"
                      checked={verificationCheckpoints.photoDocumentation}
                      onCheckedChange={(checked) => updateCheckpoint('photoDocumentation', !!checked)}
                      disabled={isAnalyzing || isLoading}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="photoDocumentation" className="text-sm font-medium cursor-pointer">
                        Photo Documentation
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Photographic evidence of real-world engagement
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="liveQA"
                      checked={verificationCheckpoints.liveQA}
                      onCheckedChange={(checked) => updateCheckpoint('liveQA', !!checked)}
                      disabled={isAnalyzing || isLoading}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="liveQA" className="text-sm font-medium cursor-pointer">
                        Live Q&A Session
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Oral defense or follow-up questions
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="peerVerification"
                      checked={verificationCheckpoints.peerVerification}
                      onCheckedChange={(checked) => updateCheckpoint('peerVerification', !!checked)}
                      disabled={isAnalyzing || isLoading}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="peerVerification" className="text-sm font-medium cursor-pointer">
                        Peer Verification
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Collaborative component with peer attestation
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

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
            ) : aiProofSettings.enableAIProofAnalysis ? (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Analyze Assessment & Generate Rubric
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Rubric
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
