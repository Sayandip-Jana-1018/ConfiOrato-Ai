import { create } from 'zustand';
import * as tf from '@tensorflow/tfjs';
import * as speechCommands from '@tensorflow-models/speech-commands';

interface SpeechState {
  isRecording: boolean;
  audioContext: AudioContext | null;
  analyzer: AnalyserNode | null;
  mediaRecorder: MediaRecorder | null;
  recordedChunks: Blob[];
  audioData: Float32Array | null;
  confidence: number;
  speechPace: number;
  voiceClarity: number;
  transcription: string;
  speechModel: speechCommands.SpeechCommandRecognizer | null;
  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  processAudio: () => void;
  initializeSpeechModel: () => Promise<void>;
}

export const useSpeechStore = create<SpeechState>((set, get) => ({
  isRecording: false,
  audioContext: null,
  analyzer: null,
  mediaRecorder: null,
  recordedChunks: [],
  audioData: null,
  confidence: 0,
  speechPace: 0,
  voiceClarity: 0,
  transcription: '',
  speechModel: null,

  initializeSpeechModel: async () => {
    try {
      await tf.ready();
      const recognizer = speechCommands.create('BROWSER_FFT');
      await recognizer.ensureModelLoaded();
      set({ speechModel: recognizer });
    } catch (error) {
      console.error('Error initializing speech model:', error);
    }
  },

  startRecording: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;

      source.connect(analyzer);
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          set((state) => ({
            recordedChunks: [...state.recordedChunks, event.data]
          }));
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms

      set({
        isRecording: true,
        audioContext,
        analyzer,
        mediaRecorder,
        recordedChunks: []
      });

      // Start processing audio for real-time feedback
      get().processAudio();

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  },

  stopRecording: () => {
    const { mediaRecorder, audioContext } = get();

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    if (audioContext) {
      audioContext.close();
    }

    set({
      isRecording: false,
      audioContext: null,
      analyzer: null,
      mediaRecorder: null
    });
  },

  processAudio: () => {
    const { analyzer, isRecording } = get();
    
    if (!analyzer || !isRecording) return;

    const bufferLength = analyzer.frequencyBinCount;
    const audioData = new Float32Array(bufferLength);
    analyzer.getFloatTimeDomainData(audioData);

    // Calculate audio features
    const rms = Math.sqrt(
      audioData.reduce((acc, val) => acc + val * val, 0) / bufferLength
    );

    // Calculate voice clarity (simplified)
    const voiceClarity = Math.min(rms * 10, 1);

    // Calculate confidence based on signal strength
    const confidence = Math.min(rms * 8, 1);

    // Calculate speech pace based on zero crossings
    let zeroCrossings = 0;
    for (let i = 1; i < bufferLength; i++) {
      if ((audioData[i] * audioData[i - 1]) < 0) {
        zeroCrossings++;
      }
    }
    const speechPace = Math.min(zeroCrossings / bufferLength * 2, 1);

    set({
      audioData,
      voiceClarity,
      confidence,
      speechPace
    });

    // Continue processing if still recording
    if (isRecording) {
      requestAnimationFrame(() => get().processAudio());
    }
  }
}));
