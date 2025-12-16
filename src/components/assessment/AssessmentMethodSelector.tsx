import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BookOpen, Target, Plus, X } from 'lucide-react';
import { CategoryCard } from './CategoryCard';
import { MethodOption } from './MethodOption';
import { LocalContextCard } from './LocalContextCard';
import { 
  ASSESSMENT_METHODS, 
  LessonContext, 
  LocalContext, 
  AssessmentCategory,
  MethodOutput 
} from '@/types/assessmentMethods';
import { SUBJECTS, GRADE_LEVELS } from '@/types/assessment';

interface AssessmentMethodSelectorProps {
  onGenerate: (data: {
    lessonContext: LessonContext;
    localContext: LocalContext;
    selectedCategory: string;
    selectedMethod: string;
    methodDetails: MethodOutput;
  }) => void;
  isLoading?: boolean;
}

export function AssessmentMethodSelector({ onGenerate, isLoading }: AssessmentMethodSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  
  const [lessonContext, setLessonContext] = useState<LessonContext>({
    title: '',
    subject: '',
    gradeLevel: '',
    objectives: [''],
  });

  const [localContext, setLocalContext] = useState<LocalContext>({
    schoolName: '',
    city: '',
    state: '',
    details: '',
  });

  const categories = Object.values(ASSESSMENT_METHODS);
  const selectedCategoryData = selectedCategory ? ASSESSMENT_METHODS[selectedCategory] : null;
  const selectedMethodData = selectedCategoryData?.options.find(m => m.id === selectedMethod);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedMethod(null);
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const addObjective = () => {
    setLessonContext(prev => ({
      ...prev,
      objectives: [...prev.objectives, ''],
    }));
  };

  const removeObjective = (index: number) => {
    setLessonContext(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index),
    }));
  };

  const updateObjective = (index: number, value: string) => {
    setLessonContext(prev => ({
      ...prev,
      objectives: prev.objectives.map((obj, i) => (i === index ? value : obj)),
    }));
  };

  const handleGenerate = () => {
    if (!selectedCategory || !selectedMethod || !selectedMethodData) return;
    
    onGenerate({
      lessonContext,
      localContext,
      selectedCategory,
      selectedMethod,
      methodDetails: selectedMethodData,
    });
  };

  const isFormValid = 
    lessonContext.title.trim() !== '' &&
    lessonContext.subject !== '' &&
    lessonContext.gradeLevel !== '' &&
    lessonContext.objectives.some(o => o.trim() !== '') &&
    selectedCategory !== null &&
    selectedMethod !== null;

  return (
    <div className="space-y-6">
      {/* AI Resistance Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <span className="text-muted-foreground font-medium">AI Resistance:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Very High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-muted-foreground">High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
          <span className="text-muted-foreground">Low</span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Context Cards */}
        <div className="space-y-4">
          {/* Lesson Context Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base font-semibold">Lesson Context</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lessonTitle" className="text-sm font-medium">
                  Lesson Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lessonTitle"
                  placeholder="e.g., Introduction to Ecosystems"
                  value={lessonContext.title}
                  onChange={(e) => setLessonContext(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={lessonContext.subject}
                  onValueChange={(value) => setLessonContext(prev => ({ ...prev, subject: value }))}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradeLevel" className="text-sm font-medium">
                  Grade Level <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={lessonContext.gradeLevel}
                  onValueChange={(value) => setLessonContext(prev => ({ ...prev, gradeLevel: value }))}
                >
                  <SelectTrigger id="gradeLevel">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Learning Objectives <span className="text-destructive">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addObjective}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {lessonContext.objectives.map((objective, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Objective ${index + 1}`}
                        value={objective}
                        onChange={(e) => updateObjective(index, e.target.value)}
                        className="flex-1"
                      />
                      {lessonContext.objectives.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeObjective(index)}
                          className="h-10 w-10 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Local Context Card */}
          <LocalContextCard
            localContext={localContext}
            onChange={setLocalContext}
          />
        </div>

        {/* Right Column - Method Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Cards */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base font-semibold">Assessment Method</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose an assessment type that aligns with your learning goals
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    isSelected={selectedCategory === category.id}
                    onClick={() => handleCategorySelect(category.id)}
                  />
                ))}
              </div>

              {/* Method Options */}
              {selectedCategoryData && (
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedCategoryData.icon}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{selectedCategoryData.label}</h3>
                      <p className="text-sm text-muted-foreground">{selectedCategoryData.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedCategoryData.options.map((method) => (
                      <MethodOption
                        key={method.id}
                        method={method}
                        isSelected={selectedMethod === method.id}
                        onClick={() => handleMethodSelect(method.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generate Button */}
          {selectedMethod && selectedMethodData && (
            <Button
              onClick={handleGenerate}
              disabled={!isFormValid || isLoading}
              className="w-full h-12 gradient-warm text-primary-foreground font-semibold shadow-lg shadow-orange-200/50 hover:shadow-orange-300/50 transition-all"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate {selectedMethodData.name} Materials
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
