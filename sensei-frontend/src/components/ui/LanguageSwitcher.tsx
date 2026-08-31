'use client';

import { useLanguageStore } from '@/stores/useLanguageStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'gu', label: 'ગુજરાતી' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);

  const activeLang = languages.find(l => l.code === language) || languages[0];

  const handleLanguageChange = (code: string) => {
    setLanguage(code as any);
    setIsOpen(false);
    
    // Trigger Google Translate Widget
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event('change'));
    }
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-2 px-3 h-10 md:h-11 rounded-xl transition-all group
          bg-white dark:bg-slate-800
          border-[3px] border-[var(--brutal-border)] dark:border-slate-600
          text-slate-800 dark:text-slate-200
          shadow-[3px_3px_0_var(--brutal-border)] dark:shadow-[3px_3px_0_rgba(100,116,139,0.4)]"
      >
        <Globe size={16} />
        <span className="hidden md:inline">{activeLang.label}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-40 rounded-xl overflow-hidden flex flex-col py-2
              bg-white dark:bg-slate-800
              border-[3px] border-[var(--brutal-border)] dark:border-slate-600
              shadow-[4px_4px_0_var(--brutal-border)] dark:shadow-[4px_4px_0_rgba(100,116,139,0.4)]"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="px-4 py-2 text-left text-sm font-bold font-display tracking-wide uppercase transition-colors
                  hover:opacity-80
                  dark:text-slate-200 dark:hover:bg-slate-700"
                style={{
                  color: language === lang.code ? 'var(--brutalist-pink, #FF1493)' : undefined,
                  backgroundColor: language === lang.code ? 'var(--bg-nav)' : 'transparent'
                }}
              >
                {lang.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
