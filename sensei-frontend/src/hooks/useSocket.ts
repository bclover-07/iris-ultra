'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

export const useSocket = (namespace: string = '/student') => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuthStore();
  const listenersRef = useRef<Array<{ event: string; callback: (...args: any[]) => void }>>([]);

  useEffect(() => {
    if (!user) return;

    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
      (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5000` : 'http://localhost:5000');
    const socketUrl = `${baseUrl}${namespace}`;
    
    const socketInstance = io(socketUrl, {
      auth: { userId: user._id },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => setConnected(true));
    socketInstance.on('disconnect', () => setConnected(false));

    // Register any listeners that were set up before connection/initialization
    listenersRef.current.forEach(({ event, callback }) => {
      socketInstance.on(event, callback);
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user, namespace]);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    listenersRef.current.push({ event, callback });
    socketRef.current?.on(event, callback);
    return () => {
      listenersRef.current = listenersRef.current.filter(
        (l) => !(l.event === event && l.callback === callback)
      );
      socketRef.current?.off(event, callback);
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { socket: socketRef.current, connected, on, emit };
};
