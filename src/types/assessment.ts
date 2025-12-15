export type AIPolicy = 'prohibited' | 'limited_assist' | 'encouraged_with_citation';

export interface AssessmentInput {
  lessonTitle: string;
  subject: string;
  gradeLevel: string;
  learningObjectives: string[];
  aiPolicy: AIPolicy;
  schoolName: string;
  city: string;
  state: string;
  localContext: string;
}

export const AI_POLICIES = [
  { value: 'prohibited', label: 'Prohibited', description: 'Students should not use AI tools' },
  { value: 'limited_assist', label: 'Limited Assist', description: 'AI okay for brainstorming only' },
  { value: 'encouraged_with_citation', label: 'Encouraged with Citation', description: 'AI okay if documented' },
] as const;

export const SUBJECTS = [
  'Art',
  'Computer Science',
  'English Language Arts',
  'Foreign Language',
  'Geography',
  'Health',
  'History',
  'Mathematics',
  'Music',
  'Physical Education',
  'Science',
  'Social Studies',
  'Other',
] as const;

export const GRADE_LEVELS = [
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
  'College',
] as const;
