'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  Brain, BookOpen, Users, GraduationCap, Target, TrendingUp, Zap, ChevronRight, BarChart3, Shield, Menu, X, Play, ArrowRight, CheckCircle2, Heart, Building2,
} from 'lucide-react';

const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), {
  ssr: false,
});
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

// ─── Design tokens ────────────────────────────────────────────────────────────
const PURPLE      = '#7B4FE9';
const PURPLE_DARK = '#5B35C4';
const NAVY        = '#1A1A2E';
const CREAM       = '#F5EFE8';

const NOTE_YELLOW   = '#FFE93A';
const NOTE_PINK     = '#F48FB1';
const NOTE_GREEN    = '#81D4A8';
const NOTE_LAVENDER = '#C9A0FF';
const NOTE_BLUE     = '#81D4FA';
const NOTE_PEACH    = '#FFB74D';

const CUBIC_BEZIER: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

// ─── AnimatedCounter ──────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', isStatic = false }: { target: number; suffix?: string; isStatic?: boolean }) {
  const [count, setCount] = useState(isStatic ? target : 0);
  const ref     = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (isStatic) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const frames = 120;
        const inc    = target / frames;
        let cur      = 0;
        const t = setInterval(() => {
          cur += inc;
          if (cur >= target) { setCount(target); clearInterval(t); }
          else { setCount(Math.floor(cur)); }
        }, 16);
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, isStatic]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── StickyNote ───────────────────────────────────────────────────────────────
function StickyNote({ color, rotate = 0, children, style, themed = false }: { color: string; rotate?: number; children: React.ReactNode; style?: React.CSSProperties; themed?: boolean }) {
  return (
    <div className={themed ? 'sticky-note-themed' : ''} style={{
      background: color,
      borderRadius: 12,
      padding: '1.1rem',
      position: 'relative',
      transform: `rotate(${rotate}deg)`,
      border: '1.5px solid var(--brutal-border)',
      boxShadow: '4px 5px 0px var(--brutal-shadow)',
      transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, color 0.3s ease',
      ...style,
    }}>
      {/* tape strip */}
      <div style={{
        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
        width: 48, height: 14,
        background: 'rgba(210,190,140,0.6)',
        borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)',
      }} />
      {children}
    </div>
  );
}

// ─── FloatingLabel ────────────────────────────────────────────────────────────
function FloatingLabel({ label, color, Icon, posStyle, delay = 0, rotate = 0 }: {
  label: string; color: string; Icon: React.ElementType;
  posStyle: React.CSSProperties; delay?: number; rotate?: number;
}) {
  return (
    <motion.div
      className="absolute"
      style={{ ...posStyle, width: 'max-content', zIndex: 10 }}
      initial={{ opacity: 0, scale: 0.7, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.65, ease: CUBIC_BEZIER }}
    >
      <motion.div
        animate={{ y: [0, -7, 0] }}
        whileHover={{ scale: 1.12, y: -5 }}
        transition={{ duration: 3 + delay * 0.5, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.4 }}
      >
        <StickyNote color={color} rotate={rotate} style={{ width: 118, padding: '0.9rem 0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
            <div style={{ width: 36, height: 36, background: 'rgba(0,0,0,0.09)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={NAVY} />
            </div>
            <p style={{ fontWeight: 800, fontSize: '0.55rem', color: NAVY, letterSpacing: '0.13em', textTransform: 'uppercase', fontFamily: "'Raleway', sans-serif", margin: 0, textAlign: 'center', lineHeight: 1.3 }}>
              {label}
            </p>
          </div>
        </StickyNote>
      </motion.div>
    </motion.div>
  );
}

// ─── DoodleStar ───────────────────────────────────────────────────────────────
function DoodleStar({ style }: { style?: React.CSSProperties }) {
  return (
    <motion.span
      animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.2, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ position: 'absolute', fontSize: '1rem', pointerEvents: 'none', userSelect: 'none', ...style }}
    >✦</motion.span>
  );
}

// ─── AnimatedBuilding ────────────────────────────────────────────────────────
function AnimatedBuilding() {
  const winRows = [
    [1,0,1,1,0,1],[0,1,1,0,1,0],[1,1,0,1,0,1],[0,1,1,0,1,1],[1,0,1,1,0,0],
  ];
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ position: 'relative', width: 310, height: 230 }}
    >
      {/* Ground glow */}
      <motion.div
        animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.18, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 230, height: 22, background: 'radial-gradient(ellipse, rgba(123,79,233,0.55), transparent 70%)', filter: 'blur(10px)' }}
      />
      <svg viewBox="0 0 310 230" fill="none" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="bL" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#1A1040"/><stop offset="100%" stopColor="#2D1B69"/></linearGradient>
          <linearGradient id="bR" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#231550"/><stop offset="100%" stopColor="#160D35"/></linearGradient>
          <linearGradient id="bT" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#3D2480"/><stop offset="100%" stopColor="#6040C0"/></linearGradient>
          <filter id="winGlow"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {/* Ground ellipse */}
        <ellipse cx="155" cy="222" rx="120" ry="10" fill="rgba(123,79,233,0.14)" />
        {/* Main building faces */}
        <polygon points="55,92 155,52 155,205 55,228" fill="url(#bL)" />
        <polygon points="155,52 255,92 255,228 155,205" fill="url(#bR)" />
        <polygon points="55,92 155,52 255,92 155,132" fill="url(#bT)" />
        {/* Left face windows */}
        {winRows.map((row, ri) => row.slice(0,3).map((lit, wi) => (
          <rect key={`l${ri}${wi}`} x={68+wi*25+ri*2} y={110+ri*19} width={13} height={11} rx={2}
            fill={lit ? '#A78BFA' : '#3D2080'} opacity={lit ? 0.92 : 0.35}
            filter={lit ? 'url(#winGlow)' : undefined} />
        )))}
        {/* Right face windows */}
        {winRows.map((row, ri) => row.slice(0,4).map((lit, wi) => (
          <rect key={`r${ri}${wi}`} x={165+wi*20-ri*2} y={110+ri*19} width={13} height={11} rx={2}
            fill={lit ? '#C4B5FD' : '#2A1B56'} opacity={lit ? 0.82 : 0.3}
            filter={lit ? 'url(#winGlow)' : undefined} />
        )))}
        {/* Entrance arch */}
        <rect x={140} y={193} width={30} height={18} rx={3} fill="#0D0820" />
        <path d="M140,197 Q155,183 170,197" fill="#A78BFA" opacity="0.25" />
        {/* Roof details */}
        <rect x={142} y={45} width={26} height={9} rx={2} fill="#3D2480" />
        <rect x={150} y={37} width={10} height={9} rx={2} fill="#5A35B0" />
        <line x1="155" y1="36" x2="155" y2="16" stroke="rgba(123,79,233,0.7)" strokeWidth="2" />
        <circle cx="155" cy="13" r="4" fill="#A78BFA" opacity="0.9" />
        {/* Side wings */}
        <polygon points="37,130 55,118 55,200 37,212" fill="#170E32" />
        <polygon points="255,118 273,130 273,212 255,200" fill="#170E32" />
        {[0,1,2].map(i => (
          <rect key={`wl${i}`} x={40} y={133+i*21} width={9} height={9} rx={1} fill="#7B4FE9" opacity="0.65" />
        ))}
        {[0,1,2].map(i => (
          <rect key={`wr${i}`} x={258} y={133+i*21} width={9} height={9} rx={1} fill="#7B4FE9" opacity="0.65" />
        ))}
        {/* Trees left */}
        <ellipse cx="28" cy="215" rx="18" ry="11" fill="#2E7D32" opacity="0.85" />
        <ellipse cx="28" cy="208" rx="13" ry="10" fill="#43A047" opacity="0.9" />
        <rect x="25" y="218" width="5" height="8" rx="1" fill="#4E342E" />
        {/* Trees right */}
        <ellipse cx="280" cy="215" rx="18" ry="11" fill="#2E7D32" opacity="0.85" />
        <ellipse cx="280" cy="208" rx="13" ry="10" fill="#43A047" opacity="0.9" />
        <rect x="277" y="218" width="5" height="8" rx="1" fill="#4E342E" />
        {/* Connecting arcs (power lines) */}
        <path d="M55,130 Q105,115 155,120" fill="none" stroke="rgba(123,79,233,0.2)" strokeWidth="1" strokeDasharray="4 3" />
        <path d="M155,120 Q205,115 255,130" fill="none" stroke="rgba(123,79,233,0.2)" strokeWidth="1" strokeDasharray="4 3" />
      </svg>
    </motion.div>
  );
}

const fadeUp = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: CUBIC_BEZIER } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };

  const features = [
    { color: NOTE_PINK,     icon: Zap,       iconColor: '#C62828', title: 'Early Risk Detection',  desc: 'AI predicts issues before they become problems.' },
    { color: NOTE_YELLOW,   icon: Target,    iconColor: '#E65100', title: 'Smart Interventions',   desc: 'Automated, personalized actions at the right time.' },
    { color: NOTE_GREEN,    icon: BarChart3, iconColor: '#2E7D32', title: 'Real-time Insights',    desc: 'Live analytics for every decision you make.' },
    { color: NOTE_BLUE,     icon: Users,     iconColor: '#0277BD', title: 'Student Success',       desc: 'Better outcomes through data-driven care.' },
    { color: NOTE_LAVENDER, icon: Shield,    iconColor: '#6A1B9A', title: 'Unified Ecosystem',     desc: 'All systems. One platform. Infinite impact.' },
  ];

  const roleCards = [
    { icon: GraduationCap, color: PURPLE,    bg: '#F0E8FF', title: 'For Students', desc: 'An AI that adapts to how you think and grows with you.', features: ['Adaptive AI Assessments', 'Focus Guardian', 'Career Simulator', 'Vision Summarizer', '24/7 AI Study Tutor', 'Progress Analytics'] },
    { icon: BookOpen,      color: '#0097A7', bg: '#E0F7FA', title: 'For Faculty',  desc: 'Intelligent tools that save time so you focus on students.', features: ['AI-Powered Grading', 'Class Analytics', 'Intervention Alerts', 'Smart Assignment Builder', 'Resource Planner', 'Poll & Quiz Creator'] },
    { icon: Shield,        color: '#2E7D32', bg: '#E8F5E9', title: 'For Admins',   desc: 'System-wide analytics and AI-powered risk insights.', features: ['University Dashboard', 'Dropout Risk Prediction', 'Performance Analytics', 'Intervention Management', 'Department Reports'] },
  ];


  const navLinks = ['Home', 'Features', 'Solutions', 'About Us', 'Pricing', 'Contact'];

  const stats = [
    { value: 10,  suffix: 'K+', label: 'Students Impacted' },
    { value: 500, suffix: '+',  label: 'Courses Analyzed' },
    { value: 95,  suffix: '%',  label: 'Early Risk Detection' },
    { value: 24,  suffix: '/7', label: 'AI Monitoring', isStatic: true },
  ];

  const howSteps = [
    { color: NOTE_LAVENDER, icon: BarChart3,  iconColor: '#7B4FE9', title: 'Collect',   desc: 'Real-time data from across campus systems.' },
    { color: NOTE_YELLOW,   icon: Brain,      iconColor: '#E65100', title: 'Analyze',   desc: 'AI agents detect patterns & predict outcomes.' },
    { color: NOTE_PINK,     icon: Target,     iconColor: '#C62828', title: 'Intervene', desc: 'Smart actions triggered at the right time.' },
    { color: NOTE_GREEN,    icon: TrendingUp, iconColor: '#2E7D32', title: 'Empower',   desc: 'Better decisions. Healthier students. Smarter campuses.' },
  ];

  const platforms = [
    { icon: GraduationCap, iconColor: PURPLE,    accentColor: NOTE_LAVENDER, title: 'STUDENT DASHBOARD',     tagline: 'Learn smarter. Stay ahead. ☆',   stats: [{ label: "Today's Progress", value: '78%' }, { label: 'Upcoming Tasks', value: '3' }, { label: 'Focus Score', value: '92%' }] },
    { icon: BookOpen,      iconColor: '#0097A7', accentColor: NOTE_BLUE,     title: 'FACULTY WORKSPACE',     tagline: 'Teach better. Impact more. ♡',   stats: [{ label: 'Class Pulse', value: 'Active' }, { label: 'At Risk Students', value: '18' }, { label: 'Interventions', value: '5' }] },
    { icon: Shield,        iconColor: '#388E3C', accentColor: NOTE_GREEN,    title: 'ADMIN COMMAND CENTER',  tagline: 'Decide faster. Lead better. 👑', stats: [{ label: 'Total Students', value: '9,842' }, { label: 'System Health', value: '92%' }, { label: 'Active Alerts', value: '23' }] },
  ];


export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const { scrollYProgress } = useScroll();
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);




  return (
    <>
    <div className="landing-page-wrapper" style={{ overflowX: 'hidden', fontFamily: "'Raleway', sans-serif" }}>
      {/* scroll progress bar */}
      <motion.div style={{ scaleX: progressScaleX, transformOrigin: '0%', position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${PURPLE},#EC407A,#4CAF50)`, zIndex: 2000 }} />

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000,
        background: scrolled ? 'var(--nav-bg-scrolled)' : 'var(--nav-bg)',
        backdropFilter: 'blur(18px)',
        borderBottom: scrolled ? '1px solid var(--nav-border-scrolled)' : 'none',
        padding: scrolled ? '0.65rem 0' : '1rem 0',
        transition: 'all 0.35s ease',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <motion.div whileHover={{ scale: 1.07, rotate: -5 }} transition={{ type: 'spring', stiffness: 300 }}
              style={{ width: 40, height: 40, background: `linear-gradient(135deg,${PURPLE},${PURPLE_DARK})`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(123,79,233,0.32)' }}>
              <Brain size={20} color="#fff" />
            </motion.div>
            <div>
              <p className="font-cinzel" style={{ fontWeight: 900, fontSize: '1.05rem', letterSpacing: '0.1em', color: 'var(--text-primary)', lineHeight: 1, margin: 0 }}>SENSEI</p>
              <p style={{ fontSize: '0.45rem', letterSpacing: '0.24em', color: PURPLE, fontWeight: 700, margin: 0, marginTop: 2 }}>AI CAMPUS OS</p>
            </div>
          </Link>

          <div className="hidden lg:flex" style={{ alignItems: 'center', gap: '2rem' }}>
            {navLinks.map((link, i) => (
              <a key={link} href={`#section-${link.toLowerCase().replace(/\s+/g, '-')}`}
                style={{ fontSize: '0.875rem', fontWeight: i === 0 ? 700 : 500, color: i === 0 ? PURPLE : 'var(--muted-text)', textDecoration: i === 0 ? 'underline' : 'none', textUnderlineOffset: 4, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = PURPLE)}
                onMouseLeave={e => (e.currentTarget.style.color = i === 0 ? PURPLE : 'var(--muted-text)')}>
                {link}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.35rem', background: `linear-gradient(135deg,${PURPLE},${PURPLE_DARK})`, color: '#fff', fontWeight: 700, fontSize: '0.875rem', borderRadius: 10, textDecoration: 'none', boxShadow: '0 4px 14px rgba(123,79,233,0.32)', transition: 'all 0.25s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 24px rgba(123,79,233,0.48)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 4px 14px rgba(123,79,233,0.32)'; }}>
              Request Demo <ArrowRight size={14} />
            </Link>
          </div>

          <button className="lg:hidden" onClick={() => setMobileOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: '0.25rem' }} aria-label="Toggle menu">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ background: 'var(--bg-nav)', boxShadow: '0 8px 32px var(--brutal-shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {navLinks.map(link => (
                  <a key={link} href={`#section-${link.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setMobileOpen(false)}
                    style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>
                    {link}
                  </a>
                ))}
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  style={{ padding: '0.85rem', background: PURPLE, color: '#fff', textAlign: 'center', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
                  Request Demo
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <section id="section-home" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        paddingTop: 80,
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-page)',
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        zIndex: 0,
      }}>
        <ParticleBackground />
        {/* polka dot texture */}
        <div className="animated-grid" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />
        {/* soft ambient blobs */}
        <div style={{ position: 'absolute', top: '8%', left: '-5%', width: 360, height: 360, background: 'rgba(212,184,255,0.25)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 300, height: 300, background: 'rgba(181,234,215,0.3)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '4.5rem 1.5rem', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', alignItems: 'center' }}>

            {/* LEFT: text */}
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              {/* badge */}
              <motion.div variants={fadeUp} style={{ marginBottom: '1.5rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(123,79,233,0.14)', border: '1.5px solid rgba(123,79,233,0.35)', borderRadius: 999, padding: '0.5rem 1.2rem', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.22em', color: PURPLE }}>
                  <span style={{ width: 8, height: 8, background: '#4CAF50', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 6px rgba(76,175,80,0.5)' }} />
                  AI-POWERED UNIVERSITY PLATFORM
                </span>
              </motion.div>

              {/* headline - animated word-by-word */}
              <motion.div variants={fadeUp} style={{ marginBottom: '1.25rem' }}>
                <motion.h1 style={{ fontSize: 'clamp(2.6rem, 5.5vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>
                  <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: CUBIC_BEZIER }}
                    style={{ display: 'inline-block', marginRight: '0.3em' }}>The</motion.span>
                  <motion.span initial={{ opacity: 0, scale: 0.5, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: CUBIC_BEZIER }}
                    style={{ display: 'inline-block', position: 'relative', color: PURPLE, fontStyle: 'italic', marginRight: '0.15em' }}>
                    AI
                  </motion.span>{' '}
                  <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45, ease: CUBIC_BEZIER }}
                    style={{ display: 'inline-block' }}>Operating</motion.span>
                  <br />
                  <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6, ease: CUBIC_BEZIER }}
                    style={{ display: 'inline-block', marginRight: '0.3em' }}>System</motion.span>
                  <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7, ease: CUBIC_BEZIER }}
                    style={{ display: 'inline-block' }}>for</motion.span>
                  <br />
                  <motion.span initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.85, ease: CUBIC_BEZIER }}
                    style={{ display: 'inline-block', color: PURPLE }}>
                    Modern Campuses
                  </motion.span>
                </motion.h1>
              </motion.div>

              {/* tagline - animated words */}
              <motion.p variants={fadeUp} style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.875rem' }}>
                <motion.span initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 1.0 }}
                  style={{ display: 'inline-block', color: 'var(--text-primary)' }}>Predict.{' '}</motion.span>
                <motion.span initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 1.2 }}
                  style={{ display: 'inline-block', color: PURPLE, textDecoration: 'underline', textUnderlineOffset: 4, fontStyle: 'italic' }}>Intervene.{' '}</motion.span>
                <motion.span initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 1.4 }}
                  style={{ display: 'inline-block', color: '#2E7D32' }}>Empower.</motion.span>
              </motion.p>

              <motion.p variants={fadeUp} style={{ fontSize: '1.02rem', color: 'var(--muted-text)', lineHeight: 1.85, maxWidth: 480, marginBottom: '2.25rem', fontWeight: 500 }}>
                Sensei unifies students, faculty, and administrators in one intelligent ecosystem to drive success &amp; excellence.
              </motion.p>

              {/* CTA buttons */}
              <motion.div variants={fadeUp} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.9rem 1.8rem', background: `linear-gradient(135deg,${PURPLE},${PURPLE_DARK})`, color: '#fff', fontWeight: 700, fontSize: '0.9rem', borderRadius: 12, textDecoration: 'none', boxShadow: '0 6px 22px rgba(123,79,233,0.38)', transition: 'all 0.3s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 12px 34px rgba(123,79,233,0.52)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 6px 22px rgba(123,79,233,0.38)'; }}>
                  Explore Platform <ArrowRight size={16} />
                </Link>
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.9rem 1.6rem', background: 'var(--watch-demo-bg)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem', borderRadius: 12, border: '1.5px solid var(--watch-demo-border)', cursor: 'pointer', transition: 'all 0.3s' }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--text-muted)'; }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--watch-demo-border)'; }}>
                  <Play size={15} fill="currentColor" /> Watch Demo
                </button>
              </motion.div>

              {/* Trusted-by social proof */}
              <motion.div variants={fadeUp} style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex' }}>
                  {['s1','s2','s3','s4','s5'].map((u, i) => (
                    <img key={u} src={`https://i.pravatar.cc/40?u=${u}-sensei`} alt={`User ${i+1}`}
                      style={{ width: 38, height: 38, borderRadius: '50%', border: '2.5px solid var(--bg-page)', marginLeft: i > 0 ? -10 : 0, objectFit: 'cover' }} />
                  ))}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 3 }}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ color: '#F59E0B', fontSize: '0.85rem' }}>★</span>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--secondary-text)', fontWeight: 600 }}>Trusted by <strong style={{ color: PURPLE }}>12,000+</strong> students & faculty</p>
                </div>
              </motion.div>

              {/* Hand-drawn decorative doodles */}
              <motion.div variants={fadeUp} style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {[
                  { emoji: '🎓', label: '15+ AI Agents' },
                  { emoji: '🧠', label: 'Smart Analytics' },
                  { emoji: '🎯', label: 'Risk Detection' },
                ].map(({ emoji, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'var(--doodle-badge-bg)', border: '1.5px dashed var(--doodle-badge-border)', borderRadius: 10, padding: '0.4rem 0.85rem' }}>
                    <span style={{ fontSize: '1rem' }}>{emoji}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-text)', letterSpacing: '0.03em' }}>{label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* RIGHT: hero illustration — Image */}
            <div className="hidden lg:block" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', padding: 10 }}>
              <img src="/images/hero-bg.png" alt="Sensei Campus Illustration" style={{ width: '115%', maxWidth: 700, height: 'auto', objectFit: 'contain', marginLeft: '-2rem', filter: 'drop-shadow(0 8px 32px rgba(123,79,233,0.15))' }} />
            </div>

          </div>
        </div>

        {/* bottom wave */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', pointerEvents: 'none' }}>
          <svg viewBox="0 0 1440 64" fill="none" preserveAspectRatio="none" style={{ display: 'block', height: 64, width: '100%' }}>
            <path d="M0,32 C360,64 1080,0 1440,32 L1440,64 L0,64 Z" fill="var(--bg-page)" />
          </svg>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section id="section-features" style={{
        background: 'var(--bg-page)',
        padding: '0 1.5rem',
        position: 'relative',
        overflow: 'visible',
        zIndex: 0,
      }}>
        {/* Torn paper top edge */}
        <div style={{ position: 'absolute', top: -13, left: 0, right: 0, height: 14, pointerEvents: 'none', zIndex: 2 }}>
          <svg viewBox="0 0 1440 14" preserveAspectRatio="none" style={{ width: '100%', height: 14, display: 'block' }}>
            <path d="M0,14 L20,4 L40,12 L60,2 L80,10 L100,0 L120,8 L140,2 L160,12 L180,0 L200,10 L220,4 L240,14 L260,2 L280,12 L300,1 L320,11 L340,4 L360,13 L380,2 L400,10 L420,0 L440,9 L460,3 L480,13 L500,1 L520,10 L540,4 L560,14 L580,2 L600,11 L620,1 L640,10 L660,4 L680,13 L700,1 L720,10 L740,3 L760,12 L780,0 L800,10 L820,3 L840,13 L860,2 L880,11 L900,1 L920,10 L940,4 L960,14 L980,2 L1000,11 L1020,1 L1040,10 L1060,4 L1080,13 L1100,2 L1120,11 L1140,1 L1160,10 L1180,4 L1200,13 L1220,2 L1240,11 L1260,1 L1280,10 L1300,3 L1320,12 L1340,1 L1360,10 L1380,4 L1400,13 L1420,2 L1440,10 L1440,14 Z" fill="var(--bg-page)" />
          </svg>
        </div>
        {/* Inner padding wrapper */}
        <div style={{ padding: '2.75rem 0', borderTop: '2px dashed rgba(0,0,0,0.08)', borderBottom: '2px dashed rgba(0,0,0,0.08)', position: 'relative' }}>
        <ParticleBackground />
        <span style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', fontSize: '1.5rem', opacity: 0.2, pointerEvents: 'none' }}>☆</span>
        <span style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', opacity: 0.2, pointerEvents: 'none' }}>😊</span>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          {stats.map(({ value, suffix, label, isStatic }, idx) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1, duration: 0.5 }}>
              <p className="font-cinzel" style={{ fontSize: 'clamp(2.2rem,5vw,3.2rem)', fontWeight: 900, color: PURPLE, lineHeight: 1 }}>
                <AnimatedCounter target={value} suffix={suffix} isStatic={isStatic} />
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--muted-text)', marginTop: '0.5rem', fontWeight: 600 }}>{label}</p>
            </motion.div>
          ))}
        </div>
        </div>{/* close inner padding wrapper */}
      </section>

      {/* ── WHY CHOOSE SENSEI ── */}
      <section style={{ background: 'var(--bg-page)', padding: '5rem 1.5rem', position: 'relative', overflow: 'hidden', zIndex: 0 }}>
        <ParticleBackground />
        {/* decorative doodles */}
        <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', top: 30, right: 40, fontSize: '2rem', opacity: 0.15, pointerEvents: 'none' }}>✦</motion.span>
        <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', bottom: 40, left: 30, fontSize: '1.5rem', opacity: 0.2, pointerEvents: 'none' }}>📎</motion.span>

        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.35em', color: PURPLE, marginBottom: '0.75rem', textTransform: 'uppercase' }}>WHY CHOOSE US</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>
              Built for <span style={{ color: PURPLE, fontStyle: 'italic' }}>Real Impact</span> on Campus
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--secondary-text)', maxWidth: 520, margin: '1rem auto 0', lineHeight: 1.8, fontWeight: 500 }}>
              Sensei isn&apos;t just another platform — it&apos;s an intelligent ecosystem that predicts, intervenes, and empowers every stakeholder.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1.25rem' }}>
            {[
              { color: NOTE_LAVENDER, icon: '🧠', title: 'Predictive Intelligence', desc: 'AI models analyze 50+ behavioral signals to identify at-risk students before problems escalate.', points: ['Dropout prediction', 'Grade forecasting'] },
              { color: NOTE_YELLOW, icon: '⚡', title: 'Real-time Interventions', desc: 'Automated, personalized actions triggered at exactly the right moment for maximum impact.', points: ['Auto-alerts', 'Smart scheduling'] },
              { color: NOTE_GREEN, icon: '📊', title: 'Unified Analytics', desc: 'One dashboard for students, faculty, and admins — no more scattered data across systems.', points: ['Cross-role views', 'Live metrics'] },
              { color: NOTE_PINK, icon: '🎯', title: 'Proven Results', desc: '+23% average grade improvement and 95% early risk detection accuracy across campuses.', points: ['Data-backed', 'Measurable ROI'] },
            ].map(({ color, icon, title, desc, points }, idx) => (
              <motion.div key={title} initial={{ opacity: 0, y: 30, rotate: idx % 2 === 0 ? -3 : 3 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.12, duration: 0.6, type: 'spring', stiffness: 200 }} whileHover={{ y: -12, rotate: 0, scale: 1.08 }}>
                <StickyNote color={color} rotate={idx === 0 ? -2 : idx === 1 ? 1.5 : idx === 2 ? -1 : 2} style={{ height: '100%', padding: '1.25rem' }} themed>
                  <span style={{ fontSize: '1.6rem', display: 'block', marginBottom: '0.5rem' }}>{icon}</span>
                  <h3 style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: '0.45rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{title}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--muted-text)', lineHeight: 1.65, fontWeight: 500, marginBottom: '0.6rem' }}>{desc}</p>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {points.map(p => (
                      <span key={p} className="sticky-tag" style={{ fontSize: '0.62rem', fontWeight: 700, background: 'rgba(0,0,0,0.06)', borderRadius: 6, padding: '0.2rem 0.5rem', color: 'var(--muted-text)' }}>{p}</span>
                    ))}
                  </div>
                </StickyNote>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW SENSEI WORKS (dark) ── */}
      <section style={{ background: '#111111', padding: '5rem 1.5rem', position: 'relative', overflow: 'hidden', zIndex: 0 }}>
        <ParticleBackground />
        {/* chalkboard texture */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", pointerEvents: 'none' }} />
        {/* hand-drawn decorations */}
        <motion.span animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', top: 30, right: 50, color: '#FFD700', fontSize: '1.5rem', opacity: 0.3, pointerEvents: 'none' }}>★</motion.span>
        <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', bottom: 40, right: 80, color: 'rgba(255,255,255,0.15)', fontSize: '1.2rem', pointerEvents: 'none' }}>✦</motion.span>
        <motion.span animate={{ rotate: [0, -10, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', top: '50%', left: 20, color: 'rgba(255,255,255,0.1)', fontSize: '2rem', pointerEvents: 'none' }}>〰</motion.span>

        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="grid xl:grid-cols-[1fr_300px] gap-10 items-start">
            <div>
              <motion.h2 initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', marginBottom: '3rem', letterSpacing: '0.07em', fontFamily: "'Raleway', sans-serif" }}>
                HOW SENSEI WORKS
              </motion.h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: '1.5rem', position: 'relative' }}>
                {howSteps.map(({ color, icon: Icon, iconColor, title, desc }, idx) => (
                  <motion.div key={title} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.15, duration: 0.55 }} style={{ position: 'relative', zIndex: 1 }}>
                    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.25 }}>
                      <StickyNote color={color} rotate={idx % 2 === 0 ? -2 : 2} style={{ padding: '1.4rem' }} themed>
                        <div className="sticky-icon-wrap" style={{ width: 46, height: 46, background: 'rgba(0,0,0,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.875rem' }}>
                          <Icon size={22} color={iconColor} />
                        </div>
                        <h3 style={{ fontWeight: 900, fontSize: '1.08rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{title}</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--muted-text)', lineHeight: 1.7, fontWeight: 500 }}>{desc}</p>
                      </StickyNote>
                    </motion.div>
                    {idx < 3 && (
                      <div className="hidden lg:flex" style={{ position: 'absolute', right: -18, top: '5.2rem', zIndex: 10, alignItems: 'center' }}>
                        <ChevronRight size={22} color="rgba(255,255,255,0.35)" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ display: 'flex', justifyContent: 'center', marginTop: '1.75rem' }}>
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                  style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.25)', display: 'inline-block' }}>↻</motion.span>
              </motion.div>
            </div>

            {/* live ai insight card */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.25 }}
              style={{ background: 'var(--insight-card-bg)', borderRadius: 18, padding: '1.5rem', boxShadow: '0 24px 60px rgba(0,0,0,0.45)', alignSelf: 'start', marginTop: '5rem', transition: 'background 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ width: 8, height: 8, background: '#4CAF50', borderRadius: '50%', display: 'inline-block' }} />
                <p style={{ fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.2em', color: 'var(--text-primary)', margin: 0 }}>LIVE AI INSIGHT</p>
              </div>
              <div style={{ paddingBottom: '0.875rem', marginBottom: '0.875rem', borderBottom: `2px solid ${PURPLE}` }}>
                <p style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Dropout Risk Detected</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>3 Students</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>B.Tech CSE 2nd Year</p>
              </div>
              <svg viewBox="0 0 200 72" style={{ width: '100%', height: 54, marginBottom: '0.75rem' }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(229,57,53,0.28)" />
                    <stop offset="100%" stopColor="rgba(229,57,53,0)" />
                  </linearGradient>
                </defs>
                <path d="M 0 62 L 40 48 L 80 54 L 120 26 L 160 38 L 200 16 L 200 72 L 0 72 Z" fill="url(#chartGrad)" />
                <polyline points="0,62 40,48 80,54 120,26 160,38 200,16" fill="none" stroke="#E53935" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <button style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1.5px solid var(--insight-btn-border)', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s', color: 'var(--text-primary)' }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'var(--text-primary)'; el.style.color = 'var(--bg-page)'; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'transparent'; el.style.color = 'var(--text-primary)'; }}>
                View Insight <ArrowRight size={12} />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── ONE PLATFORM ── */}
      <section id="section-solutions" style={{ background: 'var(--bg-page)', padding: '5rem 1.5rem', position: 'relative', overflow: 'hidden', zIndex: 0 }}>
        <ParticleBackground />
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.03em', fontFamily: "'Raleway', sans-serif" }}>
              ONE PLATFORM. <span style={{ color: PURPLE }}>EVERYONE</span> EMPOWERED.
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
            {platforms.map(({ icon: Icon, iconColor, accentColor, title, tagline, stats: pStats }, idx) => (
              <motion.div key={title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.15, duration: 0.6 }} whileHover={{ y: -8 }}
                style={{ background: 'var(--bg-page)', border: '1.5px solid rgba(0,0,0,0.06)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 6px 24px var(--brutal-shadow)', transition: 'box-shadow 0.3s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 50px rgba(0,0,0,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px var(--brutal-shadow)'; }}>
                <div style={{ padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', gap: '0.65rem', borderBottom: `1.5px solid ${accentColor}` }}>
                  <div style={{ width: 34, height: 34, background: accentColor, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={17} color={iconColor} />
                  </div>
                  <p style={{ fontWeight: 900, fontSize: '0.78rem', letterSpacing: '0.12em', color: 'var(--text-primary)', margin: 0 }}>{title}</p>
                </div>
                <div style={{ padding: '1.25rem', background: `${accentColor}33` }}>
                  <div style={{ background: 'var(--bg-page)', borderRadius: 12, padding: '0.875rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', minHeight: 140 }}>
                    {pStats.map(({ label, value: v }, si) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: si < pStats.length - 1 ? '1px solid var(--card-divider)' : 'none' }}>
                        <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)', margin: 0, fontWeight: 500 }}>{label}</p>
                        <p style={{ fontSize: '1rem', fontWeight: 900, color: iconColor, margin: 0 }}>{v}</p>
                      </div>
                    ))}
                    <div style={{ marginTop: '0.75rem', height: 6, background: 'var(--progress-track)', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} whileInView={{ width: '72%' }} viewport={{ once: true }} transition={{ duration: 1.2, delay: idx * 0.2 + 0.4 }}
                        style={{ height: '100%', background: `linear-gradient(90deg,${iconColor},${accentColor})`, borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
                <div style={{ padding: '1rem 1.4rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--muted-text)', fontWeight: 600 }}>{tagline}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section id="section-about-us" style={{ background: 'var(--section-alt-bg)', padding: '5rem 1.5rem', position: 'relative', overflow: 'hidden', zIndex: 0 }}>
        <ParticleBackground />
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 300, background: 'rgba(123,79,233,0.04)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.4em', color: PURPLE, marginBottom: '0.875rem', textTransform: 'uppercase' }}>WHO IS SENSEI FOR?</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>
              ONE PLATFORM. <span style={{ color: PURPLE }}>THREE EXPERIENCES.</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.75rem' }}>
            {roleCards.map(({ icon: Icon, color, bg, title, desc, features: roleFeatures }, idx) => (
              <motion.div key={title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.12, duration: 0.6 }} whileHover={{ y: -8 }}
                style={{ background: 'var(--bg-page)', border: `1.5px solid ${color}28`, borderRadius: 22, padding: '2.25rem', position: 'relative', overflow: 'hidden', transition: 'border-color 0.3s, box-shadow 0.3s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${color}55`; el.style.boxShadow = `0 20px 50px ${color}18`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${color}28`; el.style.boxShadow = 'none'; }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: `${color}10`, borderRadius: '50%', filter: 'blur(20px)' }} />
                <div style={{ width: 56, height: 56, background: `${color}20`, border: `1.5px solid ${color}35`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Icon size={26} color={color} />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.65rem', color: 'var(--text-primary)' }}>{title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted-text)', lineHeight: 1.7, marginBottom: '1.5rem', fontWeight: 500 }}>{desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.75rem' }}>
                  {roleFeatures.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <CheckCircle2 size={14} color={color} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.86rem', color: 'var(--muted-text)', fontWeight: 500 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.65rem 1.35rem', background: `${color}18`, border: `1.5px solid ${color}35`, borderRadius: 10, color, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textDecoration: 'none', transition: 'all 0.25s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${color}30`; el.style.borderColor = `${color}60`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${color}18`; el.style.borderColor = `${color}35`; }}>
                  Get Started <ChevronRight size={13} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SMART FEATURES ── */}
      <section id="section-pricing" style={{ background: 'var(--bg-page)', padding: '5rem 1.5rem', position: 'relative', overflow: 'hidden', zIndex: 0 }}>
        <ParticleBackground />
        <div style={{ position: 'absolute', top: 28, left: 18, color: PURPLE, fontSize: '2.2rem', opacity: 0.25, transform: 'rotate(-20deg)', pointerEvents: 'none' }}>→</div>
        <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', top: 50, right: 60, fontSize: '1.8rem', opacity: 0.18, pointerEvents: 'none' }}>📌</motion.span>
        <motion.span animate={{ rotate: [0, 10, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', bottom: 50, left: '50%', fontSize: '1.5rem', opacity: 0.12, pointerEvents: 'none' }}>✏️</motion.span>
        <DoodleStar style={{ bottom: 28, right: 32, color: '#4CAF50', opacity: 0.25, fontSize: '1.4rem' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ color: PURPLE, fontSize: '1.4em', lineHeight: 1 }}>→</span>
              SMART FEATURES. REAL IMPACT.
            </h2>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.25rem' }}>
            {features.map(({ color, icon: Icon, iconColor, title, desc }, idx) => (
              <motion.div key={title} variants={fadeUp} whileHover={{ y: -10, scale: 1.08, rotate: 0 }} style={{ transition: 'transform 0.3s' }}>
                <StickyNote color={color} rotate={idx === 0 ? -2 : idx === 1 ? 1.5 : idx === 2 ? 0 : idx === 3 ? -1.5 : 2} style={{ height: '100%', padding: '1.4rem' }} themed>
                  <div className="sticky-icon-wrap" style={{ width: 46, height: 46, background: 'rgba(0,0,0,0.08)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.875rem' }}>
                    <Icon size={22} color={iconColor} />
                  </div>
                  <h3 style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{title}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted-text)', lineHeight: 1.7, fontWeight: 500 }}>{desc}</p>
                </StickyNote>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── AI SENSEI METRICS ── */}
      <section style={{ background: 'var(--section-alt-bg)', padding: '5rem 1.5rem', position: 'relative', overflow: 'hidden', zIndex: 0 }}>
        <ParticleBackground />
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.4em', color: PURPLE, marginBottom: '0.875rem', textTransform: 'uppercase' }}>GUIDED BY TRUE INTELLIGENCE</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif", marginBottom: '1rem' }}>
              Meet Your Personal <span style={{ color: PURPLE }}>AI Sensei</span>
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--muted-text)', maxWidth: 520, margin: '0 auto', lineHeight: 1.8, fontWeight: 500 }}>
              Not just a chatbot — a dedicated academic mentor available 24/7 for every student.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { value: 2100000, suffix: '+', label: 'AI Sessions',      sub: 'Logged this month',              color: PURPLE },
              { value: 23,      suffix: '%', label: 'Avg Grade Lift',   sub: 'After 30 days of usage',         color: '#2E7D32' },
              { value: 97,      suffix: '%', label: 'Satisfaction Rate',sub: 'Among enrolled students & faculty',color: '#E65100' },
            ].map(({ value, suffix, label, sub, color }, idx) => (
              <motion.div key={label} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.12, duration: 0.55 }}
                style={{ background: 'var(--bg-page)', borderRadius: 18, padding: '2rem', textAlign: 'center', boxShadow: '0 6px 24px var(--brutal-shadow)', border: `1.5px solid ${color}22`, transition: 'transform 0.3s, box-shadow 0.3s' }}
                whileHover={{ y: -6, boxShadow: `0 20px 50px ${color}18` }}>
                <p className="font-cinzel" style={{ fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 900, color, lineHeight: 1, marginBottom: '0.5rem' }}>
                  <AnimatedCounter target={value} suffix={suffix} />
                </p>
                <p style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{label}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="section-contact" style={{ background: 'linear-gradient(135deg,#150D2B 0%,#1E1140 50%,#150D2B 100%)', padding: '5.5rem 1.5rem', position: 'relative', overflow: 'hidden', zIndex: 0 }}>
        <ParticleBackground />
        {/* animated stars */}
        {[{ l:'12%',t:'18px',c:'#FFD700'},{l:'22%',t:'44px',c:'#7B4FE9'},{l:'80%',t:'28px',c:'#FFD700'},{l:'88%',t:'54px',c:'#4CAF50'},{l:'50%',t:'12px',c:'#fff'},{l:'35%',t:'80%',c:'#FFD700'},{l:'65%',t:'85%',c:'#7B4FE9'}].map((s,i) => (
          <motion.span key={i} animate={{ scale:[1,1.4,1], opacity:[0.5,0.9,0.5] }} transition={{ duration:2+i*0.4, repeat:Infinity, ease:'easeInOut', delay:i*0.3 }}
            style={{ position:'absolute', left:s.l, top:s.t, color:s.c, fontSize:'0.85rem', pointerEvents:'none' }}>★</motion.span>
        ))}
        <motion.div animate={{ rotate:[0,5,-3,0] }} transition={{ duration:6, repeat:Infinity, ease:'easeInOut' }}
          style={{ position:'absolute', top:'10%', right:'12%', opacity:0.18, pointerEvents:'none' }}>
          <GraduationCap size={80} color="#fff" strokeWidth={1} />
        </motion.div>
        <div style={{ position:'absolute', top:0, right:'20%', fontSize:'2.5rem', color:'#FFD700', opacity:0.32, transform:'rotate(25deg)', pointerEvents:'none' }}>📎</div>

        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%,200px),1fr))', gap:'2.5rem', alignItems:'center' }}>
            {/* left sticky note */}
            <motion.div className="hidden lg:block" initial={{ opacity:0, x:-30, rotate:-10 }} whileInView={{ opacity:1, x:0, rotate:-6 }} viewport={{ once:true }} transition={{ duration:0.7 }}>
              <StickyNote color={NOTE_YELLOW} rotate={-6}>
                <p style={{ fontWeight:700, fontSize:'0.98rem', color:'var(--text-primary)', lineHeight:1.6 }}>The future<br/>of education<br/>is intelligent.</p>
                <p style={{ marginTop:'0.5rem', fontSize:'1.4rem' }}>😊</p>
              </StickyNote>
            </motion.div>

            {/* center CTA */}
            <motion.div initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.7, delay:0.1 }} style={{ textAlign:'center' }}>
              <h2 style={{ fontSize:'clamp(1.7rem, 4vw, 2.9rem)', fontWeight:900, color:'#fff', lineHeight:1.35, marginBottom:'0.875rem', fontFamily:"'Raleway', sans-serif" }}>
                Ready to <em style={{ color:'#A78BFA', fontStyle:'italic' }}>transform</em> your campus<br/>with the power of <span style={{ color:'#A78BFA' }}>AI</span>?
              </h2>
              <p style={{ color:'rgba(255,255,255,0.52)', fontSize:'0.92rem', marginBottom:'2rem' }}>Join the future of intelligent education.</p>
              <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
                <Link href="/login" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.9rem 1.8rem', background:`linear-gradient(135deg,${PURPLE},${PURPLE_DARK})`, color:'#fff', fontWeight:700, fontSize:'0.9rem', borderRadius:12, textDecoration:'none', boxShadow:'0 6px 24px rgba(123,79,233,0.48)', transition:'all 0.3s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform='translateY(-3px)'; el.style.boxShadow='0 12px 36px rgba(123,79,233,0.65)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform='translateY(0)'; el.style.boxShadow='0 6px 24px rgba(123,79,233,0.48)'; }}>
                  Request Demo <ArrowRight size={16} />
                </Link>
                <Link href="/login" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.9rem 1.75rem', background:'transparent', color:'#fff', fontWeight:700, fontSize:'0.9rem', borderRadius:12, textDecoration:'none', border:'2px solid rgba(255,255,255,0.3)', transition:'all 0.3s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='rgba(255,255,255,0.65)'; el.style.background='rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='rgba(255,255,255,0.3)'; el.style.background='transparent'; }}>
                  Contact Sales <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>

            {/* right torn note */}
            <motion.div className="hidden lg:block" initial={{ opacity:0, x:30, rotate:8 }} whileInView={{ opacity:1, x:0, rotate:5 }} viewport={{ once:true }} transition={{ duration:0.7, delay:0.2 }}>
              <div style={{ background:'var(--bg-page)', borderRadius:8, padding:'1.5rem 1.75rem', transform:'rotate(5deg)', boxShadow:'0 10px 32px var(--brutal-shadow)' }}>
                <p style={{ fontWeight:700, fontSize:'1.05rem', color:'var(--text-primary)', fontStyle:'italic', lineHeight:1.6 }}>Empower today.<br/>Excel tomorrow.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'#0D0820', padding:'3.5rem 1.5rem', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'2.5rem', marginBottom:'2.5rem' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.55rem', marginBottom:'0.875rem' }}>
                <div style={{ width:30, height:30, background:PURPLE, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}><Brain size={15} color="#fff" /></div>
                <span className="font-cinzel" style={{ fontWeight:900, fontSize:'0.95rem', letterSpacing:'0.1em', color:'#fff' }}>SENSEI</span>
              </div>
              <p style={{ fontSize:'0.84rem', color:'rgba(255,255,255,0.45)', lineHeight:1.72, maxWidth:220 }}>AI-powered adaptive learning for the next generation of universities.</p>
            </div>
            {[
              { heading:'PLATFORM',    links:['Features','For Students','For Faculty','AI Sensei'] },
              { heading:'INSTITUTION', links:['Pricing','Case Studies','API Access','Security'] },
              { heading:'COMPANY',     links:['About Us','Blog','Careers','Contact'] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p style={{ fontSize:'0.62rem', fontWeight:800, letterSpacing:'0.3em', color:'rgba(255,255,255,0.38)', marginBottom:'1rem', textTransform:'uppercase' }}>{heading}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                  {links.map(l => (
                    <a key={l} href="#" style={{ fontSize:'0.84rem', color:'rgba(255,255,255,0.45)', textDecoration:'none', transition:'color 0.2s', fontWeight:500 }}
                      onMouseEnter={e => (e.currentTarget.style.color = PURPLE)}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', border: '1px solid var(--brutal-border)', paddingTop:'1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.875rem' }}>
            <p style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em' }}>© 2025 SENSEI ACADEMY. ALL RIGHTS RESERVED.</p>
            <div style={{ display:'flex', gap:'1.5rem' }}>
              {['Privacy Policy','Terms of Service'].map(l => (
                <a key={l} href="#" style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.35)', textDecoration:'none', transition:'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
