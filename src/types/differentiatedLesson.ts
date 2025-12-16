export interface StudentHandout {
  groupId: string;
  groupName: string;
  level: 'embers' | 'sparks' | 'flames' | 'blazers' | 'supernovas';
  language: string;
  content: string; // Markdown content for this specific group
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
