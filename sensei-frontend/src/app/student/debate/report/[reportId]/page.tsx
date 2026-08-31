'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { Trophy, Brain, Target, ShieldAlert, Activity, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function DebateReport() {
  const { reportId } = useParams();
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    api.get(`/api/debate/report/${reportId}`)
      .then(res => setReport(res.data.report))
      .catch(console.error);
  }, [reportId]);

  if (!report) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white font-bold">Loading Analysis...</div>;

  const psych = report.psychologicalBreakdown;
  const scores = report.scores;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans pb-32">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {}
        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none scale-150 transform translate-x-1/4 -translate-y-1/4">
            <Trophy size={400} />
          </div>
          <div className="relative z-10">
            <h1 className="text-4xl font-black mb-2 flex items-center gap-4">
              <span className="text-yellow-400">🏆 {psych?.debateRank}</span>
            </h1>
            <p className="text-indigo-200 text-lg">Topic: {report.topic} | vs {report.aiPersonality.replace('_', ' ')}</p>
          </div>
          <div className="relative z-10 bg-indigo-600/30 border border-indigo-400 px-6 py-4 rounded-2xl text-center backdrop-blur-md">
            <p className="text-3xl font-black text-white">+{report.xpEarned} XP</p>
            <p className="text-xs uppercase font-bold text-indigo-200">Earned</p>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-md">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4"><Brain className="text-indigo-600"/> Overall Verdict</h2>
            <p className="text-slate-700 text-lg leading-relaxed">{psych?.overallVerdict}</p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md">
            <h2 className="text-xl font-bold mb-6">Final Scores</h2>
            <div className="space-y-4">
              {Object.entries(scores).filter(([k]) => k !== 'overall').map(([k, v]: [string, any]) => (
                <div key={k}>
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-1 capitalize">
                    <span>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span>{Math.round(v * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: (v * 100) + '%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-6"><Activity className="text-rose-500"/> Emotional Volatility</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report.emotionTimeline || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFrust" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tickFormatter={(v)=>Math.round(v/1000)+'s'} />
                <YAxis domain={[0, 1]} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip labelFormatter={(v)=>Math.round(v/1000)+'s'} />
                <Area type="monotone" dataKey="frustration" stroke="#f43f5e" fillOpacity={1} fill="url(#colorFrust)" name="Frustration" />
                <Area type="monotone" dataKey="confidence" stroke="#4f46e5" fillOpacity={1} fill="url(#colorConf)" name="Confidence" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Target className="text-emerald-500"/> Psychological Profile</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Debating Style</p>
                <p className="text-lg font-bold text-slate-800">{psych?.psychologicalProfile?.debatingStyle}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Under Pressure</p>
                <p className="text-slate-700">{psych?.psychologicalProfile?.underPressure}</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {psych?.psychologicalProfile?.strengthsUnderPressure?.map((s:string, i:number) => (
                  <span key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">{s}</span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ShieldAlert className="text-rose-500"/> Vulnerabilities</h2>
            <div className="space-y-4">
              {psych?.psychologicalProfile?.vulnerabilitiesUnderPressure?.map((v:string, i:number) => (
                <div key={i} className="flex items-start gap-3 bg-rose-50 p-3 rounded-xl border border-rose-100">
                  <AlertTriangle className="text-rose-500 shrink-0" size={18} />
                  <p className="text-sm text-rose-900 font-medium">{v}</p>
                </div>
              ))}
              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-2 mt-4">Logic Weaknesses</p>
                {psych?.logicWeaknesses?.recurringFallacies?.map((f:string, i:number) => (
                  <span key={i} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-300 mr-2">{f}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-8"><TrendingUp className="text-yellow-400"/> 3-Week Training Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {psych?.weeklyTrainingPlan?.map((plan:any, i:number) => (
              <div key={i} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 text-7xl font-black text-slate-700 opacity-20">{plan.week}</div>
                <h3 className="text-lg font-bold text-yellow-400 mb-2 relative z-10">Week {plan.week}: {plan.focus}</h3>
                <div className="space-y-4 relative z-10 mt-4">
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-400 mb-1">Drills</p>
                    <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                      {plan.drills?.map((d:string, j:number) => <li key={j}>{d}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-400 mb-1">Mental Exercises</p>
                    <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                      {plan.mentalExercises?.map((d:string, j:number) => <li key={j}>{d}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
