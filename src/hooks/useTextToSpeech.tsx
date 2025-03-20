
import { useState, useCallback, useEffect, useRef } from 'react';

interface UseTextToSpeechProps {
  rate?: number;
  pitch?: number;
  voice?: string;
}

interface UseTextToSpeechReturn {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  error: string | null;
}

const useTextToSpeech = ({
  rate = 1,
  pitch = 1,
  voice = ''
}: UseTextToSpeechProps = {}): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check for browser support
    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech is not supported in this browser.');
      return;
    }

    speechSynthRef.current = window.speechSynthesis;

    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);

  // Set up the speech synthesis voice
  useEffect(() => {
    if (!speechSynthRef.current) return;

    // A bit of delay to make sure voices are loaded
    const timeoutId = setTimeout(() => {
      if (voice && speechSynthRef.current) {
        const voices = speechSynthRef.current.getVoices();
        const selectedVoice = voices.find(v => v.name === voice || v.voiceURI === voice);
        
        if (selectedVoice && utteranceRef.current) {
          utteranceRef.current.voice = selectedVoice;
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [voice]);

  const speak = useCallback((text: string) => {
    if (!speechSynthRef.current) {
      setError('Text-to-speech is not available.');
      return;
    }

    try {
      // Cancel any ongoing speech
      speechSynthRef.current.cancel();

      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      
      // Set voice if specified
      if (voice) {
        const voices = speechSynthRef.current.getVoices();
        const selectedVoice = voices.find(v => v.name === voice || v.voiceURI === voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        setError(`Speech synthesis error: ${event.error}`);
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      speechSynthRef.current.speak(utterance);
    } catch (err) {
      setError(`Error during speech synthesis: ${err}`);
      setIsSpeaking(false);
    }
  }, [rate, pitch, voice]);

  const stop = useCallback(() => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    error
  };
};

export default useTextToSpeech;
