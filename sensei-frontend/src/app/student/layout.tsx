'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  Home, Brain, BookOpen, MessageCircle, FileText, AlertTriangle,
  Trophy, HelpCircle, User, Bell, LogOut, ChevronLeft, ChevronRight, ArrowRight, ChevronDown, ArrowLeft
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

import { FaHome, FaRobot, FaSpaceShuttle, FaBrain, FaChartLine, FaBullseye, FaRocket, FaHandshake, FaUser } from 'react-icons/fa';

const NotificationPanel = dynamic(() => import('@/components/NotificationPanel'), { ssr: false });

const navItems = [
  { href: '/student', labelKey: 'dashboard', icon: FaHome },
  { href: '/student/ai-avatar', labelKey: 'mentor', icon: FaRobot },
  { href: '/student/virtual-beyond', labelKey: 'virtual_beyond', icon: FaSpaceShuttle },
  { href: '/student/ultra-study', labelKey: 'ultra_study', icon: FaBrain },
  { href: '/student/overcome', labelKey: 'overcome', icon: FaChartLine },
  { href: '/student/focus-guardian', labelKey: 'focus_guard', icon: FaBullseye },
  { href: '/student/career-simulator', labelKey: 'career_sim', icon: FaRocket },
  { href: '/student/social', labelKey: 'social_hub', icon: FaHandshake },
  { href: '/student/profile', labelKey: 'profile', icon: FaUser },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [hoverState, setHoverState] = useState(false);

  const handleScroll = () => {
    if (scrollRef.current && scrollRef.current.scrollLeft > 20) {
      setShowScrollHint(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'student') {
      router.push('/login');
    }
  }, [user, router]);

  const isWorldRoom = pathname.startsWith('/student/world/');
  const isInterviewSession = /^\/student\/interview\/iv_/.test(pathname);
  const isStudentRoot = pathname === '/student';

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className={`flex flex-col min-h-screen relative ${isInterviewSession ? 'pb-0 bg-[#0d1b2a]' : 'pb-36 md:pb-44 bg-[var(--s-page-bg)]'} w-full overflow-x-hidden text-[var(--s-text)]`}>
      {/* Grid pattern backdrop overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px, 30px 30px', backgroundPosition: '0 0, 15px 15px' }} />

      <main className="flex-1 w-full max-w-[1600px] mx-auto relative z-10">
        {/* Header (Top Nav) */}
        {!isWorldRoom && !isInterviewSession && (
          <header className="sticky top-0 z-40 px-4 md:px-8 py-4 md:py-5 flex items-center justify-between backdrop-blur-sm max-w-full bg-[var(--s-header-bg)] border-b-4 border-b-[var(--s-border)] shadow-[0_6px_0_var(--s-border)]">
            <div className="flex items-center gap-4 md:gap-8 min-w-0">
              {/* Profile Avatar Burst */}
              <div className="relative flex-shrink-0 pt-2 hidden sm:block">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-slate-800 brutalist-border rounded-2xl md:rounded-3xl overflow-hidden hard-shadow-lg -rotate-[6deg] hover:rotate-0 transition-transform cursor-pointer">
                  <Image src={`https://i.pravatar.cc/100?u=${encodeURIComponent(user.name || 'user')}`} alt={user.name || 'Avatar'} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                </div>
                {/* Speech Bubble Greeting */}
                <div className="absolute -top-12 left-16 hidden lg:block z-20 bg-white dark:bg-slate-800 border-4 border-[var(--s-border)] rounded-2xl px-3 py-1.5 shadow-[4px_4px_0_var(--s-border)] whitespace-nowrap" style={{ animation: 'float-slow 4s ease-in-out infinite' }}>
                  <p className="font-fredoka font-bold text-sm text-[var(--s-text)]">{t('hey')} {user.name?.split(' ')[0]}, {t('ready_to_level_up')}</p>
                  <div className="absolute -bottom-3.5 left-5 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-[var(--s-border)]" />
                  <div className="absolute -bottom-2.5 left-[23px] w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[11px] border-t-white dark:border-t-slate-805 z-10" />
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="font-fredoka text-2xl md:text-4xl font-bold tracking-tight truncate uppercase text-[var(--s-text)]">
                  {t('dashboard')}
                </h2>
                <div className="flex items-center gap-2 md:gap-4 mt-1 flex-wrap">
                  <span className="font-fredoka font-bold text-[10px] md:text-xs px-2 md:px-4 py-1 brutalist-border rounded-lg md:rounded-xl -rotate-1 hard-shadow bg-white dark:bg-slate-800 text-[var(--s-text)] whitespace-nowrap">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
                  </span>
                  <span className="font-fredoka font-bold text-[10px] md:text-xs text-gray-500 italic uppercase tracking-wide hidden sm:inline truncate">
                    {t('time_to_crush_it')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
              <ThemeToggle />
              <LanguageSwitcher />
              <NotificationPanel />
              <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-400 dark:bg-slate-800 brutalist-border rounded-xl flex items-center justify-center text-lg md:text-xl font-black hard-shadow text-[var(--s-text)]" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>
        )}

        {/* Back Button (shown on subpages) */}
        {!isWorldRoom && !isInterviewSession && !isStudentRoot && (
          <div className="px-4 md:px-8 pt-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 brutalist-border hard-shadow font-fredoka font-bold text-sm uppercase tracking-wide hover:-translate-y-1 transition-transform text-[var(--s-text)] rounded-xl"
            >
              <ArrowLeft size={16} strokeWidth={3} />
              {t('go_back')}
            </button>
          </div>
        )}

        <div className={isWorldRoom || isInterviewSession ? "p-0 h-screen" : "p-4 md:p-8"}>{children}</div>
      </main>



      {}
      {!isWorldRoom && !isInterviewSession && (
        <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95vw] md:w-auto max-w-full">
          <AnimatePresence>
            {showScrollHint && !hoverState && (
              <motion.div 
                key="scroll-hint"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap brutalist-border"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span>{t('swipe_for_more')}</span>
                <ArrowRight size={10} className="animate-swipe-hint" />
              </motion.div>
            )}
          </AnimatePresence>

          <div 
            className="relative group mx-auto w-fit max-w-full"
            onMouseEnter={() => setHoverState(true)}
            onMouseLeave={() => setHoverState(false)}
          >
            {/* Dock Background */}
            <div className="absolute inset-x-0 bottom-0 h-[64px] md:h-[72px] backdrop-blur-xl brutalist-border rounded-[2rem] pointer-events-none bg-[var(--s-dock-bg)] shadow-[8px_8px_0_var(--s-border)]" />

            <nav 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex items-center gap-2 overflow-x-auto hide-scrollbar pt-16 pb-2 px-2 snap-x relative z-10 w-full"
            >
              {}
              <button 
                onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
                className="absolute left-0 bottom-0 h-[64px] md:h-[72px] z-30 w-10 flex items-center justify-center bg-gradient-to-r from-white dark:from-slate-950 via-white/80 dark:via-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-l-[2rem]"
              >
                <ChevronLeft size={20} className="text-brutal-text dark:text-slate-400" />
              </button>
              <button 
                onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
                className="absolute right-0 bottom-0 h-[64px] md:h-[72px] z-30 w-10 flex items-center justify-center bg-gradient-to-l from-white dark:from-slate-950 via-white/80 dark:via-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-r-[2rem]"
              >
                <ChevronRight size={20} className="text-brutal-text dark:text-slate-400" />
              </button>

              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/student' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex items-center justify-center snap-center shrink-0 group/item"
                  >
                    {}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/90 dark:bg-slate-800 backdrop-blur-md text-white px-3 py-1.5 rounded-xl pointer-events-none whitespace-nowrap brutalist-border dark:border-slate-700 opacity-0 group-hover/item:opacity-100 group-hover/item:-translate-y-1 transition-all duration-200 z-50 shadow-[4px_4px_0_rgba(0,0,0,0.3)] dark:shadow-[4px_4px_0_rgba(0,0,0,0.5)]" style={{ fontFamily: 'var(--font-display)' }}>
                      <Icon className="text-yellow-400 text-sm" />
                      <span className="uppercase text-[10px] tracking-widest font-bold">{t(item.labelKey as any)}</span>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black rotate-45 border-r-2 border-b-2 border-white/20" />
                    </div>

                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: isActive ? 0 : 5 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-xl md:text-2xl border-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-yellow-400 dark:bg-[var(--s-card)] text-brutal-text dark:text-[var(--accent-purple)] border-[var(--s-border)] -translate-y-2 md:-translate-y-4 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_var(--s-border)]' : 'bg-white/50 dark:bg-[var(--s-card)]/50 border-transparent hover:border-brutal-border hover:dark:border-[var(--s-border)] hover:-translate-y-2 hover:shadow-[2px_2px_0px_#000] hover:dark:shadow-[2px_2px_0px_var(--s-border)] text-brutal-text dark:text-slate-400 hover:dark:text-white'}`}
                    >
                      <Icon />
                    </motion.div>
                  </Link>
                );
              })}
              
              <div className="w-1 h-8 md:h-10 bg-black/10 mx-1 md:mx-2 rounded-full shrink-0 self-end mb-2 md:mb-3" /> {}
 
              <button
                onClick={handleLogout}
                className="relative flex items-center justify-center snap-center shrink-0 group/item"
              >
                {}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/90 dark:bg-slate-800 backdrop-blur-md text-white px-3 py-1.5 rounded-xl pointer-events-none whitespace-nowrap brutalist-border dark:border-slate-700 opacity-0 group-hover/item:opacity-100 group-hover/item:-translate-y-1 transition-all duration-200 z-50 shadow-[4px_4px_0_rgba(0,0,0,0.3)] dark:shadow-[4px_4px_0_rgba(0,0,0,0.5)]" style={{ fontFamily: 'var(--font-display)' }}>
                  <LogOut size={14} className="text-yellow-400" />
                  <span className="uppercase text-[10px] tracking-widest font-bold">{t('log_out')}</span>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black rotate-45 border-r-2 border-b-2 border-white/20" />
                </div>
 
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-xl md:text-2xl border-2 border-transparent rounded-2xl transition-all duration-300 bg-white/50 dark:bg-[var(--s-card)]/50 text-brutal-text dark:text-slate-400 hover:bg-red-500 hover:dark:bg-red-600 hover:text-white hover:-translate-y-2 hover:shadow-[2px_2px_0px_#000] hover:dark:shadow-[2px_2px_0px_var(--s-border)]"
                >
                  <LogOut size={20} strokeWidth={3} className="md:w-6 md:h-6" />
                </motion.div>
              </button>
            </nav>
          </div>
        </div>
      )}
      
    </div>
  );
}
