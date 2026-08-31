'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Send, History, Trash2, Mail, Play, CheckCircle2, Circle, Clock, Loader2, ArrowLeft } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export default function StudyPlanPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  

  const [topic, setTopic] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [planType, setPlanType] = useState<'normal' | 'advanced'>('normal');
  const [loading, setLoading] = useState(false);
  

  const [currentPlan, setCurrentPlan] = useState<any | null>(null);
  const [emailing, setEmailing] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  // Modal configuration states
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [days, setDays] = useState('7');
  const [hoursPerDay, setHoursPerDay] = useState('2');


  const [historyPlans, setHistoryPlans] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const [plansRes, statsRes] = await Promise.all([
        api.get('/api/study-plan/my-plans?limit=50'),
        api.get('/api/study-plan/history/stats')
      ]);
      setHistoryPlans(plansRes.data.plans);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenConfigModal = () => {
    if (!topic.trim()) return toast.error('Enter a topic');
    setDays(planType === 'advanced' ? '14' : '7');
    setHoursPerDay('2');
    setShowConfigModal(true);
  };

  const generate = async (selectedDays: string, selectedHours: string) => {
    setLoading(true);
    setCurrentPlan(null);
    setShowConfigModal(false);
    try {
      const { data } = await api.post('/api/study-plan/generate', { 
        planType, 
        mode: 'topic', 
        topic, 
        videoUrl: planType === 'advanced' ? videoUrl : undefined,
        days: selectedDays,
        hoursPerDay: selectedHours
      });
      setCurrentPlan(data);
      toast.success('Study plan generated!');
    } catch (err: any) { 
      toast.error(err.response?.data?.error || 'Failed to generate plan'); 
    } finally { 
      setLoading(false); 
    }
  };

  const viewPlan = async (planId: string) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/study-plan/${planId}`);
      setCurrentPlan(data);
      setActiveTab('create');
    } catch {
      toast.error('Failed to load plan details');
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/study-plan/${planId}`);
      toast.success('Plan deleted');
      fetchHistory();
      if (currentPlan?._id === planId || currentPlan?.planId === planId) {
        setCurrentPlan(null);
      }
    } catch {
      toast.error('Failed to delete plan');
    }
  };

  const sendEmail = async () => {
    const pId = currentPlan?._id || currentPlan?.planId;
    if (!pId) return;
    
    setEmailing(true);
    try {
      await api.post(`/api/study-plan/${pId}/send-email`, { email: emailInput });
      toast.success('Study plan sent to email!');
      setShowEmailDialog(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send email');
    } finally {
      setEmailing(false);
    }
  };

  const toggleDayComplete = async (dayIndex: number) => {
    const pId = currentPlan?._id || currentPlan?.planId;
    if (!pId) return;
    try {
      const { data } = await api.patch(`/api/study-plan/${pId}/progress`, { completedDay: dayIndex + 1 });
      setCurrentPlan((prev: any) => {
        const newPlan = { ...prev };
        newPlan.dailySessions[dayIndex].completed = true;
        newPlan.progress = data.progress;
        return newPlan;
      });
      toast.success(`Day ${dayIndex + 1} marked as complete!`);
    } catch {
      toast.error('Failed to update progress');
    }
  };

  const renderChart = (chart: any, i: number) => {
    const data = Array.isArray(chart.data) ? chart.data : [];
    if (!data.length) return null;

    return (
      <div key={i} className="bg-white p-4 rounded-xl border-2 border-brutal-border hard-shadow mb-4 h-64">
        <h4 className="font-bold font-display mb-2 text-center text-sm">{chart.title}</h4>
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'progress' || chart.type === 'bar' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={50} />
              <YAxis tick={{fontSize: 10}} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '2px solid black' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color || ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'][index % 4]} />
                ))}
              </Bar>
            </BarChart>
          ) : chart.type === 'radar' ? (
             <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" tick={{fontSize: 10}} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <Radar name="Skill" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.5} />
              <RechartsTooltip />
            </RadarChart>
          ) : chart.type === 'timeline' || chart.type === 'line' ? (
             <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="phase" tick={{fontSize: 10}} />
              <YAxis tick={{fontSize: 10}} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '2px solid black' }} />
              <Line type="monotone" dataKey="topics" stroke="#EF4444" strokeWidth={3} dot={{r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#000'}} />
            </LineChart>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-500">Unsupported chart type: {chart.type}</div>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      
      {}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-black font-display uppercase flex items-center gap-2 text-[#111] dark:text-white">
          <BookOpen className="text-blue-500 dark:text-blue-400" /> Study Plans
        </h1>
        <div className="flex bg-white dark:bg-slate-800 rounded-xl border-2 border-[#111] dark:border-slate-700 p-1 shadow-[4px_4px_0_#111] dark:shadow-[4px_4px_0_#1e293b]">
          <button 
            onClick={() => { setActiveTab('create'); setCurrentPlan(null); }}
            className={`px-4 py-2 rounded-lg font-bold font-display text-sm transition-colors flex items-center gap-2 ${activeTab === 'create' ? 'bg-yellow-400 dark:bg-yellow-500 text-[#111] border-2 border-[#111] dark:border-slate-800' : 'text-gray-500 dark:text-slate-400 hover:text-[#111] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700'}`}
          >
            <Sparkles size={16} /> Generator
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-bold font-display text-sm transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'bg-purple-400 dark:bg-purple-600 text-white border-2 border-[#111] dark:border-slate-800' : 'text-gray-500 dark:text-slate-400 hover:text-[#111] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700'}`}
          >
            <History size={16} /> My Plans
          </button>
        </div>
      </div>

      {activeTab === 'create' && !currentPlan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex gap-3 flex-wrap">
            {(['normal', 'advanced'] as const).map((t) => (
              <button 
                key={t} 
                onClick={() => setPlanType(t)} 
                className={`comic-btn px-6 py-3 rounded-xl capitalize font-display flex items-center gap-2 border-2 ${planType === t ? (t === 'advanced' ? 'bg-purple-500 dark:bg-purple-600 text-white border-[#111] dark:border-slate-600' : 'bg-green-400 dark:bg-green-500 text-[#111] border-[#111] dark:border-slate-600') : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-transparent dark:border-slate-700'}`}
              >
                {t === 'advanced' ? <><Sparkles size={18} /> Deep-Dive Advanced</> : <><BookOpen size={18} /> Standard Plan</>}
              </button>
            ))}
          </div>

          <div className={`p-6 rounded-2xl border-4 sticky-card transition-colors ${planType === 'advanced' ? 'bg-[#F3E5F5] dark:bg-purple-900/20' : 'bg-[#FFFDE7] dark:bg-yellow-900/10'} border-[#111] dark:border-slate-700 shadow-[8px_8px_0_#111] dark:shadow-[8px_8px_0_#1e293b]`}>
            <div className="space-y-4">
              <div>
                <label className="font-bold font-display block mb-2 text-[#111] dark:text-white">What do you want to master?</label>
                <input 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  placeholder="e.g., Quantum Physics, React Native, French Revolution" 
                  className="notebook-input w-full bg-white/80 dark:bg-slate-800/80 text-[#111] dark:text-white border-2 border-[#111] dark:border-slate-600 backdrop-blur" 
                  autoFocus
                />
              </div>
              
              <AnimatePresence>
                {planType === 'advanced' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <label className="font-bold font-display block mb-2 mt-2 flex items-center gap-2 text-[#111] dark:text-white"><Play size={16} className="text-red-500 dark:text-red-400" /> Include Video Context (Optional)</label>
                    <input 
                      value={videoUrl} 
                      onChange={(e) => setVideoUrl(e.target.value)} 
                      placeholder="Paste a YouTube URL to analyze..." 
                      className="notebook-input w-full bg-white/80 dark:bg-slate-800/80 text-[#111] dark:text-white border-2 border-[#111] dark:border-slate-600 backdrop-blur" 
                    />
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-2 font-mono">⚡ LangGraph AI will extract key concepts and visual aids from this video.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={handleOpenConfigModal} 
                disabled={loading} 
                className="comic-btn w-full py-4 mt-4 bg-black dark:bg-slate-700 text-white font-black font-display text-lg rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-slate-600 border-2 border-transparent dark:border-slate-600 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" /> Analyzing & Generating...
                  </div>
                ) : (
                  <><Sparkles /> Generate Awesome Plan</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {}
      {currentPlan && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border-4 border-[#111] dark:border-slate-700 shadow-[8px_8px_0_#111] dark:shadow-[8px_8px_0_#1e293b] relative overflow-hidden">
          
          <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
             <BookOpen size={200} />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 text-xs font-black uppercase rounded-full border-2 border-brutal-border ${currentPlan.planType === 'advanced' ? 'bg-purple-400 text-white' : 'bg-green-400 text-brutal-text'}`}>
                  {currentPlan.planType || 'Standard'}
                </span>
                <span className="px-3 py-1 text-xs font-black uppercase rounded-full border-2 border-brutal-border bg-yellow-400 text-brutal-text flex items-center gap-1">
                  <Clock size={12} /> {currentPlan.totalDays} Days
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black font-display text-[#111] dark:text-white">{currentPlan.title}</h2>
              {currentPlan.progress !== undefined && (
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-4 w-48 bg-gray-200 rounded-full border-2 border-brutal-border overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-500" style={{ width: `${currentPlan.progress}%` }} />
                  </div>
                  <span className="font-bold font-mono text-sm">{currentPlan.progress}% Done</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPlan(null)} 
                className="p-3 border-2 border-[#111] dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800 text-[#111] dark:text-white"
                title="Back to Generator"
              >
                <ArrowLeft size={20} />
              </button>
              <button 
                onClick={() => setShowEmailDialog(true)} 
                className="comic-btn px-4 py-2 bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 font-display"
              >
                <Mail size={18} /> Send to Email
              </button>
            </div>
          </div>

          {}
          <AnimatePresence>
            {showEmailDialog && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-4 border-[#111] dark:border-slate-700 shadow-[8px_8px_0_#111] dark:shadow-[8px_8px_0_#1e293b] max-w-sm w-full">
                  <h3 className="text-xl font-black font-display mb-4 flex items-center gap-2 text-[#111] dark:text-white"><Send className="text-blue-500 dark:text-blue-400" /> Send Plan</h3>
                  <p className="text-sm font-body mb-4 text-gray-600 dark:text-slate-300">Enter an email to send this study plan to. Leave blank to use your account email.</p>
                  <input 
                    type="email" 
                    value={emailInput} 
                    onChange={e => setEmailInput(e.target.value)} 
                    placeholder="Enter email address..." 
                    className="w-full border-2 border-[#111] dark:border-slate-600 bg-white dark:bg-slate-700 text-[#111] dark:text-white rounded-lg p-3 font-body mb-4 outline-none focus:border-blue-500 dark:focus:border-blue-400"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowEmailDialog(false)} className="px-4 py-2 border-2 border-[#111] dark:border-slate-600 text-[#111] dark:text-white rounded-lg font-bold">Cancel</button>
                    <button onClick={sendEmail} disabled={emailing} className="comic-btn px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50">
                      {emailing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {}
          {currentPlan.videoSummary && (
            <div className="p-6 rounded-2xl border-4 border-brutal-border bg-indigo-900 text-white hard-shadow relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 opacity-10"><Play size={120} /></div>
               <h3 className="text-xl font-black font-display mb-4 flex items-center gap-2 text-yellow-400">
                 <Sparkles /> LangGraph Video Analysis
               </h3>
               <div className="mb-4">
                 <h4 className="font-bold text-lg mb-2">{currentPlan.videoSummary.title}</h4>
                 <p className="text-sm leading-relaxed text-indigo-100">{currentPlan.videoSummary.summary}</p>
               </div>
               {currentPlan.videoSummary.keyPoints?.length > 0 && (
                 <div className="bg-black/20 p-4 rounded-xl border border-indigo-500/30">
                   <h5 className="font-bold text-sm text-yellow-400 mb-2 font-mono uppercase tracking-wider">Extracted Insights</h5>
                   <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-indigo-50">
                     {currentPlan.videoSummary.keyPoints.map((kp: string, i: number) => (
                       <li key={i} className="flex items-start gap-2">
                         <span className="text-yellow-400 mt-1">⚡</span> <span>{kp}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               )}
            </div>
          )}

          {}
          {currentPlan.summaryCards?.length > 0 && (
            <div>
              <h3 className="text-xl font-black font-display mb-4 border-b-4 border-[#111] dark:border-slate-700 pb-2 inline-block text-[#111] dark:text-white">Flash Insights</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {currentPlan.summaryCards.map((card: any, i: number) => (
                  <motion.div key={i} whileHover={{ scale: 1.05, rotate: i%2===0?1:-1 }} className="p-4 rounded-xl border-2 border-[#111] dark:border-slate-700 shadow-[4px_4px_0_#111] dark:shadow-[4px_4px_0_#1e293b] flex flex-col bg-[#f3f4f6] dark:bg-slate-700">
                    <div className="text-3xl mb-2">{card.emoji || '💡'}</div>
                    <h4 className="font-black font-display text-sm mb-1 text-[#111] dark:text-white">{card.title}</h4>
                    <p className="text-xs font-body text-gray-700 dark:text-slate-300 flex-1">{card.keyPoint}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {}
          {currentPlan.charts?.length > 0 && (
            <div>
              <h3 className="text-xl font-black font-display mb-4 border-b-4 border-[#111] dark:border-slate-700 pb-2 inline-block text-[#111] dark:text-white">Visual Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentPlan.charts.map((chart: any, i: number) => renderChart(chart, i))}
              </div>
            </div>
          )}

          {}
          <div>
            <h3 className="text-2xl font-black font-display mb-6 border-b-4 border-[#111] dark:border-slate-700 pb-2 inline-block text-[#111] dark:text-white">Action Plan</h3>
            <div className="space-y-4">
              {currentPlan.dailySessions?.map((day: any, i: number) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className={`p-5 rounded-2xl border-4 border-[#111] dark:border-slate-700 transition-all ${day.completed ? 'bg-green-100 dark:bg-green-900/30 opacity-80' : 'bg-[#FFFDE7] dark:bg-yellow-900/10 shadow-[4px_4px_0_#111] dark:shadow-[4px_4px_0_#1e293b] hover:translate-x-1'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-black font-display text-xl flex items-center gap-2 text-[#111] dark:text-white">
                      <div className={`w-8 h-8 rounded-full border-2 border-brutal-border flex items-center justify-center text-sm ${day.completed ? 'bg-green-500 text-white' : 'bg-white'}`}>
                        {day.completed ? <CheckCircle2 size={16} /> : day.day}
                      </div>
                      Day {day.day}
                    </h4>
                    {!day.completed && (
                      <button 
                        onClick={() => toggleDayComplete(i)}
                        className="px-3 py-1 text-xs font-bold border-2 border-[#111] dark:border-slate-600 rounded-full hover:bg-green-400 dark:hover:bg-green-600 transition-colors flex items-center gap-1 bg-white dark:bg-slate-800 text-[#111] dark:text-white"
                      >
                        <Circle size={12} /> Mark Done
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3 pl-10">
                    {day.topics?.length > 0 && (
                      <div>
                        <span className="text-xs font-black uppercase text-gray-500 mb-1 block font-mono">Focus</span>
                        <div className="flex flex-wrap gap-2">
                          {day.topics.map((t: string, ti: number) => (
                            <span key={ti} className="text-sm font-bold bg-white dark:bg-slate-800 border border-[#111] dark:border-slate-600 px-2 py-1 rounded-md text-[#111] dark:text-white">📌 {t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {day.activities?.length > 0 && (
                      <div>
                        <span className="text-xs font-black uppercase text-gray-500 mb-1 block font-mono">Activities</span>
                        <ul className="space-y-1">
                          {day.activities.map((a: string, ai: number) => (
                            <li key={ai} className="text-sm font-body text-gray-800 dark:text-slate-200 flex items-start gap-2">
                              <span className="mt-1 opacity-50">✏️</span> <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </motion.div>
      )}

      {}
      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {historyLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin w-12 h-12 text-blue-500" /></div>
          ) : (
            <>
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                   <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-[#111] dark:border-slate-700 shadow-[4px_4px_0_#111] dark:shadow-[4px_4px_0_#1e293b] text-center">
                     <div className="text-3xl font-black font-display text-blue-500 dark:text-blue-400">{stats.totalPlans}</div>
                     <div className="text-xs font-bold uppercase text-gray-500 dark:text-slate-400 mt-1">Total Plans</div>
                   </div>
                   <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-[#111] dark:border-slate-700 shadow-[4px_4px_0_#111] dark:shadow-[4px_4px_0_#1e293b] text-center">
                     <div className="text-3xl font-black font-display text-purple-500 dark:text-purple-400">{stats.advancedCount}</div>
                     <div className="text-xs font-bold uppercase text-gray-500 dark:text-slate-400 mt-1">Advanced</div>
                   </div>
                   <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-[#111] dark:border-slate-700 shadow-[4px_4px_0_#111] dark:shadow-[4px_4px_0_#1e293b] text-center">
                     <div className="text-3xl font-black font-display text-green-500 dark:text-green-400">{stats.completedPlans}</div>
                     <div className="text-xs font-bold uppercase text-gray-500 dark:text-slate-400 mt-1">Completed</div>
                   </div>
                   <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-[#111] dark:border-slate-700 shadow-[4px_4px_0_#111] dark:shadow-[4px_4px_0_#1e293b] text-center">
                     <div className="text-3xl font-black font-display text-yellow-500 dark:text-yellow-400">{stats.avgProgress}%</div>
                     <div className="text-xs font-bold uppercase text-gray-500 dark:text-slate-400 mt-1">Avg Progress</div>
                   </div>
                </div>
              )}

              {historyPlans.length === 0 ? (
                <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-2xl border-4 border-[#111] dark:border-slate-700 border-dashed">
                  <History className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                  <h3 className="text-xl font-black font-display text-gray-500 dark:text-slate-400">No Study Plans Yet</h3>
                  <p className="text-gray-400 dark:text-slate-500 mt-2">Go back to the generator to create your first plan!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {historyPlans.map((plan: any) => (
                    <motion.div 
                      key={plan._id}
                      whileHover={{ y: -4 }}
                      onClick={() => viewPlan(plan._id)}
                      className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-[#111] dark:border-slate-700 shadow-[4px_4px_0_#111] dark:shadow-[4px_4px_0_#1e293b] cursor-pointer flex flex-col h-full"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border-2 border-[#111] dark:border-slate-600 ${plan.planType === 'advanced' ? 'bg-purple-200 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' : 'bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-300'}`}>
                          {plan.planType}
                        </span>
                        <div className="flex items-center gap-2">
                          {plan.emailSent && <Mail size={14} className="text-blue-500 dark:text-blue-400" />}
                          <button onClick={(e) => deletePlan(plan._id, e)} className="p-1 hover:bg-red-100 dark:hover:bg-slate-700 rounded text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <h3 className="font-black font-display text-lg mb-2 flex-1 line-clamp-2 text-[#111] dark:text-white">{plan.title}</h3>
                      
                      <div className="mt-auto pt-4 border-t-2 border-dashed border-gray-200">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-500 mb-2">
                          <span>Progress</span>
                          <span>{plan.progress || 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-300">
                          <div className="h-full bg-green-500 transition-all" style={{ width: `${plan.progress || 0}%` }} />
                        </div>
                        <div className="text-[10px] text-gray-400 mt-2 font-mono uppercase text-right">
                          {new Date(plan.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {showConfigModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-4 border-[#111] dark:border-slate-700 shadow-[8px_8px_0_#111] dark:shadow-[8px_8px_0_#1e293b] max-w-md w-full space-y-6"
            >
              <h3 className="text-2xl font-black font-display flex items-center gap-2 text-[#111] dark:text-white">
                ⚙️ Customize Study Plan
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="font-bold font-display block mb-1 text-sm text-[#111] dark:text-white">
                    Plan Duration (Days)
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="90"
                    value={days} 
                    onChange={e => setDays(e.target.value)} 
                    className="w-full border-2 border-[#111] dark:border-slate-600 bg-white dark:bg-slate-700 text-[#111] dark:text-white rounded-lg p-3 font-body outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2 mt-2">
                    {['3', '7', '14', '30'].map(d => (
                      <button
                        key={d}
                        onClick={() => setDays(d)}
                        className={`px-3 py-1 text-xs font-bold border-2 border-[#111] dark:border-slate-600 rounded-md transition-colors ${days === d ? 'bg-yellow-400 text-black' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'}`}
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold font-display block mb-1 text-sm text-[#111] dark:text-white">
                    Study Hours Per Day
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="24"
                    value={hoursPerDay} 
                    onChange={e => setHoursPerDay(e.target.value)} 
                    className="w-full border-2 border-[#111] dark:border-slate-600 bg-white dark:bg-slate-700 text-[#111] dark:text-white rounded-lg p-3 font-body outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2 mt-2">
                    {['1', '2', '4', '6'].map(h => (
                      <button
                        key={h}
                        onClick={() => setHoursPerDay(h)}
                        className={`px-3 py-1 text-xs font-bold border-2 border-[#111] dark:border-slate-600 rounded-md transition-colors ${hoursPerDay === h ? 'bg-yellow-400 text-black' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'}`}
                      >
                        {h} Hour{parseInt(h) > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowConfigModal(false)} 
                  className="px-4 py-2 border-2 border-[#111] dark:border-slate-600 text-[#111] dark:text-white rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => generate(days, hoursPerDay)}
                  className="comic-btn px-6 py-2 bg-yellow-400 text-[#111] rounded-lg font-bold flex items-center gap-2"
                >
                  <Sparkles size={16} /> Generate Plan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
