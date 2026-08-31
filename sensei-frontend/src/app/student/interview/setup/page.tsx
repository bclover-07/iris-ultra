'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/axios';
import AlertModal from '@/components/ui/AlertModal';

const COMPANIES = [
  { name: 'Google', style: 'Algorithmic', color: '#4285F4' }, { name: 'Microsoft', style: 'System Design', color: '#00A4EF' },
  { name: 'Amazon', style: 'STAR Method', color: '#FF9900' }, { name: 'Meta', style: 'System Design', color: '#1877F2' },
  { name: 'Apple', style: 'Behavioral', color: '#555555' }, { name: 'TCS', style: 'Comprehensive', color: '#0072C6' },
  { name: 'Infosys', style: 'Technical', color: '#007CC3' }, { name: 'Wipro', style: 'HR + Technical', color: '#44166B' },
  { name: 'Flipkart', style: 'DSA + Design', color: '#F8D210' }, { name: 'Zomato', style: 'Product Sense', color: '#E23744' },
  { name: 'CRED', style: 'System Design', color: '#2D2D2D' }, { name: 'Razorpay', style: 'Full Stack', color: '#3395FF' },
  { name: 'Deloitte', style: 'Case Study', color: '#86BC25' }, { name: 'Accenture', style: 'Behavioral', color: '#A100FF' },
  { name: 'IBM', style: 'Technical', color: '#054ADA' }, { name: 'Startup', style: 'Full Stack', color: '#FF6B35' },
];

const ROLES = ['Software Engineer', 'Data Analyst', 'Product Manager', 'DevOps Engineer', 'ML Engineer',
  'Data Scientist', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'QA Engineer', 'Business Analyst', 'System Architect'];

const MODES = [
  { id: 'hr', emoji: '🤝', title: 'HR Round', desc: 'Behavioral & personality questions' },
  { id: 'technical', emoji: '💻', title: 'Technical Round', desc: 'Coding, system design, DSA' },
  { id: 'stress', emoji: '🔥', title: 'Stress Test', desc: 'Pressure questions, interruptions' },
  { id: 'mentor', emoji: '🧑‍🏫', title: 'Mentor Mode', desc: 'Guided practice with hints' },
  { id: 'panel', emoji: '👥', title: 'Panel Interview', desc: 'Face 3 interviewers simultaneously' },
];

const ROOMS = [
  { id: 'corporate', name: 'Corporate Office', color: '#3E2723' },
  { id: 'startup', name: 'Startup Office', color: '#388E3C' },
  { id: 'hr', name: 'HR Office', color: '#616161' },
  { id: 'online', name: 'Online Interview', color: '#1565C0' },
  { id: 'panel', name: 'Panel Room', color: '#4A148C' },
];

export default function InterviewSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [company, setCompany] = useState(searchParams.get('company') || '');
  const [mode, setMode] = useState('technical');
  const [resumeData, setResumeData] = useState<any>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [room, setRoom] = useState('corporate');
  const [interviewerName, setInterviewerName] = useState('Alex');
  const [starting, setStarting] = useState(false);
  const [micTested, setMicTested] = useState(false);
  const fileInputRef = useRef<any>(null);
  const [alertModal, setAlertModal] = useState<{ open: boolean; type?: any; title: string; message: string; onConfirm?: () => void }>({ open: false, title: '', message: '' });

  const handleResumeUpload = useCallback(async (file: any) => {
    if (!file) return;
    setResumeLoading(true);
    setResumeFile(file.name);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/api/interview/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResumeData(res.data);
    } catch (e) {
      console.error('Resume upload failed');
    }
    setResumeLoading(false);
  }, []);

  const testMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicTested(true);
    } catch (e) {
      setAlertModal({ open: true, type: 'error', title: 'Microphone Denied', message: 'Please allow microphone access in your browser settings to continue.', onConfirm: () => setAlertModal(a => ({ ...a, open: false })) });
    }
  }, []);

  const startInterview = useCallback(async () => {
    if (!role || !company) return;
    setStarting(true);
    try {
      const res = await api.post('/api/interview/start', { jobRole: role, company, mode, difficulty: 1 });
      const { sessionId } = res.data;
      const params = new URLSearchParams({
        role, company, mode, room, interviewerName,
        camera: cameraEnabled ? '1' : '0',
        ...(resumeData ? { hasResume: '1' } : {})
      });
      if (resumeData) {
        sessionStorage.setItem(`resume_${sessionId}`, JSON.stringify(resumeData));
      }
      router.push(`/student/interview/${sessionId}?${params.toString()}`);
    } catch (e) {
      setAlertModal({ open: true, type: 'error', title: 'Start Failed', message: 'Failed to start interview. Please try again.', onConfirm: () => setAlertModal(a => ({ ...a, open: false })) });
      setStarting(false);
    }
  }, [role, company, mode, room, interviewerName, cameraEnabled, resumeData, router]);

  const canGoNext = () => {
    if (step === 1) return role.length > 0;
    if (step === 2) return company.length > 0;
    return true;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <AlertModal {...alertModal} />
      {}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: '#e0e0e0', border: '2px solid #000' }}>
            <motion.div className="h-full rounded-full"
              animate={{ width: step >= s ? '100%' : '0%' }}
              style={{ background: step >= s ? '#4285F4' : 'transparent' }} transition={{ duration: 0.3 }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <div className="bg-white rounded-3xl p-6 md:p-8" style={{ border: '4px solid #000', boxShadow: '6px 6px 0 #000' }}>
              <h2 className="font-fredoka text-2xl md:text-3xl font-bold mb-2">🎯 Choose Your Role</h2>
              <p className="text-gray-500 text-sm mb-6">What position are you interviewing for?</p>
              <input
                type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Software Engineer"
                className="w-full p-4 rounded-2xl font-fredoka text-lg mb-4"
                style={{ border: '3px solid #000', outline: 'none' }}
              />
              <p className="text-xs font-bold text-gray-400 mb-3">POPULAR ROLES</p>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`px-4 py-2 rounded-xl font-fredoka font-bold text-sm transition-all ${role === r ? 'bg-yellow-400 -translate-y-0.5' : 'bg-gray-100 hover:bg-gray-200'}`}
                    style={{ border: '2px solid #000' }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <div className="bg-white rounded-3xl p-6 md:p-8" style={{ border: '4px solid #000', boxShadow: '6px 6px 0 #000' }}>
              <h2 className="font-fredoka text-2xl font-bold mb-4">🏢 Company & Mode</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
                {COMPANIES.map(c => (
                  <button key={c.name} onClick={() => setCompany(c.name)}
                    className={`p-3 rounded-xl text-center transition-all ${company === c.name ? '-translate-y-1 ring-2 ring-yellow-400' : 'hover:-translate-y-0.5'}`}
                    style={{ border: '2px solid #000', background: company === c.name ? '#FFF9C4' : 'white' }}>
                    <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center text-white font-bold text-sm mb-1" style={{ background: c.color }}>{c.name[0]}</div>
                    <p className="text-[10px] font-bold truncate">{c.name}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold text-gray-400 mb-3">INTERVIEW MODE</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MODES.map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    className={`p-4 rounded-2xl text-left transition-all ${mode === m.id ? '-translate-y-1 bg-yellow-50' : 'hover:-translate-y-0.5'}`}
                    style={{ border: mode === m.id ? '3px solid #000' : '2px solid #ccc', boxShadow: mode === m.id ? '4px 4px 0 #000' : 'none' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{m.emoji}</span>
                      <div>
                        <p className="font-fredoka font-bold text-sm">{m.title}</p>
                        <p className="text-[11px] text-gray-500">{m.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <div className="bg-white rounded-3xl p-6 md:p-8" style={{ border: '4px solid #000', boxShadow: '6px 6px 0 #000' }}>
              <h2 className="font-fredoka text-2xl font-bold mb-2">📄 Resume (Optional)</h2>
              <p className="text-gray-500 text-sm mb-6">Upload your resume for personalized questions based on your experience.</p>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleResumeUpload(f); }}
                onDragOver={(e) => e.preventDefault()}
                className="border-4 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc" className="hidden" onChange={e => { if (e.target.files?.[0]) handleResumeUpload(e.target.files[0]); }} />
                {resumeLoading ? (
                  <div className="animate-spin text-4xl">⏳</div>
                ) : resumeData ? (
                  <div>
                    <div className="text-4xl mb-2">✅</div>
                    <p className="font-fredoka font-bold">{resumeFile}</p>
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                      {(resumeData.skills || []).slice(0, 8).map((s: any, i: number) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{s}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-2">📎</div>
                    <p className="font-fredoka font-bold">Drag & drop or click to upload</p>
                    <p className="text-xs text-gray-400 mt-1">PDF or DOCX, max 10MB</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <div className="bg-white rounded-3xl p-6 md:p-8" style={{ border: '4px solid #000', boxShadow: '6px 6px 0 #000' }}>
              <h2 className="font-fredoka text-2xl font-bold mb-6">⚙️ Settings</h2>
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl" style={{ border: '2px solid #000' }}>
                  <div>
                    <p className="font-fredoka font-bold">📹 Camera</p>
                    <p className="text-xs text-gray-500">Required for body language analysis</p>
                  </div>
                  <button onClick={() => setCameraEnabled(!cameraEnabled)}
                    className={`w-14 h-8 rounded-full transition-all ${cameraEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                    style={{ border: '2px solid #000' }}>
                    <div className={`w-6 h-6 bg-white rounded-full transition-transform ${cameraEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} style={{ border: '2px solid #000' }} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl" style={{ border: '2px solid #000' }}>
                  <div>
                    <p className="font-fredoka font-bold">🎤 Microphone</p>
                    <p className="text-xs text-gray-500">{micTested ? '✅ Mic working!' : 'Test your microphone'}</p>
                  </div>
                  <button onClick={testMic} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold" style={{ border: '2px solid #000' }}>
                    {micTested ? 'Tested ✓' : 'Test Mic'}
                  </button>
                </div>

                <div>
                  <p className="font-fredoka font-bold mb-2">🏠 Room Style</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {ROOMS.map(r => (
                      <button key={r.id} onClick={() => setRoom(r.id)}
                        className={`p-3 rounded-xl text-center transition-all ${room === r.id ? '-translate-y-1 ring-2 ring-yellow-400 bg-yellow-50' : ''}`}
                        style={{ border: '2px solid #000' }}>
                        <div className="w-8 h-8 rounded-lg mx-auto mb-1" style={{ background: r.color }} />
                        <p className="text-[10px] font-bold">{r.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-fredoka font-bold mb-2">🧑‍💼 Interviewer Name</p>
                  <div className="flex gap-2">
                    {['Alex', 'Priya', 'Raj', 'Sarah'].map(n => (
                      <button key={n} onClick={() => setInterviewerName(n)}
                        className={`px-4 py-2 rounded-xl font-fredoka font-bold text-sm ${interviewerName === n ? 'bg-yellow-400' : 'bg-gray-100'}`}
                        style={{ border: '2px solid #000' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <div className="flex items-center justify-between">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.push('/student/interview')}
          className="px-6 py-3 bg-white rounded-2xl font-fredoka font-bold"
          style={{ border: '3px solid #000', boxShadow: '3px 3px 0 #000' }}>
          ← Back
        </button>

        {step < 4 ? (
          <button onClick={() => canGoNext() && setStep(step + 1)} disabled={!canGoNext()}
            className={`px-8 py-3 rounded-2xl font-fredoka font-bold text-lg ${canGoNext() ? 'bg-yellow-400 hover:-translate-y-0.5' : 'bg-gray-200 text-gray-400'}`}
            style={{ border: '3px solid #000', boxShadow: canGoNext() ? '4px 4px 0 #000' : 'none' }}>
            Next →
          </button>
        ) : (
          <button onClick={startInterview} disabled={starting}
            className="px-8 py-3 bg-green-500 text-white rounded-2xl font-fredoka font-bold text-lg hover:-translate-y-0.5 transition-transform"
            style={{ border: '3px solid #000', boxShadow: '4px 4px 0 #000' }}>
            {starting ? '⏳ Starting...' : '🚀 Start Interview'}
          </button>
        )}
      </div>
    </div>
  );
}
