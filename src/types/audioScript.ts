export interface AudioScriptInput {
  lessonContent: string;
  language: string;
  readingLevel: string;
}

export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Mandarin Chinese',
  'Japanese',
  'Korean',
  'Portuguese',
  'Italian',
  'Arabic',
  'Hindi',
  'Russian',
] as const;

export const READING_LEVELS = [
  'Elementary (K-2)',
  'Elementary (3-5)',
  'Middle School',
  'High School',
  'College',
] as const;
