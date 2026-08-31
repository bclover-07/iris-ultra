'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import AlertModal from '@/components/ui/AlertModal';

const InterviewCanvas = dynamic(() => import('@/components/interview/InterviewCanvas'), { ssr: false });
const MediaPipeInterviewAnalyzer = dynamic(() => import('@/components/interview/MediaPipeInterviewAnalyzer'), { ssr: false });

type InterviewPhase = 'intro' | 'warmup' | 'technical' | 'hr' | 'stress' | 'closing' | 'complete';

interface QuestionData {
  text: string;
  type: string;
  topic: string;
  difficulty: string;
  expectedKeywords: string[];
}

interface TurnScores {
  technical: number | null;
  communication: number;
  confidence: number;
  eyeContact: number;
  posture: number;
  fluency: number;
  sentiment: number;
}

interface TranscriptEntry {
  role: 'ai' | 'user';
  text: string;
  timestamp: number;
}

export default function ActiveInterviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const sessionId = params.sessionId as string;
  const role = searchParams.get('role') || 'Software Engineer';
  const company = searchParams.get('company') || 'Google';
  const mode = searchParams.get('mode') || 'technical';
  const roomType = searchParams.get('room') || 'corporate';
  const interviewerName = searchParams.get('interviewerName') || 'Alex';
  const cameraEnabled = searchParams.get('camera') === '1';
  const hasResume = searchParams.get('hasResume') === '1';
  const isCanvasOnly = searchParams.get('canvas_only') === 'true';

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<InterviewPhase>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingState, setThinkingState] = useState<string | null>(null);
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(1);
  const [showTranscript, setShowTranscript] = useState(true);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [avatarAnimation, setAvatarAnimation] = useState<'idle' | 'speaking' | 'thinking' | 'nodding'>('idle');
  const [alertModal, setAlertModal] = useState<{ open: boolean; type?: any; title: string; message: string; onConfirm?: () => void; onCancel?: () => void; confirmText?: string; cancelText?: string }>({ open: false, title: '', message: '' });
  const [liveTranscript, setLiveTranscript] = useState('');

  const [eyeContact, setEyeContact] = useState(0.8);
  const [posture, setPosture] = useState(0.8);
  const [confidence, setConfidence] = useState(0.7);
  const [wpm, setWpm] = useState(0);
  const [expression, setExpression] = useState('neutral');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const accumulatedTextRef = useRef('');
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.rate = mode === 'stress' ? 1.15 : mode === 'mentor' ? 0.85 : 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => { setIsAISpeaking(true); setAvatarAnimation('speaking'); };
    utterance.onend = () => { setIsAISpeaking(false); setAvatarAnimation('idle'); };
    utterance.onerror = () => { setIsAISpeaking(false); setAvatarAnimation('idle'); };

    synthRef.current.speak(utterance);
  }, [mode]);

  const speakTextRef = useRef(speakText);
  useEffect(() => { speakTextRef.current = speakText; }, [speakText]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
      (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5000` : 'http://localhost:5000');
    const socket = io(`${apiUrl}/interview`, {
      auth: { userId: user?._id },
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      let resumeData = {};
      if (hasResume) {
        try {
          const stored = sessionStorage.getItem(`resume_${sessionId}`);
          if (stored) resumeData = JSON.parse(stored);
        } catch (e) {}
      }
      socket.emit('interview:start', {
        sessionId, userId: user?._id, jobRole: role, company, mode, difficulty: 1, resumeData
      });
    });

    socket.on('interview:ai_response', (data) => {
      setLoading(false);
      setThinkingState(null);
      setIsProcessing(false);
      if (data.question) setCurrentQuestion(data.question);
      if (data.phase) setPhase(data.phase as InterviewPhase);
      if (data.questionIndex != null) setQuestionIndex(data.questionIndex);
      if (data.totalQuestions) setTotalQuestions(data.totalQuestions);
      if (data.feedbackNote) setFeedbackNote(data.feedbackNote);
      if (data.adaptiveDifficulty) setAdaptiveDifficulty(data.adaptiveDifficulty);
      if (data.text) {
        setTranscript(prev => [...prev, { role: 'ai', text: data.text, timestamp: Date.now() }]);
        speakTextRef.current(data.text);
      }
    });

    socket.on('interview:thinking', (data) => {
      setThinkingState(data.state);
      setAvatarAnimation('thinking');
    });

    socket.on('interview:complete', (data) => {
      setInterviewComplete(true);
      setReportData(data);
      if (data.pdfBase64) {
        sessionStorage.setItem(`report_pdf_${sessionId}`, data.pdfBase64);
      }
    });

    socket.on('interview:error', (data) => {
      console.error('Interview error:', data.message);
      setIsProcessing(false);
      setThinkingState(null);
    });

    const pingInterval = setInterval(() => {
      socket.emit('interview:ping', { sessionId });
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
      if (synthRef.current) synthRef.current.cancel();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [sessionId, user, role, company, mode, hasResume]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const submitAnswer = useCallback((transcript: string) => {
    if (!socketRef.current || !transcript) {
      setIsProcessing(false);
      return;
    }

    setTranscript(prev => [...prev, { role: 'user', text: transcript, timestamp: Date.now() }]);

    const words = transcript.split(/\s+/).filter(Boolean);
    const estimatedWPM = Math.round(words.length * 4);
    setWpm(estimatedWPM);

    socketRef.current.emit('interview:answer', {
      sessionId,
      transcript,
      wordTimestamps: [],
      duration: Math.max(words.length / 2.5, 5),
      mediaPipeData: {
        eyeContactScore: eyeContact,
        postureScore: posture,
        expressionState: expression,
        overallBodyLanguage: (eyeContact + posture) / 2
      },
      clientNLP: {
        sentiment: { label: 'POSITIVE', score: 0.65 },
        emotion: 'neutral',
        clarity: 0.7
      }
    });
  }, [sessionId, eyeContact, posture, expression]);

  const startRecording = useCallback(async () => {
    if (isAISpeaking || isProcessing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      setLiveTranscript('');
      setIsRecording(true);
      isRecordingRef.current = true;
      accumulatedTextRef.current = '';

      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        let currentFinalText = '';

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript + ' ';
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          currentFinalText = final;
          setLiveTranscript(accumulatedTextRef.current + currentFinalText + interim);
        };

        recognition.onend = () => {
          if (isRecordingRef.current) {
            accumulatedTextRef.current += currentFinalText;
            currentFinalText = '';
            try {
              recognition.start();
            } catch (err) {
              console.warn('Failed to restart speech recognition:', err);
            }
          } else {
            const finalSpeech = (accumulatedTextRef.current + currentFinalText).trim();
            submitAnswer(finalSpeech || 'No answer.');
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e.error);
          if (e.error === 'no-speech') {
            return;
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        setTimeout(() => {
          setIsRecording(false);
          isRecordingRef.current = false;
          setIsProcessing(false);
          setAlertModal({ open: true, type: 'warning', title: 'Browser Not Supported', message: 'Your browser does not support speech recognition. Please use Chrome.', confirmText: 'OK', onConfirm: () => setAlertModal(a => ({ ...a, open: false })) });
        }, 100);
      }
    } catch (e) {
      setAlertModal({ open: true, type: 'error', title: 'Microphone Required', message: 'Please allow microphone access to participate in the interview.', confirmText: 'OK', onConfirm: () => setAlertModal(a => ({ ...a, open: false })) });
    }
  }, [isAISpeaking, isProcessing, submitAnswer]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setIsProcessing(true);
    setLiveTranscript('');
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.stop(); 
      } catch (e) { 
        submitAnswer(accumulatedTextRef.current.trim()); 
      }
    } else {
      submitAnswer('');
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, [submitAnswer]);

  const exitInterview = useCallback(() => {
    setAlertModal({
      open: true, type: 'confirm',
      title: 'Exit Interview?',
      message: 'Your progress will be saved but the session will end. Are you sure you want to exit?',
      confirmText: '🚪 Exit', cancelText: 'Continue',
      onConfirm: () => { socketRef.current?.disconnect(); router.push('/student/interview'); },
      onCancel: () => setAlertModal(a => ({ ...a, open: false }))
    });
  }, [router]);

  const downloadPDF = useCallback(() => {
    const pdf = sessionStorage.getItem(`report_pdf_${sessionId}`);
    if (pdf) {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdf}`;
      link.download = `interview-report-${sessionId}.pdf`;
      link.click();
    }
  }, [sessionId]);

  if (interviewComplete && reportData) {
    const scores = reportData.scores || {};
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-[#0d1b2a] to-[#1b263b] text-white overflow-y-auto z-50">
        <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-8 pb-20">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="font-fredoka text-4xl font-bold mb-2">🎉 Interview Complete!</h1>
            <p className="text-blue-300">Your {mode} interview for {role} at {company}</p>
            {reportData.xpEarned > 0 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
                className="inline-block mt-4 px-6 py-2 bg-yellow-500 text-brutal-text rounded-2xl font-bold text-lg">
                +{reportData.xpEarned} XP Earned! ⭐
              </motion.div>
            )}
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(scores).filter(([k]) => k !== 'overall').map(([key, value], i) => {
              const pct = Math.round((value as number) * 100);
              const color = pct >= 70 ? '#4caf50' : pct >= 40 ? '#ff9800' : '#f44336';
              return (
                <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                  className="bg-white/10/10 backdrop-blur rounded-2xl p-4 text-center">
                  <div className="text-3xl font-bold mb-1" style={{ color }}>{pct}%</div>
                  <div className="text-xs text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                </motion.div>
              );
            })}
          </div>

          <div className="bg-white/10/10 backdrop-blur rounded-2xl p-6 text-center">
            <div className="text-6xl font-bold mb-2" style={{ color: (scores.overall || 0) >= 0.7 ? '#4caf50' : '#ff9800' }}>
              {Math.round((scores.overall || 0) * 100)}%
            </div>
            <p className="text-lg text-gray-300">Overall Score</p>
          </div>

          {reportData.report?.overallVerdict && (
            <div className="bg-white/10/10 backdrop-blur rounded-2xl p-6">
              <h3 className="font-fredoka text-xl font-bold mb-2">📋 Verdict</h3>
              <p className="text-gray-300 leading-relaxed">{reportData.report.overallVerdict}</p>
            </div>
          )}

          {reportData.report?.strengths && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-500/20 rounded-2xl p-5">
                <h3 className="font-fredoka font-bold mb-3 text-green-400">✅ Strengths</h3>
                {reportData.report.strengths.map((s: string, i: number) => <p key={i} className="text-sm text-gray-300 mb-2">• {s}</p>)}
              </div>
              <div className="bg-orange-500/20 rounded-2xl p-5">
                <h3 className="font-fredoka font-bold mb-3 text-orange-400">🔶 Improve</h3>
                {(reportData.report.improvements || []).map((s: string, i: number) => <p key={i} className="text-sm text-gray-300 mb-2">• {s}</p>)}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={downloadPDF} className="px-6 py-3 bg-blue-600 rounded-2xl font-bold hover:bg-blue-700 transition-colors">📥 Download PDF</button>
            <button onClick={() => router.push('/student/interview/setup')} className="px-6 py-3 bg-white/20/20 rounded-2xl font-bold hover:bg-white/30/30 transition-colors">🔁 Practice Again</button>
            <button onClick={() => router.push('/student/interview')} className="px-6 py-3 bg-white/10/10 rounded-2xl font-bold hover:bg-white/20/20 transition-colors">🏠 Hub</button>
          </div>
        </div>
      </div>
    );
  }

  if (isCanvasOnly) {
    return (
      <div className="fixed inset-0 bg-[#0d1b2a] flex flex-col overflow-hidden z-50">
        <InterviewCanvas roomType={roomType} avatarAnimation={avatarAnimation} interviewerName={interviewerName} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0d1b2a] flex flex-col overflow-hidden z-50">
      <AlertModal {...alertModal} />
      {}
      <div className="flex items-center justify-between px-3 py-2 bg-black/40 backdrop-blur-md z-30 border-b border-white/10">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/student/virtual-beyond')} className="p-1.5 rounded-lg bg-white/10/10 text-white/70 hover:bg-white/20/20 text-xs flex items-center gap-1">
            <span>←</span><span className="hidden sm:inline">Hub</span>
          </button>
          <span className="text-white/80 text-xs font-bold">Q{questionIndex}/{totalQuestions}</span>
          <span className="px-2 py-0.5 bg-blue-600/40 text-blue-200 rounded-lg text-[10px] font-bold uppercase">{phase}</span>
          <span className="hidden sm:inline px-2 py-0.5 bg-yellow-600/40 text-yellow-200 rounded-lg text-[10px] font-bold">
            ⚡{adaptiveDifficulty <= 1.5 ? 'Easy' : adaptiveDifficulty <= 2.5 ? 'Medium' : 'Hard'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTranscript(!showTranscript)} className="p-1.5 rounded-lg bg-white/10/10 text-white/70 hover:bg-white/20/20 text-xs">📜</button>
          <button onClick={exitInterview} className="px-3 py-1.5 rounded-lg bg-red-500/30 text-red-300 hover:bg-red-500/50 text-xs font-bold">🚪 Exit</button>
        </div>
      </div>

      {}
      <div className="flex-1 flex overflow-hidden">
        {}
        <div className={`relative flex-1 ${showTranscript ? 'md:w-2/3' : 'w-full'}`}>
          <InterviewCanvas roomType={roomType} avatarAnimation={avatarAnimation} interviewerName={interviewerName} />

          {}
          {isAISpeaking && transcript.length > 0 && (
            <div className="absolute bottom-28 md:bottom-32 left-4 right-4 text-center z-20">
              <div className="inline-block max-w-lg bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm">
                {transcript[transcript.length - 1]?.role === 'ai' ? transcript[transcript.length - 1].text.slice(0, 120) + '...' : ''}
              </div>
            </div>
          )}

          {}
          {thinkingState && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="bg-black/70 backdrop-blur-md text-white px-6 py-3 rounded-2xl flex items-center gap-3">
                <div className="animate-spin text-xl">🧠</div>
                <span className="text-sm font-bold">{thinkingState === 'generating_report' ? 'Generating Report...' : 'Analyzing your answer...'}</span>
              </div>
            </div>
          )}

          {}
          {loading && (
            <div className="absolute inset-0 bg-[#0d1b2a] z-30 flex items-center justify-center">
              <div className="text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-6xl mb-4">🎙️</motion.div>
                <h2 className="text-white font-fredoka text-2xl font-bold mb-2">Preparing Your Interview</h2>
                <p className="text-gray-400 text-sm">Setting up AI interviewer for {role} at {company}...</p>
              </div>
            </div>
          )}

          {}
          <AnimatePresence>
            {feedbackNote && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-yellow-500/90 text-brutal-text px-4 py-2 rounded-xl text-sm font-bold max-w-sm text-center">
                💡 {feedbackNote}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {}
        {showTranscript && (
          <div className="hidden md:flex md:w-1/3 max-w-sm flex-col bg-black/30 backdrop-blur-md border-l border-white/10">
            <div className="p-3 border-b border-white/10">
              <h3 className="text-white font-fredoka font-bold text-sm">📜 Transcript</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {transcript.map((t, i) => (
                <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${t.role === 'user' ? 'bg-blue-600/40 text-blue-100' : 'bg-white/10/10 text-gray-200'}`}>
                    <p className="text-[10px] font-bold mb-1 opacity-60">{t.role === 'ai' ? interviewerName : 'You'}</p>
                    {t.text}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}
      </div>

      {}
      <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-black/40 backdrop-blur-md border-t border-white/10">
        {[
          { label: 'Eye Contact', value: eyeContact, icon: '👁️' },
          { label: 'Posture', value: posture, icon: '🧍' },
          { label: 'Confidence', value: confidence, icon: '💪' },
          { label: 'Speed', value: wpm > 0 ? `${wpm} WPM` : '—', icon: '⚡', isText: true },
        ].map((m, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <span className="text-sm">{m.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] text-white/60">{m.label}</span>
                <span className="text-[10px] text-white/80 font-bold">
                  {m.isText ? m.value : `${Math.round((m.value as number) * 100)}%`}
                </span>
              </div>
              {!m.isText && (
                <div className="h-1.5 bg-white/10/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(m.value as number) * 100}%`,
                      background: (m.value as number) >= 0.7 ? '#4caf50' : (m.value as number) >= 0.4 ? '#ff9800' : '#f44336'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="px-4 py-3 bg-black/50 backdrop-blur-md border-t border-white/10 z-30">
        {currentQuestion && !isAISpeaking && (
          <p className="text-gray-300 text-xs md:text-sm mb-2 text-center max-w-2xl mx-auto line-clamp-2">{currentQuestion.text}</p>
        )}
        {isRecording && liveTranscript && (
          <p className="text-green-300 text-[10px] text-center mb-1 max-w-lg mx-auto italic truncate">🎤 {liveTranscript}</p>
        )}
        <div className="flex items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onPointerDown={startRecording} onPointerUp={stopRecording} onPointerLeave={(e) => { if (isRecording) stopRecording(); }}
            disabled={isAISpeaking || isProcessing}
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold shadow-lg transition-all ${
              isRecording ? 'bg-red-500 scale-110' :
              isProcessing ? 'bg-gray-600 cursor-wait' :
              isAISpeaking ? 'bg-gray-700 cursor-not-allowed opacity-50' :
              'bg-blue-600 hover:bg-blue-500'
            }`}
            style={{ border: '3px solid rgba(255,255,255,0.3)', boxShadow: isRecording ? '0 0 24px rgba(239,68,68,0.7)' : 'none' }}
          >
            {isRecording ? '🔴' : isProcessing ? '⏳' : '🎤'}
          </motion.button>
        </div>
        <p className="text-white/50 text-[10px] text-center mt-1">
          {isRecording ? '🔴 Recording — release to send' : isProcessing ? '⏳ Analyzing your answer...' : isAISpeaking ? '🔊 Interviewer is speaking...' : '🎤 Hold to answer'}
        </p>
      </div>
      <MediaPipeInterviewAnalyzer 
        onMetricsUpdate={(m) => {
          setEyeContact(m.eyeContactScore);
          setPosture(m.postureScore);
          setConfidence(m.confidenceScore);
          setExpression(m.expressionState);
        }} 
      />
    </div>
  );
}
