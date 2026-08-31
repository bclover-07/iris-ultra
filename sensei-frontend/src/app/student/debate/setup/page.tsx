'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Swords, Brain, Map as MapIcon, Settings } from 'lucide-react';

const STEPS = [
  { id: 'topic', title: 'Choose Topic', icon: <Swords /> },
  { id: 'personality', title: 'Opponent', icon: <Brain /> },
  { id: 'room', title: 'Arena', icon: <MapIcon /> },
  { id: 'mode', title: 'Settings', icon: <Settings /> }
];

const AI_PERSONALITIES = [
  { id: 'aggressive_politician', name: 'Aggressive Politician', desc: 'Interrupts, points fingers, raises voice.', icon: '🎤' },
  { id: 'calm_professor', name: 'Calm Professor', desc: 'Logical, slow, requires evidence.', icon: '📚' },
  { id: 'troll_debater', name: 'Troll Debater', desc: 'Emotional bait, mockery, laughs.', icon: '😈' },
  { id: 'fast_thinker', name: 'Fast Thinker', desc: 'Rapid-fire questions, very fast.', icon: '⚡' },
  { id: 'passive_opponent', name: 'Passive Opponent', desc: 'Short vague answers.', icon: '😶' },
  { id: 'news_anchor', name: 'News Anchor', desc: 'Formal, journalistic scrutiny.', icon: '📺' },
  { id: 'startup_investor', name: 'Startup Investor', desc: 'Challenges ROI and evidence.', icon: '💰' },
  { id: 'toxic_opponent', name: 'Toxic Opponent', desc: 'Personal attacks, max pressure.', icon: '☠️' }
];

const ROOMS = [
  { id: 'university_hall', name: 'University Hall', desc: 'Classic debate hall with wooden podiums.', bg: 'bg-stone-800' },
  { id: 'courtroom', name: 'Courtroom', desc: 'Judge bench and witness stands.', bg: 'bg-amber-900' },
  { id: 'boardroom', name: 'Boardroom', desc: 'Corporate table with city views.', bg: 'bg-slate-800' },
  { id: 'podcast_studio', name: 'Podcast Studio', desc: 'Mics and studio lighting.', bg: 'bg-red-900' },
  { id: 'political_stage', name: 'Political Stage', desc: 'Grand stage with flags.', bg: 'bg-blue-900' },
  { id: 'startup_arena', name: 'Startup Pitch', desc: 'Investor panel setup.', bg: 'bg-orange-900' }
];

export default function DebateSetupWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState('');
  const [personality, setPersonality] = useState('calm_professor');
  const [room, setRoom] = useState('university_hall');
  const [rounds, setRounds] = useState(6);

  useEffect(() => {
    const qTopic = searchParams.get('topic');
    if (qTopic) setTopic(qTopic);
  }, [searchParams]);

  const handleStart = () => {
    const sessionId = 'deb_' + Math.random().toString(36).substr(2, 9);

    router.push(`/student/debate/${sessionId}?topic=${encodeURIComponent(topic)}&ai=${personality}&room=${room}&rounds=${rounds}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col font-sans">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        
        {}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-widest uppercase flex items-center gap-3" style={{ fontFamily: 'Bangers, sans-serif' }}>
            <span className="text-yellow-400">⚔️ DEBATE</span> CONFIGURATION
          </h1>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i === step ? 'bg-yellow-400 text-slate-900' : i < step ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && <div className={`w-8 h-1 mx-1 rounded-full ${i < step ? 'bg-indigo-600' : 'bg-slate-800'}`} />}
              </div>
            ))}
          </div>
        </div>

        {}
        <div className="p-8 flex-1 flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div 
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              
              {}
              {step === 0 && (
                <div className="max-w-2xl mx-auto space-y-6 mt-10">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-slate-800">What are we debating?</h2>
                    <p className="text-slate-500">Enter a clear, debatable statement.</p>
                  </div>
                  <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Artificial Intelligence poses an existential threat to humanity."
                    className="w-full h-40 p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xl font-medium resize-none transition-all"
                  />
                </div>
              )}

              {}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2 mb-8">
                    <h2 className="text-3xl font-bold text-slate-800">Select Opponent</h2>
                    <p className="text-slate-500">Who will you face in the arena?</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {AI_PERSONALITIES.map(ai => (
                      <div 
                        key={ai.id} 
                        onClick={() => setPersonality(ai.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${personality === ai.id ? 'border-indigo-600 bg-indigo-50 shadow-md transform scale-105' : 'border-slate-200 hover:border-indigo-300'}`}
                      >
                        <div className="text-4xl mb-3 text-center">{ai.icon}</div>
                        <h3 className="font-bold text-center text-slate-800 leading-tight mb-1">{ai.name}</h3>
                        <p className="text-xs text-center text-slate-500">{ai.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2 mb-8">
                    <h2 className="text-3xl font-bold text-slate-800">Select Arena</h2>
                    <p className="text-slate-500">Where will this debate take place?</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {ROOMS.map(r => (
                      <div 
                        key={r.id} 
                        onClick={() => setRoom(r.id)}
                        className={`relative h-32 rounded-2xl cursor-pointer overflow-hidden border-4 transition-all ${room === r.id ? 'border-yellow-400 shadow-xl transform scale-105' : 'border-transparent'}`}
                      >
                        <div className={`absolute inset-0 ${r.bg} opacity-80`} />
                        <div className="absolute inset-0 p-4 flex flex-col justify-end text-white bg-gradient-to-t from-black/80 to-transparent">
                          <h3 className="font-bold text-lg">{r.name}</h3>
                          <p className="text-xs text-slate-300">{r.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {}
              {step === 3 && (
                <div className="max-w-xl mx-auto space-y-8 mt-10">
                  <div className="text-center space-y-2 mb-8">
                    <h2 className="text-3xl font-bold text-slate-800">Final Settings</h2>
                    <p className="text-slate-500">Configure debate rules.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Total Rounds</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" min="2" max="10" step="2"
                        value={rounds} onChange={e => setRounds(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <span className="w-12 text-center font-black text-xl text-indigo-600 bg-indigo-50 py-1 rounded-lg">{rounds}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="font-bold text-slate-800">Summary</h4>
                    <div className="text-sm space-y-2 text-slate-600">
                      <p><span className="font-medium text-slate-800 w-24 inline-block">Topic:</span> {topic}</p>
                      <p><span className="font-medium text-slate-800 w-24 inline-block">Opponent:</span> {AI_PERSONALITIES.find(p=>p.id===personality)?.name}</p>
                      <p><span className="font-medium text-slate-800 w-24 inline-block">Arena:</span> {ROOMS.find(r=>r.id===room)?.name}</p>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between">
          <button 
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={20} /> Back
          </button>
          
          {step < STEPS.length - 1 ? (
            <button 
              onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
              disabled={step === 0 && topic.trim().length < 10}
              className="px-6 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors flex items-center gap-2 shadow-lg"
            >
              Next <ChevronRight size={20} />
            </button>
          ) : (
            <button 
              onClick={handleStart}
              className="px-8 py-3 rounded-xl font-bold bg-yellow-400 hover:bg-yellow-300 text-slate-900 transition-colors flex items-center gap-2 shadow-xl"
            >
              Start Debate ⚔️
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
