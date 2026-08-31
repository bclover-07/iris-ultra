'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, Hand, History, Sparkles } from 'lucide-react';

export default function QuizHubPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--s-text)' }}>
        🎯 Quiz Arena
      </h1>
      <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--s-muted)' }}>
        Test your knowledge with AI-generated adaptive quizzes
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/student/quiz/standard">
          <motion.div
            whileHover={{ scale: 1.02, rotate: -0.5 }}
            whileTap={{ scale: 0.98 }}
            className="p-6 rounded-2xl border-3 cursor-pointer relative overflow-hidden group"
            style={{ background: 'var(--s-card)', borderColor: 'var(--s-border)', border: '3px solid var(--s-border)' }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500" />
            <Brain size={40} className="mb-4" style={{ color: '#FFD93D' }} />
            <h3 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--s-text)' }}>
              Standard Quiz
            </h3>
            <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--s-muted)' }}>
              Classic MCQ format with adaptive difficulty. AI generates questions based on your weak areas.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs" style={{ fontFamily: 'var(--font-mono)' }}>10 Questions</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs" style={{ fontFamily: 'var(--font-mono)' }}>Adaptive</span>
            </div>
          </motion.div>
        </Link>

        <Link href="/student/quiz/camo">
          <motion.div
            whileHover={{ scale: 1.02, rotate: 0.5 }}
            whileTap={{ scale: 0.98 }}
            className="p-6 rounded-2xl border-3 cursor-pointer relative overflow-hidden group"
            style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '3px solid var(--s-border)' }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500" />
            <Hand size={40} className="mb-4 text-purple-400" />
            <h3 className="text-2xl mb-2 text-purple-300" style={{ fontFamily: 'var(--font-display)' }}>
              🤚 CAMO Quiz
            </h3>
            <p className="text-sm text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>
              Answer with hand gestures using MediaPipe. 3D floating bubbles in Three.js arena.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs" style={{ fontFamily: 'var(--font-mono)' }}>Gesture</span>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs" style={{ fontFamily: 'var(--font-mono)' }}>3D Arena</span>
            </div>
          </motion.div>
        </Link>
      </div>

      <Link href="/student/quiz/history" className="flex items-center gap-2 text-sm hover:underline" style={{ fontFamily: 'var(--font-mono)', color: 'var(--s-muted)' }}>
        <History size={14} /> View Quiz History →
      </Link>
    </div>
  );
}
