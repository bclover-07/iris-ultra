'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Swords, Brain, Award, ShieldAlert, ArrowRight, Target, BookOpen, ArrowLeft } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';

const AI_PERSONALITIES = [
  { id: 'aggressive_politician', name: 'Aggressive Politician', diff: 5, tag: 'Interrupts constantly', icon: '🎤' },
  { id: 'calm_professor', name: 'Calm Professor', diff: 3, tag: 'Pure logic, no emotion', icon: '📚' },
  { id: 'troll_debater', name: 'Troll Debater', diff: 4, tag: 'Emotional bait, mockery', icon: '😈' },
  { id: 'fast_thinker', name: 'Fast Thinker', diff: 5, tag: 'Rapid-fire questions', icon: '⚡' },
  { id: 'passive_opponent', name: 'Passive Opponent', diff: 2, tag: 'Short vague answers', icon: '😶' },
  { id: 'news_anchor', name: 'News Anchor', diff: 4, tag: 'Structured journalism', icon: '📺' },
  { id: 'startup_investor', name: 'Startup Investor', diff: 4, tag: 'Challenges ROI/evidence', icon: '💰' },
  { id: 'toxic_opponent', name: 'Toxic Opponent', diff: 5, tag: 'Maximum pressure & attacks', icon: '☠️' }
];

const SUGGESTED_TOPICS = [
  "AI will eventually replace most human jobs",
  "Social media platforms should be held liable for user content",
  "Remote work is better for society than office work",
  "Universal Basic Income is necessary for the future",
  "Space exploration is a waste of resources",
  "Coding should be a mandatory school subject",
  "Veganism should be legally mandated to save the planet",
  "Grades do not accurately measure student intelligence"
];

export default function DebateHub() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/debate')
      .then(res => setSessions(res.data.sessions || []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {}
      <Link href="/student/virtual-beyond">
        <motion.button whileHover={{ x: -3 }} className="flex items-center gap-2 text-sm font-fredoka font-bold px-4 py-2 bg-white dark:bg-slate-800 text-[#111] dark:text-slate-200 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-2 border-[#111] dark:border-slate-700 shadow-[3px_3px_0_#111] dark:shadow-[3px_3px_0_#1e293b]">
          <ArrowLeft size={16} /> Back to Virtual Beyond
        </motion.button>
      </Link>

      {}
      <div className="relative bg-white dark:bg-slate-800 p-8 rounded-3xl overflow-hidden border-4 border-[#111] dark:border-slate-700 shadow-[8px_8px_0_#111] dark:shadow-[8px_8px_0_#1e293b]">
        <div className="absolute top-2 left-4">
          <span className="bg-red-500 dark:bg-slate-700 text-white text-[10px] font-fredoka font-black uppercase px-3 py-1 rounded-lg rotate-[-2deg] inline-block border-2 border-[#111] dark:border-slate-600">NEW!</span>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <span className="text-4xl">⚔️</span>
          <div>
            <h2 className="font-fredoka text-3xl md:text-4xl font-black uppercase tracking-tight text-[#111] dark:text-white">
              Virtual Debate Arena
            </h2>
            <p className="font-fredoka text-gray-500 font-bold tracking-wide uppercase text-xs">
              Challenge AI opponents. Master the art of argument.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Link href="/student/debate/setup">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="font-fredoka font-bold text-sm uppercase px-8 py-3 rounded-2xl flex items-center gap-3 transition-all bg-[var(--comic-yellow)] dark:bg-slate-700 text-[var(--comic-black)] dark:text-white border-4 border-[var(--comic-black)] dark:border-slate-600 shadow-[4px_4px_0_var(--comic-black)] dark:shadow-[4px_4px_0_#1e293b]"
            >
              <Swords size={18} /> Enter the Arena
            </motion.button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {}
        <div className="lg:col-span-2 space-y-6">

          {}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-4 border-[var(--comic-black)] dark:border-slate-700 shadow-[8px_8px_0_var(--comic-black)] dark:shadow-[8px_8px_0_#1e293b]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center border-2 border-brutal-border rotate-[2deg]">
                <Brain size={20} className="text-purple-600" />
              </div>
              <h3 className="font-fredoka text-xl font-black uppercase text-[var(--comic-black)] dark:text-white">Choose Your Opponent</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AI_PERSONALITIES.map(ai => (
                <Link key={ai.id} href={'/student/debate/setup?ai=' + ai.id}>
                  <div className="bg-white dark:bg-slate-700 rounded-2xl p-4 border-2 border-gray-200 dark:border-slate-600 hover:border-brutal-border hover:dark:border-slate-500 hover:shadow-[4px_4px_0_var(--comic-black)] hover:dark:shadow-[4px_4px_0_#1e293b] transition-all cursor-pointer flex flex-col items-center text-center h-full group hover:-translate-y-1">
                    <div className="text-3xl mb-2">{ai.icon}</div>
                    <h4 className="font-fredoka font-bold text-xs uppercase leading-tight mb-1 text-[var(--comic-black)] dark:text-white">{ai.name}</h4>
                    <p className="text-[10px] text-gray-400 font-medium mb-2">{ai.tag}</p>
                    <div className="mt-auto flex text-yellow-500 text-[10px]">
                      {Array(5).fill(0).map((_, i) => <span key={i}>{i < ai.diff ? '★' : '☆'}</span>)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-4 border-[var(--comic-black)] dark:border-slate-700 shadow-[8px_8px_0_var(--comic-black)] dark:shadow-[8px_8px_0_#1e293b]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center border-2 border-brutal-border rotate-[-2deg]">
                <Target size={20} className="text-rose-500" />
              </div>
              <h3 className="font-fredoka text-xl font-black uppercase text-[var(--comic-black)] dark:text-white">Hot Debate Topics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SUGGESTED_TOPICS.map((topic, i) => (
                <Link key={i} href={'/student/debate/setup?topic=' + encodeURIComponent(topic)}>
                  <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-brutal-border hover:dark:border-slate-500 hover:shadow-[3px_3px_0_var(--comic-black)] hover:dark:shadow-[3px_3px_0_#1e293b] transition-all text-xs font-fredoka font-bold text-gray-600 dark:text-slate-200 flex items-center gap-3 cursor-pointer group hover:-translate-y-0.5 uppercase">
                    <div className="bg-white dark:bg-slate-600 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 border-gray-200 dark:border-slate-500 group-hover:border-brutal-border group-hover:dark:border-slate-400 group-hover:bg-yellow-400 group-hover:dark:bg-slate-500 transition-all">
                      <ArrowRight size={12} />
                    </div>
                    <span className="normal-case">{topic}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {}
        <div className="space-y-6">

          {}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-4 border-[var(--comic-black)] dark:border-slate-700 shadow-[8px_8px_0_var(--comic-black)] dark:shadow-[8px_8px_0_#1e293b]">
            <h3 className="font-fredoka text-lg font-black uppercase mb-4 flex items-center gap-2 text-[var(--comic-black)] dark:text-white">
              <Award className="text-yellow-500" size={20} /> My Stats
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-2xl text-center border-2 border-gray-100 dark:border-slate-600">
                <p className="text-2xl font-fredoka font-black text-indigo-600 dark:text-indigo-400">{sessions.filter(s => s.status === 'completed').length}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">Completed</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-2xl text-center border-2 border-gray-100 dark:border-slate-600">
                <p className="text-lg font-fredoka font-black text-rose-500 dark:text-rose-400">{user?.debateRank || 'Unranked'}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">Rank</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-2xl text-center col-span-2 border-2 border-gray-100 dark:border-slate-600">
                <p className="text-xl font-fredoka font-black text-emerald-600 dark:text-emerald-400">{user?.xp || 0} XP</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">Experience</p>
              </div>
            </div>
          </div>

          {}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-4 border-[var(--comic-black)] dark:border-slate-700 shadow-[8px_8px_0_var(--comic-black)] dark:shadow-[8px_8px_0_#1e293b]">
            <h3 className="font-fredoka text-lg font-black uppercase mb-4 flex items-center gap-2 text-[var(--comic-black)] dark:text-white">
              <BookOpen className="text-teal-500" size={20} /> Recent Battles
            </h3>
            <div className="space-y-2">
              {sessions.slice(0, 5).map(session => (
                <div key={session._id} className="p-3 bg-gray-50 dark:bg-slate-700 rounded-xl flex items-center justify-between border-2 border-gray-100 dark:border-slate-600">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-fredoka font-bold text-gray-800 dark:text-white truncate">{session.topic}</p>
                    <p className="text-[10px] text-gray-400 truncate">vs {session.aiPersonality?.replace('_', ' ')}</p>
                  </div>
                  {session.status === 'completed' && session.reportId ? (
                    <Link href={'/student/debate/report/' + session.reportId._id}>
                      <button className="ml-2 px-3 py-1 bg-yellow-400 dark:bg-slate-600 text-[10px] font-fredoka font-black uppercase rounded-lg border-2 border-brutal-border dark:border-slate-500 hover:shadow-[2px_2px_0_var(--comic-black)] hover:dark:shadow-[2px_2px_0_#1e293b] text-[var(--comic-black)] dark:text-white transition-all">View</button>
                    </Link>
                  ) : (
                    <span className="ml-2 text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-md border border-rose-200 dark:border-rose-800/50">{session.status}</span>
                  )}
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="text-center p-6 text-gray-300">
                  <ShieldAlert size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-fredoka font-bold">No battles yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
