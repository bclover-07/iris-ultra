'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, AlertTriangle, Info, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/student/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/api/student/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={16} className="text-orange-500" />;
      case 'info':
        return <Info size={16} className="text-blue-500" />;
      case 'message':
        return <MessageCircle size={16} className="text-green-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative w-12 h-12 bg-white dark:bg-slate-800 brutalist-border dark:border-slate-700 rounded-xl flex items-center justify-center hover:bg-yellow-400 dark:hover:bg-slate-700 transition-all hard-shadow dark:shadow-[6px_6px_0px_#1e293b] hover:-translate-y-1 hover:hard-shadow-lg"
      >
        <Bell size={22} strokeWidth={2.5} style={{ color: 'var(--comic-black)' }} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--comic-red)] border-2 border-[var(--comic-black)] text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse" style={{ boxShadow: '2px 2px 0 var(--comic-black)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-16 w-[340px] max-h-[420px] bg-white dark:bg-slate-800 brutalist-border dark:border-slate-700 rounded-2xl overflow-hidden z-50"
            style={{ boxShadow: '6px 6px 0 var(--comic-black)' }}
          >
            {}
            <div className="flex items-center justify-between px-4 py-3 border-b-2" style={{ borderColor: 'var(--comic-black)', background: 'var(--comic-yellow)' }}>
              <h3 className="font-fredoka font-bold text-sm" style={{ color: 'var(--comic-black)' }}>
                🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              <button onClick={() => setIsOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/10 transition-colors">
                <X size={16} strokeWidth={3} />
              </button>
            </div>

            {}
            <div className="overflow-y-auto max-h-[350px]" style={{ scrollbarWidth: 'thin' }}>
              {loading && notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="flex gap-1 justify-center">
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-fredoka">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-3xl mb-2">🎉</p>
                  <p className="font-fredoka font-bold text-sm text-gray-500">All caught up!</p>
                  <p className="text-xs text-gray-400 mt-1">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`flex items-start gap-3 px-4 py-3 border-b transition-colors cursor-pointer hover:bg-yellow-50 dark:hover:bg-slate-700/50 ${
                      !notif.isRead ? 'bg-yellow-50/60 dark:bg-slate-700/30' : ''
                    }`}
                    style={{ borderColor: 'var(--adm-border-solid, #eee)' }}
                    onClick={() => !notif.isRead && markAsRead(notif._id)}
                  >
                    <div className="mt-1 flex-shrink-0">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-fredoka font-bold text-xs truncate" style={{ color: 'var(--comic-black)' }}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif._id);
                        }}
                        className="mt-1 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-green-100 transition-colors"
                        title="Mark as read"
                      >
                        <Check size={14} className="text-green-600" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
