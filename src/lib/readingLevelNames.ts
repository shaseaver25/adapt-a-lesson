// Strengths-based student-friendly naming system for reading levels
// Students should NEVER see deficit-based language like "Below Grade"

export const STUDENT_LEVEL_NAMES = {
  'Below Grade': { label: 'Embers', tagline: 'Warming up', icon: '🔥', color: 'hsl(32, 95%, 85%)' },
  'On Grade': { label: 'Flames', tagline: 'Building momentum', icon: '🔥', color: 'hsl(30, 100%, 50%)' },
  'Above Grade': { label: 'Blazers', tagline: 'Burning bright', icon: '💫', color: 'hsl(18, 100%, 50%)' },
  'Advanced': { label: 'Supernovas', tagline: 'Explosive excellence', icon: '🌟', color: 'hsl(0, 100%, 50%)' },
} as const;

// Teacher-facing display shows both the friendly name AND the grade context
export const TEACHER_LEVEL_DISPLAY = {
  'Below Grade': { label: 'Embers (Below grade level)', icon: '🔥' },
  'On Grade': { label: 'Flames (On grade level)', icon: '🔥' },
  'Above Grade': { label: 'Blazers (Above grade level)', icon: '💫' },
  'Advanced': { label: 'Supernovas (Gifted / 2+ above)', icon: '🌟' },
} as const;

// Color classes for badges (tailwind-compatible)
export const READING_LEVEL_COLORS = {
  'Below Grade': 'bg-amber-400/20 text-amber-700 dark:text-amber-400 border-amber-400/30',
  'On Grade': 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
  'Above Grade': 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
  'Advanced': 'bg-rose-600/20 text-rose-700 dark:text-rose-400 border-rose-600/30',
} as const;

// Utility functions
export function getStudentFriendlyName(level: string): string {
  return STUDENT_LEVEL_NAMES[level as keyof typeof STUDENT_LEVEL_NAMES]?.label || level;
}

export function getStudentFriendlyIcon(level: string): string {
  return STUDENT_LEVEL_NAMES[level as keyof typeof STUDENT_LEVEL_NAMES]?.icon || '📖';
}

export function getTeacherDisplayLabel(level: string): string {
  return TEACHER_LEVEL_DISPLAY[level as keyof typeof TEACHER_LEVEL_DISPLAY]?.label || level;
}

export function getTeacherDisplayIcon(level: string): string {
  return TEACHER_LEVEL_DISPLAY[level as keyof typeof TEACHER_LEVEL_DISPLAY]?.icon || '📖';
}

export function getReadingLevelColor(level: string): string {
  return READING_LEVEL_COLORS[level as keyof typeof READING_LEVEL_COLORS] || 'bg-muted text-muted-foreground border-border';
}
