import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('gabai_lang') || 'he');

  const toggleLang = useCallback(() => {
    setLang(l => {
      const next = l === 'he' ? 'en' : 'he';
      localStorage.setItem('gabai_lang', next);
      document.documentElement.dir = next === 'he' ? 'rtl' : 'ltr';
      document.documentElement.lang = next;
      return next;
    });
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] ?? translations['he']?.[key] ?? key;
  }, [lang]);

  // Set initial dir
  React.useEffect(() => {
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, isHe: lang === 'he' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
