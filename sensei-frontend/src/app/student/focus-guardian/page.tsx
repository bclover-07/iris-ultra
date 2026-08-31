'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, ShieldAlert, Brain, Zap, History, BarChart3, Settings, Play, Pause, Square, AlertCircle, RefreshCw, X } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export default function FocusGuardianPage() {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isDistracted, setIsDistracted] = useState(false);
  const [focusScore, setFocusScore] = useState(100);
  const [distractions, setDistractions] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<any>(null);
  const [holistic, setHolistic] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Mindfulness break state
  const [showMindfulness, setShowMindfulness] = useState(false);
  const [breathState, setBreathState] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [breathTimer, setBreathTimer] = useState(19);
  const [breathingCompliance, setBreathingCompliance] = useState(100);
  const shoulderHistoryRef = useRef<number[]>([]);
  const complianceHistoryRef = useRef<boolean[]>([]);

  useEffect(() => {
    const initMP = async () => {
        try {
            const vision = await import('@mediapipe/tasks-vision');
            const filesetResolver = await vision.FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            const landmarker = await vision.PoseLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO"
            });
            setHolistic(landmarker);
        } catch (err) {
            console.error("MediaPipe Init Error:", err);
        }
    };
    initMP();
  }, []);

  useEffect(() => {
    let animId: number;
    const runDetection = () => {
        if (holistic && videoRef.current && isActive && videoRef.current.readyState >= 2) {
            try {
                if (videoRef.current.paused) videoRef.current.play().catch(() => {});

                const results = holistic.detectForVideo(videoRef.current, performance.now());
                if (results.landmarks && results.landmarks.length > 0 && results.landmarks[0].length > 0) {
                    const landmarks = results.landmarks[0];
                    const head = landmarks[0];
                    
                    if (head.x < 0.25 || head.x > 0.75 || head.y < 0.2 || head.y > 0.8) {
                        if (!isDistracted) {
                          setIsDistracted(true);
                          setShowMindfulness(true);
                          toast('Mindfulness Break Triggered', { icon: '🧘', duration: 3000 });
                        }

                        setDistractions(prev => {
                            const last = prev[prev.length - 1];
                            const now = new Date();
                            if (!last || (now.getTime() - new Date(last.timestamp).getTime() > 5000)) {
                                return [...prev, { type: 'looking_away', timestamp: now }];
                            }
                            return prev;
                        });
                    } else {
                        setIsDistracted(false);
                    }

                    // Track chest/shoulder expansion for breathing compliance
                    if (landmarks[11] && landmarks[12]) {
                      const avgY = (landmarks[11].y + landmarks[12].y) / 2;
                      shoulderHistoryRef.current.push(avgY);
                      if (shoulderHistoryRef.current.length > 30) {
                        shoulderHistoryRef.current.shift();
                      }

                      const lastState = (window as any)._breathState;
                      const lastTimer = (window as any)._breathTimer;
                      if (lastState && lastState !== 'idle' && lastTimer > 0) {
                        const len = shoulderHistoryRef.current.length;
                        if (len >= 2) {
                          const deltaY = avgY - shoulderHistoryRef.current[len - 2];
                          let isCompliant = true;
                          if (lastState === 'inhale') {
                            // Inhale: shoulders rise (y decreases)
                            isCompliant = deltaY < 0.0003;
                          } else if (lastState === 'exhale') {
                            // Exhale: shoulders drop (y increases)
                            isCompliant = deltaY > -0.0003;
                          } else if (lastState === 'hold') {
                            // Hold: shoulders stable
                            isCompliant = Math.abs(deltaY) < 0.0008;
                          }
                          complianceHistoryRef.current.push(isCompliant);
                          const trues = complianceHistoryRef.current.filter(Boolean).length;
                          setBreathingCompliance(Math.round((trues / complianceHistoryRef.current.length) * 100));
                        }
                      }
                    }
                }
            } catch (err) {
                console.warn("Pose detection frame skipped:", err);
            }
        }
        animId = requestAnimationFrame(runDetection);
    };
    if (isActive) runDetection();
    return () => cancelAnimationFrame(animId);
  }, [holistic, isActive, isDistracted]);

  // Breathing 4-7-8 control sequence
  useEffect(() => {
    let interval: any;
    if (showMindfulness) {
      setBreathTimer(19);
      setBreathState('inhale');
      (window as any)._breathState = 'inhale';
      (window as any)._breathTimer = 19;
      complianceHistoryRef.current = [];
      setBreathingCompliance(100);
      
      interval = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev <= 1) {
            setBreathState('idle');
            (window as any)._breathState = 'idle';
            (window as any)._breathTimer = 0;
            clearInterval(interval);
            return 0;
          }
          const nextVal = prev - 1;
          (window as any)._breathTimer = nextVal;
          if (nextVal > 15) {
            setBreathState('inhale');
            (window as any)._breathState = 'inhale';
          } else if (nextVal > 8) {
            setBreathState('hold');
            (window as any)._breathState = 'hold';
          } else {
            setBreathState('exhale');
            (window as any)._breathState = 'exhale';
          }
          return nextVal;
        });
      }, 1000);
    } else {
      setBreathState('idle');
      (window as any)._breathState = 'idle';
      (window as any)._breathTimer = 0;
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [showMindfulness]);

  useEffect(() => {
    if (isActive && !showMindfulness) {
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    const currentVideo = videoRef.current;
    return () => {
        clearInterval(timerRef.current);
        if (currentVideo?.srcObject) {
            const stream = currentVideo.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
        }
    };
  }, [isActive, showMindfulness]);

  useEffect(() => {
    const watchdog = setInterval(() => {
      if (isActive && videoRef.current) {
        if (videoRef.current.paused || videoRef.current.readyState < 2) {
            videoRef.current.play().catch(() => {});
        }
      }
    }, 3000);
    return () => clearInterval(watchdog);
  }, [isActive]);

  const handleStart = async () => {
    setIsActive(true);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
        toast.error("Camera needed for focus tracking");
    }
  };

  const handleStop = async () => {
    setIsActive(false);
    const totalMinutes = Math.floor(seconds / 60);
    const focusedMinutes = Math.max(0, totalMinutes - Math.floor(distractions.length / 2));
    
    setLoading(true);
    try {
        await api.post('/api/focus/session', {
            startTime: new Date(Date.now() - seconds * 1000),
            endTime: new Date(),
            totalMinutes,
            focusedMinutes,
            distractions,
            environment: { noiseLevel: 'quiet' }
        });
        toast.success("Focus session saved!");
        setSeconds(0);
        setDistractions([]);
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
    } catch (err) {
        toast.error("Failed to save session");
    } finally {
        setLoading(false);
    }
  };

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const resumeFocus = () => {
    setShowMindfulness(false);
    setIsDistracted(false);
    toast.success('Resuming Focus Session!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 relative">
      
      {/* ── MINDFULNESS BREATHING OVERLAY ── */}
      <AnimatePresence>
        {showMindfulness && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#FAF6EE] dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-fredoka border-8 border-brutal-border dark:border-slate-800"
          >
            <div className="absolute top-6 left-6 bg-yellow-400 border-4 border-brutal-border px-4 py-2 text-sm font-black uppercase tracking-wider rounded-xl shadow-brutal-md rotate-[-2deg]">
              🧘 Adaptive Mindfulness Break
            </div>

            <div className="max-w-md w-full space-y-8">
              <h2 className="text-4xl font-black uppercase tracking-tight text-[var(--comic-black)]">
                Resetting your focus...
              </h2>
              <p className="text-gray-600 dark:text-slate-400 text-sm">
                We noticed you looked away. Let's do a quick 4-7-8 breathing exercise to recalibrate your attention level.
              </p>

              {/* Breathing circular animation */}
              <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: breathState === 'inhale' ? 1.4 : breathState === 'hold' ? 1.4 : 0.8,
                    backgroundColor: breathState === 'inhale' ? '#93C5FD' : breathState === 'hold' ? '#FDE047' : '#86EFAC'
                  }}
                  transition={{
                    duration: breathState === 'inhale' ? 4 : breathState === 'hold' ? 7 : 8,
                    ease: "easeInOut"
                  }}
                  className="w-40 h-40 rounded-full border-4 border-brutal-border flex flex-col items-center justify-center shadow-brutal-lg transition-colors"
                >
                  <span className="text-2xl font-black uppercase text-brutal-text">
                    {breathState === 'inhale' ? 'Inhale 👃' : breathState === 'hold' ? 'Hold ✋' : breathState === 'exhale' ? 'Exhale 👄' : 'Done! 🎉'}
                  </span>
                  <span className="text-sm font-mono mt-1 text-brutal-text font-bold">
                    {breathTimer > 0 ? `${breathTimer}s` : 'Completed'}
                  </span>
                </motion.div>
              </div>

              {/* Live telemetry tracking */}
              <div className="bg-white dark:bg-slate-900 border-4 border-brutal-border dark:border-slate-800 p-4 rounded-2xl shadow-brutal-md space-y-2 text-black dark:text-white">
                <div className="flex justify-between items-center text-xs font-bold uppercase text-brutal-text dark:text-slate-200">
                  <span>Webcam Breathing Compliance</span>
                  <span className="text-blue-600 dark:text-blue-400">{breathingCompliance}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-950 h-4 rounded-full overflow-hidden border-2 border-brutal-border dark:border-slate-800">
                  <motion.div
                    animate={{ width: `${breathingCompliance}%` }}
                    className="h-full bg-blue-500"
                  />
                </div>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 text-left italic">
                  Pose landmarker is tracking your shoulder elevation. Rise shoulders during Inhale, fall during Exhale.
                </p>
              </div>

              {/* Controls */}
              <div className="pt-4">
                {breathTimer === 0 ? (
                  <motion.button
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    onClick={resumeFocus}
                    className="comic-btn px-10 py-4 !bg-green-400 text-brutal-text text-xl font-display rounded-2xl shadow-brutal-lg"
                  >
                    Resume Focus Work 🎯
                  </motion.button>
                ) : (
                  <button
                    onClick={resumeFocus}
                    className="px-6 py-2 border-2 border-brutal-border dark:border-slate-800 text-gray-500 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-gray-100 hover:dark:bg-slate-900 transition-colors"
                  >
                    Skip & Resume Focus
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-2">
        <h1 className="text-5xl font-display text-sensei-coral drop-shadow-[4px_4px_0px_#2D2D2D] dark:drop-shadow-[4px_4px_0px_#334155]">🎯 Focus Guardian</h1>
        <p className="text-lg font-body text-s-muted">Deep work tracker with AI distraction detection</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main tracking space */}
        <div className="md:col-span-2 comic-card p-8 bg-white dark:bg-slate-800 text-black dark:text-white flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
          <div className="relative">
            <div className={`w-64 h-64 rounded-full border-8 flex items-center justify-center transition-colors duration-500 ${isDistracted ? 'border-red-500' : 'border-sensei-gold'}`}>
              <span className="text-6xl font-mono font-bold text-black dark:text-white">{formatTime(seconds)}</span>
            </div>
            {isActive && (
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-4 border-4 border-dashed border-sensei-blue rounded-full opacity-30"
                />
            )}
          </div>

          <div className="flex gap-4">
            {!isActive ? (
                <button onClick={handleStart} className="comic-btn px-10 py-4 !bg-sensei-gold text-s-text text-2xl font-display rounded-2xl flex items-center gap-3 shadow-[6px_6px_0px_#2D2D2D]">
                    <Play fill="currentColor" size={28} /> START FOCUS
                </button>
            ) : (
                <div className="flex gap-4">
                    <button onClick={() => setIsActive(false)} className="comic-btn px-8 py-4 bg-yellow-100 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 text-xl font-display rounded-2xl flex items-center gap-3">
                        <Pause fill="currentColor" /> PAUSE
                    </button>
                    <button onClick={handleStop} className="comic-btn px-8 py-4 !bg-red-500 text-white font-bold text-xl font-display rounded-2xl flex items-center gap-3 shadow-[4px_4px_0px_#8b0000] border-2 border-black dark:border-white">
                        <Square fill="currentColor" size={20} /> STOP SESSION
                    </button>
                </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="comic-card p-6 bg-sensei-card3 dark:bg-amber-950/40 dark:border-amber-800/60 dark:shadow-[6px_6px_0px_rgba(245,158,11,0.4)] text-black dark:text-white">
            <h3 className="text-xl font-display flex items-center gap-2 mb-4">
                <Brain size={20} /> Real-time IQ
            </h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="font-body">Focus Score</span>
                    <span className="font-bold text-2xl text-sensei-blue">{isDistracted ? 40 : 98}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-950 h-4 rounded-full overflow-hidden border-2 border-s-border dark:border-slate-800">
                    <motion.div 
                        animate={{ width: isDistracted ? '40%' : '98%' }}
                        className="h-full bg-sensei-blue"
                    />
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-s-muted">Head pose: {isDistracted ? 'Looking Away' : 'On Screen'}</span>
                    <span className="flex items-center gap-1 text-green-500 font-bold">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        STABLE
                    </span>
                </div>
            </div>
          </div>

          <div className="comic-card p-6 bg-sensei-card5 dark:bg-purple-950/40 dark:border-purple-800/60 dark:shadow-[6px_6px_0px_rgba(168,85,247,0.4)] text-black dark:text-white">
            <h3 className="text-xl font-display flex items-center gap-2 mb-4">
                <ShieldAlert size={20} /> Guardian Logs
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto hide-scrollbar">
                {distractions.length === 0 && <p className="text-sm font-body italic text-center py-4">No distractions yet. Amazing!</p>}
                {distractions.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono p-2 bg-white/50 dark:bg-slate-900/50 border border-transparent dark:border-slate-800/60 rounded-lg text-black dark:text-slate-300">
                        <span className="text-red-500">⚠</span>
                        <span>{new Date(d.timestamp).toLocaleTimeString()} - {d.type}</span>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Picture-in-picture video stream */}
      <div className={`fixed bottom-24 right-8 w-48 h-36 rounded-2xl border-4 border-s-border bg-black overflow-hidden shadow-2xl transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-60" />
        <div className="absolute top-2 right-2 flex gap-1">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        </div>
      </div>

      {/* Focus calendar heatmap */}
      <div className="comic-card p-8 bg-white dark:bg-slate-800 text-black dark:text-white">
        <h2 className="text-2xl font-display flex items-center gap-2 mb-6">
            <BarChart3 className="text-sensei-coral" /> Weekly Focus Heatmap
        </h2>
        <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 * 12 }).map((_, i) => (
                <div key={i} className={`aspect-square rounded-md border border-gray-100 dark:border-slate-800/80 ${Math.random() > 0.6 ? 'bg-sensei-gold' : 'bg-gray-50 dark:bg-slate-900/50'}`} style={{ opacity: Math.random() }} />
            ))}
        </div>
        <div className="flex justify-between mt-4 text-xs font-mono text-s-muted uppercase">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
        </div>
      </div>
    </div>
  );
}
