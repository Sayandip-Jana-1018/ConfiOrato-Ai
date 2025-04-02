import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { VoiceMetrics } from './VoiceAnalyzer';
import { HiMicrophone, HiPlay, HiPause, HiVolumeUp } from 'react-icons/hi';

interface CoachAvatarProps {
  metrics: VoiceMetrics;
  isListening: boolean;
  feedbackPoints: string[];
  onStartListening: () => Promise<void>;
  onStopListening: () => void;
  audioURL: string | null;
}

// Error state component
const ErrorState = () => {
  return (
    <div className="text-center">
      <div className="w-32 h-32 rounded-xl bg-white/10 mx-auto mb-4 flex items-center justify-center text-5xl">
        🎙️
      </div>
      <p className="text-white/60 text-sm">
        AI Coach visualization is taking a break.
        <br />
        Don't worry, I'm still listening and analyzing!
      </p>
    </div>
  );
};

// Feedback bubble component
const FeedbackBubble = ({ text, delay }: { text: string, delay: number }) => {
  const { themeColor } = useTheme();
  
  return (
    <motion.div
      className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-2 max-w-[90%]"
      initial={{ opacity: 0, y: 20, x: 0 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={{ borderLeft: `3px solid ${themeColor}` }}
    >
      <p className="text-white text-sm whitespace-pre-wrap">{text}</p>
    </motion.div>
  );
};

// Audio Player component
const AudioPlayer = ({ audioURL }: { audioURL: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { themeColor } = useTheme();
  
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);
  
  return (
    <div className="mt-4 w-full">
      <audio ref={audioRef} src={audioURL} className="hidden" />
      <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
        <div className="flex items-center">
          <button 
            onClick={togglePlayback}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${isPlaying ? 'bg-red-500' : `bg-${themeColor}-500`}`}
          >
            {isPlaying ? <HiPause className="w-5 h-5 text-white" /> : <HiPlay className="w-5 h-5 text-white" />}
          </button>
          <div className="ml-3">
            <p className="text-white text-sm font-medium">Your Recording</p>
            <p className="text-white/60 text-xs">Tap to listen</p>
          </div>
        </div>
        <HiVolumeUp className="w-5 h-5 text-white/60" />
      </div>
    </div>
  );
};

export default function CoachAvatar({ 
  metrics, 
  isListening, 
  feedbackPoints, 
  onStartListening, 
  onStopListening,
  audioURL
}: CoachAvatarProps) {
  const { themeColor } = useTheme();
  const [modelError, setModelError] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(true);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [confidenceText, setConfidenceText] = useState("Needs Practice");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Reset feedback visibility when feedback points change
  useEffect(() => {
    setFeedbackVisible(true);
    
    // Hide feedback after 15 seconds
    const timer = setTimeout(() => {
      setFeedbackVisible(false);
    }, 15000);
    
    return () => clearTimeout(timer);
  }, [feedbackPoints]);

  // Update confidence text based on metrics
  useEffect(() => {
    if (metrics.confidence >= 80) {
      setConfidenceText("Excellent Confidence");
    } else if (metrics.confidence >= 60) {
      setConfidenceText("Good Confidence");
    } else if (metrics.confidence >= 40) {
      setConfidenceText("Improving Confidence");
    } else {
      setConfidenceText("Needs Practice");
    }
  }, [metrics.confidence]);

  // Get ARIA label for screen readers
  const getAriaLabel = () => {
    return `AI Coach. ${isListening ? 'Currently listening to your speech.' : 'Tap to start speaking.'}`;
  };

  // Handle microphone click
  const handleMicrophoneClick = async () => {
    if (isListening) {
      onStopListening();
    } else {
      await onStartListening();
    }
  };

  // Draw waveform animation
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Store previous wave points for smooth animation
    let wavePoints: number[] = Array(100).fill(height / 2);
    
    const drawWaveform = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw circular background
      ctx.beginPath();
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.45; // Increased radius
      
      // Create gradient for background
      const bgGradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.5,
        centerX, centerY, radius * 1.2
      );
      
      bgGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)'); // Increased opacity
      bgGradient.addColorStop(1, 'rgba(255, 255, 255, 0.08)'); // Increased opacity
      
      ctx.fillStyle = bgGradient;
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw outer ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `${themeColor}66`; // Increased opacity
      ctx.lineWidth = 3; // Increased line width
      ctx.stroke();
      
      // Draw microphone icon
      const iconSize = 40; // Larger icon size
      const iconY = centerY - iconSize/4; // Adjust position
      
      if (!isListening) {
        // Draw microphone icon
        ctx.fillStyle = 'white';
        ctx.font = `${iconSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎙️', centerX, iconY);
        
        // Draw "Tap to Record" text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px Arial';
        ctx.fillText('Tap to Record', centerX, centerY + radius * 0.6);
      } else {
        // Draw microphone with red color when recording
        ctx.fillStyle = '#f87171';
        ctx.font = `${iconSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎙️', centerX, iconY);
        
        // Draw "Recording..." text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px Arial';
        ctx.fillText('Tap to Stop', centerX, centerY + radius * 0.6);
        
        // Draw recording indicator
        const now = Date.now();
        const pulseSize = 8 + Math.sin(now * 0.008) * 4;
        ctx.beginPath();
        ctx.arc(centerX + radius * 0.6, centerY - radius * 0.6, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = '#f87171';
        ctx.fill();
      }
      
      // Draw smooth waveform
      if (isListening) {
        // Update wave points with new random values for demo
        // In a real app, this would use actual audio data
        wavePoints = wavePoints.map((point, i) => {
          const target = height / 2 + (Math.sin(Date.now() * 0.001 + i * 0.2) * height * 0.2) + 
                        (Math.random() * height * 0.15); // Increased wave amplitude
          // Smooth transition
          return point + (target - point) * 0.1;
        });
        
        // Draw the smooth wave
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        
        // Draw the wave path
        for (let i = 0; i < wavePoints.length; i++) {
          const x = (i / wavePoints.length) * width;
          ctx.lineTo(x, wavePoints[i]);
        }
        
        // Style the wave
        ctx.strokeStyle = isListening ? '#f87171' : themeColor;
        ctx.lineWidth = 4; // Increased line width
        ctx.stroke();
        
        // Create a gradient fill under the wave
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, isListening ? '#f8717155' : `${themeColor}55`); // Increased opacity
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.08)'); // Increased opacity
        ctx.fillStyle = gradient;
        ctx.fill();
      } else {
        // Draw pulsing circle when not listening
        const pulseSize = (Math.sin(Date.now() * 0.002) + 1) * 12 + radius - 12; // Increased pulse size
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
        ctx.strokeStyle = `${themeColor}77`; // Increased opacity
        ctx.lineWidth = 3; // Increased line width
        ctx.stroke();
      }
    };
    
    const animate = () => {
      drawWaveform();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, themeColor]);

  if (modelError) {
    return <ErrorState />;
  }

  return (
    <div className="flex flex-col items-center">
      {/* Confidence indicator */}
      <div className="text-center mb-4">
        <span className="text-white/60 text-sm">{confidenceText}</span>
      </div>
      
      {/* Coach avatar with waveform */}
      <div 
        className="relative cursor-pointer"
        onClick={handleMicrophoneClick}
        aria-label={getAriaLabel()}
        role="button"
        tabIndex={0}
      >
        <canvas 
          ref={waveformCanvasRef} 
          width={300} 
          height={300} 
          className="w-full max-w-[300px] h-auto"
        />
        
        {/* Status indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-white text-xs flex items-center">
            {isListening ? (
              <>
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                Recording...
              </>
            ) : (
              "Needs Practice"
            )}
          </span>
        </div>
      </div>
      
      {/* Audio playback */}
      {audioURL && !isListening && (
        <AudioPlayer audioURL={audioURL} />
      )}
    </div>
  );
}
