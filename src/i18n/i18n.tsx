import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { zh, TranslationKey } from './zh';
import { en } from './en';

type Language = 'zh' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'vision_trainer_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return (saved === 'en' || saved === 'zh') ? saved : 'zh';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(LANGUAGE_KEY, newLang);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dictionary = lang === 'en' ? en : zh;
    let text = dictionary[key];

    // Fallback to key if not found
    if (!text) return key;

    // Replace parameters if provided e.g., {name} -> 'John'
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(value));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useT = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useT must be used within a LanguageProvider');
  }
  return context;
};
