export interface StudentGroup {
  groupName: string;
  numStudents: number;
  readingLevelLabel: 'Below Grade' | 'On Grade' | 'Above Grade' | 'Advanced';
  readingLevelLexile: string;
  homeLanguage: string;
  ellStatus: 'None' | 'Emerging' | 'Developing' | 'Expanding' | 'Bridging';
  iep504Status: 'None' | 'IEP' | '504 Plan';
  learningPreferences: string[];
  accommodations: string[];
  notes: string;
}

export const LEARNING_PREFERENCES = [
  { label: 'Visual', value: 'Visual' },
  { label: 'Hands-on', value: 'Hands-on' },
  { label: 'Mixed', value: 'Mixed' },
  { label: 'Verbal', value: 'Verbal' },
  { label: 'Independent', value: 'Independent' },
] as const;

export const READING_LEVELS = [
  { label: 'Below Grade', value: 'Below Grade' },
  { label: 'On Grade', value: 'On Grade' },
  { label: 'Above Grade', value: 'Above Grade' },
  { label: 'Advanced', value: 'Advanced' },
] as const;

export const ELL_STATUSES = [
  { label: 'None', value: 'None' },
  { label: 'Emerging', value: 'Emerging' },
  { label: 'Developing', value: 'Developing' },
  { label: 'Expanding', value: 'Expanding' },
  { label: 'Bridging', value: 'Bridging' },
] as const;

export const IEP_504_STATUSES = [
  { label: 'None', value: 'None' },
  { label: 'IEP', value: 'IEP' },
  { label: '504 Plan', value: '504 Plan' },
] as const;

export const ACCOMMODATION_OPTIONS = [
  'Visual Supports',
  'Read Aloud',
  'Extended Time',
  'Chunked Instructions',
  'Bilingual Glossary',
  'Graphic Organizers',
  'Sentence Starters',
  'Reduced Text Density',
  'Preferential Seating',
  'Check for Understanding',
  'Choice Board',
  'Enrichment Extension',
] as const;

export const LANGUAGES = [
  'English',
  'Spanish',
  'Mandarin',
  'Vietnamese',
  'Arabic',
  'Tagalog',
  'Korean',
  'Haitian Creole',
  'Portuguese',
  'Russian',
  'Other',
] as const;
