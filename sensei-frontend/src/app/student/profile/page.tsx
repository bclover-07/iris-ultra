'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, BookOpen, Hash, Calendar, Award, Zap, Flame } from 'lucide-react';
import api from '@/lib/axios';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/student/profile').then(({ data }) => setProfile(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="pencil-loader w-48" /></div>;
  if (!profile) return null;

  const fields = [
    { icon: User, label: t('name'), value: profile.name as string },
    { icon: Mail, label: t('email'), value: profile.email as string },
    { icon: Hash, label: t('student_id'), value: profile.studentId as string },
    { icon: BookOpen, label: t('department'), value: profile.department as string },
    { icon: Calendar, label: t('semester'), value: `${t('semester')} ${profile.semester}` },
    { icon: Zap, label: t('xp'), value: `${profile.xp} XP` },
    { icon: Award, label: t('level'), value: `${t('level')} ${profile.level}` },
    { icon: Flame, label: t('streak'), value: `${profile.streakDays} days` }
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--s-text)' }}>👤 {t('my_profile')}</h1>
      <div className="p-6 rounded-2xl border-2" style={{ background: 'var(--s-card)', borderColor: 'var(--s-border)' }}>
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-brutal-text" style={{ fontFamily: 'var(--font-display)' }}>
          {(profile.name as string)?.charAt(0).toUpperCase()}
        </div>
        <div className="space-y-3">
          {fields.map((f, i) => (
            <motion.div key={f.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-900/40 border border-black/5 dark:border-slate-850">
              <f.icon size={16} style={{ color: 'var(--s-muted)' }} />
              <span className="text-xs w-20" style={{ fontFamily: 'var(--font-mono)', color: 'var(--s-muted)' }}>{f.label}</span>
              <span className="text-sm font-bold flex-1" style={{ fontFamily: 'var(--font-body)', color: 'var(--s-text)' }}>{f.value || '-'}</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {((profile.badges as string[]) || []).map((b, i) => (
            <span key={i} className="px-3 py-1 bg-yellow-100 rounded-full text-xs font-bold" style={{ fontFamily: 'var(--font-display)' }}>🏅 {b}</span>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700 flex flex-col gap-4">
          <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--s-text)' }}>{t('preferences')}</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--s-muted)' }}>{t('language')}</span>
            </div>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--s-muted)' }}>{t('theme')}</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
