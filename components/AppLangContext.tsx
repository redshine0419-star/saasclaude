'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AppLang } from '@/lib/app-i18n';

interface AppLangContextValue {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
}

const AppLangContext = createContext<AppLangContextValue>({ lang: 'ko', setLang: () => {} });

const STORAGE_KEY = 'app-ui-lang';

export function AppLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLang>('ko');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as AppLang | null;
    if (saved && ['ko', 'en', 'ja'].includes(saved)) setLangState(saved);
  }, []);

  const setLang = (l: AppLang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  return (
    <AppLangContext.Provider value={{ lang, setLang }}>
      {children}
    </AppLangContext.Provider>
  );
}

export function useAppLang() {
  return useContext(AppLangContext);
}
