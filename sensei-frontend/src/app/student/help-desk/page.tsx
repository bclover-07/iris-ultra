'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Send, Clock, CheckCircle2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useSocket } from '@/hooks/useSocket';

interface Ticket { _id: string; message: string; status: string; response?: string; category?: string; urgency?: string; createdAt: string; respondedAt?: string; }

export default function HelpDeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('Academic');
  const [urgency, setUrgency] = useState('medium');
  const [teachers, setTeachers] = useState<{ _id: string, name: string }[]>([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { on } = useSocket('/student');

  const fetchTickets = async () => {
    try {
      const { data } = await api.get('/api/help-ticket');
      setTickets(data.tickets || []);
    } catch {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/api/help-ticket/faculty');
      setTeachers(data.teachers || []);
    } catch {}
  };

  useEffect(() => { 
    fetchTickets(); 
    fetchTeachers();

    const cleanupUpdate = on('help:ticket_updated', (updatedTicket: any) => {
      setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
      toast.success('Your help ticket was responded!', { icon: '💬' });
    });

    return () => {
      cleanupUpdate();
    };
  }, [on]);

  const submit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/api/help-ticket', { message, category, urgency, assignedTo: assignedTo || undefined });
      toast.success('Help ticket submitted!');
      setMessage('');
      setAssignedTo('');
      fetchTickets();
    } catch { 
      toast.error('Failed to submit ticket'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const getUrgencyColor = (u: string) => {
    switch (u) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--s-text)' }}>🙋 Student Help Desk</h1>
        <div className="px-4 py-1 rounded-full bg-yellow-100 dark:bg-slate-800 border-2 border-yellow-400 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-yellow-700 dark:text-slate-300">
          Fast Support
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {}
        <div className="md:col-span-1 space-y-4">
          <div className="p-6 rounded-3xl border-2 sticky top-6" style={{ background: 'var(--s-card)', borderColor: 'var(--s-border)' }}>
            <h3 className="text-xl mb-4 font-bold" style={{ fontFamily: 'var(--font-display)' }}>New Ticket</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold mb-1 opacity-50">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="notebook-input w-full p-2 text-sm"
                >
                  <option>Academic</option>
                  <option>Technical</option>
                  <option>Administrative</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold mb-1 opacity-50">Select Faculty (Optional)</label>
                <select 
                  value={assignedTo} 
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="notebook-input w-full p-2 text-sm"
                >
                  <option value="">Any Available Faculty</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold mb-1 opacity-50">Urgency</label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map(u => (
                    <button 
                      key={u}
                      onClick={() => setUrgency(u)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border-2 ${urgency === u ? 'border-current' : 'border-transparent opacity-40 grayscale'}`}
                      style={{ color: getUrgencyColor(u), background: `${getUrgencyColor(u)}10` }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold mb-1 opacity-50">Issue Description</label>
                <textarea 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  rows={4} 
                  placeholder="Tell us what's wrong..."
                  className="notebook-input w-full resize-none text-sm"
                />
              </div>

              <button 
                onClick={submit} 
                disabled={submitting || !message.trim()}
                className="comic-btn w-full py-3 bg-yellow-400 dark:bg-slate-700 dark:text-white dark:border-slate-600 text-brutal-text font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {submitting ? 'Submitting...' : <><Send size={18} /> Submit Ticket</>}
              </button>
            </div>
          </div>
        </div>

        {}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-2xl" style={{ fontFamily: 'var(--font-display)' }}>Ticket History</h2>
          {loading ? (
            <div className="pencil-loader w-32" />
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center rounded-3xl border-2 border-dashed opacity-50" style={{ borderColor: 'var(--s-border)' }}>
              <HelpCircle size={40} className="mx-auto mb-2" />
              <p>You haven't raised any tickets yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((t, i) => (
                <motion.div 
                  key={t._id} 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-3xl border-2 transition-all hover:shadow-lg" 
                  style={{ background: 'var(--s-card)', borderColor: 'var(--s-border)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-2 items-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase`} style={{ color: getUrgencyColor(t.urgency || 'medium'), background: `${getUrgencyColor(t.urgency || 'medium')}15` }}>
                        {t.urgency || 'medium'}
                      </span>
                      <span className="text-[10px] uppercase font-bold opacity-40 tracking-widest">{t.category || 'Support'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold" style={{ color: 'var(--s-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</span>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${t.status === 'responded' ? 'bg-green-100 text-green-700 dark:bg-slate-800 dark:text-green-400 dark:border dark:border-green-900/50' : 'bg-yellow-100 text-yellow-700 dark:bg-slate-800 dark:text-yellow-400 dark:border dark:border-yellow-900/50'}`}>
                        {t.status === 'responded' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {t.status}
                      </div>
                    </div>
                  </div>

                  <p className="text-lg leading-relaxed mb-4 break-words break-all" style={{ fontFamily: 'var(--font-body)' }}>{t.message}</p>
                  
                  {t.response && (
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-4 rounded-2xl bg-blue-50 dark:bg-slate-800 border-2 border-blue-100 dark:border-slate-700 relative"
                      >
                        <div className="absolute -top-3 left-4 bg-blue-500 dark:bg-slate-700 dark:border dark:border-slate-600 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase">Response</div>
                        <p className="text-sm text-blue-900 dark:text-slate-200 leading-relaxed pt-1 break-words break-all">{t.response}</p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-blue-400 dark:text-slate-400">
                          <MessageCircle size={12} /> Responded on {new Date(t.respondedAt || '').toLocaleDateString()}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
