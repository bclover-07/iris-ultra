'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Brain, Sparkles, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import type { QuizQuestion, QuizResult } from '@/types';

export default function StandardQuizPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'results'>('setup');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizId, setQuizId] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; selectedOption: string }[]>([]);
  const [results, setResults] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [startTime] = useState(Date.now());

  const generateQuiz = async () => {
    if (!topic.trim()) return toast.error('Enter a topic');
    setLoading(true);
    try {
      const { data } = await api.post('/api/quiz/generate', { mode: 'topic', topic, difficulty });
      setQuestions(data.questions);
      setQuizId(data.quizId);
      setPhase('playing');
    } catch (err) {
      toast.error('Failed to generate quiz. Check API key.');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (option: string) => {
    const answer = { questionId: questions[currentQ].id, selectedOption: option };
    setAnswers([...answers, answer]);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      submitQuiz([...answers, answer]);
    }
  };

  const submitQuiz = async (finalAnswers: typeof answers) => {
    setLoading(true);
    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const { data } = await api.post('/api/quiz/submit', { quizId, answers: finalAnswers, timeTaken });
      setResults(data);
      setPhase('results');
      if (data.percentage >= 80) toast.success('🎉 Great score!');
    } catch (err) {
      toast.error('Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  if (phase === 'setup') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-3xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--s-text)' }}>
          🧠 Standard Quiz
        </h1>

        <div className="p-6 rounded-2xl border-2" style={{ background: 'var(--s-card)', borderColor: 'var(--s-border)' }}>
          <label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--s-muted)' }}>
            Topic
          </label>
          <input
            id="quiz-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Data Structures, Thermodynamics, Linear Algebra..."
            className="notebook-input w-full mb-4"
          />

          <label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--s-muted)' }}>
            Difficulty
          </label>
          <div className="flex gap-3 mb-6">
            {['beginner', 'intermediate', 'advanced'].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-4 py-2 rounded-xl border-2 text-sm capitalize transition-all ${
                  difficulty === d ? 'bg-yellow-400/20 border-yellow-500 font-bold' : 'border-gray-300 hover:border-yellow-300'
                }`}
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {d === 'beginner' ? '🟢' : d === 'intermediate' ? '🟡' : '🔴'} {d}
              </button>
            ))}
          </div>

          <button
            id="generate-quiz"
            onClick={generateQuiz}
            disabled={loading}
            className="comic-btn w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-brutal-text font-bold rounded-xl flex items-center justify-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {loading ? (
              <div className="flex gap-1">
                <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
              </div>
            ) : (
              <><Sparkles size={18} /> Generate Quiz</>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'playing' && questions.length > 0) {
    const q = questions[currentQ];
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ fontFamily: 'var(--font-mono)', color: 'var(--s-muted)' }}>
            Question {currentQ + 1} of {questions.length}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs" style={{
            background: q.difficulty === 'easy' ? '#E8F5E9' : q.difficulty === 'hard' ? '#FFEBEE' : '#FFF3E0',
            fontFamily: 'var(--font-mono)'
          }}>
            {q.difficulty}
          </span>
        </div>

        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
          />
        </div>

        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 rounded-2xl border-2"
          style={{ background: 'var(--s-card)', borderColor: 'var(--s-border)' }}
        >
          <h2 className="text-lg mb-6" style={{ fontFamily: 'var(--font-body)', color: 'var(--s-text)' }}>
            {q.question}
          </h2>

          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectAnswer(opt)}
                className="w-full text-left p-4 rounded-xl border-2 hover:border-yellow-400 hover:bg-yellow-50 transition-all flex items-center gap-3"
                style={{ borderColor: '#e0d4b8', fontFamily: 'var(--font-body)' }}
              >
                <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'results' && results) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-2xl border-2 text-center"
          style={{ background: 'var(--s-card)', borderColor: 'var(--s-border)' }}
        >
          <div className="text-6xl mb-4">
            {results.percentage >= 80 ? '🏆' : results.percentage >= 60 ? '👍' : '📚'}
          </div>
          <h2 className="text-4xl mb-2" style={{ fontFamily: 'var(--font-display)', color: results.percentage >= 80 ? '#4CAF50' : results.percentage >= 60 ? '#FFC107' : '#F44336' }}>
            {results.percentage}%
          </h2>
          <p className="text-lg mb-1" style={{ fontFamily: 'var(--font-body)', color: 'var(--s-text)' }}>
            {results.score}/{questions.length} Correct
          </p>
          <p className="text-sm mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--s-muted)' }}>
            Time: {Math.floor(results.timeTaken / 60)}m {results.timeTaken % 60}s • +{results.xpEarned} XP
          </p>

          {results.badgesEarned.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-xl">
              <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>🏅 Badges Earned!</p>
              {results.badgesEarned.map((b, i) => (
                <span key={i} className="inline-block px-2 py-0.5 bg-yellow-200 rounded-full text-xs mr-1 mt-1">{b}</span>
              ))}
            </div>
          )}

          {results.weakAreas.length > 0 && (
            <div className="text-left p-4 bg-red-50 rounded-xl mb-4">
              <p className="text-sm font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>📌 Review These Topics:</p>
              {results.weakAreas.map((w, i) => (
                <span key={i} className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs mr-1 mt-1">{w}</span>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => { setPhase('setup'); setCurrentQ(0); setAnswers([]); }}
              className="comic-btn px-6 py-2 bg-yellow-400 text-brutal-text rounded-xl font-bold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/student/quiz')}
              className="px-6 py-2 border-2 rounded-xl"
              style={{ borderColor: 'var(--s-border)', fontFamily: 'var(--font-display)' }}
            >
              Back to Hub
            </button>
          </div>
        </motion.div>

        {}
        <div className="space-y-3">
          {results.results.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-xl border-2 ${r.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 size={18} className={r.correct ? 'text-green-500 mt-0.5' : 'text-red-500 mt-0.5'} />
                <div>
                  <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-body)' }}>Q{i + 1}</p>
                  <p className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-body)', color: 'var(--s-muted)' }}>
                    Your answer: {r.yourAnswer} {!r.correct && `• Correct: ${r.correctAnswer}`}
                  </p>
                  {r.explanation && (
                    <p className="text-xs mt-1 italic" style={{ fontFamily: 'var(--font-body)', color: '#666' }}>
                      💡 {r.explanation}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
