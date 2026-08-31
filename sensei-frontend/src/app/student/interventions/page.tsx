'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle2, Eye } from 'lucide-react';
import api from '@/lib/axios';

interface InterventionItem {
  _id: string;
  message: string;
  teacherId?: { name: string };
  status: string;
  urgency: string;
  createdAt: string;
}

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState<InterventionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/student/interventions').then(({ data }) => {
      setInterventions(data.interventions || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="pencil-loader w-48" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--s-text)' }}>📋 Personalized Support Plans</h1>
      <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--s-muted)' }}>Empathetic academic support plans designed by your teachers to help you succeed</p>
 
      {interventions.length === 0 ? (
        <div className="text-center py-12 opacity-50">
          <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500" />
          <p style={{ fontFamily: 'var(--font-display)' }}>No active support plans — you&apos;re on track and doing great! 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interventions.map((item, i) => (
            <motion.div key={item._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-2xl border-2 ${item.status === 'resolved' ? 'opacity-60' : ''}`}
              style={{ background: 'var(--s-card)', borderColor: item.urgency === 'high' ? '#FF9800' : 'var(--s-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                    Active Support Plan
                  </span>
                  <span className="text-xs font-bold uppercase" style={{ fontFamily: 'var(--font-mono)', color: item.urgency === 'high' ? '#F44336' : '#FFC107' }}>
                    Priority: {item.urgency || 'medium'}
                  </span>
                </div>
                <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--s-muted)' }}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--s-text)' }}>{item.message}</p>
              {item.teacherId && typeof item.teacherId === 'object' && (
                <p className="text-xs mt-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--s-muted)' }}>
                  From: {item.teacherId.name}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
