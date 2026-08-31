'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertModalProps {
  open: boolean;
  type?: 'alert' | 'confirm' | 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const TYPE_CONFIG = {
  alert: { emoji: '💡', bg: 'from-blue-600 to-indigo-700', accent: '#6366F1', badge: 'bg-indigo-100 text-indigo-700' },
  confirm: { emoji: '❓', bg: 'from-amber-500 to-orange-600', accent: '#F59E0B', badge: 'bg-amber-100 text-amber-700' },
  success: { emoji: '✅', bg: 'from-green-500 to-emerald-700', accent: '#10B981', badge: 'bg-green-100 text-green-700' },
  error: { emoji: '❌', bg: 'from-red-500 to-rose-700', accent: '#EF4444', badge: 'bg-red-100 text-red-700' },
  warning: { emoji: '⚠️', bg: 'from-yellow-400 to-amber-600', accent: '#F59E0B', badge: 'bg-yellow-100 text-yellow-800' },
  info: { emoji: 'ℹ️', bg: 'from-sky-500 to-blue-700', accent: '#0EA5E9', badge: 'bg-sky-100 text-sky-700' },
};

export default function AlertModal({
  open,
  type = 'alert',
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: AlertModalProps) {
  const cfg = TYPE_CONFIG[type];

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') onCancel?.();
      if (e.key === 'Enter') onConfirm?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onConfirm, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="w-full max-w-sm relative"
            style={{ border: '3px solid #000', borderRadius: 24, boxShadow: '8px 8px 0 #000, 0 20px 60px rgba(0,0,0,0.5)' }}
          >
            {}
            <div className={`bg-gradient-to-br ${cfg.bg} rounded-t-[21px] p-6 flex flex-col items-center`}>
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                className="text-5xl mb-3 drop-shadow-lg"
              >
                {cfg.emoji}
              </motion.div>
              <h2 className="font-fredoka text-white text-2xl font-bold text-center drop-shadow">{title}</h2>
            </div>

            {}
            <div className="bg-white rounded-b-[21px] p-6">
              <p className="text-gray-600 text-sm text-center leading-relaxed mb-6">{message}</p>

              <div className={`flex gap-3 ${type === 'confirm' ? 'flex-row' : 'flex-col'}`}>
                {type === 'confirm' && (
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-2xl font-fredoka font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    style={{ border: '2px solid #000', boxShadow: '3px 3px 0 #000' }}
                  >
                    {cancelText}
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onConfirm}
                  className={`flex-1 py-3 rounded-2xl font-fredoka font-bold text-sm text-white transition-all`}
                  style={{ background: `linear-gradient(135deg, ${cfg.accent}, ${cfg.accent}cc)`, border: '2px solid #000', boxShadow: '4px 4px 0 #000' }}
                >
                  {confirmText}
                </motion.button>
              </div>
            </div>

            {}
            <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-yellow-400 border-2 border-brutal-border" />
            <div className="absolute -bottom-2 -left-2 w-3 h-3 rounded-full bg-black" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
