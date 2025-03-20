
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Use refs to avoid dependency issues with cleanup functions
  const silenceTimerRef = useRef<number | null>(null);
  const lastResultTimestampRef = useRef<number>(Date.now());
  
  // Store interim results in a ref to avoid rerenders while typing
  const interimTranscriptRef = useRef<string>('');
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    // Improved configuration for better recognition
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';
    
    // Increase for faster initial response (default is often 500-1000ms)
    if ('speechRecognitionTimeout' in recognitionInstance) {
      // @ts-ignore - Non-standard property
      recognitionInstance.speechRecognitionTimeout = 100;
    }
    
    recognitionInstance.onresult = (event: any) => {
      lastResultTimestampRef.current = Date.now();
      
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;
      
      // Process both interim and final results immediately
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += ' ' + transcript;
          finalTranscriptRef.current = finalTranscript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      interimTranscriptRef.current = interimTranscript;
      
      // Update the visible transcript with both final and interim results
      // This makes the recognition appear faster to the user
      setTranscript((finalTranscript + ' ' + interimTranscript).trim());
    };

    recognitionInstance.onerror = (event: any) => {
      // Ignore no-speech errors when user is just being quiet
      if (event.error === 'no-speech') {
        return;
      }
      
      console.error('Speech recognition error:', event.error);
      
      // Handle other errors
      setError(`Speech recognition error: ${event.error}`);
      
      // For network errors, try to restart recognition
      if (event.error === 'network') {
        if (isListening) {
          try {
            setTimeout(() => {
              recognitionInstance.start();
            }, 1000);
          } catch (err) {
            console.error('Error restarting recognition after network error:', err);
          }
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionInstance.onend = () => {
      // If still listening, restart recognition
      if (isListening) {
        try {
          recognitionInstance.start();
        } catch (err) {
          console.error('Error restarting recognition:', err);
        }
      }
    };

    // Use audio level events if available for better silence detection
    if ('onaudiostart' in recognitionInstance) {
      recognitionInstance.onaudiostart = () => {
        // Clear any existing silence timer
        if (silenceTimerRef.current) {
          window.clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      };
    }

    if ('onaudioend' in recognitionInstance) {
      recognitionInstance.onaudioend = () => {
        // Set a timeout to stop listening if silence persists
        const timer = window.setTimeout(() => {
          if (Date.now() - lastResultTimestampRef.current > 1500 && transcript) {
            if (isListening) {
              stopListening();
            }
          }
        }, 1500); // Reduced from 2000ms to 1500ms for faster response
        
        silenceTimerRef.current = timer as unknown as number;
      };
    }

    recognitionRef.current = recognitionInstance;

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore errors during cleanup
        }
      }
      
      if (silenceTimerRef.current) {
        window.clearTimeout(silenceTimerRef.current);
      }
    };
  }, [isListening, transcript]);

  const startListening = useCallback(() => {
    setError(null);
    setIsListening(true);
    setTranscript('');
    interimTranscriptRef.current = '';
    finalTranscriptRef.current = '';
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
    
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    // Make sure we include any pending interim results in the final transcript
    if (interimTranscriptRef.current) {
      setTranscript((prev) => prev.trim());
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    interimTranscriptRef.current = '';
    finalTranscriptRef.current = '';
  }, []);

  return {
    transcript,
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
};

export default useSpeechRecognition;
