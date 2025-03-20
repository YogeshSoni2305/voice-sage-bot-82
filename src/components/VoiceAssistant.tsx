
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import MicrophoneButton from './MicrophoneButton';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WaveformAnimation from './WaveformAnimation';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import useTextToSpeech from '@/hooks/useTextToSpeech';
import { generateLLMResponse, Message } from '@/services/llmService';
import { AlertCircle, Clock, Calendar, CloudSun } from 'lucide-react';

interface VoiceAssistantProps {
  className?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ className }) => {
  const [messages, setMessages] = useState<Array<Message & { id: string }>>([
    { 
      role: 'assistant', 
      content: 'Hello! I\'m your AI assistant. How can I help you today? You can ask me about the time, date, weather, or anything else.',
      id: 'init-' + Date.now()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoEndListening, setAutoEndListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { transcript, isListening, error: speechError, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking, error: ttsError } = useTextToSpeech();

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Process transcript when user has been silent for a moment
  useEffect(() => {
    if (isListening && transcript.trim() && autoEndListening) {
      // Stop listening after a significant pause in speech
      stopListening();
      setAutoEndListening(false);
      
      // Process the transcript
      handleSendMessage(transcript);
    }
  }, [isListening, transcript, autoEndListening]);

  // Set up auto-end listening when transcript has been stable for a while
  useEffect(() => {
    if (isListening && transcript.trim()) {
      const timer = setTimeout(() => {
        setAutoEndListening(true);
      }, 1500); // 1.5 seconds of silence triggers auto-end
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isListening, transcript]);

  // Set errors from hooks
  useEffect(() => {
    if (speechError) setError(speechError);
    if (ttsError) setError(ttsError);
  }, [speechError, ttsError]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        handleSendMessage(transcript);
      }
    } else {
      if (isSpeaking) stopSpeaking();
      setAutoEndListening(false);
      startListening();
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    
    // Add user message
    const userMessage = { 
      role: 'user' as const, 
      content: text.trim(),
      id: 'user-' + Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    resetTranscript();
    setIsProcessing(true);
    
    // Display typing indicator
    setIsTyping(true);
    
    try {
      // Prepare message history for LLM
      const messageHistory: Message[] = [
        { role: 'system', content: 'You are a helpful, concise, and friendly assistant.' },
        ...messages.map(({ role, content }) => ({ role, content })),
        userMessage
      ];
      
      // Generate response from LLM
      const { response, error: llmError } = await generateLLMResponse(messageHistory);
      
      if (llmError) {
        setError(llmError);
      }
      
      // Hide typing indicator
      setIsTyping(false);
      
      // Add assistant response
      const assistantMessage = { 
        role: 'assistant' as const, 
        content: response,
        id: 'assistant-' + Date.now()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response
      speak(response);
      
    } catch (err) {
      setIsTyping(false);
      setError(`Error processing message: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to determine if a message is related to time, date, or weather
  const getMessageIcon = (content: string) => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('time') && !lowerContent.includes('weather') && !lowerContent.includes('date')) {
      return <Clock className="w-4 h-4 text-blue-500" />;
    } else if ((lowerContent.includes('date') || lowerContent.includes('day')) && !lowerContent.includes('weather') && !lowerContent.includes('time')) {
      return <Calendar className="w-4 h-4 text-green-500" />;
    } else if (lowerContent.includes('weather')) {
      return <CloudSun className="w-4 h-4 text-yellow-500" />;
    }
    
    return null;
  };

  return (
    <div className={cn('flex flex-col h-full w-full max-w-3xl mx-auto', className)}>
      {/* Header */}
      <div className="flex justify-center py-4 glass-panel rounded-b-2xl border-t-0 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="text-assistant">AI</span> Voice Assistant
        </h1>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 flex flex-col overflow-y-auto py-6 px-4 space-y-6">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            isUser={message.role === 'user'}
            text={message.content}
            icon={message.role === 'assistant' ? getMessageIcon(message.content) : undefined}
          />
        ))}
        
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 flex-shrink-0">
              <div className="w-5 h-5 text-assistant">
                <TypingIndicator />
              </div>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg animate-fade-in">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {/* Empty div for scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-4 glass-panel rounded-t-2xl border-b-0 shadow-lg">
        <div className="flex flex-col items-center gap-4">
          {/* Transcript or Waveform */}
          <div className="w-full min-h-12 rounded-xl flex items-center justify-center">
            {isListening ? (
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 animate-fade-in">
                {transcript || "Listening..."}
              </div>
            ) : isSpeaking ? (
              <WaveformAnimation isActive={isSpeaking} />
            ) : null}
          </div>
          
          {/* Microphone Button */}
          <MicrophoneButton 
            isListening={isListening}
            isLoading={isProcessing}
            onClick={toggleListening}
          />
          
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isListening ? 'Tap to stop listening or wait for a pause' : 'Tap the microphone to speak'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
