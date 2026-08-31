'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/axios';
import { ArrowLeft } from 'lucide-react';

const COMPANIES = [
  { name: 'Google', style: 'Algorithmic', difficulty: 5, color: '#4285F4', icon: 'G' },
  { name: 'Microsoft', style: 'System Design', difficulty: 4, color: '#00A4EF', icon: 'M' },
  { name: 'Amazon', style: 'STAR Method', difficulty: 5, color: '#FF9900', icon: 'A' },
  { name: 'Meta', style: 'System Design', difficulty: 5, color: '#1877F2', icon: 'M' },
  { name: 'Apple', style: 'Behavioral', difficulty: 4, color: '#555555', icon: '' },
  { name: 'TCS', style: 'Comprehensive', difficulty: 3, color: '#0072C6', icon: 'T' },
  { name: 'Infosys', style: 'Technical', difficulty: 3, color: '#007CC3', icon: 'I' },
  { name: 'Wipro', style: 'HR + Technical', difficulty: 3, color: '#44166B', icon: 'W' },
  { name: 'Flipkart', style: 'DSA + Design', difficulty: 4, color: '#F8D210', icon: 'F' },
  { name: 'Zomato', style: 'Product Sense', difficulty: 4, color: '#E23744', icon: 'Z' },
  { name: 'CRED', style: 'System Design', difficulty: 4, color: '#2D2D2D', icon: 'C' },
  { name: 'Razorpay', style: 'Full Stack', difficulty: 4, color: '#3395FF', icon: 'R' },
  { name: 'Deloitte', style: 'Case Study', difficulty: 3, color: '#86BC25', icon: 'D' },
  { name: 'Accenture', style: 'Behavioral', difficulty: 3, color: '#A100FF', icon: 'A' },
  { name: 'IBM', style: 'Technical', difficulty: 3, color: '#054ADA', icon: 'I' },
  { name: 'Startup', style: 'Full Stack', difficulty: 3, color: '#FF6B35', icon: '🚀' },
];

export default function InterviewHubPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ totalSessions: 0, avgScores: { overall: 0 }, bestCompany: 'None', totalXPFromInterviews: 0, improvementTrend: [] });
  const [sessions, setSessions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/interview/stats/me').then(r => setStats(r.data)).catch(() => {});
    api.get('/api/interview/sessions/me').then(r => setSessions(r.data)).catch(() => {});
    api.get('/api/interview/leaderboard').then(r => setLeaderboard(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      {}
      <Link href="/student/virtual-beyond">
        <motion.button whileHover={{ x: -3 }} className="flex items-center gap-2 text-sm font-fredoka font-bold px-4 py-2 bg-white dark:bg-slate-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-2 border-black dark:border-slate-700 shadow-[3px_3px_0_#000] dark:shadow-[3px_3px_0_#1e293b] text-black dark:text-white">
          <ArrowLeft size={16} /> Back to Virtual Beyond
        </motion.button>
      </Link>

      {}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 md:p-10"
        style={{
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 40%, #3949ab 100%)',
          border: '4px solid var(--comic-black, #000)', boxShadow: '8px 8px 0 var(--comic-black, #000)'
        }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10">
          <h1 className="font-fredoka text-3xl md:text-5xl font-bold text-white mb-2">🎙️ Virtual Interview Hub</h1>
          <p className="text-blue-200 text-sm md:text-lg max-w-2xl">Practice with an AI interviewer. Get real-time feedback on confidence, body language & technical skills. Land your dream job.</p>
          <Link href="/student/interview/setup">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="mt-6 px-8 py-3 bg-yellow-400 text-brutal-text font-fredoka font-bold text-lg rounded-2xl"
              style={{ border: '3px solid #000', boxShadow: '4px 4px 0 #000' }}
            >
              🚀 Start Interview
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        {[
          { label: 'Sessions', value: stats.totalSessions, emoji: '📋' },
          { label: 'Avg Score', value: `${Math.round((stats.avgScores?.overall || 0) * 100)}%`, emoji: '📊' },
          { label: 'Best Company', value: stats.bestCompany || 'N/A', emoji: '🏢' },
          { label: 'XP Earned', value: stats.totalXPFromInterviews || 0, emoji: '⭐' },
          { label: 'Streak', value: `${stats.totalSessions > 0 ? '🔥' : '0'}`, emoji: '🔥' },
        ].map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 text-center border-[3px] border-black dark:border-slate-700 shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#1e293b]"
          >
            <div className="text-2xl mb-1">{s.emoji}</div>
            <div className="font-fredoka font-bold text-xl md:text-2xl dark:text-white">{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 font-fredoka">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {}
      <div>
        <h2 className="font-fredoka text-2xl font-bold mb-4 text-black dark:text-white">🏢 Choose a Company</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {COMPANIES.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
              onClick={() => router.push(`/student/interview/setup?company=${encodeURIComponent(c.name)}`)}
              className="cursor-pointer bg-white dark:bg-slate-800 rounded-2xl p-4 hover:-translate-y-1 transition-all duration-200 group border-[3px] border-black dark:border-slate-700 shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#1e293b]"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-2 group-hover:scale-110 transition-transform"
                style={{ background: c.color }}
              >
                {c.icon}
              </div>
              <h3 className="font-fredoka font-bold text-sm md:text-base dark:text-white">{c.name}</h3>
              <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded-lg text-[10px] font-bold text-gray-600 dark:text-slate-300">{c.style}</span>
              <div className="mt-1 text-yellow-500 text-xs">{'★'.repeat(c.difficulty)}{'☆'.repeat(5 - c.difficulty)}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {}
      {sessions.length > 0 && (
        <div>
          <h2 className="font-fredoka text-2xl font-bold mb-4 text-black dark:text-white">📜 Recent Sessions</h2>
          <div className="space-y-3">
            {sessions.slice(0, 5).map((s, i) => {
              const score = Math.round((s.finalScores?.overall || 0) * 100);
              const color = score >= 70 ? '#4caf50' : score >= 40 ? '#ff9800' : '#f44336';
              return (
                <motion.div key={s._id || i}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 border-[3px] border-black dark:border-slate-700 shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#1e293b]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                      style={{ background: COMPANIES.find(c => c.name === s.company)?.color || '#666' }}>
                      {s.company?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-fredoka font-bold text-sm truncate dark:text-white">{s.jobRole} — {s.company}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{s.mode} · {new Date(s.startedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center">
                      <div className="font-fredoka font-bold text-lg" style={{ color }}>{score}%</div>
                      <div className="text-[10px] text-gray-400">{s.status}</div>
                    </div>
                    {s.reportId && (
                      <Link href={`/student/interview/report/${s.reportId}`}>
                        <button className="px-3 py-1.5 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors"
                          style={{ border: '2px solid #000' }}>
                          View
                        </button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {}
      {leaderboard.length > 0 && (
        <div>
          <h2 className="font-fredoka text-2xl font-bold mb-4 text-black dark:text-white">🏆 Interview Leaderboard</h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border-[3px] border-black dark:border-slate-700 shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#1e293b]">
            {leaderboard.slice(0, 5).map((entry, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b-2 border-gray-100 dark:border-slate-700 last:border-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-fredoka font-bold text-white text-sm"
                  style={{ background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#999' }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-fredoka font-bold text-sm truncate dark:text-white">{entry.name || 'Student'}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-400">{entry.sessions} sessions · {entry.bestCompany}</p>
                </div>
                <div className="font-fredoka font-bold text-lg text-indigo-900 dark:text-indigo-300">
                  {Math.round((entry.avgScore || 0) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
