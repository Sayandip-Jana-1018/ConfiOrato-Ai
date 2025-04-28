import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { HiCamera, HiMicrophone, HiCog, HiChartBar, HiVideoCamera, HiUserCircle, HiEye, HiEyeOff } from 'react-icons/hi';
import * as tf from '@tensorflow/tfjs';
import AppLayout from '@/components/layout/AppLayout';
import GlassCard from '@/components/ui/GlassCard';
import PoseAnalysis from '@/components/analysis/PoseAnalysis';
import VoiceAnalysis from '@/components/analysis/VoiceAnalysis';
import CameraSettings from '@/components/video/CameraSettings';
import VirtualCoach from '@/components/ui/VirtualCoach';
import BodyLanguageResults from '@/components/analysis/BodyLanguageResults';
import type { CameraSettingsType } from '@/types/camera';
import { useTheme } from '@/context/ThemeContext';
import ThemeSelector from '@/components/ThemeSelector';
import { formatBodyLanguageFeedback, BodyLanguageMetrics } from '@/backend/bodyLanguageFeedback';

export default function VideoAnalysis() {
  const [activeTab, setActiveTab] = useState<'voice' | 'body'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { themeColor } = useTheme();
  const [analysisResult, setAnalysisResult] = useState({
    posture: { type: 'unknown', alignment: 'unknown', confidence: 0 },
    gesture: { type: 'unknown', description: 'No gesture detected', engagement: 'low' },
    confidence: 0,
    suggestions: ['Enable camera to begin analysis'],
  });
  const [cameraSettings, setCameraSettings] = useState<CameraSettingsType>({
    deviceId: '',
    resolution: { width: 320, height: 240 },
    frameRate: 24,
    audioDeviceId: '',
    audioEnabled: true,
    videoEnabled: false, // Default to disabled
  });
  const [bodyLanguageFeedback, setBodyLanguageFeedback] = useState<string>('');
  const [bodyLanguageMetrics, setBodyLanguageMetrics] = useState<BodyLanguageMetrics | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<{ gesture: string; confidence: number } | null>(null);
  const [voiceFeedback, setVoiceFeedback] = useState<string>('');

  // Initialize TensorFlow with optimized settings
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        await tf.ready();
        await tf.setBackend('webgl');
        
        // Optimize WebGL settings
        tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
        tf.env().set('WEBGL_PACK', true);
        tf.env().set('WEBGL_CPU_FORWARD', false);
        tf.env().set('WEBGL_SIZE_UPLOAD_UNIFORM', 4);
        
        if (isMounted && cameraSettings.videoEnabled) {
          startStream();
        }
      } catch (error) {
        console.error('TensorFlow initialization error:', error);
      }
    };
    
    init();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    };
  }, [cameraSettings.videoEnabled]);

  // Handle analysis results
  const handleAnalysisResult = useCallback((result: {
    posture: { type: string, alignment: string, confidence: number },
    gesture: { type: string, description: string, engagement: string },
    confidence: number,
    suggestions: string[]
  }) => {
    setAnalysisResult(result);
  }, []);

  // Memoized stream constraints
  const getStreamConstraints = useMemo(() => {
    return {
      video: cameraSettings.videoEnabled
        ? {
            deviceId: cameraSettings.deviceId || undefined,
            width: { ideal: cameraSettings.resolution.width },
            height: { ideal: cameraSettings.resolution.height },
            frameRate: { ideal: cameraSettings.frameRate }
          }
        : false,
      audio: cameraSettings.audioEnabled
        ? { deviceId: cameraSettings.audioDeviceId || undefined }
        : false,
    };
  }, [cameraSettings]);

  // Optimized stream start
  const startStream = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (!cameraSettings.videoEnabled && !cameraSettings.audioEnabled) {
        setStream(null);
        setVideoError(null);
        return;
      }

      console.log('Starting stream with constraints:', getStreamConstraints);
      const newStream = await navigator.mediaDevices.getUserMedia(getStreamConstraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
        });
      }
      
      setStream(newStream);
      setVideoError(null);
    } catch (error) {
      console.error('Stream error:', error);
      setVideoError('Failed to access camera. Check permissions.');
      setStream(null);
    }
  }, [cameraSettings, getStreamConstraints]);

  // Memoized camera toggle
  const toggleCamera = useCallback(() => {
    setCameraSettings(prev => {
      const newSettings = { ...prev, videoEnabled: !prev.videoEnabled };
      return newSettings;
    });
  }, []);

  // Memoized settings update
  const applySettings = useCallback((newSettings: CameraSettingsType) => {
    setCameraSettings(newSettings);
    if (newSettings.videoEnabled || newSettings.audioEnabled) {
      startStream();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  }, [startStream, stream]);

  const handleRecordingToggle = useCallback(() => {
    if (!stream) return;

    if (isRecording) {
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      
      // Add a small delay to ensure all metrics are processed before stopping
      setTimeout(() => {
        // This ensures the voice analysis component has time to calculate averages
        console.log("Recording stopped and metrics should be processed");
      }, 500);
    } else {
      setIsRecording(true);
      setVoiceFeedback(''); // Clear previous feedback when starting a new recording
      setBodyLanguageFeedback('');
      setBodyLanguageMetrics(null);
      recordingTimerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    }
  }, [isRecording, stream]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Handle body language feedback
  const handleBodyLanguageFeedback = useCallback((feedback: string) => {
    setBodyLanguageFeedback(feedback);
    
    // Update bodyLanguageMetrics with feedback if it exists
    if (bodyLanguageMetrics) {
      setBodyLanguageMetrics({
        ...bodyLanguageMetrics,
        feedback: feedback
      });
    }
  }, [bodyLanguageMetrics]);

  // Handle body language metrics
  const handleBodyLanguageMetrics = useCallback((metrics: BodyLanguageMetrics) => {
    setBodyLanguageMetrics(metrics);
  }, []);

  // Handle voice feedback
  const handleVoiceFeedback = useCallback((feedback: string) => {
    setVoiceFeedback(feedback);
  }, []);

  // UI rendering (simplified; adjust as needed)
  return (
    <AppLayout>
      <div className="max-w-8xl mx-auto px-4 py-8 space-y-6">
        <GlassCard className="p-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Video Analysis</h1>
          <div className="flex justify-center gap-4 mt-4">
            <motion.button
              onClick={() => setActiveTab('voice')}
              className={`px-6 py-2 rounded-lg ${activeTab === 'voice' ? 'text-white border' : 'bg-white/5'}`}
            >
              <HiMicrophone className="w-5 h-5 ml-10 mb-2" /> Voice Analysis
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('body')}
              className={`px-6 py-2 rounded-lg ${activeTab === 'body' ? 'text-white border' : 'bg-white/5'}`}
            >
              <HiVideoCamera className="w-5 h-5 ml-10 mb-2" /> Body Language
            </motion.button>
          </div>
        </GlassCard>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1fr,1fr] gap-6 mx-auto">
          {/* Left panel - Video feed (only shown for voice analysis) */}
          {activeTab === 'voice' && (
            <GlassCard className="relative lg:col-span-1 mx-auto w-full max-w-[700px] h-full p-0">
              <div className="rounded-xl h-[670px] bg-black/50 flex items-center justify-center">
                {stream && cameraSettings.videoEnabled ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                    {videoError || 'Camera is off'}
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-center">
                <button
                  onClick={handleRecordingToggle}
                  className={`px-6 py-3 rounded-lg ${isRecording ? 'bg-red-500' : 'bg-purple-600'} text-white font-medium`}
                  disabled={!stream}
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
                {isRecording && <div className="mt-2 text-white">Recording: {formatTime(recordingTime)}</div>}
              </div>
            </GlassCard>
          )}
          
          {/* Middle panel - Analysis component */}
          <GlassCard className={`p-6 ${activeTab === 'voice' ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
            {/* Camera controls - always visible in both tabs */}
            <div className="flex justify-end mb-4">
              <button onClick={toggleCamera} className="p-2 rounded-lg bg-black/40 mr-2">
                {cameraSettings.videoEnabled ? (
                  <HiEye className="w-5 h-5 text-white" />
                ) : (
                  <HiEyeOff className="w-5 h-5 text-white/60" />
                )}
              </button>
              <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg bg-black/40">
                <HiCog className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            {activeTab === 'voice' ? (
              <VoiceAnalysis 
                stream={stream} 
                isRecording={isRecording}
                onFeedbackGenerated={handleVoiceFeedback}
              />
            ) : (
              <>
                <PoseAnalysis
                  stream={stream}
                  isRecording={isRecording}
                  setIsRecording={setIsRecording}
                  onFeedbackGenerated={handleBodyLanguageFeedback}
                  onMetricsGenerated={handleBodyLanguageMetrics}
                  onPredictionUpdate={setCurrentPrediction}
                />
                
                {/* Recording controls for body language tab */}
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleRecordingToggle}
                    className={`px-6 py-3 rounded-lg ${isRecording ? 'bg-red-500' : 'bg-purple-600'} text-white font-medium`}
                    disabled={!stream}
                  >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </button>
                  {isRecording && <div className="ml-4 text-white flex items-center">Recording: {formatTime(recordingTime)}</div>}
                </div>
              </>
            )}
          </GlassCard>
          
          {/* Right panel - Virtual Coach and feedback */}
          <GlassCard className={`p-6 ${activeTab === 'voice' ? 'lg:col-span-1' : ''}`}>
            <div className="h-[300px]">
              <VirtualCoach 
                modelUrl="/models/virtual_coach.glb" 
                className="h-full" 
                sessionResults={bodyLanguageMetrics}
              />
            </div>
            
            <div className="mt-4">
              {activeTab === 'body' && !isRecording ? (
                <BodyLanguageResults metrics={bodyLanguageMetrics} currentPrediction={currentPrediction} />
              ) : (
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-white/80 text-sm font-medium">
                    {isRecording 
                      ? `Analyzing your ${activeTab === 'body' ? 'body language' : 'voice'}...` 
                      : `Your ${activeTab === 'body' ? 'body language' : 'voice'} analysis`}
                  </p>
                  
                  {/* Display voice feedback when available */}
                  {activeTab === 'voice' && voiceFeedback && !isRecording && (
                    <div className="mt-4 max-h-[200px] overflow-y-auto">
                      <h3 className="text-blue-300 font-semibold mb-2">Voice Analysis</h3>
                      <div className="text-white/80 text-sm">{voiceFeedback}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
        {showSettings && (
          <CameraSettings
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            settings={cameraSettings}
            onApply={applySettings}
          />
        )}
      </div>
      <ThemeSelector />
    </AppLayout>
  );
}