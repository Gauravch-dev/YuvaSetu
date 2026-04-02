import { useRef, useEffect, useState } from 'react';
import { useMousePosition } from '@/hooks/useMousePosition';

interface InteractiveBackgroundProps {
  particleCount?: number;
  showCursorGlow?: boolean;
  showBlobs?: boolean;
  className?: string;
}

export const InteractiveBackground = ({
  particleCount = 30,
  showCursorGlow = true,
  showBlobs = true,
  className = '',
}: InteractiveBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { x: mouseX, y: mouseY, isInside } = useMousePosition({ containerRef });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isInside) {
      setCursorPos({ x: mouseX, y: mouseY });
    }
  }, [mouseX, mouseY, isInside]);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Animated gradient blobs */}
      {showBlobs && (
        <>
          <div 
            className="absolute w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] animate-blob-morph"
            style={{ top: '10%', left: '10%', animationDelay: '0s' }}
          />
          <div 
            className="absolute w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-blob-morph"
            style={{ bottom: '10%', right: '10%', animationDelay: '5s' }}
          />
          <div 
            className="absolute w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] animate-blob-morph"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animationDelay: '10s' }}
          />
        </>
      )}

      {/* Floating particles */}
      {Array.from({ length: particleCount }).map((_, i) => (
        <div
          key={i}
          className={`absolute w-1.5 h-1.5 rounded-full animate-particle-drift ${
            i % 2 === 0 ? 'bg-primary/30' : 'bg-accent/30'
          }`}
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 23) % 100}%`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      {/* Cursor glow spotlight */}
      {showCursorGlow && isInside && (
        <div 
          className="cursor-glow"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            opacity: isInside ? 1 : 0,
          }}
        />
      )}

      {/* Aurora overlay */}
      <div className="absolute inset-0 animate-aurora opacity-20 pointer-events-none" />
    </div>
  );
};

export default InteractiveBackground;
