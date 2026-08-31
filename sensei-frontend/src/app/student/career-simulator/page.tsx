'use client';

import { useState, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Target, Brain, Sparkles, Briefcase, TrendingUp, ChevronRight, Loader2, Award, Zap } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const CareerCanvas = dynamic(() => import('@/components/career/CareerCanvas'), { ssr: false });

export default function CareerSimulatorPage() {
  const [formData, setFormData] = useState({
    interests: '',
    cgpa: '8.5',
    skills: '',
    targetCompanies: ''
  });
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState<any>(null);

  const handleSimulate = async () => {
    if (!formData.interests) return toast.error('Enter your interests first!');
    setLoading(true);
    setSimulation(null);
    try {
      const { data } = await api.post('/api/career/simulate', {
        interests: formData.interests.split(',').map(s => s.trim()),
        cgpa: parseFloat(formData.cgpa),
        skills: formData.skills.split(',').map(s => s.trim()),
        targetCompanies: formData.targetCompanies.split(',').map(s => s.trim())
      });
      setSimulation(data);
      toast.success('Career trajectories generated!');
    } catch (err) {
      toast.error('Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-2">
        <h1 className="text-6xl font-display text-sensei-blue drop-shadow-[4px_4px_0px_#2D2D2D] dark:drop-shadow-[4px_4px_0px_#334155]">🚀 AI Career Simulator</h1>
        <p className="text-xl font-body text-s-muted">Multi-path Monte Carlo career planner</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        { }
        <div className="comic-card p-8 bg-white dark:bg-slate-800 space-y-6 text-black dark:text-white">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="font-display text-lg flex items-center gap-2"><Zap size={18} className="text-sensei-gold" /> Interests</label>
              <input
                value={formData.interests}
                onChange={e => setFormData({ ...formData, interests: e.target.value })}
                placeholder="e.g. AI, Space Tech, Finance"
                className="notebook-input w-full text-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="font-display text-lg flex items-center gap-2"><Award size={18} className="text-sensei-coral" /> CGPA</label>
                <input
                  value={formData.cgpa}
                  onChange={e => setFormData({ ...formData, cgpa: e.target.value })}
                  type="number" step="0.1"
                  className="notebook-input w-full text-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="font-display text-lg flex items-center gap-2"><Briefcase size={18} className="text-sensei-blue" /> Target Firms</label>
                <input
                  value={formData.targetCompanies}
                  onChange={e => setFormData({ ...formData, targetCompanies: e.target.value })}
                  placeholder="e.g. Google, SpaceX"
                  className="notebook-input w-full text-xl"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-display text-lg flex items-center gap-2"><Target size={18} className="text-sensei-mint" /> Current Skills</label>
              <input
                value={formData.skills}
                onChange={e => setFormData({ ...formData, skills: e.target.value })}
                placeholder="e.g. Python, React, Public Speaking"
                className="notebook-input w-full text-xl"
              />
            </div>
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="comic-btn w-full py-5 bg-sensei-blue text-white text-2xl font-display rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Rocket />} RUN MONTE CARLO SIMULATION
          </button>
        </div>

        { }
        <div className="w-full min-h-[50vh] md:h-[600px] flex flex-col md:flex-row">
          <div className="comic-card w-full h-full bg-s-bg relative overflow-hidden flex flex-col items-center justify-center text-center p-8">
            <div className="absolute inset-0 z-0">
              <CareerCanvas />
            </div>
            {!simulation ? (
              <div className="relative z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border-4 border-s-border dark:border-slate-700 max-w-sm text-black dark:text-white">
                <h3 className="text-2xl font-display mb-2">Unfold Your Future</h3>
                <p className="font-body text-lg text-gray-700 dark:text-slate-300">We use semantic matching against thousands of successful alumni profiles to calculate your success probabilities across 3 distinct paths.</p>
              </div>
            ) : (
              <div className="relative z-10 w-full h-full flex flex-col justify-end pb-4">
                <div className="pow-burst bg-sensei-gold text-xl mx-auto">SIMULATION COMPLETE!</div>
              </div>
            )}
          </div>
        </div>
      </div>

      { }
      <AnimatePresence>
        {simulation && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid md:grid-cols-3 gap-8">
              {simulation.trajectories?.map((path: any, idx: number) => {
                const isHighRisk = parseFloat(formData.cgpa) <= 6.0 || simulation?.riskTier === 'high' || simulation?.riskTier === 'critical';
                const isVocational = isHighRisk || path.title?.toLowerCase().includes('certificate') || path.title?.toLowerCase().includes('vocational') || path.title?.toLowerCase().includes('track');
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -10 }}
                    className={`comic-card p-6 flex flex-col relative overflow-hidden text-black dark:text-white ${
                      isVocational
                        ? 'border-4 border-purple-600 bg-purple-50/80 dark:bg-purple-950/40 dark:border-purple-800/60 shadow-[6px_6px_0px_#9333EA] dark:shadow-[6px_6px_0px_rgba(168,85,247,0.4)]'
                        : path.type === 'conservative'
                        ? 'bg-sensei-card5 dark:bg-purple-950/40 dark:border-purple-800/60 dark:shadow-[6px_6px_0px_rgba(168,85,247,0.4)]'
                        : path.type === 'ambitious'
                        ? 'bg-sensei-card2 dark:bg-rose-950/40 dark:border-rose-900/60 dark:shadow-[6px_6px_0px_rgba(244,63,94,0.4)]'
                        : 'bg-sensei-card4 dark:bg-amber-950/40 dark:border-amber-900/60 dark:shadow-[6px_6px_0px_rgba(245,158,11,0.4)]'
                    }`}
                  >
                    {isVocational && (
                      <div className="absolute top-0 right-0 bg-purple-600 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-md z-10">
                        🚀 Accelerated Vocational Path
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-white dark:bg-slate-900 rounded-full border-2 border-s-border dark:border-slate-700 text-xs font-mono font-bold uppercase tracking-widest text-black dark:text-slate-200">{path.type}</span>
                      <span className="text-3xl font-display text-sensei-blue">{path.probability}%</span>
                    </div>
                    <h3 className="text-2xl font-display mb-2">{path.title}</h3>
                    <p className="font-body text-sm mb-6 flex-1 italic">"{path.narrative}"</p>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-2 text-sm font-bold"><Target size={14} /> {path.targetRole}</div>
                    <div className="flex items-center gap-2 text-sm font-bold"><TrendingUp size={14} /> {path.expectedSalary}</div>
                  </div>

                  <div className="space-y-2 border-t-2 border-s-border/10 pt-4">
                    <p className="font-display text-xs uppercase tracking-widest text-s-muted mb-3">Key Milestones</p>
                    {path.milestones?.slice(0, 3).map((m: any, i: number) => (
                      <div key={i} className="flex gap-2 text-xs font-body">
                        <span className="text-sensei-blue">●</span>
                        <span>Month {m.month}: {m.title}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
            </div>

            <div className="comic-card p-8 bg-white dark:bg-slate-800">
              <h2 className="text-3xl font-display mb-6 flex items-center gap-2 text-[var(--comic-black)]">
                <TrendingUp className="text-sensei-coral" /> Market Insights & Skill Gaps
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="font-display text-lg text-[var(--comic-black)]">Trending Skills in {formData.interests}</p>
                  <div className="flex flex-wrap gap-2">
                    {simulation.marketInsights?.trendingSkills?.map((skill: string, i: number) => (
                      <span key={i} className="px-4 py-2 bg-sensei-card3 dark:bg-slate-900 rounded-xl border-2 border-s-border dark:border-slate-700 font-body text-black dark:text-white">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="font-display text-lg text-sensei-coral">Your Skill Gaps</p>
                  <div className="flex flex-wrap gap-2">
                    {simulation.resumeMatch?.gaps?.map((gap: string, i: number) => (
                      <span key={i} className="px-4 py-2 bg-red-50 dark:bg-red-950/30 rounded-xl border-2 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 font-body">❌ {gap}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
