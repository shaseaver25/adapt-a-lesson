import { useState, useEffect, useCallback } from "react";

export interface MarketingSurveyFormData {
  // Step 1: About You
  primary_role: string;
  grade_levels: string[];
  usage_duration: string;
  // Step 2: Usage & Value
  lessons_per_week: string;
  features_used: string[];
  time_saved_rating: number;
  previous_method: string;
  // Step 3: Satisfaction & Impact
  lesson_quality_satisfaction: number;
  multilingual_satisfaction: number;
  student_impact: string;
  nps_score: number;
  // Step 4: Compliance & Open Feedback
  wcag_adoption_factor: string;
  ocr_complaint: string;
  most_valuable_thing: string;
  improvement_suggestion: string;
}

const STORAGE_KEY = "marketing_survey_draft";

const defaultFormData: MarketingSurveyFormData = {
  primary_role: "",
  grade_levels: [],
  usage_duration: "",
  lessons_per_week: "",
  features_used: [],
  time_saved_rating: 0,
  previous_method: "",
  lesson_quality_satisfaction: 0,
  multilingual_satisfaction: 0,
  student_impact: "",
  nps_score: -1,
  wcag_adoption_factor: "",
  ocr_complaint: "",
  most_valuable_thing: "",
  improvement_suggestion: "",
};

export function useMarketingSurveyForm() {
  const [formData, setFormData] = useState<MarketingSurveyFormData>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return { ...defaultFormData, ...JSON.parse(saved) };
        } catch {
          return defaultFormData;
        }
      }
    }
    return defaultFormData;
  });

  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateField = useCallback(<K extends keyof MarketingSurveyFormData>(
    field: K,
    value: MarketingSurveyFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleArrayField = useCallback((
    field: "grade_levels" | "features_used",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(defaultFormData);
    setCurrentStep(1);
  }, []);

  const isStep1Valid = formData.primary_role !== "" && formData.usage_duration !== "";
  const isStep2Valid = formData.time_saved_rating > 0 && formData.previous_method !== "";
  const isStep3Valid = formData.lesson_quality_satisfaction > 0 && formData.nps_score >= 0;
  const isStep4Valid = formData.most_valuable_thing.trim().length > 0;

  return {
    formData,
    currentStep,
    updateField,
    toggleArrayField,
    nextStep,
    prevStep,
    clearDraft,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    isStep4Valid,
    setCurrentStep,
  };
}
