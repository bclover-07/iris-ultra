'use client';

import { useEffect, useState, useRef } from 'react';

interface MobileControlsProps {
  onMove: (data: { x: number; y: number } | null) => void;
  onJump: () => void;
}

export default function MobileControls({ onMove, onJump }: MobileControlsProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickStart, setJoystickStart] = useState({ x: 0, y: 0 });
  const [joystickCurrent, setJoystickCurrent] = useState({ x: 0, y: 0 });
  
  const touchAreaRef = useRef<HTMLDivElement>(null);
  const maxRadius = 50; // px

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkTouch = () => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024;
      };
      setIsTouchDevice(checkTouch());
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const startPos = { x: touch.clientX, y: touch.clientY };
    setJoystickStart(startPos);
    setJoystickCurrent(startPos);
    setJoystickActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!joystickActive) return;
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    
    let dx = touch.clientX - joystickStart.x;
    let dy = touch.clientY - joystickStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }
    
    const currentPos = {
      x: joystickStart.x + dx,
      y: joystickStart.y + dy
    };
    
    setJoystickCurrent(currentPos);
    
    // Normalize coordinates to range [-1, 1]
    onMove({
      x: dx / maxRadius,
      y: dy / maxRadius
    });
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setJoystickActive(false);
    onMove(null);
  };

  if (!isTouchDevice) return null;

  // Calculate relative offset for the joystick knob styling
  const knobStyle = joystickActive ? {
    transform: `translate(${joystickCurrent.x - joystickStart.x}px, ${joystickCurrent.y - joystickStart.y}px)`,
    left: joystickStart.x - 30, // 30 is knob radius
    top: joystickStart.y - 30,
    position: 'fixed' as const,
  } : {};

  const baseStyle = joystickActive ? {
    left: joystickStart.x - 60, // 60 is base radius
    top: joystickStart.y - 60,
    position: 'fixed' as const,
  } : {};

  return (
    <>
      {/* Touch Area covering bottom-left of screen */}
      <div 
        ref={touchAreaRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          width: '60vw', 
          height: '60vh', 
          zIndex: 50,
          pointerEvents: 'auto',
          touchAction: 'none',
          userSelect: 'none'
        }} 
      />

      {/* Visual Joystick Base */}
      {joystickActive && (
        <div 
          style={{
            ...baseStyle,
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            border: '4px solid var(--comic-black, #000)',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
            zIndex: 100,
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      {/* Visual Joystick Knob */}
      {joystickActive && (
        <div 
          style={{
            ...knobStyle,
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--comic-yellow, #facc15)',
            border: '4px solid var(--comic-black, #000)',
            boxShadow: '2px 2px 0px rgba(0,0,0,0.8)',
            zIndex: 101,
            pointerEvents: 'none',
            transition: 'transform 0.05s ease-out'
          }}
        />
      )}
      
      {/* Jump Button */}
      <button
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onJump();
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onJump();
        }}
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          width: '75px',
          height: '75px',
          borderRadius: '50%',
          backgroundColor: '#ff4757',
          border: '4px solid var(--comic-black, #000)',
          color: 'white',
          fontFamily: 'Fredoka, sans-serif',
          fontWeight: 'black',
          fontSize: '16px',
          zIndex: 50,
          pointerEvents: 'auto',
          boxShadow: '4px 4px 0px var(--comic-black, #000)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          touchAction: 'none'
        }}
      >
        JUMP
      </button>
    </>
  );
}
