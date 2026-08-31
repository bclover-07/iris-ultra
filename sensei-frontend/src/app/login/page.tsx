'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, GraduationCap, Sparkles, Brain, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

const PURPLE = '#7B4FE9';
const NAVY = '#1A1A2E';
const NOTE_YELLOW = '#FFE93A';
const NOTE_GREEN = '#81D4A8';
const NOTE_LAVENDER = '#C9A0FF';
const NOTE_PINK = '#F48FB1';
const NOTE_BLUE = '#81D4FA';

const DEMOS = [
  { label: 'Aarav Sharma (CSE)', email: 'aarav.sharma.cse@sensei.edu', pass: 'student123', dept: 'CSE' },
  { label: 'Priya Patel (IT)', email: 'priya.patel.it@sensei.edu', pass: 'student123', dept: 'IT' },
  { label: 'Rohan Kumar (AI)', email: 'rohan.kumar.ai@sensei.edu', pass: 'student123', dept: 'AI' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      login(data.user, data.accessToken);
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 3000);
      router.push('/student');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      if (!error.response) toast.error('Network Error. Server might be starting — please try again.');
      else toast.error(error.response?.data?.error || 'Login failed');
      setLoading(false);
    }
  };

  const handleDemoSelect = (demo: typeof DEMOS[0]) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    toast.success(`Loaded credentials for ${demo.label}`);
  };

  if (isTransitioning) {
    return (
      <div className="fixed inset-0 bg-[#FAF6EE] dark:bg-slate-950 z-50 flex flex-col items-center justify-center gap-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full"
        />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black font-fredoka uppercase text-[#111] dark:text-white">
            Launching Iris Plus Student Dashboard...
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-mono">
            Calibrating your AI study cockpit & NPU models
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EE] dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-fredoka">
      {/* Top right controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 z-10 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400 border-3 border-[#111] dark:border-white shadow-[4px_4px_0_#111] dark:shadow-[4px_4px_0_#fff] rotate-[-4deg]">
          <GraduationCap size={36} className="text-black" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-[#111] dark:text-white">
          Iris Plus
        </h1>
        <p className="text-gray-600 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">
          Student AI Learning Operating System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl border-4 border-[#111] dark:border-slate-700 shadow-[8px_8px_0_#111] dark:shadow-[8px_8px_0_#1e293b] space-y-6">
          {/* Demo 1-Click Selectors */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles size={14} className="text-yellow-500" /> Quick Student Login:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {DEMOS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDemoSelect(d)}
                  className="w-full text-left px-3 py-2 text-xs font-bold rounded-xl border-2 border-[#111] dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-yellow-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between text-[#111] dark:text-white shadow-[2px_2px_0_#111] dark:shadow-[2px_2px_0_#334155]"
                >
                  <span>{d.label}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
                    {d.dept}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t-2 border-gray-200 dark:border-slate-700"></div>
            <span className="flex-shrink mx-3 text-xs font-bold text-gray-400 uppercase">Or Enter Credentials</span>
            <div className="flex-grow border-t-2 border-gray-200 dark:border-slate-700"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#111] dark:text-slate-300 mb-1">
                Student Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. aarav.sharma.cse@sensei.edu"
                className="w-full px-4 py-3 rounded-xl border-2 border-[#111] dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-[#111] dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-[3px_3px_0_#111] dark:shadow-[3px_3px_0_#334155]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#111] dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#111] dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-[#111] dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-[3px_3px_0_#111] dark:shadow-[3px_3px_0_#334155]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-black dark:hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-lg uppercase tracking-wider border-3 border-[#111] shadow-[4px_4px_0_#111] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Enter Dashboard <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-gray-500 dark:text-slate-400 font-bold">
            New student?{' '}
            <Link href="/register" className="text-purple-600 dark:text-purple-400 underline uppercase">
              Create Student Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
