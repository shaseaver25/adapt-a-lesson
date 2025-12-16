import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Import translations
import en from './translations/en.json';
import es from './translations/es.json';
import zh from './translations/zh.json';
import vi from './translations/vi.json';
import so from './translations/so.json';

export type Language = 'en' | 'es' | 'zh' | 'vi' | 'so';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
];

const translations: Record<Language, Record<string, unknown>> = {
  en,
  es,
  zh,
  vi,
  so,
};

const STORAGE_KEY = 'preferred-language';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let result: unknown = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Return the key if not found
    }
  }
  
  return typeof result === 'string' ? result : path;
}

function detectBrowserLanguage(): Language {
  const browserLang = navigator.language.split('-')[0].toLowerCase();
  
  // Map common browser language codes to our supported languages
  const langMap: Record<string, Language> = {
    en: 'en',
    es: 'es',
    zh: 'zh',
    vi: 'vi',
    so: 'so',
  };
  
  return langMap[browserLang] || 'en';
}

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage first
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && LANGUAGES.some(l => l.code === stored)) {
      return stored;
    }
    // Fall back to browser detection
    return detectBrowserLanguage();
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = lang;
  }, []);

  // Set initial HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    let result = getNestedValue(translations[language] as unknown as Record<string, unknown>, key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(new RegExp(`{{${k}}}`, 'g'), v);
      });
    }
    return result;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Helper hook that provides just the translation function
export function useTranslation() {
  const { t, language } = useI18n();
  return { t, language };
}
