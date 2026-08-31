'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function InterviewReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.reportId as string;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandTranscript, setExpandTranscript] = useState(false);

  useEffect(() => {
    api.get(`/api/interview/reports/${reportId}`)
      .then(r => { setReport(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [reportId]);

  const downloadPDF = async () => {
    try {
      const res = await api.get(`/api/interview/reports/${reportId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-report-${reportId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-5xl">🎙️</motion.div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="font-fredoka text-xl font-bold">Report not found</p>
        <button onClick={() => router.push('/student/interview')} className="mt-4 px-6 py-3 bg-yellow-400 rounded-2xl font-bold" style={{ border: '3px solid #000' }}>← Back to Hub</button>
      </div>
    );
  }

  const scores = report.scores || {};
  const radarData = [
    { metric: 'Technical', value: Math.round((scores.technical || 0) * 100) },
    { metric: 'Communication', value: Math.round((scores.communication || 0) * 100) },
    { metric: 'Confidence', value: Math.round((scores.confidence || 0) * 100) },
    { metric: 'Eye Contact', value: Math.round((scores.eyeContact || 0) * 100) },
    { metric: 'Posture', value: Math.round((scores.posture || 0) * 100) },
    { metric: 'Fluency', value: Math.round((scores.fluency || 0) * 100) },
  ];
  const readinessColors: Record<string, string> = { ready: '#4caf50', almost_ready: '#ff9800', needs_work: '#f44336', not_ready: '#9e9e9e' };
  const readinessLabels: Record<string, string> = { ready: '✅ Ready', almost_ready: '🔶 Almost Ready', needs_work: '🔴 Needs Work', not_ready: '⚪ Not Ready' };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 md:p-8" style={{ border: '4px solid #000', boxShadow: '6px 6px 0 #000' }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-fredoka text-2xl md:text-3xl font-bold">📋 Interview Report</h1>
            <p className="text-gray-500 mt-1">{report.jobRole} at {report.company} · {report.mode} mode</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-xl font-fredoka font-bold text-sm" style={{ background: readinessColors[report.readinessLevel] || '#999', color: 'white', border: '2px solid #000' }}>
              {readinessLabels[report.readinessLevel] || report.readinessLevel}
            </span>
            {report.xpEarned > 0 && (
              <span className="px-4 py-2 bg-yellow-400 rounded-xl font-fredoka font-bold text-sm" style={{ border: '2px solid #000' }}>
                +{report.xpEarned} XP ⭐
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl p-6" style={{ border: '4px solid #000', boxShadow: '6px 6px 0 #000' }}>
        <h2 className="font-fredoka text-xl font-bold mb-4">📊 Score Breakdown</h2>
        <div className="h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e0e0e0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="Score" dataKey="value" stroke="#1a237e" fill="#1a237e" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Overall', value: scores.overall, emoji: '🎯' },
          { label: 'Technical', value: scores.technical, emoji: '💻' },
          { label: 'Communication', value: scores.communication, emoji: '💬' },
          { label: 'Confidence', value: scores.confidence, emoji: '💪' },
          { label: 'Eye Contact', value: scores.eyeContact, emoji: '👁️' },
          { label: 'Posture', value: scores.posture, emoji: '🧍' },
          { label: 'Fluency', value: scores.fluency, emoji: '🗣️' },
          { label: 'Company Fit', value: (report.companyFitScore || 0) / 100, emoji: '🏢' },
        ].map((s, i) => {
          const pct = Math.round((s.value || 0) * 100);
          const color = pct >= 70 ? '#4caf50' : pct >= 40 ? '#ff9800' : '#f44336';
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-white rounded-2xl p-4 text-center" style={{ border: '3px solid #000', boxShadow: '4px 4px 0 #000' }}>
              <div className="text-xl mb-1">{s.emoji}</div>
              <div className="font-fredoka font-bold text-2xl" style={{ color }}>{pct}%</div>
              <div className="text-xs text-gray-500 font-fredoka">{s.label}</div>
            </motion.div>
          );
        })}
      </div>

      {}
      {report.verdict && (
        <div className="bg-yellow-50 rounded-3xl p-6" style={{ border: '4px solid #000', boxShadow: '6px 6px 0 #000' }}>
          <h2 className="font-fredoka text-xl font-bold mb-2">📝 Verdict</h2>
          <p className="text-gray-700 leading-relaxed font-fredoka">{report.verdict}</p>
        </div>
      )}

      {}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-3xl p-6" style={{ border: '3px solid #000', boxShadow: '4px 4px 0 #000' }}>
          <h3 className="font-fredoka font-bold text-lg mb-3 text-green-700">✅ Strengths</h3>
          {(report.strengths || []).map((s: string, i: number) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <span className="text-green-500 mt-0.5">●</span>
              <p className="text-sm text-gray-700">{s}</p>
            </div>
          ))}
        </div>
        <div className="bg-orange-50 rounded-3xl p-6" style={{ border: '3px solid #000', boxShadow: '4px 4px 0 #000' }}>
          <h3 className="font-fredoka font-bold text-lg mb-3 text-orange-700">🔶 Areas to Improve</h3>
          {(report.improvements || []).map((s: string, i: number) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <span className="text-orange-500 mt-0.5">●</span>
              <p className="text-sm text-gray-700">{s}</p>
            </div>
          ))}
        </div>
      </div>

      {}
      {report.weeklyActionPlan && report.weeklyActionPlan.length > 0 && (
        <div className="bg-white rounded-3xl p-6" style={{ border: '4px solid #000', boxShadow: '6px 6px 0 #000' }}>
          <h2 className="font-fredoka text-xl font-bold mb-4">📅 4-Week Action Plan</h2>
          <div className="space-y-4">
            {report.weeklyActionPlan.map((w: any, i: number) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl" style={{ border: '2px solid #000' }}>
                <h4 className="font-fredoka font-bold text-sm text-blue-700">Week {w.week}: {w.focus}</h4>
                <ul className="mt-2 space-y-1">
                  {(w.tasks || []).map((t: string, j: number) => (
                    <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                      <span>•</span><span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      {report.recommendedRoles && report.recommendedRoles.length > 0 && (
        <div className="bg-white rounded-3xl p-6" style={{ border: '3px solid #000', boxShadow: '4px 4px 0 #000' }}>
          <h3 className="font-fredoka font-bold text-lg mb-3">🎯 Recommended Alternative Roles</h3>
          <div className="flex flex-wrap gap-2">
            {report.recommendedRoles.map((r: string, i: number) => (
              <span key={i} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-bold" style={{ border: '2px solid #000' }}>{r}</span>
            ))}
          </div>
        </div>
      )}

      {}
      {report.conversationHistory && report.conversationHistory.length > 0 && (
        <div className="bg-white rounded-3xl p-6" style={{ border: '4px solid #000', boxShadow: '6px 6px 0 #000' }}>
          <button onClick={() => setExpandTranscript(!expandTranscript)} className="flex items-center justify-between w-full">
            <h2 className="font-fredoka text-xl font-bold">📜 Full Transcript</h2>
            <span className="text-xl">{expandTranscript ? '▲' : '▼'}</span>
          </button>
          {expandTranscript && (
            <div className="mt-4 space-y-3 max-h-[50vh] overflow-y-auto">
              {report.conversationHistory.map((entry: any, i: number) => (
                <div key={i} className={`p-3 rounded-xl text-sm ${entry.role === 'user' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}>
                  <p className="text-[10px] font-bold text-gray-400 mb-1">{entry.role === 'user' ? 'You' : 'Interviewer'}</p>
                  <p className="text-gray-700">{entry.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {}
      <div className="flex flex-wrap gap-3 justify-center">
        <button onClick={downloadPDF} className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-fredoka font-bold hover:-translate-y-0.5 transition-transform" style={{ border: '3px solid #000', boxShadow: '4px 4px 0 #000' }}>
          📥 Download PDF
        </button>
        <button onClick={() => router.push('/student/interview/setup')} className="px-6 py-3 bg-yellow-400 rounded-2xl font-fredoka font-bold hover:-translate-y-0.5 transition-transform" style={{ border: '3px solid #000', boxShadow: '4px 4px 0 #000' }}>
          🔁 Practice Again
        </button>
        <button onClick={() => router.push('/student/interview')} className="px-6 py-3 bg-white rounded-2xl font-fredoka font-bold hover:-translate-y-0.5 transition-transform" style={{ border: '3px solid #000', boxShadow: '4px 4px 0 #000' }}>
          🏠 Back to Hub
        </button>
      </div>
    </div>
  );
}
