'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-10 h-10" />;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-xl transition-all duration-200
        bg-white dark:bg-slate-800
        border-[3px] border-[var(--brutal-border)] dark:border-slate-600
        text-slate-800 dark:text-slate-200
        shadow-[3px_3px_0_var(--brutal-border)] dark:shadow-[3px_3px_0_rgba(100,116,139,0.4)]
        hover:scale-105 active:scale-95 active:shadow-none"
      aria-label="Toggle Dark Mode"
    >
      <motion.div
        initial={false}
        animate={{
          rotate: isDark ? 180 : 0,
          scale: isDark ? 0 : 1,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="absolute"
      >
        <Sun size={20} />
      </motion.div>

      <motion.div
        initial={false}
        animate={{
          rotate: isDark ? 0 : -180,
          scale: isDark ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="absolute"
      >
        <Moon size={20} />
      </motion.div>
    </button>
  );
}
