'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, HelpCircle, ArrowRight, Flame, AlertTriangle, TrendingUp, Calendar, Trophy, Zap, X, CheckCircle2, Target } from 'lucide-react';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import { useSocket } from '@/hooks/useSocket';
import { useTranslation } from '@/hooks/useTranslation';
import toast from 'react-hot-toast';
import type { StudentDashboard } from '@/types';

import { useTheme } from 'next-themes';

const riskColors: Record<string, string> = { low: '#4CAF50', medium: '#FFC107', high: '#FF9800', critical: '#F44336' };
const riskEmoji: Record<string, string> = { low: '🟢', medium: '🟡', high: '🟠', critical: '🔴' };
const chartColors = ['#3b82f6', '#ef4444', '#eab308', '#a855f7', '#f97316'];
const darkColors: Record<string, string> = {
  '#3b82f6': '#60a5fa', // blue
  '#16a34a': '#4ade80', // green
  '#d97706': '#fbbf24', // amber
  '#ca8a04': '#facc15', // yellow
  '#854d0e': '#facc15', // yellow
  '#7c3aed': '#a78bfa', // purple
  '#f59e0b': '#fbbf24', // amber
  '#ef4444': '#f87171', // red
};

const MarksTrendChart = dynamic(() => import('@/components/student/StudentCharts').then(m => m.MarksTrendChart), { ssr: false });
const SubjectRadarChart = dynamic(() => import('@/components/student/StudentCharts').then(m => m.SubjectRadarChart), { ssr: false });
const AttendancePieChart = dynamic(() => import('@/components/student/StudentCharts').then(m => m.AttendancePieChart), { ssr: false });

export default function StudentDashboardPage() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRec, setExpandedRec] = useState<number | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showCGPAModal, setShowCGPAModal] = useState(false);
  const [targetCGPA, setTargetCGPA] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const router = useRouter();
  const { on } = useSocket('/student');

  const fetchDashboard = () => {
    api.get('/api/student/dashboard')
      .then(({ data: d }) => setData(d))
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error || 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    const offRefresh = on('dashboard:refresh', () => {
      fetchDashboard();
    });
    const offNotif = on('notification:new', (notif: any) => {
      toast.success(notif.title + ': ' + notif.message, { icon: '🔔' });
      fetchDashboard();
    });
    const offPollNew = on('poll:new', () => {
      setData(prev => prev ? { ...prev, activePolls: (prev.activePolls || 0) + 1 } : null);
    });
    const offPollClosed = on('poll:closed', () => {
      setData(prev => prev ? { ...prev, activePolls: Math.max(0, (prev.activePolls || 1) - 1) } : null);
    });
    const offHelpUpdate = on('help:ticket_updated', (ticket: any) => {
      if (ticket.status === 'responded') {
        setData(prev => prev ? { ...prev, pendingHelpTickets: Math.max(0, (prev.pendingHelpTickets || 1) - 1) } : null);
      }
    });
    return () => {
      offRefresh();
      offNotif();
      offPollNew();
      offPollClosed();
      offHelpUpdate();
    };
  }, [on]);

  if (loading) return (
    <div className="space-y-8 doodle-bg p-4 rounded-[40px] animate-pulse bg-[var(--s-page-bg)]">
      <div className="flex justify-between items-center mb-10">
        <div className="comic-panel p-6 bg-gray-200 dark:bg-[var(--s-card)] rotate-[-1deg] w-64 h-24 brutalist-border"></div>
        <div className="pow-burst w-24 h-24 bg-gray-300 dark:bg-[var(--s-card)] scale-125 brutalist-border"></div>
      </div>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="brutalist-border hard-shadow rounded-3xl p-7 h-40 bg-gray-100 dark:bg-[var(--s-card)] relative overflow-hidden">
            <div className="skeleton-shimmer absolute inset-0 opacity-50 dark:opacity-10" />
            <div className="w-11 h-11 bg-gray-300 dark:bg-[var(--s-card)] brutalist-border rounded-xl mb-3 relative z-10" />
            <div className="w-20 h-4 bg-gray-300 dark:bg-[var(--s-card)] rounded mb-2 relative z-10" />
            <div className="w-16 h-10 bg-gray-400 dark:bg-[var(--s-card)] rounded relative z-10" />
          </div>
        ))}
      </section>
      <div className="brutalist-border hard-shadow-lg h-40 bg-gray-200 dark:bg-[var(--s-card)] w-full relative overflow-hidden">
        <div className="skeleton-shimmer absolute inset-0 opacity-50 dark:opacity-10" />
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-24 text-center">
      <div className="bg-[var(--comic-red)] text-white brutalist-border hard-shadow p-10 rounded-3xl max-w-sm">
        <p className="font-fredoka text-2xl font-bold">⚠️ {error}</p>
      </div>
    </div>
  );

  if (!data) return null;

  const radarData = data.subjectMarks?.map(m => ({ subject: m.subject?.slice(0, 10), value: m.percentage, fullMark: 100 })) || [];
  const trendData = data.marksTrend?.labels?.map((label, i) => {
    const row: Record<string, unknown> = { exam: label };
    data.marksTrend?.datasets?.forEach(ds => { row[ds.label] = ds.data[i]; });
    return row;
  }) || [];
  const attendancePie = [
    { name: 'Present', value: data.avgAttendance || 0, color: '#4CAF50' },
    { name: 'Absent', value: 100 - (data.avgAttendance || 0), color: '#ef4444' },
  ];

  return (
    <div className="space-y-8 doodle-bg p-4 rounded-[40px] bg-[var(--s-page-bg)]">
      <div className="flex justify-between items-center mb-10">
        <div className="comic-panel p-6 bg-[var(--comic-white,white)] dark:bg-[var(--s-card)] rotate-[-1deg]">
          <h1 className="font-fredoka text-5xl font-bold text-[var(--comic-black)] dark:text-white uppercase tracking-tight">
            {t('my_progress')} <span className="inline-block animate-bounce">📈</span>
          </h1>
          <p className="font-fredoka text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">{t('status_crushing_it')}</p>
        </div>
        <div className="pow-burst text-2xl px-10 py-6 scale-125 bg-yellow-400 dark:bg-[var(--s-card)] text-black dark:text-white brutalist-border border-[var(--s-border)]">
          LVL {data.level || 1}
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {([
          { labelKey: 'cgpa', value: (data.cgpa || 0).toFixed(2), icon: TrendingUp, color: '#3b82f6', bg: '#dbeafe', border: '#3b82f6', action: 'cgpa', link: '' },
          { labelKey: 'attendance', value: `${Math.round(data.avgAttendance || 0)}%`, icon: Calendar, color: (data.avgAttendance || 0) >= 75 ? '#16a34a' : '#d97706', bg: '#dcfce7', border: '#16a34a', action: 'attendance', link: '' },
          { labelKey: 'class_rank', value: data.leaderboardPosition?.rank ? `#${data.leaderboardPosition.rank}` : '-', icon: Trophy, color: '#854d0e', bg: '#fef9c3', border: '#ca8a04', action: '', link: '/student/leaderboard' },
          { labelKey: 'xp', value: (data.totalXP || 0).toLocaleString(), icon: Zap, color: '#7c3aed', bg: '#f3e8ff', border: '#7c3aed', action: '', link: '/student/leaderboard' },
          { labelKey: 'active_polls', value: data.activePolls || 0, icon: BarChart3, color: '#f59e0b', bg: '#fef3c7', border: '#f59e0b', action: '', link: '/student/polls' },
          { labelKey: 'open_tickets', value: data.pendingHelpTickets || 0, icon: HelpCircle, color: '#ef4444', bg: '#fee2e2', border: '#ef4444', action: '', link: '/student/help-desk' },
        ] as const).map((stat, i) => {
          const cardBg = isDark ? 'var(--s-card)' : stat.bg;
          const cardBorder = isDark ? 'var(--s-border)' : stat.border;
          const activeColor = isDark ? (darkColors[stat.color as keyof typeof darkColors] || stat.color) : stat.color;
          return (
            <motion.div key={stat.labelKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="relative brutalist-border hard-shadow rounded-3xl p-7 overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer"
              style={{ background: cardBg, borderColor: cardBorder }}
              onClick={() => {
                if (stat.action === 'cgpa') setShowCGPAModal(true);
                else if (stat.action === 'attendance') setShowAttendanceModal(true);
                else if (stat.link) router.push(stat.link);
              }}>
              <div className="washi-tape -top-3 left-4" style={{ transform: 'rotate(-3deg)', background: isDark ? 'rgba(255,255,255,0.05)' : `${stat.bg}cc` }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 bg-white dark:bg-slate-900 brutalist-border rounded-xl flex items-center justify-center" style={{ borderColor: cardBorder }}>
                    <stat.icon size={20} color={activeColor} />
                  </div>
                  <span className="font-fredoka text-[10px] uppercase tracking-widest font-bold" style={{ color: isDark ? `${activeColor}cc` : `${stat.color}99` }}>{t(stat.labelKey as any)}</span>
                </div>
                <p className="font-fredoka text-5xl font-bold leading-none text-brutal-text dark:text-white">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </section>

      {}
      <motion.section initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
        className="brutalist-border hard-shadow-lg torn-edge relative overflow-hidden min-h-[160px] flex items-center hover:-translate-y-1 transition-transform"
        style={{ 
          background: isDark ? 'var(--s-card)' : riskColors[data.riskLevel || 'low'], 
          borderColor: isDark ? 'var(--s-border)' : 'var(--brutal-border)',
          borderRadius: 0 
        }}>
        <div className="absolute bottom-4 right-1/4 opacity-10 pointer-events-none">
          <div className="text-white text-[8rem] leading-none">⚡</div>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between w-full p-10 gap-6">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-white dark:bg-[var(--s-card)] brutalist-border rounded-full flex items-center justify-center hard-shadow-lg animate-bounce flex-shrink-0">
              <AlertTriangle size={40} color={riskColors[data.riskLevel || 'low']} />
            </div>
            <div>
              <h2 className="font-fredoka text-4xl font-bold text-white uppercase mb-2">{t('ai_risk_assessment')}</h2>
              <div className="flex flex-wrap items-center gap-4 text-white">
                <span className="font-fredoka font-bold text-xl bg-black/30 border-2 border-white/20 px-4 py-1.5 rounded-2xl">
                  {t('dropout')}: {data.dropoutProbability || 0}%
                </span>
                <span className="font-fredoka font-bold text-xl uppercase flex items-center gap-2">
                  {riskEmoji[data.riskLevel || 'low']} {(data.riskLevel || 'low').toUpperCase()} {t('risk')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="bg-white dark:bg-[var(--s-card)] px-8 py-4 brutalist-border hard-shadow-lg rounded-3xl rotate-3 hover:rotate-0 transition-all cursor-default" style={{ borderColor: isDark ? 'var(--s-border)' : undefined }}>
              <p className="font-fredoka font-bold text-2xl" style={{ color: riskColors[data.riskLevel || 'low'] }}>{t('keep_it_up')}</p>
            </div>
            {data.riskReason && (
              <p className="text-white text-sm font-bold italic mt-3 bg-black/10 px-4 py-1 rounded-full border border-white/10 max-w-xs">"{data.riskReason}" — Sensei AI</p>
            )}
          </div>
        </div>
      </motion.section>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {}
        {data.activePolls > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="comic-card brutal-card-yellow p-6 md:p-8 flex items-center justify-between gap-6 group cursor-pointer"
            onClick={() => router.push('/student/polls')}
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 brutal-card-yellow brutalist-border rounded-2xl flex items-center justify-center animate-pulse">
                <BarChart3 size={32} />
              </div>
              <div>
                <div className="pow-burst text-[10px] px-3 py-1 bg-yellow-400 dark:bg-slate-700 text-black dark:text-white rotate-[-2deg] mb-2 brutalist-border dark:border-slate-600">LIVE!</div>
                <h3 className="font-fredoka text-2xl font-bold">Active Class Poll</h3>
                <p className="font-fredoka text-xs font-bold uppercase tracking-widest mt-1 opacity-80">
                  Tap to participate & see results
                </p>
              </div>
            </div>
            <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </motion.div>
        )}

        {}
        {data.pendingHelpTickets > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="comic-card brutal-card-red p-6 md:p-8 flex items-center justify-between gap-6 group cursor-pointer"
            onClick={() => router.push('/student/help-desk')}
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 brutal-card-red brutalist-border rounded-2xl flex items-center justify-center">
                <HelpCircle size={32} />
              </div>
              <div>
                <div className="pow-burst text-[10px] px-3 py-1 bg-red-500 dark:bg-slate-700 text-white rotate-[2deg] mb-2 brutalist-border dark:border-slate-600">UPDATE!</div>
                <h3 className="font-fredoka text-2xl font-bold">Help Ticket Status</h3>
                <p className="font-fredoka text-xs font-bold uppercase tracking-widest mt-1 opacity-80">
                  You have {data.pendingHelpTickets} open ticket{data.pendingHelpTickets > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </motion.div>
        )}
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 brutalist-border hard-shadow-lg rounded-[40px] p-8 relative overflow-hidden">
          <div className="halftone-dots absolute inset-0 opacity-[0.12] pointer-events-none" />
          <div className="relative z-10">
            <h3 className="font-fredoka text-2xl font-bold uppercase flex items-center gap-3 mb-6">
              <span className="bg-[var(--comic-blue)] dark:bg-slate-700 dark:border-slate-600 text-white px-4 py-1 brutalist-border rounded-xl -rotate-2 inline-block">📈 {t('marks_trend')}</span>
            </h3>
            {trendData.length > 0 ? (
              <MarksTrendChart trendData={trendData} marksTrendDatasets={data.marksTrend?.datasets || []} chartColors={chartColors} />
            ) : <p className="font-fredoka text-gray-400 text-center py-12 text-lg">No marks data yet ✏️</p>}
          </div>
        </motion.div>

        {}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 brutalist-border hard-shadow-lg rounded-[40px] p-8 relative overflow-hidden">
          <div className="halftone-dots absolute inset-0 opacity-[0.12] pointer-events-none" />
          <div className="relative z-10">
            <h3 className="font-fredoka text-2xl font-bold uppercase flex items-center gap-3 mb-6">
              <span className="bg-yellow-400 dark:bg-slate-700 dark:text-white dark:border-slate-600 text-brutal-text px-4 py-1 brutalist-border rounded-xl rotate-2 inline-block">🎯 {t('subject_radar')}</span>
            </h3>
            <div className="bg-[#f8fafc] dark:bg-slate-900 brutalist-border dark:border-slate-700 rounded-3xl p-4">
              {radarData.length > 0 ? (
                <SubjectRadarChart radarData={radarData} />
              ) : <p className="font-fredoka text-gray-400 text-center py-12 text-lg">No subject data yet 📚</p>}
            </div>
          </div>
        </motion.div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.55 }}
          className="bg-yellow-400 dark:bg-slate-800 brutalist-border hard-shadow rounded-[40px] p-8 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
          <div className="halftone-dots absolute inset-0 opacity-10 pointer-events-none" />
          <Flame size={48} color="#ef4444" className="drop-shadow-lg relative z-10" />
          <p className="font-fredoka text-7xl font-bold leading-none relative z-10 text-black dark:text-white">{data.streakDays || 0}</p>
          <p className="font-fredoka text-sm font-bold uppercase tracking-widest text-yellow-900 dark:text-slate-400 relative z-10">{t('day_streak')}</p>
          <div style={{ width: 80, height: 80 }}>
            <AttendancePieChart attendancePie={attendancePie} />
          </div>
          <p className="font-fredoka text-xs font-bold uppercase tracking-widest text-yellow-900 dark:text-slate-400">Attendance</p>
        </motion.div>

        {}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="col-span-2 bg-white dark:bg-slate-800 brutalist-border hard-shadow-lg rounded-[40px] p-8 relative overflow-hidden">
          <div className="halftone-dots absolute inset-0 opacity-[0.12] pointer-events-none" />
          <h3 className="font-fredoka text-2xl font-bold uppercase mb-8 flex items-center gap-3 relative z-10 text-black dark:text-white">
            <span className="text-[var(--comic-blue)]">📊</span> {t('subject_breakdown')}
          </h3>
          <div className="space-y-6 relative z-10">
            {data.subjectMarks?.slice(0, 5).map(m => {
              const pct = Math.min(m.percentage, 100);
              const color = pct >= 80 ? '#3b82f6' : pct >= 60 ? '#eab308' : '#ef4444';
              const activeColor = isDark ? (darkColors[color as keyof typeof darkColors] || color) : color;
              return (
                <div key={m.subject} className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <span className="font-fredoka font-bold text-lg uppercase text-black dark:text-white">{m.subject}</span>
                    <span className="font-fredoka font-bold text-xl" style={{ color: activeColor }}>{m.percentage}%</span>
                  </div>
                  <div className="h-7 w-full brutalist-border dark:border-slate-700 rounded-2xl overflow-hidden flex bg-white dark:bg-slate-950">
                    <div className="h-full brutalist-border dark:border-slate-700 border-y-0 border-l-0 rounded-l-xl relative transition-all duration-700" style={{ width: `${pct}%`, background: activeColor }}>
                      <div className="halftone-dots absolute inset-0 opacity-20" />
                    </div>
                    <div className="h-full crosshatch flex-1" />
                  </div>
                </div>
              );
            })}
            {(!data.subjectMarks || data.subjectMarks.length === 0) && (
              <p className="font-fredoka text-gray-400 text-center py-8 text-lg">No marks recorded yet ✏️</p>
            )}
          </div>
        </motion.div>
      </div>

      {}
      {data.subjectMarks?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="bg-white dark:bg-slate-800 brutalist-border hard-shadow-lg rounded-[40px] p-8 overflow-x-auto relative">
          <div className="halftone-dots absolute inset-0 opacity-[0.12] pointer-events-none rounded-[40px]" />
          <h3 className="font-fredoka text-2xl font-bold uppercase mb-6 relative z-10 text-black dark:text-white">📋 {t('detailed_marks')}</h3>
          <table className="w-full text-sm relative z-10">
            <thead>
              <tr className="font-fredoka text-xs uppercase tracking-widest text-gray-500 dark:text-slate-400">
                <th className="text-left py-3 px-3">Subject</th>
                <th className="text-center py-3 px-2">UT1</th>
                <th className="text-center py-3 px-2">Mid</th>
                <th className="text-center py-3 px-2">UT2</th>
                <th className="text-center py-3 px-2">End</th>
                <th className="text-center py-3 px-2 font-bold">Total</th>
                <th className="text-center py-3 px-2">%</th>
              </tr>
            </thead>
            <tbody className="font-fredoka">
              {data.subjectMarks.map(m => (
                <tr key={m.subject} className="border-t border-dashed border-gray-200 dark:border-slate-700 hover:bg-yellow-50 hover:dark:bg-slate-700/50 transition-colors dark:text-slate-300">
                  <td className="py-3 px-3 font-bold text-base text-black dark:text-white">{m.subject}</td>
                  <td className="text-center py-3 px-2">{m.ut1}</td>
                  <td className="text-center py-3 px-2">{m.midSem}</td>
                  <td className="text-center py-3 px-2">{m.ut2}</td>
                  <td className="text-center py-3 px-2">{m.endSem}</td>
                  <td className="text-center py-3 px-2 font-bold text-base">{m.total}</td>
                  <td className="text-center py-3 px-2">
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold brutalist-border ${m.percentage >= 80 ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800' : m.percentage >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800' : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'}`}>
                      {m.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {}
      {data.recommendations?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
          className="bg-white dark:bg-slate-800 brutalist-border hard-shadow rounded-[40px] p-8">
          <h3 className="font-fredoka text-2xl font-bold uppercase mb-6 text-black dark:text-white">{t('ai_recommendations')}</h3>
          <div className="space-y-3">
            {data.recommendations.map((r, i) => (
              <div key={i} 
                className="flex flex-col gap-2 p-4 brutal-card-blue brutalist-border rounded-2xl cursor-pointer transition-colors" 
                onClick={() => setExpandedRec(expandedRec === i ? null : i)}
              >
                <div className="flex items-start gap-4">
                  <span className="font-bold text-lg flex-shrink-0 opacity-80">{i + 1}.</span>
                  <div className="flex-1 flex justify-between items-center">
                    <p className="font-fredoka font-medium">{r}</p>
                    <span className="font-bold opacity-80">{expandedRec === i ? '▲' : '▼'}</span>
                  </div>
                </div>
                
                <AnimatePresence>
                  {expandedRec === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 pt-4 border-t-2 border-blue-200 text-sm font-body text-gray-700 overflow-hidden"
                    >
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-100 dark:border-blue-950/50 shadow-sm space-y-3 text-gray-700 dark:text-slate-300">
                        <p><strong className="text-blue-800 dark:text-blue-400 flex items-center gap-2">🎯 Why focus here?</strong> Based on your recent performance metrics and engagement data, this area shows a higher error rate compared to your class average.</p>
                        <p><strong className="text-blue-800 dark:text-blue-400 flex items-center gap-2">🛠️ What to do:</strong> Revisit the core fundamental concepts, practice with targeted flashcards in Ultra Keeper, and try the Doubt Solver to clear your specific conceptual bottlenecks.</p>
                        <p><strong className="text-blue-800 dark:text-blue-400 flex items-center gap-2">📈 Expected Outcome:</strong> Dedicating just 20-30 mins daily to this could boost your mastery score significantly within a week!</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {}
      <AnimatePresence>
        {showAttendanceModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAttendanceModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 dark:text-slate-200 rounded-[32px] brutalist-border hard-shadow-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowAttendanceModal(false)} className="absolute top-4 right-4 w-10 h-10 bg-red-100 dark:bg-red-950/40 brutalist-border dark:border-red-900/60 rounded-xl flex items-center justify-center hover:bg-red-200 hover:dark:bg-red-900/40 transition-colors z-10">
                <X size={18} className="text-red-500" />
              </button>

              <h2 className="font-fredoka text-3xl font-bold uppercase mb-1 flex items-center gap-3 text-black dark:text-white">
                <Calendar className="text-green-600" size={28} /> Attendance Overview
              </h2>
              <p className="font-fredoka text-sm text-gray-500 dark:text-slate-400 mb-6">Your complete attendance history since college enrollment</p>

              {}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="brutal-card-green brutalist-border rounded-2xl p-4 text-center">
                  <p className="font-fredoka text-3xl font-bold">{Math.round(data.avgAttendance || 0)}%</p>
                  <p className="font-fredoka text-[10px] uppercase tracking-widest font-bold">Overall</p>
                </div>
                <div className="brutal-card-blue brutalist-border rounded-2xl p-4 text-center">
                  <p className="font-fredoka text-3xl font-bold">{Math.round((data.avgAttendance || 0) * 1.8)}</p>
                  <p className="font-fredoka text-[10px] uppercase tracking-widest font-bold">Days Present</p>
                </div>
                <div className="brutal-card-red brutalist-border rounded-2xl p-4 text-center">
                  <p className="font-fredoka text-3xl font-bold">{Math.round((100 - (data.avgAttendance || 0)) * 1.8)}</p>
                  <p className="font-fredoka text-[10px] uppercase tracking-widest font-bold">Days Absent</p>
                </div>
              </div>

              {}
              <div className="bg-gray-50 dark:bg-slate-900 brutalist-border dark:border-slate-700 rounded-2xl p-5 mb-6">
                <h3 className="font-fredoka font-bold text-sm uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-4">📅 Monthly Attendance Calendar (2025-26)</h3>
                <div className="grid grid-cols-4 gap-3">
                  {(data.attendanceHistory || []).map((m: any) => {
                    const pct = m.percentage;
                    const color = pct >= 75 ? '#16a34a' : pct >= 60 ? '#d97706' : '#ef4444';
                    const bgColor = pct >= 75 ? '#dcfce7' : pct >= 60 ? '#fef3c7' : '#fee2e2';
                    const monthBgColor = isDark ? '#1E293B' : bgColor;
                    const monthBorderColor = isDark ? (darkColors[color as keyof typeof darkColors] || color) : color;
                    const activeColor = isDark ? (darkColors[color as keyof typeof darkColors] || color) : color;
                    return (
                      <div key={m.month} className="brutalist-border rounded-xl p-3 text-center transition-transform hover:-translate-y-1" style={{ background: monthBgColor, borderColor: monthBorderColor }}>
                        <p className="font-fredoka text-xs font-bold uppercase text-gray-500 dark:text-slate-400">{m.month}</p>
                        <p className="font-fredoka text-xl font-bold" style={{ color: activeColor }}>{Math.round(pct)}%</p>
                        <div className="flex flex-wrap gap-[2px] justify-center mt-2">
                          {(m.days || []).map((present: boolean, d: number) => (
                            <div key={d} className="w-[6px] h-[6px] rounded-sm" style={{ background: present ? activeColor : (isDark ? '#334155' : '#e5e7eb') }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {(!data.attendanceHistory || data.attendanceHistory.length === 0) && (
                    <div className="col-span-4 text-center py-6 text-gray-400 font-fredoka">No attendance history available.</div>
                  )}
                </div>
              </div>

              {}
              <div className="brutal-card-yellow brutalist-border rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 brutal-card-yellow brutalist-border rounded-xl flex items-center justify-center text-xl flex-shrink-0">🎓</div>
                <div>
                  <p className="font-fredoka font-bold text-sm">College Year: 2025-2026</p>
                  <p className="font-fredoka text-xs text-gray-500 dark:text-slate-400">Session started: July 15, 2025 • Semester 2 in progress</p>
                  <p className="font-fredoka text-xs mt-1">
                    {(data.avgAttendance || 0) >= 75
                      ? <span className="text-green-600 dark:text-green-400 font-bold">✅ You meet the minimum 75% attendance requirement!</span>
                      : <span className="text-red-600 dark:text-red-400 font-bold">⚠️ You are below the 75% minimum requirement. Attend more classes!</span>
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {showCGPAModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCGPAModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 dark:text-slate-200 rounded-[32px] brutalist-border hard-shadow-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowCGPAModal(false)} className="absolute top-4 right-4 w-10 h-10 bg-red-100 dark:bg-red-950/40 brutalist-border dark:border-red-900/60 rounded-xl flex items-center justify-center hover:bg-red-200 hover:dark:bg-red-900/40 transition-colors z-10">
                <X size={18} className="text-red-500" />
              </button>

              <h2 className="font-fredoka text-3xl font-bold uppercase mb-1 flex items-center gap-3 text-black dark:text-white">
                <TrendingUp className="text-blue-600" size={28} /> CGPA Breakdown
              </h2>
              <p className="font-fredoka text-sm text-gray-500 dark:text-slate-400 mb-6">Detailed semester-wise performance analysis</p>

              {}
              <div className="brutal-card-blue brutalist-border rounded-2xl p-6 mb-6 text-center relative overflow-hidden">
                <div className="halftone-dots absolute inset-0 opacity-10 pointer-events-none" />
                <p className="font-fredoka text-6xl font-bold relative z-10">{(data.cgpa || 0).toFixed(2)}</p>
                <p className="font-fredoka text-xs uppercase tracking-widest font-bold relative z-10 opacity-80">Current CGPA</p>
              </div>

              {}
              <div className="bg-gray-50 dark:bg-slate-900 brutalist-border dark:border-slate-700 rounded-2xl p-5 mb-6">
                <h3 className="font-fredoka font-bold text-sm uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-4">📊 Semester-wise GPA</h3>
                <div className="space-y-3">
                  {(data.semesterGPAs || []).map((s: any) => {
                    const gpaVal = parseFloat(s.gpa);
                    const color = gpaVal >= 8 ? '#3b82f6' : gpaVal >= 6 ? '#eab308' : '#ef4444';
                    const activeColor = isDark ? (darkColors[color as keyof typeof darkColors] || color) : color;
                    return (
                      <div key={s.sem} className="bg-white dark:bg-slate-800 brutalist-border rounded-xl p-4 flex items-center justify-between" style={{ borderColor: activeColor }}>
                        <div>
                          <p className="font-fredoka font-bold text-black dark:text-white">{s.sem}</p>
                          <p className="font-fredoka text-xs text-gray-400 dark:text-slate-400">{s.credits} Credits</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-3 bg-gray-100 dark:bg-slate-900 rounded-full overflow-hidden brutalist-border dark:border-slate-700" style={{ borderColor: activeColor }}>
                            <div className="h-full rounded-full" style={{ width: `${(gpaVal / 10) * 100}%`, background: activeColor }} />
                          </div>
                          <span className="font-fredoka text-xl font-bold" style={{ color: activeColor }}>{s.gpa}</span>
                        </div>
                      </div>
                    );
                  })}
                  {(!data.semesterGPAs || data.semesterGPAs.length === 0) && (
                    <div className="text-center py-6 text-gray-400 font-fredoka">No GPA records found.</div>
                  )}
                </div>
              </div>

              {}
              {data.subjectMarks && data.subjectMarks.length > 0 && (
                <div className="bg-gray-50 dark:bg-slate-900 brutalist-border dark:border-slate-700 rounded-2xl p-5 mb-6">
                  <h3 className="font-fredoka font-bold text-sm uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-4">📋 Current Semester Subjects</h3>
                  <div className="space-y-2">
                    {data.subjectMarks.map(m => {
                      const color = m.percentage >= 80 ? '#3b82f6' : m.percentage >= 60 ? '#eab308' : '#ef4444';
                      const activeColor = isDark ? (darkColors[color as keyof typeof darkColors] || color) : color;
                      return (
                        <div key={m.subject} className="flex items-center justify-between bg-white dark:bg-slate-800 px-4 py-3 rounded-xl brutalist-border" style={{ borderColor: activeColor }}>
                          <span className="font-fredoka font-bold text-sm text-black dark:text-white">{m.subject}</span>
                          <span className="font-fredoka font-bold" style={{ color: activeColor }}>{m.percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {}
              <div className="brutal-card-green brutalist-border rounded-2xl p-5 mb-6">
                <h3 className="font-fredoka font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle2 size={16} /> How to Improve Your CGPA
                </h3>
                <ul className="space-y-2">
                  {[
                    'Focus on weak subjects — even a 5% improvement in low-scoring subjects dramatically boosts CGPA.',
                    'Use the Study Plan generator to create focused revision schedules for upcoming exams.',
                    'Practice with AI Quizzes regularly to identify and fill knowledge gaps early.',
                    'Attend all classes — attendance correlates with higher exam scores.',
                    'Use Doubt Solver for concepts you find tricky instead of skipping them.',
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-body text-gray-700 dark:text-slate-300">
                      <span className="mt-0.5 text-green-500 flex-shrink-0">✦</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {}
              <div className="brutal-card-purple brutalist-border rounded-2xl p-5">
                <h3 className="font-fredoka font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Target size={16} /> Set Your Target CGPA
                </h3>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0" max="10" step="0.1"
                    value={targetCGPA}
                    onChange={(e) => setTargetCGPA(e.target.value)}
                    placeholder="e.g., 8.5"
                    className="flex-1 px-4 py-3 brutalist-border rounded-xl font-fredoka font-bold text-lg outline-none focus:border-purple-500 bg-white dark:bg-slate-900 dark:text-white dark:border-slate-700"
                    style={{ borderColor: '#7c3aed' }}
                  />
                  <button
                    onClick={() => {
                      if (targetCGPA) {
                        toast.success(`Target CGPA set to ${targetCGPA}! 🎯`);
                      } else {
                        toast.error('Please enter a target CGPA');
                      }
                    }}
                    className="px-6 py-3 bg-purple-600 dark:bg-purple-700 text-white font-fredoka font-bold rounded-xl brutalist-border hard-shadow hover:-translate-y-1 transition-transform dark:border-purple-950/60"
                    style={{ borderColor: '#5b21b6' }}
                  >
                    Set Goal
                  </button>
                </div>
                {targetCGPA && parseFloat(targetCGPA) > (data.cgpa || 0) && (
                  <p className="font-fredoka text-xs text-purple-600 dark:text-purple-400 mt-3 font-bold">
                    📈 You need to improve by {(parseFloat(targetCGPA) - (data.cgpa || 0)).toFixed(2)} points. Focus on your weakest subjects to close the gap!
                  </p>
                )}
                {targetCGPA && parseFloat(targetCGPA) <= (data.cgpa || 0) && (
                  <p className="font-fredoka text-xs text-green-600 dark:text-green-400 mt-3 font-bold">
                    🎉 Amazing! You've already achieved this target. Set a higher goal to keep pushing!
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
