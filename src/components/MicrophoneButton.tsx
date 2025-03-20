
import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MicrophoneButtonProps {
  isListening: boolean;
  isLoading: boolean;
  onClick: () => void;
  className?: string;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isListening,
  isLoading,
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        'relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 shadow-lg',
        isListening 
          ? 'bg-assistant text-white scale-110' 
          : 'bg-white text-assistant-dark hover:bg-slate-50',
        isLoading && 'opacity-70',
        className
      )}
      aria-label={isListening ? 'Stop listening' : 'Start listening'}
    >
      {isLoading ? (
        <Loader2 className="w-7 h-7 animate-spin" />
      ) : isListening ? (
        <>
          <span className="absolute inset-0 rounded-full animate-pulse-ring bg-assistant/40"></span>
          <MicOff className="w-7 h-7" />
        </>
      ) : (
        <Mic className="w-7 h-7" />
      )}
    </button>
  );
};

export default MicrophoneButton;
