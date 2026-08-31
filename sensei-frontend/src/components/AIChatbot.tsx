'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      api.get('/api/chatbot/history').then(({ data }) => {
        if (data.messages?.length > 0) setMessages(data.messages);
        else setMessages([{ role: 'assistant', content: 'Hi! I am Sensei. How can I help you today?', timestamp: new Date().toISOString() }]);
      }).catch(console.error);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const playTTS = async (text: string, forcePlay: boolean = false) => {
    if (!isSpeaking && !forcePlay) return;
    try {
      setPlayingAudio(true);
      const cleanText = text.replace(/[*_~`#\[\]]/g, '').replace(/\n/g, ' ');
      const token = localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage') as string)?.state?.token : '';
      
      const audioUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tts/generate?text=${encodeURIComponent(cleanText)}${token ? `&token=${token}` : ''}`;
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        audioRef.current.onended = () => setPlayingAudio(false);
      }
    } catch (err) {
      console.error('TTS Error:', err);
      setPlayingAudio(false);
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg: ChatMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, msg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/chatbot/chat', { message: msg.content });
      const assistantMsg: ChatMessage = { role: 'assistant', content: data.reply, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);
      
      if (isSpeaking) {
        await playTTS(data.reply);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Something went wrong.', timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <audio ref={audioRef} className="hidden" />
      
      {}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-[4px_4px_0px_#000] border-2 border-brutal-border bg-yellow-400 text-brutal-text flex items-center justify-center ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageCircle size={28} />
      </motion.button>

      {}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-[350px] sm:w-[400px] h-[600px] max-h-[80vh] bg-white border-4 border-brutal-border rounded-3xl shadow-[8px_8px_0px_#000] flex flex-col overflow-hidden flex-shrink-0"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {}
            <div className="bg-yellow-400 p-4 border-b-4 border-brutal-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-full border-2 border-brutal-border flex items-center justify-center font-bold">🤖</div>
                <h3 className="font-bold text-xl" style={{ fontFamily: 'var(--font-display)' }}>Sensei AI</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsSpeaking(!isSpeaking)} className="p-1 hover:bg-yellow-300 rounded transition-colors" title="Toggle AI Voice">
                  {isSpeaking ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-yellow-300 rounded transition-colors">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>
            </div>

            {}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 hide-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl border-2 border-brutal-border shadow-[2px_2px_0px_#000] ${m.role === 'user' ? 'bg-[#00E5FF] text-brutal-text rounded-tr-sm' : 'bg-white text-brutal-text rounded-tl-sm'}`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border-2 border-brutal-border p-3 rounded-2xl rounded-tl-sm shadow-[2px_2px_0px_#000]">
                    <div className="flex gap-1">
                      <div className="thinking-dot" />
                      <div className="thinking-dot" />
                      <div className="thinking-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {}
            <div className="p-4 bg-white border-t-4 border-brutal-border">
              {playingAudio && <p className="text-xs text-green-600 font-bold mb-2 animate-pulse">🔊 AI is speaking...</p>}
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleListening}
                  className={`p-3 border-2 border-brutal-border rounded-xl transition-colors shadow-[2px_2px_0px_#000] ${isListening ? 'bg-red-400 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200 text-brutal-text'}`}
                  title="Voice Input (STT)"
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Ask Sensei anything..."
                  className="flex-1 px-4 py-3 border-2 border-brutal-border rounded-xl outline-none focus:bg-yellow-50 transition-colors"
                />
                <button 
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className="p-3 bg-yellow-400 border-2 border-brutal-border rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors shadow-[2px_2px_0px_#000]"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
