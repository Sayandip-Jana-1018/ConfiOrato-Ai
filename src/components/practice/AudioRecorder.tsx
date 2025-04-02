import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HiMicrophone, HiStop } from 'react-icons/hi';
import { useTheme } from '../../context/ThemeContext';

interface AudioRecorderProps {
  isListening: boolean;
  onStartListening: () => Promise<void>;
  onStopListening: () => void;
  audioURL: string | null;
  sessionActive: boolean;
}

export default function AudioRecorder({ 
  isListening, 
  onStartListening, 
  onStopListening, 
  audioURL,
  sessionActive
}: AudioRecorderProps) {
  const { themeColor } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartListening = useCallback(async () => {
    if (isProcessing || sessionActive) return;
    
    setIsProcessing(true);
    try {
      await onStartListening();
    } catch (error) {
      console.error('Failed to start listening:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [onStartListening, isProcessing, sessionActive]);

  const handleStopListening = useCallback(() => {
    if (!isListening) return;
    onStopListening();
  }, [isListening, onStopListening]);

  return (
    <div className="flex flex-col items-center space-y-6 w-full">
      <div className="w-full flex justify-center">
        {!isListening ? (
          <motion.div
            className="relative cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartListening}
          >
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-75" 
                 style={{ animationDuration: '3s' }}></div>
            <div className="relative flex items-center justify-center w-32 h-32 bg-gradient-to-br from-green-500/30 to-green-600/30 rounded-full border-2 border-green-500/50">
              <HiMicrophone className="w-16 h-16 text-green-500" />
            </div>
            <motion.div 
              className="absolute -inset-2 rounded-full border border-green-500/30"
              animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.5, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className="text-center text-white mt-4 font-medium">
              {isProcessing ? 'Initializing...' : 'Tap to Start Recording'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="relative cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStopListening}
          >
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping opacity-75" 
                 style={{ animationDuration: '1s' }}></div>
            <div className="relative flex items-center justify-center w-32 h-32 bg-gradient-to-br from-red-500/30 to-red-600/30 rounded-full border-2 border-red-500/50">
              <HiStop className="w-16 h-16 text-red-500" />
            </div>
            <motion.div 
              className="absolute -inset-2 rounded-full border border-red-500/30"
              animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.5, 0.7] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <p className="text-center text-white mt-4 font-medium">Recording... Tap to Stop</p>
          </motion.div>
        )}
      </div>
      
      {/* Audio waves visualization when recording */}
      {isListening && (
        <div className="w-full h-16 flex items-center justify-center">
          <div className="flex items-end justify-center space-x-1 h-full w-full">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 bg-red-500/80"
                animate={{
                  height: [
                    `${Math.random() * 20 + 10}%`,
                    `${Math.random() * 60 + 20}%`,
                    `${Math.random() * 30 + 5}%`,
                    `${Math.random() * 80 + 10}%`,
                  ],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.05,
                }}
                style={{
                  borderRadius: "2px",
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Audio playback */}
      {audioURL && (
        <motion.div 
          className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-white text-sm mb-3 text-center font-medium">Your Recording</p>
          <audio 
            src={audioURL} 
            controls 
            className="w-full" 
            style={{ 
              height: '50px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
