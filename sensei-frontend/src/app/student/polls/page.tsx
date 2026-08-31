'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Clock, Users, CheckCircle2, AlertCircle, RefreshCw, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useSocket } from '@/hooks/useSocket';
import { Poll } from '@/types';
import { useAuthStore } from '@/stores/authStore';

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const end = new Date(expiresAt).getTime();
    const tick = () => {
      const now = new Date().getTime();
      const left = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(left);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeLeft <= 0) return <span className="text-red-500 font-bold">Ended</span>;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  return <span className="text-amber-500 font-bold font-mono bg-amber-100 px-2 py-1 rounded">{mins}:{secs.toString().padStart(2, '0')}</span>;
}

export default function StudentPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [archivedPolls, setArchivedPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { on, emit, connected } = useSocket('/student');

  const fetchActivePolls = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/poll/student/active');
      setPolls(data);
      
      data.forEach((p: Poll) => {
        emit('join:class', p.classId);
      });
    } catch (err) {
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  }, [emit]);

  useEffect(() => {
    fetchActivePolls();
    fetchArchivedPolls();
  }, [fetchActivePolls]);

  useEffect(() => {
    if (!connected) return;

    const cleanupNew = on('poll:new', () => {
      fetchActivePolls();
      toast.success('New Live Poll!', { icon: '📊' });
    });

    const cleanupClosed = on('poll:closed', ({ pollId }: any) => {
      setPolls(prev => prev.filter(p => p._id !== pollId));
      fetchArchivedPolls();
      toast('A poll was closed.', { icon: 'ℹ️' });
    });

    const cleanupResults = on('poll:update_results', ({ pollId, results }: any) => {
      setPolls(prev => prev.map(p => {
        if (p._id === pollId) {
          return { ...p, results };
        }
        return p;
      }));
    });

    return () => {
      cleanupNew();
      cleanupClosed();
      cleanupResults();
    };
  }, [connected, on, emit, fetchActivePolls]);

  const fetchArchivedPolls = async () => {
    try {
      const { data } = await api.get('/api/poll/student/archived');
      setArchivedPolls(data);
    } catch (err) {}
  };

  const submitVote = async (pollId: string, option: string) => {
    setSubmitting(pollId);
    try {
      await api.post(`/api/poll/${pollId}/respond`, { option });
      toast.success('Vote recorded! Thanks for participating! 🎉');
      
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFE066', '#FF5C5C', '#24B694', '#4DA8DA']
      });
      

      fetchActivePolls();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit vote');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="pencil-loader w-48 mx-auto" />
      <p className="font-fredoka text-xl font-bold text-[var(--comic-black)]">Scanning the classroom for polls...</p>
    </div>
  );

  return (
    <div className="space-y-10 doodle-bg p-4 rounded-[40px] min-h-[80vh] bg-[var(--s-page-bg)]">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-8 mb-12">
        <div className="comic-panel p-8 bg-[var(--s-card)] border-[var(--s-border)] rotate-[-1.5deg] relative">
          <div className="absolute -top-4 -left-4 pow-burst scale-75 rotate-[-15deg] bg-red-500 dark:bg-slate-700 dark:border-slate-600 text-white border-white">
            LIVE!
          </div>
          <h1 className="font-fredoka text-5xl md:text-6xl font-bold text-[var(--comic-black)] dark:text-white uppercase tracking-tighter">
            CLASSROOM POLLS <span className="inline-block animate-bounce">📊</span>
          </h1>
          <p className="font-fredoka text-gray-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-sm mt-2">
            Your opinion matters in real-time!
          </p>
        </div>

        <button 
          onClick={fetchActivePolls}
          className="vibrant-btn flex items-center gap-3 px-8 py-4 text-xl"
        >
          <RefreshCw size={24} className={loading ? 'animate-spin' : ''} /> REFRESH
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {polls.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {polls.map((poll, i) => {
              const hasVoted = poll.responses.some(r => r.studentId === user?._id);
              const myResponse = poll.responses.find(r => r.studentId === user?._id);
              const maxCount = Math.max(...(poll.results?.map(r => r.count) || [1]), 1);

              return (
                <motion.div
                  key={poll._id}
                  initial={{ opacity: 0, y: 30, rotate: i % 2 === 0 ? -1 : 1 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 100, delay: i * 0.1 }}
                  className="comic-card bg-[var(--s-card)] border-[var(--s-border)] p-8 md:p-10 flex flex-col relative group"
                >
                  <div className="halftone-dots absolute inset-0 opacity-[0.15] pointer-events-none" />
                  
                  <div className="relative z-10 flex-1 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="pow-burst text-xs px-4 py-2 bg-yellow-400 dark:bg-[var(--s-card)] dark:text-white dark:border-[var(--s-border)] rotate-[-5deg] scale-90 text-black">
                        POLL #{poll.code || poll._id.slice(-4).toUpperCase()}
                      </div>
                      <div className="font-fredoka font-bold text-sm text-gray-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        {poll.expiresAt ? <CountdownTimer expiresAt={poll.expiresAt} /> : <><Clock size={16} /> {new Date(poll.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>}
                      </div>
                    </div>

                    <h3 className="font-fredoka text-3xl md:text-4xl font-bold text-[var(--comic-black)] dark:text-white leading-[1.1] uppercase tracking-tight">
                      {poll.question}
                    </h3>

                    {!hasVoted ? (
                      <div className="grid grid-cols-1 gap-4">
                        {poll.options.map((option) => (
                          <button
                            key={option}
                            disabled={submitting === poll._id}
                            onClick={() => submitVote(poll._id, option)}
                            className="comic-btn group relative p-6 rounded-2xl text-2xl text-left flex items-center justify-between bg-white dark:bg-[var(--s-card)] hover:bg-yellow-100 hover:dark:bg-slate-800/80 dark:text-white dark:border-[var(--s-border)]"
                          >
                            <span className="font-fredoka font-black">{option}</span>
                            <Send size={20} className="opacity-0 group-hover:opacity-100 transition-opacity text-yellow-600 dark:text-yellow-400" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="font-fredoka font-bold text-lg text-green-600 dark:text-green-400 flex items-center gap-2 mb-4">
                          <CheckCircle2 size={24} /> You voted: <span className="underline decoration-4 underline-offset-4">{myResponse?.option}</span>
                        </p>
                        {/* Results breakdown when user already voted */}
                        <div className="space-y-4 bg-gray-50 dark:bg-[var(--s-page-bg)] p-6 rounded-3xl brutalist-border border-[var(--s-border)]">
                          {poll.options.map((option) => {
                            const result = poll.results?.find(r => r.option === option);
                            const count = result?.count || 0;
                            const percentage = result?.percentage || 0;
                            const isMyChoice = myResponse?.option === option;

                            return (
                              <div key={option} className="space-y-1">
                                <div className="flex justify-between font-fredoka font-bold text-sm uppercase">
                                  <span>{option} {isMyChoice && '⭐'}</span>
                                  <span>{count} votes ({percentage}%)</span>
                                </div>
                                <div className="h-6 w-full bg-white dark:bg-slate-950 brutalist-border dark:border-slate-800 rounded-full overflow-hidden flex">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    className={`h-full ${isMyChoice ? 'bg-yellow-400 dark:bg-slate-500' : 'bg-blue-400 dark:bg-slate-700'} border-r-2 border-brutal-border dark:border-slate-800 relative`}
                                  >
                                    <div className="halftone-dots absolute inset-0 opacity-20" />
                                  </motion.div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 mt-10 pt-8 border-t-4 border-dashed border-gray-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(n => (
                          <div key={n} className="w-8 h-8 rounded-full border-2 border-brutal-border dark:border-slate-700 bg-gray-100 dark:bg-slate-900 flex items-center justify-center text-[10px] font-bold">
                            👤
                          </div>
                        ))}
                      </div>
                      <span className="font-fredoka font-bold text-gray-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                        {poll.responses.length} Responded
                      </span>
                    </div>
                    
                    {hasVoted && (
                      <motion.div 
                        initial={{ x: 20, opacity: 0 }} 
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-green-500 text-white px-4 py-2 brutalist-border rounded-xl rotate-2 font-fredoka font-bold text-xs uppercase dark:border-green-700"
                      >
                        Live Feedback 📡
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="comic-panel bg-white dark:bg-slate-800 dark:border-slate-700 p-20 text-center space-y-8 rounded-[40px] rotate-[0.5deg]"
          >
            <div className="w-40 h-40 bg-yellow-100 dark:bg-yellow-950/40 brutalist-border dark:border-slate-700 rounded-full flex items-center justify-center mx-auto mb-10 relative">
              <div className="absolute inset-0 halftone-dots opacity-20 rounded-full" />
              <AlertCircle size={80} className="text-yellow-500 animate-pulse" />
            </div>
            <h3 className="font-fredoka text-5xl font-bold text-[var(--comic-black)] dark:text-white uppercase tracking-tighter">Silence in the Studio...</h3>
            <p className="font-fredoka text-2xl text-gray-500 dark:text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
              No live polls active right now. Your teachers might be plotting their next big question. Stay tuned! ⚡
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      {archivedPolls.length > 0 && (
        <div className="mt-20 space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-1 flex-1 bg-gray-200 dark:bg-slate-700 brutalist-border dark:border-slate-850 rounded-full" />
            <h2 className="font-fredoka text-2xl font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Archived Polls</h2>
            <div className="h-1 flex-1 bg-gray-200 dark:bg-slate-700 brutalist-border dark:border-slate-850 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 hover:opacity-100 transition-opacity">
            {archivedPolls.map((poll) => {
              const myResponse = poll.responses.find(r => r.studentId === user?._id);
              return (
                <div key={poll._id} className="comic-card bg-gray-50 dark:bg-slate-800 p-6 flex flex-col grayscale hover:grayscale-0 transition-all dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Closed {new Date(poll.closedAt || '').toLocaleDateString()}</span>
                    <span className="text-red-500 font-black text-xs uppercase">Ended</span>
                  </div>
                  <h4 className="font-fredoka font-bold text-lg mb-4 text-[var(--comic-black)] dark:text-white">{poll.question}</h4>
                  
                  <div className="space-y-2">
                    {poll.results?.slice(0, 2).map(r => (
                      <div key={r.option} className="flex justify-between text-[10px] font-bold uppercase">
                        <span>{r.option}</span>
                        <span>{r.percentage}%</span>
                      </div>
                    ))}
                    <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase mt-2">
                      {myResponse ? `You voted: ${myResponse.option}` : "You didn't vote"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
