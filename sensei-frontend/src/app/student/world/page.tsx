'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Plus, Users, Zap, BookOpen, Trophy, RefreshCw, Lock, Unlock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';

interface Room {
  _id: string;
  roomId: string;
  name: string;
  createdBy: { name: string };
  subjectTags: string[];
  roomType: string;
  visibility: string;
  currentPlayers: string[];
  maxPlayers: number;
  createdAt: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  CSE: '#4D96FF', Maths: '#FFB347', Physics: '#6BCB77', Chemistry: '#FF6B9D', General: '#FFD93D',
  Science: '#4DB6AC', Programming: '#9b59b6',
};

const ROOM_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  study: { label: 'Study Room', emoji: '📚' },
  quiz_battle: { label: 'Quiz Battle', emoji: '⚔️' },
  exam_prep: { label: 'Exam Prep', emoji: '📝' },
  social: { label: 'Social Hangout', emoji: '🎉' },
};

export default function WorldLobbyPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [roomName, setRoomName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['General']);
  const [roomType, setRoomType] = useState('study');
  const [visibility, setVisibility] = useState('public');

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/world/rooms');
      setRooms(data);
    } catch { toast.error('Failed to load rooms'); }
    finally { setLoading(false); }
  };

  const createRoom = async () => {
    if (!roomName.trim()) return toast.error('Enter a room name');
    setCreating(true);
    try {
      const { data } = await api.post('/api/world/rooms', {
        name: roomName, subjectTags: selectedTags, roomType, visibility,
      });
      toast.success(`Room created! Entering...`);
      router.push(`/student/world/${data.roomId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create room');
    } finally { setCreating(false); }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-8 doodle-bg p-4 md:p-6 rounded-[30px] min-h-[80vh]">
      {/* Back button */}
      <button onClick={() => router.push('/student/virtual-beyond')} className="flex items-center gap-2 text-sm font-fredoka font-bold px-4 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 hover:dark:bg-slate-700/80 dark:text-white transition-colors" style={{ border: '2px solid var(--s-border, #000)', boxShadow: '3px 3px 0 var(--s-border, #000)' }}>
        <ArrowLeft size={16} /> Back to Virtual Beyond
      </button>

      {/* Header panel */}
      <div className="comic-panel p-6 md:p-8 bg-white dark:bg-slate-800 dark:border-slate-700 rotate-[-0.5deg] relative">
        <div className="absolute -top-4 -left-4 pow-burst scale-75 rotate-[-15deg] bg-purple-500 text-white border-white">
          NEW!
        </div>
        <h1 className="font-fredoka text-4xl md:text-5xl font-bold text-[var(--comic-black)] uppercase tracking-tighter">
          🌍 Virtual World Hub
        </h1>
        <p className="font-fredoka text-gray-500 dark:text-slate-400 font-bold uppercase tracking-[0.15em] text-sm mt-2">
          Study, compete, and learn with classmates in 3D!
        </p>
      </div>

      {/* Lobby actions */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="comic-btn flex items-center gap-3 px-8 py-4 text-lg bg-yellow-300 hover:bg-yellow-400 dark:text-black dark:border-yellow-700/50"
        >
          <Plus size={24} /> {showCreate ? 'Cancel' : 'Create Room'}
        </button>
        <button onClick={fetchRooms} className="comic-btn flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 hover:bg-gray-50 hover:dark:bg-slate-700/80 dark:text-white">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="comic-card bg-white dark:bg-slate-800 p-6 md:p-8 space-y-6"
          >
            <h2 className="font-fredoka text-2xl font-bold uppercase text-[var(--comic-black)]">🚀 Create a New Room</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-fredoka font-bold text-sm uppercase text-gray-500 dark:text-slate-400">Room Name</label>
                <input
                  value={roomName} onChange={e => setRoomName(e.target.value)}
                  placeholder={`${user?.name?.split(' ')[0]}'s Study Arena`}
                  className="w-full px-4 py-3 border-3 border-brutal-border dark:border-slate-700 rounded-xl font-fredoka text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white dark:bg-slate-900 dark:text-white"
                  style={{ borderWidth: 3 }}
                />
              </div>

              <div className="space-y-2">
                <label className="font-fredoka font-bold text-sm uppercase text-gray-500 dark:text-slate-400">Room Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ROOM_TYPE_LABELS).map(([key, { label, emoji }]) => (
                    <button key={key} onClick={() => setRoomType(key)}
                      className={`px-3 py-2 rounded-xl border-2 font-fredoka font-bold text-sm transition-all ${roomType === key ? 'border-yellow-400 bg-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-400 scale-105' : 'border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:text-slate-400'}`}
                    >{emoji} {label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-fredoka font-bold text-sm uppercase text-gray-500 dark:text-slate-400">Subject Tags</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(SUBJECT_COLORS).map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    className="px-4 py-2 rounded-full font-fredoka font-bold text-sm border-2 transition-all"
                    style={{
                      borderColor: SUBJECT_COLORS[tag],
                      backgroundColor: selectedTags.includes(tag) ? SUBJECT_COLORS[tag] + '30' : 'transparent',
                      color: selectedTags.includes(tag) ? SUBJECT_COLORS[tag] : '#999',
                    }}
                  >{tag}</button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="space-y-2">
                <label className="font-fredoka font-bold text-sm uppercase text-gray-500 dark:text-slate-400">Visibility</label>
                <div className="flex gap-2">
                  {['public', 'class', 'private'].map(v => (
                    <button key={v} onClick={() => setVisibility(v)}
                      className={`px-4 py-2 rounded-xl border-2 font-fredoka font-bold text-sm capitalize flex items-center gap-2 ${visibility === v ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800' : 'border-gray-200 dark:border-slate-700 dark:text-slate-400'}`}
                    >{v === 'private' ? <Lock size={14} /> : <Unlock size={14} />} {v}</button>
                  ))}
                </div>
              </div>

              <button onClick={createRoom} disabled={creating}
                className="comic-btn px-8 py-4 bg-green-400 hover:bg-green-500 text-lg font-fredoka font-bold disabled:opacity-50 ml-auto"
              >{creating ? 'Creating...' : '🚀 Create & Enter'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h2 className="font-fredoka text-2xl font-bold uppercase mb-4 text-[var(--comic-black)]">🏠 Active Rooms</h2>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="pencil-loader w-48" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="comic-panel bg-white dark:bg-slate-800 dark:border-slate-700 p-12 text-center rounded-[30px]">
            <Globe size={64} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
            <h3 className="font-fredoka text-2xl font-bold text-gray-400 dark:text-slate-400">No Rooms Yet</h3>
            <p className="font-fredoka text-gray-400 dark:text-slate-500 mt-2">Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room, i) => {
              const typeInfo = ROOM_TYPE_LABELS[room.roomType] || ROOM_TYPE_LABELS.study;
              return (
                <motion.div key={room._id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="comic-card bg-white dark:bg-slate-800 p-6 flex flex-col gap-4 hover:rotate-[0.5deg] transition-transform"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-fredoka text-xl font-bold text-[var(--comic-black)]">{room.name}</h3>
                      <p className="font-fredoka text-gray-400 dark:text-slate-500 text-sm">by {room.createdBy?.name || t('unknown_student')}</p>
                    </div>
                    <span className="pow-burst text-[10px] px-2 py-1 bg-blue-400 text-white scale-75">
                      {typeInfo.emoji} {typeInfo.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {room.subjectTags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ backgroundColor: (SUBJECT_COLORS[tag] || '#ccc') + '25', color: SUBJECT_COLORS[tag] || '#666' }}
                      >{tag}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 font-fredoka font-bold text-sm text-gray-500 dark:text-slate-400">
                      <Users size={16} />
                      <span>{room.currentPlayers.length}/{room.maxPlayers}</span>
                      {room.visibility === 'private' && <Lock size={14} className="text-red-400" />}
                    </div>
                    <button
                      onClick={() => router.push(`/student/world/${room.roomId}`)}
                      className="comic-btn px-5 py-2 bg-yellow-300 hover:bg-yellow-400 dark:text-black dark:border-yellow-700/50 font-fredoka font-bold text-sm"
                    >Join Room →</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
