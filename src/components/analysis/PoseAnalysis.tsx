import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  HiOutlineVideoCamera, 
  HiOutlineStop, 
  HiOutlineRefresh, 
  HiOutlineInformationCircle,
  HiOutlineThumbUp,
  HiOutlineThumbDown
} from 'react-icons/hi';
import RealTimeDetection from './RealTimeDetection';
import BodyLanguageResults from './BodyLanguageResults';
import { 
  analyzeBodyLanguageFrame, 
  startBodyLanguageSession, 
  stopBodyLanguageSession 
} from '@/pages/api/body-language-feedback';
import { getGestureColor, getGestureStatus } from '@/backend/bodyLanguageFeedback';
import { PoseAnalysisProvider } from './PoseAnalysisContext';

interface PoseAnalysisProps {
  stream: MediaStream | null;
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  onFeedbackGenerated: (feedback: any) => void;
  onMetricsGenerated: (metrics: any) => void;
  onPredictionUpdate?: (prediction: { gesture: string; confidence: number }) => void;
}

const PoseAnalysis: React.FC<PoseAnalysisProps> = ({
  stream,
  isRecording,
  setIsRecording,
  onFeedbackGenerated,
  onMetricsGenerated,
  onPredictionUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<any>(null);
  const [processingFrame, setProcessingFrame] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const [lastProcessedImage, setLastProcessedImage] = useState<string | null>(null);
  const [visualizationStyle, setVisualizationStyle] = useState({
    showSkeleton: true,
    colorScheme: 'default',
    lineStyle: 'solid',
    showLabels: false
  });

  // Initialize video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
        setError('Failed to play video stream');
      });
    }
  }, [stream]);

  // Start/stop recording session
  useEffect(() => {
    let sessionStartTimeout: NodeJS.Timeout | null = null;
    let sessionStopTimeout: NodeJS.Timeout | null = null;
    
    const startSession = async () => {
      try {
        // Only start a new session if we don't already have one
        if (!sessionId) {
          console.log('Starting new body language session...');
          const newSessionId = await startBodyLanguageSession();
          console.log(`Session started with ID: ${newSessionId}`);
          setSessionId(newSessionId);
        }
      } catch (error) {
        console.error('Error starting session:', error);
        setError('Failed to start recording session');
      }
    };
    
    const stopSession = async () => {
      try {
        // Only stop if we have a valid session ID
        if (sessionId) {
          console.log(`Stopping session with ID: ${sessionId}`);
          const metrics = await stopBodyLanguageSession(sessionId);
          
          // Process metrics
          if (metrics) {
            console.log('Session metrics:', metrics);
            onMetricsGenerated(metrics);
            
            // Generate feedback
            const feedback = {
              type: 'body-language',
              metrics: metrics,
              timestamp: new Date().toISOString(),
            };
            onFeedbackGenerated(feedback);
          }
          
          // Keep the last prediction visible after stopping
          // Don't clear currentPrediction here
          
          // Clear session ID after a short delay to prevent race conditions
          setTimeout(() => {
            setSessionId('');
          }, 500);
        }
      } catch (error) {
        console.error('Error stopping session:', error);
        setError('Failed to stop recording session');
        
        // Even if there's an error, clear the session ID to allow restarting
        setTimeout(() => {
          setSessionId('');
        }, 500);
      }
    };
    
    if (isRecording && !sessionId) {
      // Add a small delay before starting the session to prevent rapid start/stop cycles
      sessionStartTimeout = setTimeout(startSession, 300);
    } else if (!isRecording && sessionId) {
      // Add a small delay before stopping the session to prevent rapid start/stop cycles
      sessionStopTimeout = setTimeout(stopSession, 300);
    }
    
    return () => {
      // Clean up timeouts
      if (sessionStartTimeout) clearTimeout(sessionStartTimeout);
      if (sessionStopTimeout) clearTimeout(sessionStopTimeout);
    };
  }, [isRecording, sessionId, onFeedbackGenerated, onMetricsGenerated]);

    // Current prediction display component
    const RealTimeDetectionComponent = () => {
      // If we're not recording and have no current prediction but have a last processed image,
      // show the last detected gesture instead of a default message
      if (!isRecording && !currentPrediction && lastProcessedImage) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/30 flex items-center justify-center mb-4">
              <HiOutlineInformationCircle className="w-8 h-8 text-purple-300" />
            </div>
            <p className="text-white font-medium text-lg">Last detected gesture</p>
            <p className="text-gray-400 text-sm mt-2">Start recording to update analysis</p>
          </div>
        );
      }
      
      // Use the current prediction from the video feed if available
      if (currentPrediction) {
        const { class: gestureName, confidence } = currentPrediction;
        const status = getGestureStatus(gestureName);
        const colorClass = status === 'positive' 
          ? 'bg-green-500/30 text-green-400' 
          : status === 'negative' 
            ? 'bg-red-500/30 text-red-400' 
            : 'bg-blue-500/30 text-blue-400';
        
        // Get description for the gesture
        const getGestureDescription = (name: string): string => {
          const descriptions: Record<string, string> = {
            'Open Palm': 'Indicates openness and honesty',
            'Thumbs Up': 'Shows approval and positive reinforcement',
            'Victorious': 'Appears confident but may be distracting if overused',
            'Pointing': 'Used to emphasize key points',
            'Crossed Arms': 'May appear defensive or closed off',
            'Hands In Pockets': 'Can appear casual or nervous',
            'Face Touching': 'Can be distracting and appear nervous',
            'Head Nodding': 'Shows active listening and agreement',
            'Slouching': 'Projects low confidence and disinterest',
          };
          
          // Find matching description
          for (const [key, desc] of Object.entries(descriptions)) {
            if (name.includes(key)) {
              return desc;
            }
          }
          
          return 'Analyze your body language in real-time';
        };
        
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`w-16 h-16 rounded-full ${colorClass.split(' ')[0]} flex items-center justify-center mb-3`}>
              {status === 'positive' ? (
                <HiOutlineThumbUp className={`w-8 h-8 ${colorClass.split(' ')[1]}`} />
              ) : status === 'negative' ? (
                <HiOutlineThumbDown className={`w-8 h-8 ${colorClass.split(' ')[1]}`} />
              ) : (
                <HiOutlineInformationCircle className={`w-8 h-8 ${colorClass.split(' ')[1]}`} />
              )}
            </div>
            <p className="text-white font-medium text-xl mb-1">{gestureName}</p>
            <div className="w-full max-w-[200px] bg-gray-700/50 rounded-full h-2 mb-3">
              <div 
                className={`h-2 rounded-full ${status === 'positive' ? 'bg-green-400' : status === 'negative' ? 'bg-red-400' : 'bg-blue-400'}`}
                style={{ width: `${confidence * 100}%` }}
                aria-label={`Confidence: ${(confidence * 100).toFixed(0)}%`}
              ></div>
            </div>
            <p className="text-gray-300 text-sm mb-2">Confidence: {(confidence * 100).toFixed(1)}%</p>
            <p className="text-gray-400 text-sm px-2">{getGestureDescription(gestureName)}</p>
          </div>
        );
      }
      
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 rounded-full bg-gray-500/20 flex items-center justify-center mb-4">
            <HiOutlineVideoCamera className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-300 font-medium">Start recording to begin analysis</p>
          <p className="text-gray-400 text-sm mt-2">Your body language will be analyzed in real-time</p>
        </div>
      );
    };

  // Process frames when recording - analyze every 5 frames for more frequent skeletal visualization
  useEffect(() => {
    let frameProcessingInterval: NodeJS.Timeout | null = null;
    
    const processFrame = async () => {
      if (!isRecording || !sessionId || !stream || !videoRef.current || !canvasRef.current) {
        return;
      }
      
      try {
        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        // Flip horizontally for mirror effect
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Process the frame
        const result = await analyzeBodyLanguageFrame(sessionId, imageData);
        
        if (result && result.processedImage) {
          setLastProcessedImage(result.processedImage);
          
          // Update current prediction if available
          if (result.prediction) {
            setCurrentPrediction(result.prediction);
            onPredictionUpdate && onPredictionUpdate({ gesture: result.prediction.class, confidence: result.prediction.confidence });
          }
          
          // Draw the processed image on the canvas
          if (canvasRef.current) {
            const displayCtx = canvasRef.current.getContext('2d');
            if (displayCtx) {
              const img = new Image();
              img.onload = () => {
                if (canvasRef.current && displayCtx) {
                  displayCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                  displayCtx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
                }
              };
              img.src = result.processedImage;
            }
          }
        }
      } catch (error) {
        console.error('Error processing frame:', error);
        // Don't set error state here to avoid UI disruption during recording
        // Just log the error and continue
      }
    };
    
    if (isRecording && sessionId && stream) {
      // Process frames at a reasonable interval (200ms) instead of every animation frame
      // This prevents overwhelming the server with requests
      frameProcessingInterval = setInterval(processFrame, 200);
    }
    
    return () => {
      if (frameProcessingInterval) {
        clearInterval(frameProcessingInterval);
      }
    };
  }, [isRecording, sessionId, stream, videoRef, canvasRef, onPredictionUpdate]);

  // Display video feed even when not recording
  useEffect(() => {
    if (!isRecording && stream && videoRef.current && canvasRef.current && !lastProcessedImage) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const drawVideoFrame = () => {
        if (ctx && videoRef.current) {
          // Set canvas dimensions to match video
          canvas.width = videoRef.current.videoWidth || 640;
          canvas.height = videoRef.current.videoHeight || 480;
          
          // Draw the video frame to canvas (flipped horizontally)
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();
        }
        
        if (!isRecording) {
          animationRef.current = requestAnimationFrame(drawVideoFrame);
        }
      };
      
      drawVideoFrame();
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isRecording, stream, lastProcessedImage]);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <PoseAnalysisProvider>
      <div className="h-full flex flex-col">      
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Canvas for visualization */}
          <div className="relative bg-black/30 h-[400px] md:h-[500px] lg:h-[660px] w-full lg:w-[590px] rounded-xl overflow-hidden mb-4">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full object-contain"
            />
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="hidden" 
            />
            
            {/* Error message */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white p-4">
                <div className="bg-red-500/80 p-4 rounded-lg backdrop-blur-sm">
                  <p>{error}</p>
                </div>
              </div>
            )}
          </div>
        
          {/* Analysis panel */}
          <div className="flex flex-col space-y-4">
            {/* Current prediction */}
            <div className="bg-white/5 w-full lg:ml-40 lg:w-[300px] h-[320px] p-4 rounded-lg backdrop-blur-sm">
              <h3 className="text-lg font-medium mb-2">Real-time Detection</h3>
              <RealTimeDetection currentPrediction={currentPrediction} />
            </div>
                
            {/* Instructions */}
            <div className="p-4 bg-white/5 w-full lg:ml-40 lg:w-[300px] rounded-lg backdrop-blur-sm">
              <h3 className="text-md font-medium mb-2 flex items-center">
                <HiOutlineInformationCircle className="mr-2" />
                Tips for Effective Body Language
              </h3>
              <ul className="text-sm text-white/80 list-disc pl-5 space-y-1">
                <li>Use open palm gestures to appear more trustworthy</li>
                <li>Maintain balanced posture and avoid slouching</li>
                <li>Make purposeful hand movements to emphasize points</li>
                <li>Avoid crossing arms as it can appear defensive</li>
                <li>Keep steady eye contact with your audience</li>
                <li>Maintain balanced posture and avoid slouching</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PoseAnalysisProvider>
  );
};

export default PoseAnalysis;
