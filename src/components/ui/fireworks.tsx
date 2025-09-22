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
      }, 3000); // Extended duration for more impact
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden bg-black/20 backdrop-blur-sm">
      {/* Central burst explosion */}
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={`burst-${i}`}
          className="absolute w-3 h-3 rounded-full"
          style={{
            left: '50%',
            top: '50%',
            backgroundColor: ['#FFD700', '#FF6B35', '#FF0080', '#00D4FF', '#39FF14', '#FF4444', '#8A2BE2', '#FFA500'][i % 8],
            animation: `burst-${i % 4} 2s ease-out forwards`,
            animationDelay: `${i * 0.05}s`,
            transform: `translate(-50%, -50%) rotate(${i * 15}deg)`,
            boxShadow: `0 0 20px ${['#FFD700', '#FF6B35', '#FF0080', '#00D4FF'][i % 4]}`,
          }}
        />
      ))}

      {/* Multiple layered explosions */}
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={`explosion-${i}`}
          className="absolute w-4 h-4 rounded-full animate-ping"
          style={{
            left: `${30 + (i * 5) % 40}%`,
            top: `${30 + (i * 7) % 40}%`,
            backgroundColor: ['#FF1493', '#00FF7F', '#FFD700', '#FF4500', '#1E90FF', '#FF69B4'][i % 6],
            animationDelay: `${0.3 + (i * 0.1)}s`,
            animationDuration: '1.5s',
            filter: 'brightness(1.5)',
            boxShadow: `0 0 30px ${['#FF1493', '#00FF7F', '#FFD700'][i % 3]}`,
          }}
        />
      ))}

      {/* Shooting stars effect */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute w-1 h-8 bg-gradient-to-b from-white to-transparent rounded-full"
          style={{
            left: `${20 + i * 10}%`,
            top: '10%',
            animation: 'shooting-star 2s ease-out forwards',
            animationDelay: `${0.5 + i * 0.2}s`,
            transform: `rotate(${45 + i * 10}deg)`,
            filter: 'brightness(2)',
            boxShadow: '0 0 10px #FFFFFF',
          }}
        />
      ))}

      {/* Confetti pieces */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={`confetti-${i}`}
          className="absolute w-2 h-2 animate-bounce"
          style={{
            left: `${10 + (i * 3) % 80}%`,
            top: `${20 + (i * 2) % 30}%`,
            backgroundColor: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'][i % 8],
            animationDelay: `${0.8 + (i * 0.05)}s`,
            animationDuration: '2s',
            borderRadius: i % 3 === 0 ? '50%' : '2px',
            transform: `rotate(${i * 20}deg)`,
            filter: 'brightness(1.3)',
          }}
        />
      ))}

      {/* Bright sparkles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute text-4xl animate-pulse"
          style={{
            left: `${25 + i * 4}%`,
            top: `${35 + (i % 3) * 15}%`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1s',
            filter: 'brightness(2) saturate(2)',
            textShadow: '0 0 20px #FFD700',
          }}
        >
          {['✨', '⭐', '💫', '🌟'][i % 4]}
        </div>
      ))}

      {/* Success message burst */}
      <div 
        className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-white animate-bounce"
        style={{
          animationDelay: '1s',
          animationDuration: '1s',
          textShadow: '0 0 30px #FFD700, 0 0 60px #FF6B35',
          filter: 'brightness(1.5)',
        }}
      >
        🎉
      </div>

      <style>{`
        @keyframes burst-0 {
          0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(180deg) translateY(-200px); opacity: 0; }
        }
        @keyframes burst-1 {
          0% { transform: translate(-50%, -50%) scale(0) rotate(90deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(270deg) translateY(-150px) translateX(150px); opacity: 0; }
        }
        @keyframes burst-2 {
          0% { transform: translate(-50%, -50%) scale(0) rotate(180deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(360deg) translateY(-100px) translateX(-150px); opacity: 0; }
        }
        @keyframes burst-3 {
          0% { transform: translate(-50%, -50%) scale(0) rotate(270deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(450deg) translateY(-250px) translateX(100px); opacity: 0; }
        }
        @keyframes shooting-star {
          0% { transform: translateY(0) translateX(0) rotate(45deg); opacity: 1; }
          100% { transform: translateY(300px) translateX(200px) rotate(45deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};