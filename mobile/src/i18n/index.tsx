import { useLocales } from 'expo-localization';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { tokenStore } from '@/lib/storage';

import { en, type Strings } from './en';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';

export type { Strings } from './en';

const DICTIONARIES = { en, it, es, fr };
export type Language = keyof typeof DICTIONARIES;
export const LANGUAGES = Object.keys(DICTIONARIES) as Language[];

/// Each language is always offered under its own name: somebody who cannot read the current
/// one still has to find theirs.
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  it: 'Italiano',
  es: 'Español',
  fr: 'Français',
};

const PREFERENCE_KEY = 'localbuddy.language';

const isLanguage = (value: string | null | undefined): value is Language =>
  !!value && Object.prototype.hasOwnProperty.call(DICTIONARIES, value);

type LanguageState = {
  /// What the app is showing right now.
  language: Language;
  /// What the member chose in the picker; null means "follow the phone".
  preference: Language | null;
  /// What the phone resolves to, for the "Phone language" option.
  phone: Language;
  setPreference: (next: Language | null) => void;
};

const LanguageContext = createContext<LanguageState | null>(null);

export function useLanguage(): LanguageState {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return context;
}

export function useStrings(): Strings {
  return DICTIONARIES[useLanguage().language];
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // The hook rather than getLocales(): a phone whose language changes re-renders the app.
  const phoneCode = useLocales()[0]?.languageCode?.toLowerCase();
  const phone: Language = isLanguage(phoneCode) ? phoneCode : 'en';

  const [preference, setStored] = useState<Language | null>(null);
  // Nothing renders until the stored choice is read, so no screen flashes in the phone's
  // language before switching to the one the member picked.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Through a promise even on the web, where localStorage can throw rather than reject.
    Promise.resolve()
      .then(() => tokenStore.get(PREFERENCE_KEY))
      .then((stored) => setStored(isLanguage(stored) ? stored : null))
      // An unreadable store means no preference, not a broken app.
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const language = preference ?? phone;

  useEffect(() => {
    // Screen readers and the browser's own translation offer go by this attribute.
    if (Platform.OS === 'web') document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageState>(
    () => ({
      language,
      preference,
      phone,
      setPreference: (next) => {
        setStored(next);
        // The switch already happened on screen; a failed write only costs the next launch.
        Promise.resolve()
          .then(() => (next ? tokenStore.set(PREFERENCE_KEY, next) : tokenStore.remove(PREFERENCE_KEY)))
          .catch(() => {});
      },
    }),
    [language, preference, phone]
  );

  // After every hook, never before one.
  if (!ready) return null;

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
