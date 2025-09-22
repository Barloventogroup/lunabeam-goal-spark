import React, { useEffect, useState } from 'react';

interface FireworksProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export const Fireworks: React.FC<FireworksProps> = ({ isVisible, onComplete }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Firework particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
          style={{
            left: '50%',
            top: '50%',
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1s',
            transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-${100 + i * 20}px)`,
          }}
        />
      ))}
      
      {/* Additional colorful particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`color-${i}`}
          className={`absolute w-3 h-3 rounded-full animate-bounce ${
            i % 4 === 0 ? 'bg-red-400' : 
            i % 4 === 1 ? 'bg-blue-400' : 
            i % 4 === 2 ? 'bg-green-400' : 'bg-purple-400'
          }`}
          style={{
            left: `${45 + (i % 3) * 5}%`,
            top: `${45 + (i % 3) * 5}%`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1.5s',
          }}
        />
      ))}
      
      {/* Sparkle effect */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute text-2xl animate-pulse"
          style={{
            left: `${40 + i * 4}%`,
            top: `${40 + (i % 2) * 20}%`,
            animationDelay: `${i * 0.2}s`,
            animationDuration: '0.8s',
          }}
        >
          ✨
        </div>
      ))}
    </div>
  );
};