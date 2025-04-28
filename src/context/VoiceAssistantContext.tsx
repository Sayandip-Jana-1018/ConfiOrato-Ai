import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking' | 'thinking' | 'error' | 'navigating';

interface VoiceAssistantContextType {
  assistantState: AssistantState;
  setAssistantState: (state: AssistantState) => void;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  caption: string;
  setCaption: (caption: string) => void;
  speak: (text: string) => void;
  activeComponent: string | null;
  setActiveComponent: (componentId: string | null) => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | undefined>(undefined);

export const VoiceAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [caption, setCaption] = useState<string>('');
  // Track which component is currently using the microphone
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  const toggleEnabled = () => {
    setIsEnabled(!isEnabled);
  };

  // Speak text using speech synthesis
  const speak = useCallback((text: string) => {
    if (!isEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Update state
      setAssistantState('speaking');
      setCaption(text);
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      
      // Use a more natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Natural') || 
        voice.name.includes('Female')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      // Handle speech end
      utterance.onend = () => {
        setAssistantState('idle');
        setCaption('');
      };
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error speaking text:', error);
      setAssistantState('idle');
      setCaption('');
    }
  }, [isEnabled]);

  return (
    <VoiceAssistantContext.Provider value={{ 
      assistantState, 
      setAssistantState, 
      isEnabled,
      setIsEnabled, 
      toggleEnabled,
      caption,
      setCaption,
      speak,
      activeComponent,
      setActiveComponent
    }}>
      {children}
    </VoiceAssistantContext.Provider>
  );
};

export const useVoiceAssistant = () => {
  const context = useContext(VoiceAssistantContext);
  if (context === undefined) {
    throw new Error('useVoiceAssistant must be used within a VoiceAssistantProvider');
  }
  return context;
};
