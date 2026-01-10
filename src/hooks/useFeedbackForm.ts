import { useState, useEffect, useCallback } from "react";

export interface FeedbackFormData {
  // Step 1: Usage & Satisfaction
  usage_frequency: string;
  overall_satisfaction: number;
  ease_of_use: number;
  feature_completeness: number;
  would_recommend: boolean | null;

  // Step 2: Detailed Feedback
  favorite_features: string;
  pain_points: string;
  missing_features: string;
  improvement_suggestions: string;

  // Step 3: About You
  user_role: string;
  years_teaching: number | null;
  grade_levels: string[];
  subject_areas: string[];
  use_cases: string;
}

const STORAGE_KEY = "feedback_form_draft";

const defaultFormData: FeedbackFormData = {
  usage_frequency: "",
  overall_satisfaction: 0,
  ease_of_use: 0,
  feature_completeness: 0,
  would_recommend: null,
  favorite_features: "",
  pain_points: "",
  missing_features: "",
  improvement_suggestions: "",
  user_role: "",
  years_teaching: null,
  grade_levels: [],
  subject_areas: [],
  use_cases: "",
};

export function useFeedbackForm() {
  const [formData, setFormData] = useState<FeedbackFormData>(() => {
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

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateField = useCallback(<K extends keyof FeedbackFormData>(
    field: K,
    value: FeedbackFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleArrayField = useCallback((
    field: "grade_levels" | "subject_areas",
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
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(defaultFormData);
    setCurrentStep(1);
  }, []);

  const isStep1Valid = 
    formData.usage_frequency !== "" &&
    formData.overall_satisfaction > 0 &&
    formData.ease_of_use > 0 &&
    formData.feature_completeness > 0 &&
    formData.would_recommend !== null;

  const isStep2Valid = formData.missing_features.trim().length > 0;

  const isStep3Valid = formData.user_role !== "";

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
    setCurrentStep,
  };
}
