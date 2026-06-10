import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getTranslations,
  interpolate,
  type Locale,
  type TranslationDict,
} from '../i18n';

const LOCALE_KEY = 'egiz_locale';

type LocaleState = {
  locale: Locale;
  ready: boolean;
  t: TranslationDict;
  setLocale: (locale: Locale) => Promise<void>;
  tf: (template: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleState | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_KEY)
      .then((saved) => {
        if (saved === 'en' || saved === 'ru' || saved === 'ky') {
          setLocaleState(saved);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    await AsyncStorage.setItem(LOCALE_KEY, next);
  }, []);

  const t = useMemo(() => getTranslations(locale), [locale]);

  const tf = useCallback(
    (template: string, vars?: Record<string, string | number>) =>
      vars ? interpolate(template, vars) : template,
    [],
  );

  const value = useMemo(
    () => ({ locale, ready, t, setLocale, tf }),
    [locale, ready, t, setLocale, tf],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}
