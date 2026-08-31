'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface Trail {
  id: number;
  x: number;
  y: number;
}

export default function CustomCursor() {
  const pathname = usePathname();
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [trails, setTrails] = useState<Trail[]>([]);
  const trailId = useRef(0);
  const trailInterval = useRef<number | null>(null);

  const getTheme = useCallback(() => {
    if (pathname.includes('/student')) return 'student';
    if (pathname.includes('/teacher')) return 'teacher';
    if (pathname.includes('/admin')) return 'admin';
    return 'landing';
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouch(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setIsHovering(!!target.closest('button, a, input, select, textarea, [role="button"], label'));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  useEffect(() => {
    if (isTouch) return;

    const addTrail = () => {
      if (mousePosition.x < 0) return;
      trailId.current += 1;
      setTrails(prev => {
        const next = [...prev, { id: trailId.current, x: mousePosition.x, y: mousePosition.y }];
        if (next.length > 12) return next.slice(-12);
        return next;
      });
    };

    trailInterval.current = window.setInterval(addTrail, 35);
    return () => {
      if (trailInterval.current) clearInterval(trailInterval.current);
    };
  }, [mousePosition, isTouch]);

  useEffect(() => {
    if (trails.length === 0) return;
    const timer = setTimeout(() => {
      setTrails(prev => prev.slice(1));
    }, 250);
    return () => clearTimeout(timer);
  }, [trails]);

  if (isTouch) return null;

  const theme = getTheme();

  const pencilColor = theme === 'student' ? '#FFD93D'
    : theme === 'teacher' ? '#4ADE80'
      : theme === 'admin' ? '#00F5FF'
        : '#FFD700';

  const bodyColor = theme === 'student' ? '#FF6B6B'
    : theme === 'teacher' ? '#22C55E'
      : theme === 'admin' ? '#3B82F6'
        : '#FF7A00';

  const trailColor = theme === 'student' ? 'rgba(255,107,107,0.5)'
    : theme === 'teacher' ? 'rgba(74,222,128,0.45)'
      : theme === 'admin' ? 'rgba(0,245,255,0.45)'
        : 'rgba(255,215,0,0.5)';

  const glowColor = theme === 'student' ? 'rgba(255,107,107,0.8)'
    : theme === 'teacher' ? 'rgba(74,222,128,0.7)'
      : theme === 'admin' ? 'rgba(0,245,255,0.7)'
        : 'rgba(255,215,0,0.8)';

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (pointer: fine) {
          *, *::before, *::after {
            cursor: none !important;
          }
        }
        .pencil-trail {
          animation: trailFade 0.35s ease-out forwards;
        }
        @keyframes trailFade {
          0% { opacity: 0.7; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(0.1); }
        }
        @keyframes pencilPulse {
          0%, 100% { filter: drop-shadow(0 0 8px ${glowColor}); }
          50% { filter: drop-shadow(0 0 18px ${glowColor}) drop-shadow(0 2px 4px rgba(0,0,0,0.4)); }
        }
        @keyframes clickBurst {
          0% { transform: scale(0); opacity: 0.9; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}} />

      { }
      {trails.map((t, i) => (
        <div
          key={t.id}
          className="pencil-trail"
          style={{
            position: 'fixed',
            left: t.x - 4,
            top: t.y - 4,
            width: 8 - (i * 0.4),
            height: 8 - (i * 0.4),
            borderRadius: '50%',
            background: trailColor,
            boxShadow: `0 0 6px ${trailColor}`,
            pointerEvents: 'none',
            zIndex: 99997,
          }}
        />
      ))}

      { }
      {isClicking && (
        <div
          style={{
            position: 'fixed',
            left: mousePosition.x - 15,
            top: mousePosition.y - 15,
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: `2px solid ${pencilColor}`,
            pointerEvents: 'none',
            zIndex: 99996,
            animation: 'clickBurst 0.4s ease-out forwards',
          }}
        />
      )}

      { }
      <div
        style={{
          position: 'fixed',
          left: mousePosition.x,
          top: mousePosition.y,
          pointerEvents: 'none',
          zIndex: 99999,
          transform: `translate(-5px, -42px) ${isClicking ? 'scale(0.8) rotate(-12deg)' : isHovering ? 'rotate(15deg) scale(1.1)' : 'rotate(0deg)'}`,
          transition: 'transform 0.12s ease',
          animation: 'pencilPulse 2s ease-in-out infinite',
        }}
      >
        <svg width="42" height="48" viewBox="0 0 42 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          { }
          <path d="M8 45L4 40L24 6L30 3L33 9L13 43L8 45Z" fill={bodyColor} stroke="#000" strokeWidth="1.5" />
          { }
          <path d="M4 40L8 45L5.5 47.5L2 43L4 40Z" fill={pencilColor} stroke="#000" strokeWidth="1" />
          { }
          <path d="M2 43L5.5 47.5L3.5 48L1 45L2 43Z" fill="#222" />
          { }
          <path d="M24 6L30 3L33 9L27 12L24 6Z" fill="#FF69B4" stroke="#000" strokeWidth="1" />
          { }
          <path d="M23 8L27 12L25 14L21 10L23 8Z" fill="#C0C0C0" stroke="#000" strokeWidth="0.8" />
          { }
          <line x1="10" y1="42" x2="26" y2="10" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
          <line x1="12" y1="43" x2="28" y2="11" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
          { }
          <circle cx="3" cy="46" r="2" fill={pencilColor} opacity="0.9">
            <animate attributeName="r" values="1.5;3;1.5" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.3;0.9" dur="0.8s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      { }
      {isHovering && (
        <div
          style={{
            position: 'fixed',
            left: mousePosition.x - 22,
            top: mousePosition.y - 22,
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: `2.5px solid ${pencilColor}`,
            boxShadow: `0 0 12px ${glowColor}, inset 0 0 8px ${glowColor}`,
            pointerEvents: 'none',
            zIndex: 99998,
            opacity: 0.7,
            transition: 'all 0.15s ease',
          }}
        />
      )}
    </>
  );
}
