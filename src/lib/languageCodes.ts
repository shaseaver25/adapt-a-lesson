export const LANGUAGE_TO_ISO_639_1: Record<string, string> = {
  'English': 'en',
  'Spanish': 'es',
  'Vietnamese': 'vi',
  'Somali': 'so',
  'Arabic': 'ar',
  'Hmong': 'hmn',
  'Mandarin': 'zh',
  'Chinese': 'zh',
  'Karen': 'kar',
  'Oromo': 'om',
  'Amharic': 'am',
  'French': 'fr',
  'Portuguese': 'pt',
  'Russian': 'ru',
  'Korean': 'ko',
  'Japanese': 'ja',
  'Hindi': 'hi',
  'Urdu': 'ur',
  'Farsi': 'fa',
  'Hebrew': 'he',
  'Swahili': 'sw',
};

export function getISOCode(languageName: string): string {
  if (LANGUAGE_TO_ISO_639_1[languageName]) {
    return LANGUAGE_TO_ISO_639_1[languageName];
  }
  const lower = languageName.toLowerCase();
  for (const [name, code] of Object.entries(LANGUAGE_TO_ISO_639_1)) {
    if (lower.includes(name.toLowerCase())) return code;
  }
  console.warn(`[languageCodes] No ISO 639-1 code for "${languageName}", defaulting to 'und'`);
  return 'und';
}