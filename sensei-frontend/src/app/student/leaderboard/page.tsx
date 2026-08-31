'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award } from 'lucide-react';
import api from '@/lib/axios';
import { useSocket } from '@/hooks/useSocket';
import type { LeaderboardEntry } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const rankIcons = ['👑', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const { on } = useSocket('/student');

  const fetchLeaderboard = () => {
    api.get('/api/student/leaderboard').then(({ data }) => {
      setEntries((data.entries || []).map((e: any) => ({
        ...e,
        isCurrentUser: e.studentId === user?._id
      })));
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeaderboard();

    const offUpdate = on('leaderboard:update', (data: any) => {
      if (data.entries) {
        setEntries(data.entries.map((e: any) => ({
          ...e,
          isCurrentUser: e.studentId === user?._id
        })));
        fetchLeaderboard();
      }
    });

    return () => { offUpdate(); };
  }, [on, user?._id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="pencil-loader w-48" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--s-text)' }}>🏆 Class Leaderboard</h1>

      {entries.length === 0 ? (
        <div className="text-center py-12 opacity-50">
          <Trophy size={48} className="mx-auto mb-4" />
          <p style={{ fontFamily: 'var(--font-display)' }}>No leaderboard data yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-2xl border-2 flex items-center gap-4 ${entry.isCurrentUser ? 'ring-2 ring-yellow-400 bg-yellow-50 dark:bg-slate-700' : 'dark:bg-slate-800'} dark:border-slate-700`}
              style={{ background: entry.isCurrentUser ? undefined : 'var(--s-card)', borderColor: 'var(--s-border)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold dark:bg-slate-700" style={{
                background: i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] + '30' : undefined,
                backgroundColor: i >= 3 ? 'var(--s-card-muted, #f0f0f0)' : undefined,
                fontFamily: 'var(--font-display)'
              }}>
                {i < 3 ? rankIcons[i] : `#${entry.rank}`}
              </div>
              <div className="flex-1">
                <p className="font-bold flex items-center gap-2 dark:text-white" style={{ fontFamily: 'var(--font-display)', color: 'var(--s-text)' }}>
                  {entry.name} {entry.isCurrentUser && <span className="text-xs bg-yellow-400 dark:bg-slate-600 dark:text-white text-brutal-text px-2 py-0.5 rounded-full">YOU</span>}
                </p>
                <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--s-muted)' }}>
                  {entry.xp || 0} XP • {entry.badges?.length || 0} badges
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>{entry.score}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  {entry.change > 0 ? <TrendingUp size={14} className="text-green-500" /> : entry.change < 0 ? <TrendingDown size={14} className="text-red-500" /> : <Minus size={14} className="text-gray-400" />}
                  <span className={`text-xs font-bold ${entry.change > 0 ? 'text-green-500' : entry.change < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {entry.change > 0 ? `+${entry.change}` : entry.change}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
