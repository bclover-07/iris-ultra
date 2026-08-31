'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Gamepad2, Search, Bot } from 'lucide-react';
import StudyPlanTab from '../study-plan/page';
import QuizTab from '../quiz/page';
import DoubtSolverTab from '../doubt-solver/page';
import UltraKeeperTab from '../ultra-keeper/page';

export default function UltraStudyPage() {
  const [activeTab, setActiveTab] = useState<'study-plan' | 'quiz' | 'doubt-solver' | 'ultra-keeper'>('study-plan');

  const tabs = [
    { id: 'study-plan', label: 'Study Plan', icon: BookOpen, color: '#4CAF50' },
    { id: 'quiz', label: 'Camo Quizo', icon: Gamepad2, color: '#FF9800' },
    { id: 'doubt-solver', label: 'Doubt Solver', icon: Search, color: '#2196F3' },
    { id: 'ultra-keeper', label: 'Ultra Keeper', icon: Bot, color: '#9C27B0' },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-slate-800 p-8 rounded-3xl border-4 border-[#111] dark:border-slate-700 shadow-[8px_8px_0_#111] dark:shadow-[8px_8px_0_#1e293b]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-slate-700 flex items-center justify-center border-2 border-brutal-border dark:border-slate-600 rotate-[-3deg]">
              <span className="text-2xl">🧠</span>
            </div>
            <h1 className="font-fredoka text-4xl md:text-5xl font-black uppercase tracking-tight text-[#111] dark:text-white">
              Ultra Study
            </h1>
          </div>
          <p className="font-fredoka text-gray-500 dark:text-slate-400 font-bold tracking-wide uppercase text-sm ml-1">
            Your Ultimate AI Learning Arsenal!
          </p>
        </div>

        {}
        <div className="flex p-1.5 bg-gray-100 dark:bg-slate-900 rounded-2xl border-2 border-brutal-border dark:border-slate-700 max-w-full overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 font-fredoka font-bold uppercase text-sm whitespace-nowrap ${isActive ? 'text-white' : 'text-[#111] dark:text-slate-300'}`}
                style={{
                  textShadow: isActive ? '1px 1px 0px rgba(0,0,0,0.5)' : 'none'
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="ultra-study-tab-indicator"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: tab.color, border: '2px solid var(--s-border, black)' }}
                    transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon size={18} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {}
      <div className="relative min-h-[60vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {activeTab === 'study-plan' && <StudyPlanTab />}
            {activeTab === 'quiz' && <QuizTab />}
            {activeTab === 'doubt-solver' && <DoubtSolverTab />}
            {activeTab === 'ultra-keeper' && <UltraKeeperTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
