import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

interface VoiceAssistantEventHandlerProps {
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onAnalyzeSpeech?: () => void;
  onReadGraph?: () => void;
  onEditProfile?: (target: string, value: string) => void;
}

/**
 * Component that listens for voice assistant events and triggers the appropriate handlers
 * This should be included in pages that need to respond to voice commands
 */
const VoiceAssistantEventHandler: React.FC<VoiceAssistantEventHandlerProps> = ({
  onStartRecording,
  onStopRecording,
  onAnalyzeSpeech,
  onReadGraph,
  onEditProfile
}) => {
  const router = useRouter();

  // Handle start recording events
  const handleStartRecording = useCallback(() => {
    console.log('VoiceAssistantEventHandler: Received start recording event');
    if (onStartRecording) {
      onStartRecording();
    } else {
      console.log('VoiceAssistantEventHandler: No start recording handler provided');
    }
  }, [onStartRecording]);

  // Handle stop recording events
  const handleStopRecording = useCallback(() => {
    console.log('VoiceAssistantEventHandler: Received stop recording event');
    if (onStopRecording) {
      onStopRecording();
    } else {
      console.log('VoiceAssistantEventHandler: No stop recording handler provided');
    }
  }, [onStopRecording]);

  // Handle analyze speech events
  const handleAnalyzeSpeech = useCallback(() => {
    console.log('VoiceAssistantEventHandler: Received analyze speech event');
    if (onAnalyzeSpeech) {
      onAnalyzeSpeech();
    } else {
      console.log('VoiceAssistantEventHandler: No analyze speech handler provided');
    }
  }, [onAnalyzeSpeech]);

  // Handle read events
  const handleRead = useCallback((event: CustomEvent) => {
    const target = event.detail?.target;
    console.log(`VoiceAssistantEventHandler: Received read event for ${target}`);
    
    if (target === 'graph' && onReadGraph) {
      onReadGraph();
    } else {
      console.log(`VoiceAssistantEventHandler: No handler for reading ${target}`);
    }
  }, [onReadGraph]);

  // Handle edit events
  const handleEdit = useCallback((event: CustomEvent) => {
    const { target, value } = event.detail || {};
    console.log(`VoiceAssistantEventHandler: Received edit event for ${target} with value: ${value}`);
    
    if (onEditProfile) {
      onEditProfile(target, value);
    } else {
      console.log('VoiceAssistantEventHandler: No edit profile handler provided');
    }
  }, [onEditProfile]);

  // Set up event listeners
  useEffect(() => {
    console.log('VoiceAssistantEventHandler: Setting up event listeners');
    
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

  // This component doesn't render anything visible
  return null;
};

export default VoiceAssistantEventHandler;
