import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import en from '../locales/en.json';
import fo from '../locales/fo.json';

type Locale = 'en' | 'fo';
type TranslationKey = string;

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, any>) => string;
}

const translations = {
  en,
  fo,
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('fo'); // Default to Faroese

  const t = useCallback((key: string, params?: Record<string, any>) => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      if (value?.[k] === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
      value = value[k];
    }
    
    if (params) {
      return Object.entries(params).reduce((str, [key, value]) => {
        return str.replace(`{${key}}`, String(value));
      }, value);
    }
    
    return value;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}; 