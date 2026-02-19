import { useState, useCallback, useMemo } from 'react';
import type { Locale } from '@/types';
import ko from '@/i18n/ko.json';
import en from '@/i18n/en.json';

const STORAGE_KEY = 'bizpilot-locale';

type TranslationMap = typeof ko;

const translations: Record<Locale, TranslationMap> = { ko, en };

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'ko';
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && translations[stored]) return stored;
  const browserLang = navigator.language.slice(0, 2);
  return browserLang === 'ko' ? 'ko' : 'en';
}

// Deep-access helper: t('dashboard.todayRevenue') → "오늘 매출"
function deepGet(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : path;
}

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useMemo(() => {
    const dict = translations[locale];
    return (path: string): string => deepGet(dict as unknown as Record<string, unknown>, path);
  }, [locale]);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'ko' ? 'en' : 'ko');
  }, [locale, setLocale]);

  return { locale, setLocale, toggleLocale, t } as const;
}
