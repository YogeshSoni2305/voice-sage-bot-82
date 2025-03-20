
import React from 'react';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  isUser: boolean;
  text: string;
  isLoading?: boolean;
  className?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  isUser,
  text,
  isLoading = false,
  className,
}) => {
  return (
    <div 
      className={cn(
        'flex items-start gap-3 w-full max-w-full animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      <div 
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0',
          isUser ? 'bg-assistant' : 'bg-slate-100 dark:bg-slate-700'
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-assistant" />
        )}
      </div>
      
      <div 
        className={cn(
          'rounded-xl py-3 px-4 break-words',
          'transition-all duration-200 ease-in-out',
          'max-w-[calc(100%-70px)]',
          isUser 
            ? 'bg-assistant text-white animate-fade-in-left rounded-tr-none' 
            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white animate-fade-in-right rounded-tl-none',
          isLoading && 'opacity-70'
        )}
      >
        {text}
      </div>
    </div>
  );
};

export default MessageBubble;
