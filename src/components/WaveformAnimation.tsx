
import React from 'react';
import { cn } from '@/lib/utils';

interface WaveformAnimationProps {
  isActive: boolean;
  className?: string;
}

const WaveformAnimation: React.FC<WaveformAnimationProps> = ({ isActive, className }) => {
  return (
    <div 
      className={cn(
        'flex items-end justify-center h-10 gap-1 transition-opacity duration-300',
        isActive ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-assistant w-1 rounded-full',
            `animate-wave-${i}`,
            !isActive && 'animation-pause'
          )}
          style={{
            height: isActive ? '100%' : '20%',
            animationPlayState: isActive ? 'running' : 'paused'
          }}
        ></div>
      ))}
    </div>
  );
};

export default WaveformAnimation;
