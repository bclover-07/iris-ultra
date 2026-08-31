'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Sparkles, BotMessageSquare, User, Mic, MicOff, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '@/lib/axios';
import type { ChatMessage } from '@/types';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const Avatar3DScene = dynamic(() => import('@/components/Avatar3DScene'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-indigo-100 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
        <p className="font-fredoka text-purple-600 font-bold text-lg">Loading 3D Avatar...</p>
      </div>
    </div>
  )
});

function FallbackAvatar({ mood }: { mood: string }) {
  const moodEmojis: Record<string, string> = {
    idle: '😊', thinking: '🤔', talking: '🗣️', happy: '😄', waving: '👋'
  };
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 rounded-3xl">
      <div className="text-center space-y-4">
        <div className={`text-8xl ${mood === 'talking' ? 'animate-bounce' : mood === 'thinking' ? 'animate-pulse' : ''}`} style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}>
          {moodEmojis[mood] || '😊'}
        </div>
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center border-4 border-white shadow-xl">
          <span className="text-white text-4xl font-bold">AI</span>
        </div>
        <p className="font-fredoka text-purple-600 font-bold text-sm">2D Avatar Mode</p>
      </div>
    </div>
  );
}

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();
    }
    return !!gl;
  } catch {
    return false;
  }
}

export default function AIAvatarChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [avatarMood, setAvatarMood] = useState<'idle' | 'thinking' | 'talking' | 'happy' | 'waving'>('idle');
  const [webglSupported, setWebglSupported] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);


  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    setWebglSupported(checkWebGLSupport());
  }, []);

  useEffect(() => {
    api.get('/api/chatbot/history').then(({ data }) => {
      if (data.messages?.length) setMessages(data.messages);
    }).catch(() => {});
  }, []);


  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);


  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        console.error('Speech recognition stop error:', e);
      }
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error('Speech recognition start error:', e);
        setIsListening(true);
      }
    }
  }, [isListening]);

  const speakText = useCallback(async (text: string) => {
    if (!isSpeaking || typeof window === 'undefined') return;
    
    try {
      // Use dynamic RegExp to bypass TypeScript's ES5 target check (TS1501 error)
      const emojiRegex = new RegExp('[\\p{Emoji_Presentation}\\p{Extended_Pictographic}]', 'gu');
      const cleanText = text.replace(/[#*_`]/g, '').replace(emojiRegex, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      const vList = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
      const femaleVoice = vList.find(v => 
        v.name.includes('Female') || 
        v.name.includes('Zira') || 
        v.name.includes('Samantha') || 
        v.name.includes('Victoria') ||
        v.name.includes('Microsoft Hazel') ||
        v.name.includes('Google UK English Female') ||
        v.name.includes('Google US English') // fallback to google generic if specific female isn't explicitly named
      );
      
      // If we found a female voice, use it. Otherwise wait for voices to load next time
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.rate = 1;
      utterance.pitch = 1.3; // Higher pitch for female/anime vibe
      utterance.volume = 1;
      
      setPlayingAudio(true);
      setAvatarMood('talking');
      
      utterance.onend = () => {
        setPlayingAudio(false);
        setAvatarMood('happy');
        setTimeout(() => setAvatarMood('idle'), 2000);
      };
      utterance.onerror = () => {
        setPlayingAudio(false);
        setAvatarMood('idle');
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('TTS Error:', err);
      setPlayingAudio(false);
      setAvatarMood('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeaking]);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const msg: ChatMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages((p) => [...p, msg]);
    setInput('');
    setLoading(true);
    setAvatarMood('thinking');

    try {
      const { data } = await api.post('/api/chatbot/chat', { message: msg.content });
      const reply = data.reply;
      setMessages((p) => [...p, { role: 'assistant', content: reply, timestamp: data.timestamp }]);
      setAvatarMood('happy');
      
      if (isSpeaking) {
        await speakText(reply);
      } else {
        setTimeout(() => setAvatarMood('idle'), 2000);
      }
    } catch {
      setMessages((p) => [...p, { role: 'assistant', content: 'Sorry, something went wrong. Please try again!', timestamp: new Date().toISOString() }]);
      setAvatarMood('idle');
    } finally { setLoading(false); }
  }, [input, loading, isSpeaking, speakText]);

  const clearHistory = useCallback(() => {
    api.delete('/api/chatbot/history');
    setMessages([]);
    setAvatarMood('waving');
    setTimeout(() => setAvatarMood('idle'), 2000);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
      <audio ref={audioRef} className="hidden" />
      
      {}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/student/chatbot" className="p-2 hover:bg-yellow-100 dark:hover:bg-slate-700 rounded-xl transition-colors brutalist-border bg-white dark:bg-slate-800 dark:border-slate-700 hard-shadow dark:shadow-[6px_6px_0px_#1e293b]">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl flex items-center gap-2 font-fredoka font-bold" style={{ color: 'var(--comic-black)' }}>
              <span className="bg-purple-500 text-white px-3 py-1 rounded-xl brutalist-border -rotate-2 text-lg md:text-xl">🤖</span>
              3D Avatar Mentor
            </h1>
            <p className="text-xs mt-1 font-fredoka font-bold uppercase tracking-widest text-gray-500">Interactive 3D AI • Voice Enabled</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSpeaking(!isSpeaking)}
            className={`p-2 md:p-3 brutalist-border rounded-xl transition-all hard-shadow flex items-center gap-2 text-xs font-bold font-fredoka ${isSpeaking ? 'bg-green-100 border-green-500 dark:bg-green-900/40 dark:border-green-600' : 'bg-gray-100 dark:bg-slate-800 dark:border-slate-700'} dark:shadow-[6px_6px_0px_#1e293b]`}
            title="Toggle Voice"
          >
            {isSpeaking ? <Volume2 size={18} className="text-green-600" /> : <VolumeX size={18} className="text-gray-400" />}
            <span className="hidden md:inline">{isSpeaking ? 'Voice On' : 'Voice Off'}</span>
          </button>
          <button 
            onClick={clearHistory}
            className="p-2 md:p-3 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl brutalist-border bg-white dark:bg-slate-800 dark:border-slate-700 hard-shadow dark:shadow-[6px_6px_0px_#1e293b] transition-all"
            title="Clear chat"
          >
            <Trash2 size={18} className="text-red-400" />
          </button>
        </div>
      </div>

      {}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0">
        
        {}
        <div className="w-full lg:w-2/5 h-[280px] md:h-[350px] lg:h-full flex-shrink-0 relative">
          <div className="w-full h-full brutalist-border dark:border-slate-700 rounded-3xl overflow-hidden hard-shadow-lg dark:shadow-[10px_10px_0px_#1e293b] relative bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900">
            {}
            <div className="absolute top-3 left-3 z-10 flex gap-2 flex-wrap">
              <span className="bg-white dark:bg-slate-800 dark:text-slate-200 px-2 py-1 text-[10px] font-bold font-fredoka rounded-lg border-2 border-brutal-border dark:border-slate-600 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#1e293b] flex items-center gap-1 uppercase tracking-wider">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Live 3D
              </span>
              {playingAudio && (
                <span className="bg-yellow-300 px-2 py-1 text-[10px] font-bold font-fredoka rounded-lg border-2 border-brutal-border shadow-[2px_2px_0px_#000] flex items-center gap-1 animate-bounce">
                  <Volume2 size={10} /> Speaking
                </span>
              )}
              {avatarMood === 'thinking' && (
                <span className="bg-blue-200 px-2 py-1 text-[10px] font-bold font-fredoka rounded-lg border-2 border-brutal-border shadow-[2px_2px_0px_#000] flex items-center gap-1 animate-pulse">
                  <Sparkles size={10} /> Thinking...
                </span>
              )}
            </div>

            {/* Mood Indicator */}
            <div className="absolute bottom-3 left-3 z-10">
              <span className="bg-white/90 dark:bg-slate-800/90 dark:text-slate-200 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold font-fredoka rounded-xl border-2 border-brutal-border dark:border-slate-600 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#1e293b] capitalize">
                Mood: {avatarMood === 'idle' ? '😊 Idle' : avatarMood === 'thinking' ? '🤔 Thinking' : avatarMood === 'talking' ? '🗣️ Talking' : avatarMood === 'happy' ? '😄 Happy' : '👋 Waving'}
              </span>
            </div>

            {/* 3D Scene / Fallback */}
            {!webglSupported || avatarError ? (
              <FallbackAvatar mood={avatarMood} />
            ) : (
              <Avatar3DScene mood={avatarMood} />
            )}
          </div>
        </div>

        {}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {}
          <div 
            className="flex-1 overflow-y-auto p-3 md:p-4 rounded-2xl brutalist-border flex flex-col space-y-3 hide-scrollbar hard-shadow"
            style={{ 
              background: 'var(--s-card)', 
              borderColor: 'var(--s-border)',
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e8dcc8 27px, #e8dcc8 28px)' 
            }}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-40 py-8">
                <BotMessageSquare size={48} className="mb-4" />
                <p className="font-fredoka text-xl font-bold">Talk to your 3D Mentor!</p>
                <p className="font-fredoka text-sm text-gray-500 mt-2">Type or use voice to start a conversation</p>
              </div>
            )}
            <AnimatePresence>
              {messages.map((m, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className={`flex gap-2 md:gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center flex-shrink-0 brutalist-border ${m.role === 'user' ? 'bg-yellow-400' : 'bg-purple-500'}`}>
                    {m.role === 'user' ? <User size={13} className="text-brutal-text" /> : <Sparkles size={13} className="text-white" />}
                  </div>
                  <div className={`max-w-[80%] p-2.5 md:p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-yellow-400/20 rounded-tr-md brutalist-border' : 'bg-white/80/80 brutalist-border rounded-tl-md'}`} style={{ fontFamily: 'var(--font-body)' }}>
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : m.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500 flex items-center justify-center brutalist-border">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div className="p-3 bg-white/80/80 brutalist-border rounded-2xl">
                  <div className="flex gap-1">
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {}
          <div className="mt-3 flex gap-2">
            <button
              onClick={toggleListening}
              className={`p-2.5 md:p-3 brutalist-border rounded-xl transition-colors hard-shadow flex-shrink-0 ${isListening ? 'bg-red-400 text-white animate-pulse' : 'bg-gray-100 dark:bg-slate-800 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 text-brutal-text dark:text-slate-200'} dark:shadow-[6px_6px_0px_#1e293b]`}
              title="Voice Input (STT)"
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <input
              id="avatar-chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={isListening ? '🎤 Listening...' : 'Talk to your 3D mentor...'}
              className="flex-1 px-3 md:px-4 py-2.5 md:py-3 rounded-xl brutalist-border focus:border-purple-400 focus:outline-none text-sm md:text-base"
              style={{ fontFamily: 'var(--font-body)', background: 'var(--s-card)' }}
              disabled={loading || isListening}
            />
            <button
              id="avatar-chatbot-send"
              onClick={send}
              disabled={loading || !input.trim()}
              className="p-2.5 md:p-3 bg-purple-500 text-white brutalist-border rounded-xl hover:bg-purple-400 disabled:opacity-50 transition-colors hard-shadow"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
