
import { useState, useEffect, useCallback } from 'react';

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
  const [recognition, setRecognition] = useState<any | null>(null);
  const [silenceTimer, setSilenceTimer] = useState<number | null>(null);

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
    recognitionInstance.maxAlternatives = 3; // Get multiple alternatives for better accuracy

    // Add silence detection
    let lastResultTimestamp = Date.now();
    
    recognitionInstance.onresult = (event: any) => {
      lastResultTimestamp = Date.now();
      
      // Process results for best transcript
      const currentTranscript = Array.from(event.results)
        .map((result: any) => {
          // Get the most confident result
          let bestResult = result[0];
          for (let i = 1; i < result.length; i++) {
            if (result[i].confidence > bestResult.confidence) {
              bestResult = result[i];
            }
          }
          return bestResult.transcript;
        })
        .join(' ');
      
      setTranscript(currentTranscript);
    };

    recognitionInstance.onerror = (event: any) => {
      // Ignore no-speech errors when user is just being quiet
      if (event.error === 'no-speech') {
        return;
      }
      
      // Handle other errors
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
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

    recognitionInstance.onsoundstart = () => {
      // Clear any existing silence timer
      if (silenceTimer) {
        window.clearTimeout(silenceTimer);
        setSilenceTimer(null);
      }
    };

    recognitionInstance.onsoundend = () => {
      // Set a timeout to stop listening if silence persists
      const timer = window.setTimeout(() => {
        if (Date.now() - lastResultTimestamp > 2000 && transcript) {
          stopListening();
        }
      }, 2000);
      
      setSilenceTimer(timer as unknown as number);
    };

    setRecognition(recognitionInstance);

    // Cleanup
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      
      if (silenceTimer) {
        window.clearTimeout(silenceTimer);
      }
    };
  }, [isListening, silenceTimer, transcript]);

  const startListening = useCallback(() => {
    setError(null);
    setIsListening(true);
    setTranscript('');
    
    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
    
    if (silenceTimer) {
      window.clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }
  }, [recognition, silenceTimer]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
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
