export interface StudentHandout {
  groupId: string;
  groupName: string;
  level: 'embers' | 'sparks' | 'flames' | 'blazers' | 'supernovas';
  language: string;
  content: string; // Markdown content (in target language for non-English groups)
  englishContent?: string; // English version for bilingual display (only for non-English groups)
}

export interface DifferentiatedLessonData {
  teacherGuide: string;
  studentHandouts: StudentHandout[];
}

export interface DifferentiatedLessonResponse {
  success: boolean;
  data: DifferentiatedLessonData;
  error?: string;
}
