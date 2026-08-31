'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/stores/authStore';
import { Flame, Users, AlertTriangle, Lightbulb, Mic, Ban, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DebateCanvas = dynamic(() => import('@/components/debate/DebateCanvas'), { ssr: false });
const MediaPipeDebateAnalyzer = dynamic(() => import('@/components/debate/MediaPipeDebateAnalyzer'), { ssr: false });

export default function DebateArena() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const { user } = useAuthStore();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessionState, setSessionState] = useState<any>({
    phase: 'opening', round: 0, totalRounds: 6,
    crowdMood: 50, heatLevel: 1, scores: {},
    aiText: '', aiEmotion: 'neutral',
  });

  const [micState, setMicState] = useState<'IDLE' | 'RECORDING' | 'PROCESSING' | 'DISABLED'>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [fallacyAlert, setFallacyAlert] = useState<any>(null);
  const [coachingNudge, setCoachingNudge] = useState<string | null>(null);
  const [ammo, setAmmo] = useState(10);

  const [pov, setPov] = useState<'1st' | '3rd'>('3rd');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const isCanvasOnly = searchParams.get('canvas_only') === 'true';

  const currentMetrics = useRef({ frustrationScore: 0.3, confidenceScore: 0.7, aggressionScore: 0.2, expressionState: 'neutral' });
  const nlpWorker = useRef<Worker | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const accumulatedTextRef = useRef('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speakText = useCallback((text: string, personality: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.rate = personality === 'fast_thinker' ? 1.2 : personality === 'calm_professor' ? 0.9 : 1.0;
    
    utterance.onstart = () => setIsAISpeaking(true);
    utterance.onend = () => setIsAISpeaking(false);
    utterance.onerror = () => setIsAISpeaking(false);
    
    synthRef.current.speak(utterance);
  }, []);

  useEffect(() => {
    if (!user) return;

    nlpWorker.current = new Worker(new URL('../../../../workers/DebateNLPWorker.ts', import.meta.url));

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 
      (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5000` : 'http://localhost:5000');
    const newSocket = io(`${socketUrl}/debate`);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('debate:start', {
        sessionId,
        userId: user._id,
        topic: searchParams.get('topic') || 'Default Topic',
        aiPersonality: searchParams.get('ai') || 'calm_professor',
        roomStyle: searchParams.get('room') || 'university_hall',
        totalRounds: parseInt(searchParams.get('rounds') || '6')
      });
    });

    newSocket.on('debate:ai_turn', (payload) => {
      setSessionState((prev: any) => ({ ...prev, ...payload }));
      setMicState('IDLE');
      if (payload.aiText) {
        speakText(payload.aiText, searchParams.get('ai') || 'calm_professor');
      }
      if (payload.shouldCutMic) {
        setMicState('DISABLED');
        setTimeout(() => setMicState('IDLE'), payload.micCutDuration || 3000);
      }
      if (payload.fallacyAlert) {
        setFallacyAlert(payload.fallacyAlert);
        setTimeout(() => setFallacyAlert(null), 5000);
      }
      if (payload.coachingNudge) {
        setCoachingNudge(payload.coachingNudge);
        setTimeout(() => setCoachingNudge(null), 5000);
      }
    });

    newSocket.on('debate:complete', (data) => {
      window.location.href = '/student/debate/report/' + data.reportId;
    });

    return () => { newSocket.disconnect(); nlpWorker.current?.terminate(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user, searchParams]);

  const submitArgument = useCallback((finalText: string) => {
    setMicState('PROCESSING');
    if (nlpWorker.current) {
      nlpWorker.current.postMessage({ id: 'turn', type: 'analyze_turn', text: finalText, topic: searchParams.get('topic') });
    }
    socket?.emit('debate:argument', {
      sessionId,
      transcript: finalText,
      audioMetrics: { wpm: 130 },
      mediaPipeData: currentMetrics.current,
      clientNLP: { toxicityScore: 0 }
    });
  }, [socket, sessionId, searchParams]);

  const startRecording = useCallback(() => {
    if (micState === 'DISABLED' || micState === 'PROCESSING' || isAISpeaking) return;
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        let currentFinalText = '';

        recognition.onstart = () => {
          setMicState('RECORDING');
          isRecordingRef.current = true;
          accumulatedTextRef.current = '';
          setLiveTranscript('');
        };
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
            submitArgument(finalSpeech || 'I disagree.');
          }
        };
        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        setMicState('RECORDING');
        isRecordingRef.current = true;
        setTimeout(() => stopRecording(), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micState, isAISpeaking, submitArgument]);

  const stopRecording = useCallback(() => {
    if (micState !== 'RECORDING') return;
    isRecordingRef.current = false;
    setMicState('PROCESSING');
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.stop(); 
      } catch (e) { 
        submitArgument(accumulatedTextRef.current.trim() || 'I disagree.'); 
      }
    } else {
      submitArgument(liveTranscript || 'I strongly disagree with that point.');
    }
  }, [micState, liveTranscript, submitArgument]);

  const handleThrow = (item: string) => {
    if (ammo <= 0 && sessionState.heatLevel < 5) return;
    if (sessionState.heatLevel < 5) setAmmo(a => a - 1);
    const hit = Math.random() > 0.2;
    socket?.emit('debate:throw_item', { sessionId, item, hit, position: { x: 0, y: 1, z: -2 } });
  };

  const crowdWidth = sessionState.crowdMood + '%';
  const ammoText = sessionState.heatLevel >= 5 ? 'CHAOS MODE: UNLIMITED' : 'Ammo: ' + ammo;

  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex flex-col font-sans relative">

      {/* Top HUD */}
      {!isCanvasOnly && (
        <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-start pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-6 py-2 flex items-center gap-4 text-white pointer-events-auto">
            <Link href="/student/virtual-beyond" className="hover:text-yellow-400 transition-colors"><LogOut size={18} /></Link>
            <div className="w-px h-4 bg-white/20/20" />
            <span className="font-bold text-sm tracking-widest text-indigo-300">ROUND {sessionState.round}/{sessionState.totalRounds}</span>
            <span className="text-sm font-medium opacity-80">{searchParams.get('topic')}</span>
          </div>
          <div className="flex gap-4 items-center pointer-events-auto">
            <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
              <button onClick={() => setPov('1st')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${pov === '1st' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>1ST POV</button>
              <button onClick={() => setPov('3rd')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${pov === '3rd' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>3RD POV</button>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Flame key={i} size={24} className={'transition-all ' + (i <= sessionState.heatLevel ? 'text-rose-500 fill-rose-500' + (i === 5 ? ' animate-pulse scale-125' : '') : 'text-slate-700')} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      <AnimatePresence>
        {!isCanvasOnly && fallacyAlert && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 80, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-amber-950 px-8 py-4 rounded-2xl shadow-2xl border-4 border-amber-300 flex items-center gap-4 max-w-lg pointer-events-auto">
            <AlertTriangle size={32} />
            <div>
              <p className="font-black tracking-widest uppercase">{fallacyAlert.type?.replace('_', ' ')} DETECTED</p>
              <p className="text-sm font-medium">{fallacyAlert.explanation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coaching Nudges */}
      <AnimatePresence>
        {!isCanvasOnly && coachingNudge && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-24 right-4 z-50 bg-indigo-600/90 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-lg border border-indigo-400 flex items-center gap-2 pointer-events-auto">
            <Lightbulb size={16} className="text-yellow-400" />
            <p className="text-sm font-medium">{coachingNudge}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debate Canvas */}
      <div className="flex-1 relative">
        <DebateCanvas
          roomStyle={searchParams.get('room') || 'university_hall'}
          aiPersonality={searchParams.get('ai') || 'calm_professor'}
          sessionState={sessionState}
          pov={pov}
        />
        
        {/* Subtitles */}
        {isAISpeaking && sessionState.aiText && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-full px-8">
            <div className="max-w-2xl mx-auto bg-black/80 backdrop-blur-md text-white p-4 rounded-2xl border border-white/10 text-center shadow-2xl">
              <p className="text-sm md:text-base font-medium leading-relaxed">{sessionState.aiText}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panel */}
      {!isCanvasOnly && (
      <div className="h-[35%] bg-gradient-to-t from-slate-950 via-slate-900 to-transparent flex flex-col justify-end p-6 z-40 relative pointer-events-none">

        <div className="w-full max-w-4xl mx-auto mb-4 pointer-events-auto">
          <div className="flex justify-between text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">
            <span className="text-rose-500 flex items-center gap-1"><Users size={12} /> Hostile</span>
            <span>Crowd Approval</span>
            <span className="text-emerald-500">Supportive</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
            <motion.div
              className={'h-full ' + (sessionState.crowdMood > 60 ? 'bg-emerald-500' : sessionState.crowdMood < 40 ? 'bg-rose-500' : 'bg-yellow-500')}
              animate={{ width: crowdWidth }}
              transition={{ type: 'spring', bounce: 0.4 }}
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-end pointer-events-auto">

          {}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-3">
            {[
              { label: 'Frustration', val: currentMetrics.current.frustrationScore, color: 'bg-rose-500', icon: '😤' },
              { label: 'Confidence', val: currentMetrics.current.confidenceScore, color: 'bg-indigo-500', icon: '💪' },
              { label: 'Aggression', val: currentMetrics.current.aggressionScore, color: 'bg-orange-500', icon: '🔥' }
            ].map(m => (
              <div key={m.label} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>{m.icon} {m.label}</span>
                  <span>{Math.round(m.val * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={m.color + ' h-full'} style={{ width: (m.val * 100) + '%' }} />
                </div>
              </div>
            ))}
          </div>

          {}
          <div className="flex flex-col items-center justify-end pb-4">
            {micState === 'RECORDING' && liveTranscript && (
              <p className="text-green-300 text-xs text-center mb-3 max-w-sm italic line-clamp-2">🎤 {liveTranscript}</p>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onPointerDown={startRecording} onPointerUp={stopRecording} onPointerLeave={() => { if (micState === 'RECORDING') stopRecording(); }}
              disabled={micState === 'DISABLED' || micState === 'PROCESSING' || isAISpeaking}
              className={'w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl ' +
                (micState === 'IDLE' && !isAISpeaking ? 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105'
                  : micState === 'RECORDING' ? 'bg-rose-600 animate-pulse scale-110 shadow-rose-500/50'
                  : 'bg-slate-700 opacity-50 cursor-not-allowed')}
            >
              {micState === 'DISABLED' ? <Ban size={32} className="text-slate-400" /> : <Mic size={32} className="text-white" />}
            </motion.button>
            <p className="text-white mt-4 font-medium h-6 text-center text-sm">
              {micState === 'IDLE' && !isAISpeaking ? 'Hold to Speak' : micState === 'RECORDING' ? 'Listening...' : micState === 'PROCESSING' ? 'Analyzing...' : isAISpeaking ? 'Interviewer Speaking...' : 'Mic Disabled'}
            </p>
          </div>

          {}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Arsenal</span>
              <span className={'text-xs font-bold px-2 py-0.5 rounded-full ' + (sessionState.heatLevel >= 5 ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300')}>
                {ammoText}
              </span>
            </div>
            <div className="flex gap-2 justify-between">
              {[
                { id: 'tomato', icon: '🍅', locked: false },
                { id: 'paper', icon: '📄', locked: false },
                { id: 'eraser', icon: '✏️', locked: false },
                { id: 'book', icon: '📚', locked: false },
                { id: 'balloon', icon: '💦', locked: false },
                { id: 'chair', icon: '🪑', locked: sessionState.heatLevel < 5 }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => handleThrow(item.id)}
                  disabled={item.locked || (ammo <= 0 && sessionState.heatLevel < 5)}
                  className={'w-12 h-12 rounded-xl text-2xl flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 transition-colors border border-white/5 ' + (item.locked ? 'opacity-20 grayscale' : 'hover:scale-110 hover:-translate-y-2')}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {!isCanvasOnly && <MediaPipeDebateAnalyzer onMetricsUpdate={(m) => { currentMetrics.current = m; }} />}
    </div>
  );
}
