'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, GraduationCap, User, ArrowRight, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import dynamic from 'next/dynamic';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

const RegisterCanvas = dynamic(() => import('@/components/register/RegisterCanvas'), { ssr: false });

const DEPARTMENTS = ['CSE', 'IT', 'BTECH', 'AI'];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        name,
        email,
        password,
        role: 'student',
        department,
        semester: 1
      });
      toast.success('Student account created successfully! Please log in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] dark:bg-[#050508] flex items-center justify-center px-4 relative overflow-hidden font-fredoka py-12">
      {/* Top controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <RegisterCanvas />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border-4 border-[#111] dark:border-slate-700 shadow-[8px_8px_0_#111] dark:shadow-[8px_8px_0_#1e293b] p-8 relative z-10 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center mx-auto border-2 border-[#111] dark:border-purple-800 rotate-[-4deg]">
            <GraduationCap size={32} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-3xl font-black uppercase text-[#111] dark:text-white">
            Create Student Account
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            Join the Iris Plus AI Learning Ecosystem
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#111] dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className="w-full px-4 py-3 rounded-xl border-2 border-[#111] dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-[#111] dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#111] dark:text-slate-300 mb-1">
              Student Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              className="w-full px-4 py-3 rounded-xl border-2 border-[#111] dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-[#111] dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#111] dark:text-slate-300 mb-1">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#111] dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-[#111] dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d} Engineering
                </option>
              ))}
            </select>
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
                className="w-full px-4 py-3 rounded-xl border-2 border-[#111] dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-[#111] dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                Register Student <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 dark:text-slate-400 font-bold">
          Already registered?{' '}
          <Link href="/login" className="text-purple-600 dark:text-purple-400 underline uppercase">
            Log in here
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
