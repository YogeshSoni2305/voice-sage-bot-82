
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
  const [femaleVoice, setFemaleVoice] = useState<SpeechSynthesisVoice | null>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check for browser support
    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech is not supported in this browser.');
      return;
    }

    speechSynthRef.current = window.speechSynthesis;

    // Find and set female voice
    const findFemaleVoice = () => {
      // Get all available voices
      const voices = speechSynthRef.current?.getVoices() || [];
      
      if (voices.length === 0) {
        // If voices aren't loaded yet, try again later
        return null;
      }
      
      // Try to find a female voice
      // First, look for voices with 'female' in the name
      let selectedVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('girl')
      );
      
      // If no explicit female voice, try common female assistant names
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('samantha') || 
          voice.name.toLowerCase().includes('siri') ||
          voice.name.toLowerCase().includes('alexa') ||
          voice.name.toLowerCase().includes('cortana')
        );
      }
      
      // If still no match, try to find a voice with a high pitch
      // Or just use the first English female voice
      if (!selectedVoice) {
        // Look for English voices
        const englishVoices = voices.filter(voice => 
          voice.lang.includes('en-') || voice.lang.includes('en_')
        );
        
        // Get the first non-male voice or just the first one
        selectedVoice = englishVoices.find(voice => 
          !voice.name.toLowerCase().includes('male') && 
          !voice.name.toLowerCase().includes('man')
        ) || englishVoices[0];
      }
      
      return selectedVoice || voices[0];
    };
    
    // Get voices initially (sometimes voices don't load immediately)
    const initialVoice = findFemaleVoice();
    if (initialVoice) {
      setFemaleVoice(initialVoice);
    }
    
    // Set up a listener for when voices are loaded
    speechSynthRef.current.onvoiceschanged = () => {
      const selectedVoice = findFemaleVoice();
      if (selectedVoice) {
        setFemaleVoice(selectedVoice);
      }
    };

    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);

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
      
      // Set the female voice
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      } else if (voice) {
        // Fall back to specified voice if no female voice is found
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
  }, [rate, pitch, voice, femaleVoice]);

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
