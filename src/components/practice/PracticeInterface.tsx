import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import GlassCard from '../ui/GlassCard';

interface PracticeMetrics {
  confidence: number;
  pace: number;
  clarity: number;
  feedback: string;
}

export default function PracticeInterface({ mode }: { mode: string }) {
  const { themeColor } = useTheme();
  const [metrics, setMetrics] = useState<PracticeMetrics | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const {
    isRecording,
    confidence,
    speechPace,
    voiceClarity,
    error,
    start,
    stop
  } = useSpeechRecognition({
    onAnalysisComplete: (analysis) => {
      setMetrics(analysis);
    }
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      stop();
    } else {
      setTimeElapsed(0);
      setMetrics(null);
      await start();
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              {mode === 'quick' && 'Quick Practice Session'}
              {mode === 'interview' && 'Interview Practice'}
              {mode === 'presentation' && 'Presentation Practice'}
            </h2>
            <div className="text-white/70">
              {isRecording ? (
                <span className="flex items-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-red-500 mr-2"
                  />
                  Recording: {formatTime(timeElapsed)}
                </span>
              ) : (
                'Ready to start'
              )}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleRecording}
            className="px-6 py-3 rounded-xl font-medium text-white flex items-center space-x-2"
            style={{
              background: isRecording 
                ? '#dc2626' 
                : `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`,
              boxShadow: `0 10px 25px -5px ${isRecording ? '#dc262666' : `${themeColor}66`}`
            }}
          >
            <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
            <span>{isRecording ? '⏹️' : '🎤'}</span>
          </motion.button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-black/30 rounded-xl p-6">
              <h3 className="text-lg font-medium text-white mb-4">Real-time Metrics</h3>
              <div className="space-y-4">
                <MetricBar
                  label="Confidence"
                  value={confidence}
                  themeColor={themeColor}
                />
                <MetricBar
                  label="Speech Pace"
                  value={speechPace}
                  themeColor={themeColor}
                />
                <MetricBar
                  label="Voice Clarity"
                  value={voiceClarity}
                  themeColor={themeColor}
                />
              </div>
            </div>

            {metrics?.feedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/30 rounded-xl p-6"
              >
                <h3 className="text-lg font-medium text-white mb-4">AI Feedback</h3>
                <p className="text-white/70 whitespace-pre-line">{metrics.feedback}</p>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-black/30 rounded-xl p-6">
              <h3 className="text-lg font-medium text-white mb-4">Practice Guidelines</h3>
              {mode === 'quick' && (
                <div className="space-y-4 text-white/70">
                  <p>• Aim for a 2-3 minute response</p>
                  <p>• Focus on clear articulation</p>
                  <p>• Maintain a steady pace</p>
                  <p>• Use natural gestures</p>
                </div>
              )}
              {mode === 'interview' && (
                <div className="space-y-4 text-white/70">
                  <p>• Structure your response using the STAR method:</p>
                  <p>• Situation - Set the context</p>
                  <p>• Task - Explain your responsibility</p>
                  <p>• Action - Describe what you did</p>
                  <p>• Result - Share the outcome</p>
                </div>
              )}
              {mode === 'presentation' && (
                <div className="space-y-4 text-white/70">
                  <p>• Start with a strong opening</p>
                  <p>• Present your main points clearly</p>
                  <p>• Use transitions between topics</p>
                  <p>• End with a memorable conclusion</p>
                  <p>• Aim for 5-7 minutes</p>
                </div>
              )}
            </div>

            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-black/30 rounded-xl p-6 relative overflow-hidden"
              >
                <div className="relative z-10">
                  <h3 className="text-lg font-medium text-white mb-4">Live Waveform</h3>
                  <div className="h-32 flex items-center justify-center">
                    <WaveformVisualizer />
                  </div>
                </div>
                <motion.div
                  className="absolute inset-0 opacity-25"
                  style={{
                    background: `linear-gradient(135deg, ${themeColor}44 0%, transparent 100%)`
                  }}
                />
              </motion.div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function MetricBar({ label, value, themeColor }: { 
  label: string; 
  value: number;
  themeColor: string;
}) {
  const percentage = Math.round(value * 100);
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white/70">{label}</span>
        <span className="text-white/70">{percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-black/30">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full"
          style={{ background: themeColor }}
        />
      </div>
    </div>
  );
}

function WaveformVisualizer() {
  const bars = 50;
  
  return (
    <div className="flex items-center justify-center space-x-1 w-full h-full">
      {[...Array(bars)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-white/30"
          animate={{
            height: [
              Math.random() * 100 + '%',
              Math.random() * 100 + '%',
              Math.random() * 100 + '%',
            ],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: i * 0.02,
          }}
        />
      ))}
    </div>
  );
}
