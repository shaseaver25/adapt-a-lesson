import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { StudentGroup } from '@/types/studentGroup';

export type GraphicOrganizerType = 
  | 'auto' 
  | 'venn-diagram' 
  | 'flow-chart' 
  | 'cause-effect' 
  | 'web-diagram' 
  | 'frayer-model' 
  | 'story-map' 
  | 'claim-evidence' 
  | 't-chart'
  | 'none';

export interface DifferentiationOptions {
  includeVocabularyScaffolding: boolean;
  generateComprehensionQuestions: boolean;
  includeVisualPlaceholders: boolean;
  includeGraphicOrganizers: boolean;
  graphicOrganizerType: GraphicOrganizerType;
  outputFormat: 'markdown' | 'pdf-ready' | 'google-docs';
}

interface DifferentiationState {
  // Lesson name
  lessonName: string;
  setLessonName: (name: string) => void;
  
  // Cached lesson content
  cachedLessonContent: string;
  setCachedLessonContent: (content: string) => void;
  
  // Selected groups
  selectedGroupIds: string[];
  setSelectedGroupIds: (ids: string[]) => void;
  toggleGroup: (id: string) => void;
  selectAllGroups: (groups: (StudentGroup & { id: string })[]) => void;
  clearSelection: () => void;
  
  // Options
  options: DifferentiationOptions;
  setOptions: (options: Partial<DifferentiationOptions>) => void;
  
  // Results
  lastResult: string | null;
  lastSelectedGroups: (StudentGroup & { id: string })[];
  setLastResult: (result: string | null, groups: (StudentGroup & { id: string })[]) => void;
  clearResults: () => void;
}

const CACHE_KEY = 'educator-tools-lesson-cache';
const NAME_KEY = 'educator-tools-lesson-name';
const OPTIONS_KEY = 'educator-tools-diff-options';

const defaultOptions: DifferentiationOptions = {
  includeVocabularyScaffolding: true,
  generateComprehensionQuestions: false,
  includeVisualPlaceholders: true,
  includeGraphicOrganizers: false,
  graphicOrganizerType: 'auto',
  outputFormat: 'markdown',
};

const DifferentiationContext = createContext<DifferentiationState | undefined>(undefined);

export function DifferentiationProvider({ children }: { children: ReactNode }) {
  // Load lesson name from localStorage
  const [lessonName, setLessonNameState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(NAME_KEY) || '';
    }
    return '';
  });

  // Load cached content from localStorage
  const [cachedLessonContent, setCachedLessonContentState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CACHE_KEY) || '';
    }
    return '';
  });

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  
  // Load options from localStorage
  const [options, setOptionsState] = useState<DifferentiationOptions>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(OPTIONS_KEY);
      if (saved) {
        try {
          return { ...defaultOptions, ...JSON.parse(saved) };
        } catch {
          return defaultOptions;
        }
      }
    }
    return defaultOptions;
  });

  const [lastResult, setLastResultState] = useState<string | null>(null);
  const [lastSelectedGroups, setLastSelectedGroups] = useState<(StudentGroup & { id: string })[]>([]);

  // Persist lesson name to localStorage
  const setLessonName = (name: string) => {
    setLessonNameState(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem(NAME_KEY, name);
    }
  };

  // Persist lesson content to localStorage
  const setCachedLessonContent = (content: string) => {
    setCachedLessonContentState(content);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_KEY, content);
    }
  };

  // Persist options to localStorage
  const setOptions = (newOptions: Partial<DifferentiationOptions>) => {
    setOptionsState((prev) => {
      const updated = { ...prev, ...newOptions };
      if (typeof window !== 'undefined') {
        localStorage.setItem(OPTIONS_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id]
    );
  };

  const selectAllGroups = (groups: (StudentGroup & { id: string })[]) => {
    setSelectedGroupIds(groups.map((g) => g.id));
  };

  const clearSelection = () => {
    setSelectedGroupIds([]);
    setLessonName('');
  };

  const setLastResult = (result: string | null, groups: (StudentGroup & { id: string })[]) => {
    setLastResultState(result);
    setLastSelectedGroups(groups);
  };

  const clearResults = () => {
    setLastResultState(null);
    setLastSelectedGroups([]);
  };

  return (
    <DifferentiationContext.Provider
      value={{
        lessonName,
        setLessonName,
        cachedLessonContent,
        setCachedLessonContent,
        selectedGroupIds,
        setSelectedGroupIds,
        toggleGroup,
        selectAllGroups,
        clearSelection,
        options,
        setOptions,
        lastResult,
        lastSelectedGroups,
        setLastResult,
        clearResults,
      }}
    >
      {children}
    </DifferentiationContext.Provider>
  );
}

export function useDifferentiation() {
  const context = useContext(DifferentiationContext);
  if (!context) {
    throw new Error('useDifferentiation must be used within DifferentiationProvider');
  }
  return context;
}
