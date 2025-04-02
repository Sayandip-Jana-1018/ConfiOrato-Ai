import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

interface VoiceCommandHandlers {
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onAnalyzeSpeech?: () => void;
  onReadGraph?: (target?: string) => void;
  onEditProfile?: (target: string, value: string) => void;
}

/**
 * Custom hook to handle voice command events
 * This hook sets up event listeners for voice commands and calls the appropriate handlers
 */
export const useVoiceCommands = (handlers: VoiceCommandHandlers) => {
  const router = useRouter();

  // Handle start recording events
  const handleStartRecording = useCallback(() => {
    console.log('useVoiceCommands: Received start recording event');
    if (handlers.onStartRecording) {
      handlers.onStartRecording();
    } else {
      console.log('useVoiceCommands: No start recording handler provided');
    }
  }, [handlers.onStartRecording]);

  // Handle stop recording events
  const handleStopRecording = useCallback(() => {
    console.log('useVoiceCommands: Received stop recording event');
    if (handlers.onStopRecording) {
      handlers.onStopRecording();
    } else {
      console.log('useVoiceCommands: No stop recording handler provided');
    }
  }, [handlers.onStopRecording]);

  // Handle analyze speech events
  const handleAnalyzeSpeech = useCallback(() => {
    console.log('useVoiceCommands: Received analyze speech event');
    if (handlers.onAnalyzeSpeech) {
      handlers.onAnalyzeSpeech();
    } else {
      console.log('useVoiceCommands: No analyze speech handler provided');
    }
  }, [handlers.onAnalyzeSpeech]);

  // Handle read events
  const handleRead = useCallback((event: CustomEvent) => {
    const target = event.detail?.target;
    console.log(`useVoiceCommands: Received read event for ${target}`);
    
    if (handlers.onReadGraph) {
      handlers.onReadGraph(target);
    } else {
      console.log(`useVoiceCommands: No handler for reading ${target}`);
    }
  }, [handlers.onReadGraph]);

  // Handle edit events
  const handleEdit = useCallback((event: CustomEvent) => {
    const { target, value } = event.detail || {};
    console.log(`useVoiceCommands: Received edit event for ${target} with value: ${value}`);
    
    if (handlers.onEditProfile) {
      handlers.onEditProfile(target, value);
    } else {
      console.log('useVoiceCommands: No edit profile handler provided');
    }
  }, [handlers.onEditProfile]);

  // Set up event listeners
  useEffect(() => {
    console.log('useVoiceCommands: Setting up event listeners');
    
    // Add event listeners
    document.addEventListener('voice-assistant:start-recording', handleStartRecording);
    document.addEventListener('voice-assistant:stop-recording', handleStopRecording);
    document.addEventListener('voice-assistant:analyze-speech', handleAnalyzeSpeech);
    document.addEventListener('voice-assistant:read', handleRead as EventListener);
    document.addEventListener('voice-assistant:edit', handleEdit as EventListener);
    
    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('voice-assistant:start-recording', handleStartRecording);
      document.removeEventListener('voice-assistant:stop-recording', handleStopRecording);
      document.removeEventListener('voice-assistant:analyze-speech', handleAnalyzeSpeech);
      document.removeEventListener('voice-assistant:read', handleRead as EventListener);
      document.removeEventListener('voice-assistant:edit', handleEdit as EventListener);
    };
  }, [handleStartRecording, handleStopRecording, handleAnalyzeSpeech, handleRead, handleEdit]);
};

export default useVoiceCommands;
