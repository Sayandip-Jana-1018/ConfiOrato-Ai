import { useEffect, useState, useCallback } from 'react';
import { useSpeechStore } from '../store/speechStore';
import axios from 'axios';

interface UseSpeechRecognitionProps {
  onTranscriptionUpdate?: (text: string) => void;
  onAnalysisComplete?: (analysis: {
    confidence: number;
    pace: number;
    clarity: number;
    feedback: string;
  }) => void;
}

export function useSpeechRecognition({
  onTranscriptionUpdate,
  onAnalysisComplete,
}: UseSpeechRecognitionProps = {}) {
  const {
    isRecording,
    startRecording,
    stopRecording,
    confidence,
    speechPace,
    voiceClarity,
    initializeSpeechModel,
  } = useSpeechStore();

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize speech model when the hook is first used
    initializeSpeechModel().catch((err) => {
      setError('Failed to initialize speech recognition model');
      console.error(err);
    });
  }, [initializeSpeechModel]);

  const generateFeedback = useCallback(async (transcription: string) => {
    try {
      const response = await axios.post('/api/analyze-speech', {
        transcription,
        metrics: {
          confidence,
          speechPace,
          voiceClarity,
        },
      });

      if (onAnalysisComplete) {
        onAnalysisComplete({
          confidence,
          pace: speechPace,
          clarity: voiceClarity,
          feedback: response.data.feedback,
        });
      }
    } catch (err) {
      console.error('Error generating feedback:', err);
      setError('Failed to generate feedback');
    }
  }, [confidence, speechPace, voiceClarity, onAnalysisComplete]);

  const start = useCallback(async () => {
    try {
      setError(null);
      await startRecording();
    } catch (err) {
      setError('Failed to start recording');
      console.error(err);
    }
  }, [startRecording]);

  const stop = useCallback(() => {
    try {
      stopRecording();
    } catch (err) {
      setError('Failed to stop recording');
      console.error(err);
    }
  }, [stopRecording]);

  return {
    isRecording,
    confidence,
    speechPace,
    voiceClarity,
    error,
    start,
    stop,
  };
}
