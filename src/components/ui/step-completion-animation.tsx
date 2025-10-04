import React, { useEffect, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface StepCompletionAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export const StepCompletionAnimation: React.FC<StepCompletionAnimationProps> = ({ 
  isVisible, 
  onComplete 
}) => {
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
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="w-64 h-64">
        <DotLottieReact
          src="https://lottie.host/7c1bd857-f4a1-4db4-b81d-ec56c76570bc/jA4X2X4idt.lottie"
          loop={false}
          autoplay
        />
      </div>
    </div>
  );
};
