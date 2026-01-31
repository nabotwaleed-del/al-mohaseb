
import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  isLoading: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let interval: number;
    
    if (isLoading) {
      setVisible(true);
      setProgress(0);
      
      // Fast initial jump
      setTimeout(() => setProgress(30), 50);
      
      // Slow crawl after initial jump
      interval = window.setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          const increment = Math.random() * 5;
          return prev + increment;
        });
      }, 200);
    } else {
      // Complete the progress
      setProgress(100);
      
      // Hide after animation finishes
      setTimeout(() => {
        setVisible(false);
        // Reset after it's hidden to be ready for next time
        setTimeout(() => setProgress(0), 300);
      }, 400);
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isLoading]);

  if (!visible && progress === 0) return null;

  return (
    <div className={`fixed top-0 right-64 left-0 z-[100] h-1 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
