'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Sparkles, BotMessageSquare, User, Mic, MicOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '@/lib/axios';
import type { ChatMessage } from '@/types';

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg: ChatMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages((p) => [...p, msg]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/chatbot/chat', { message: msg.content });
      setMessages((p) => [...p, { role: 'assistant', content: data.reply, timestamp: data.timestamp }]);
    } catch {
      setMessages((p) => [...p, { role: 'assistant', content: 'Sorry, please try again.', timestamp: new Date().toISOString() }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl flex items-center gap-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--s-text)' }}>
            🤖 AI Study Mentor
          </h1>
          <p className="text-xs mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--s-muted)' }}>Powered by Gemini 2.0 Flash</p>
        </div>
        <button onClick={() => { api.delete('/api/chatbot/history'); setMessages([]); }} className="p-2 hover:bg-red-100 rounded-xl"><Trash2 size={18} className="text-red-400" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 rounded-2xl border-2 flex flex-col space-y-4" style={{ background: 'var(--s-card)', borderColor: 'var(--s-border)', backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e8dcc8 27px, #e8dcc8 28px)' }}>
        {messages.length === 0 && <div className="flex flex-col items-center justify-center h-full opacity-40"><BotMessageSquare size={48} className="mb-4" /><p style={{ fontFamily: 'var(--font-display)' }}>Ask me anything!</p></div>}
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-yellow-400' : 'bg-purple-500'}`}>
                {m.role === 'user' ? <User size={14} className="text-brutal-text" /> : <Sparkles size={14} className="text-white" />}
              </div>
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-yellow-400/20 rounded-tr-md' : 'bg-white/80/80 border border-gray-200 rounded-tl-md'}`} style={{ fontFamily: 'var(--font-body)' }}>
                {m.role === 'assistant' ? <div className="prose prose-sm max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div> : m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && <div className="flex gap-3"><div className="w-8 h-8 rounded-xl bg-purple-500 flex items-center justify-center"><Sparkles size={14} className="text-white" /></div><div className="p-3 bg-white/80/80 border rounded-2xl"><div className="flex gap-1"><span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" /></div></div></div>}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <button 
          onClick={toggleListening}
          className={`p-3 border-2 border-brutal-border rounded-xl transition-colors shadow-[2px_2px_0px_#000] flex-shrink-0 ${isListening ? 'bg-red-400 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200 text-brutal-text'}`}
          title="Voice Input (STT)"
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <input id="chatbot-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={isListening ? "Listening..." : "Ask about study tips, concepts, exam prep..."} className="flex-1 px-4 py-3 rounded-xl border-2 focus:border-yellow-400 focus:outline-none" style={{ borderColor: 'var(--s-border)', fontFamily: 'var(--font-body)', background: 'var(--s-card)' }} disabled={loading || isListening} />
        <button id="chatbot-send" onClick={send} disabled={loading || !input.trim()} className="comic-btn px-5 py-3 bg-yellow-400 rounded-xl disabled:opacity-50"><Send size={18} className="text-brutal-text" /></button>
      </div>
    </div>
  );
}
