import { useState, useEffect, useCallback } from 'react';

export interface VoiceMetrics {
  confidence: number;
  clarity: number;
  pace: number;
  pitchVariation: number;
  volume: number;
  fillerWords: number;
  articulation: number;
  engagement: number;
}

interface VoiceAnalyzerProps {
  isListening: boolean;
  onMetricsUpdate: (metrics: VoiceMetrics) => void;
  audioStream: MediaStream | null;
  analyserNode: AnalyserNode | null;
}

export default function VoiceAnalyzer({ 
  isListening, 
  onMetricsUpdate, 
  audioStream, 
  analyserNode 
}: VoiceAnalyzerProps) {
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);

  // Function for real-time audio analysis
  const analyzeAudio = useCallback(() => {
    if (!analyserNode || !isListening) return;
    
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    
    const runAnalysis = () => {
      analyserNode.getByteFrequencyData(dataArray);
      
      // Calculate average frequency
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      
      // Calculate metrics based on audio data
      // These are simplified calculations for demonstration
      const confidence = Math.min(100, Math.max(0, average * 1.5));
      const clarity = Math.min(100, Math.max(0, average * 1.2 + 20));
      const pace = Math.min(100, Math.max(0, 70 + (Math.random() * 30 - 15)));
      const volume = Math.min(100, Math.max(0, average * 1.3));
      const pitchVariation = Math.min(100, Math.max(0, 65 + (Math.random() * 20 - 10)));
      const fillerWords = Math.floor(Math.random() * 10); // Placeholder - would need speech recognition
      const articulation = Math.min(100, Math.max(0, clarity * 0.8));
      const engagement = Math.min(100, Math.max(0, (pitchVariation + volume) / 2));
      
      // Update metrics
      onMetricsUpdate({
        confidence,
        clarity,
        pace,
        volume,
        pitchVariation,
        fillerWords,
        articulation,
        engagement
      });
      
      // Continue analyzing if still listening
      if (isListening) {
        const frameId = requestAnimationFrame(runAnalysis);
        setAnimationFrameId(frameId);
      }
    };
    
    runAnalysis();
  }, [analyserNode, isListening, onMetricsUpdate]);

  // Start/stop analysis based on listening state
  useEffect(() => {
    if (isListening && analyserNode) {
      analyzeAudio();
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isListening, analyserNode, analyzeAudio, animationFrameId]);

  // This component doesn't render anything visible
  return null;
}
