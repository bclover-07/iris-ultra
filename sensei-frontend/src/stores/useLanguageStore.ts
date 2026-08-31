import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'gu';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'sensei-language',
    }
  )
);
