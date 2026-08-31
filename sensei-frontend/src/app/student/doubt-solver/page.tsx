'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Camera, Send, Brain, Sparkles, Volume2, VolumeX, Image as ImageIcon, Loader2, ChevronRight } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';


interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export default function DoubtSolverPage() {
  const [inputType, setInputType] = useState<'text' | 'voice' | 'image'>('text');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [handLandmarker, setHandLandmarker] = useState<any>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(100);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  useEffect(() => {

    const initMP = async () => {
      try {
        const vision = await import('@mediapipe/tasks-vision');
        const { HandLandmarker, FilesetResolver } = vision;
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });
        setHandLandmarker(landmarker);
      } catch (err) {
        console.error("MediaPipe Init Error:", err);
      }
    };
    initMP();
  }, []);

  useEffect(() => {
    let animId: number;
    const runDetection = () => {
      if (handLandmarker && videoRef.current && isCameraOpen && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
        try {
          const results = handLandmarker.detectForVideo(videoRef.current, performance.now());
          if (results.landmarks.length > 0) {

          }
        } catch (err) {
          console.warn("Detection frame skipped:", err);
        }
      }
      animId = requestAnimationFrame(runDetection);
    };
    if (isCameraOpen) runDetection();
    return () => cancelAnimationFrame(animId);
  }, [handLandmarker, isCameraOpen]);


  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    if (!speechSupported) {
      toast.error('Speech recognition not supported in this browser. Try Chrome.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = query;

    recognition.onstart = () => {
      setIsRecording(true);
      setInputType('voice');
      toast.success('🎙️ Listening... Speak your doubt now!');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + transcript;
          setQuery(finalTranscript);
          setInterimText('');
        } else {
          interim += transcript;
        }
      }
      if (interim) {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone permissions.');
      } else if (event.error === 'no-speech') {
        toast.error('No speech detected. Try again.');
      } else if (event.error !== 'aborted') {
        toast.error(`Speech error: ${event.error}`);
      }
      setIsRecording(false);
      setInterimText('');
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText('');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [query, speechSupported]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimText('');
    toast.success('Recording stopped');
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const playNarration = () => {
    if (!solution?.narration || typeof window === 'undefined') return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(solution.narration);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleSolve = async () => {
    if (!query.trim() && inputType === 'text') return toast.error('Enter your doubt first!');
    if (!query.trim()) return toast.error('No input captured yet!');

    if (isRecording) stopRecording();

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
    setLoading(true);
    setSolution(null);
    setFallbackActive(false);
    setConfidenceScore(100);
    try {
      const { data } = await api.post('/api/doubt/solve', {
        inputType,
        originalQuery: query,
        transcription: inputType === 'voice' ? query : '',
        ocrText: inputType === 'image' ? 'Handwritten question from image...' : ''
      });
      setSolution(data.solution);
      setFallbackActive(data.fallbackActive || false);
      setConfidenceScore(data.confidenceScore !== undefined ? data.confidenceScore : 100);
      toast.success('Solution generated!');
    } catch (err) {
      toast.error('Failed to solve doubt');
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setIsCameraOpen(false);
      toast.error('Camera failed. Please use the Upload option.');
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInputType('image');
      setQuery(`[Image Attached: ${file.name}]`);
      toast.success('Image uploaded! Click Solve to explain it.');
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0, 400, 300);
      setIsCameraOpen(false);
      setInputType('image');
      setQuery('[Image Captured]');
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-display text-sensei-gold drop-shadow-[4px_4px_0px_#2D2D2D] dark:drop-shadow-[4px_4px_0px_#334155]">🔍 Doubt Solver</h1>
        <p className="text-lg font-body text-s-muted">Snap it, speak it, or type it — Sensei solves it!</p>
      </div>


      <div className="comic-card p-6 bg-white dark:bg-slate-800 space-y-6">
        <div className="flex justify-center gap-4 flex-wrap">
          <button
            onClick={() => { if (isRecording) stopRecording(); setInputType('text'); }}
            className={`comic-btn px-6 py-2 rounded-xl flex items-center gap-2 ${inputType === 'text' && !isRecording ? 'bg-sensei-gold text-brutal-text border-brutal-border' : 'bg-gray-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'}`}
          >
            <Send size={18} /> Type
          </button>
          <button
            onClick={toggleRecording}
            className={`comic-btn px-6 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 ${isRecording
                ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-105'
                : inputType === 'voice'
                  ? 'bg-sensei-coral text-white border-brutal-border'
                  : 'bg-gray-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
              }`}
          >
            {isRecording ? (
              <>
                <MicOff size={18} className="animate-pulse" /> Stop
              </>
            ) : (
              <>
                <Mic size={18} /> Voice
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => { if (isRecording) stopRecording(); startCamera(); }}
              className={`comic-btn px-6 py-2 rounded-xl flex items-center gap-2 ${inputType === 'image' && !isCameraOpen ? 'bg-sensei-blue text-white border-brutal-border' : 'bg-gray-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'}`}
            >
              <Camera size={18} /> Camera
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="comic-btn px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 flex items-center gap-2 hover:bg-gray-200 hover:dark:bg-slate-800"
              title="Upload Image"
            >
              <ImageIcon size={18} /> Upload
            </button>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
        />
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-center gap-4 py-4 px-6 bg-red-50 dark:bg-red-950/20 rounded-2xl border-2 border-red-200 dark:border-red-900/40">
                <div className="relative flex items-center justify-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                  <div className="absolute w-8 h-8 bg-red-400/30 rounded-full animate-ping" />
                </div>
                <span className="font-display text-lg text-red-600 dark:text-red-400 animate-pulse">
                  🎙️ LISTENING...
                </span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-red-400 rounded-full"
                      animate={{ height: [8, 20, 8] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
                <button
                  onClick={stopRecording}
                  className="ml-auto px-4 py-1.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors border-2 border-red-700"
                >
                  ■ STOP
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isCameraOpen && (
          <div className="relative rounded-2xl overflow-hidden border-4 border-s-border max-w-md mx-auto">
            <video ref={videoRef} autoPlay playsInline className="w-full" />
            <button onClick={captureImage} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 dark:text-white p-4 rounded-full border-4 border-s-border shadow-lg">
              <Camera size={24} />
            </button>
          </div>
        )}

        <div className="relative">
          <textarea
            value={query + (interimText ? (query ? ' ' : '') + interimText : '')}
            onChange={(e) => { if (!isRecording) setQuery(e.target.value); }}
            placeholder={
              isRecording
                ? '🎙️ Speak now... your words will appear here in real-time'
                : inputType === 'voice'
                  ? 'Click "Voice" to start recording...'
                  : inputType === 'image'
                    ? 'Image details here...'
                    : "Type your math, science or coding doubt..."
            }
            className={`notebook-input w-full min-h-[120px] text-xl transition-all duration-300 ${isRecording ? 'border-red-300 bg-red-50/30 ring-2 ring-red-200' : ''
              }`}
            readOnly={isRecording}
          />
          {interimText && (
            <div className="absolute bottom-2 left-4 text-sm text-gray-400 italic font-body">
              hearing: &quot;{interimText}&quot;
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-sensei-gold" size={48} />
                <p className="font-display text-xl animate-pulse text-black dark:text-white">Sensei is Thinking...</p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSolve}
          disabled={loading || !query.trim()}
          className="comic-btn w-full py-4 bg-sensei-gold text-2xl font-display rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 text-brutal-text"
        >
          <Sparkles /> SOLVE NOW <Sparkles />
        </button>
      </div>

      <canvas ref={canvasRef} width={400} height={300} className="hidden" />


      <AnimatePresence>
        {solution && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {fallbackActive && (
              <div className="bg-orange-50 dark:bg-orange-950/20 border-4 border-orange-400 dark:border-orange-850 p-5 rounded-2xl shadow-brutal-md flex gap-3 items-start font-fredoka text-orange-950 dark:text-orange-200">
                <span className="text-3xl">⚠️</span>
                <div>
                  <p className="font-bold text-orange-800 dark:text-orange-400 text-lg uppercase">Human-in-the-Loop Fallback Activated</p>
                  <p className="mt-1 text-sm">
                    Our AI has a confidence level of <strong>{confidenceScore}%</strong> (below 70%) for this doubt. We have automatically routed this query to the Teacher Help Queue for manual resolution.
                  </p>
                </div>
              </div>
            )}

            <div className="speech-bubble bg-sensei-card5 dark:bg-slate-900 dark:text-white dark:border-slate-700">
              <h2 className="text-2xl font-display flex items-center gap-2">
                <Brain className="text-sensei-coral" /> Sensei's Explanation
              </h2>
              <p className="font-body text-lg mt-2">{solution.explanation}</p>

              {solution.narration && (
                <div
                  onClick={playNarration}
                  className={`mt-4 p-3 rounded-xl flex items-center gap-3 border-2 border-s-border cursor-pointer transition-all duration-300 ${isPlaying
                      ? 'bg-sensei-gold text-white shadow-[0_4px_12px_rgba(255,190,11,0.3)] border-brutal-border'
                      : 'bg-white/50 dark:bg-slate-900/50 hover:bg-white hover:dark:bg-slate-800 dark:text-slate-300 hover:dark:text-white hover:border-sensei-blue'
                    }`}
                >
                  {isPlaying ? (
                    <VolumeX className={isPlaying ? 'animate-pulse' : ''} />
                  ) : (
                    <Volume2 className="text-sensei-blue" />
                  )}
                  <p className="text-sm italic font-bold">
                    {isPlaying ? 'Stop narration' : 'Click to hear the narrated walkthrough'}
                  </p>
                  {isPlaying && (
                    <div className="flex gap-1 ml-auto">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 bg-white rounded-full"
                          animate={{ height: [6, 16, 6] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-6">
              {solution.steps?.map((step: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="comic-card p-6 group hover:border-sensei-gold"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-sensei-gold rounded-full flex items-center justify-center font-display text-2xl border-3 border-s-border shrink-0 text-brutal-text">
                      {step.stepNumber}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold font-display">{step.title}</h3>
                      <p className="font-body text-lg text-s-muted">{step.content}</p>
                      {step.latex && (
                        <div className="p-4 bg-gray-50 dark:bg-slate-950 rounded-xl font-mono text-sensei-coral border-2 border-dashed border-gray-300 dark:border-slate-800">
                          {step.latex}
                        </div>
                      )}
                      {step.visual && (
                        <div className="flex items-center gap-2 text-sm text-sensei-blue font-bold">
                          <ImageIcon size={14} /> Visual: {step.visual}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pow-burst w-full py-6 text-3xl">
              SUMMARY: {solution.summary}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
