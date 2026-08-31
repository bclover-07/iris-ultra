import { useLanguageStore } from '@/stores/useLanguageStore';
import { dictionaries, DictionaryKey } from '@/locales/dictionaries';

export function useTranslation() {
  const { language } = useLanguageStore();

  const t = (key: DictionaryKey | string | any) => {
    const langDict = dictionaries[language as keyof typeof dictionaries] || dictionaries.en;
    return (langDict as Record<string, string>)[key] || (dictionaries.en as Record<string, string>)[key] || key;
  };

  return { t, language };
}
