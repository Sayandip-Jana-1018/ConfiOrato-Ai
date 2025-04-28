import { motion } from 'framer-motion';
import { VoiceMetrics } from './VoiceAnalyzer';
import { HiChartBar, HiMusicNote, HiVolumeUp, HiSpeakerphone, HiAnnotation, HiEmojiHappy } from 'react-icons/hi';

interface AdvancedMetricsProps {
  metrics: VoiceMetrics;
}

export default function AdvancedMetrics({ metrics }: AdvancedMetricsProps) {
  // Generate feedback for each metric
  const getFeedback = (metricName: string, value: number) => {
    if (value >= 80) return "Excellent";
    if (value >= 70) return "Good";
    if (value >= 50) return "Average";
    return "Needs work";
  };

  return (
    <div className="space-y-4 flex-1">
      <p className="text-white/60 text-sm mb-4 text-center">Detailed voice analysis</p>
      
      {/* Pitch Variation */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <HiMusicNote className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-white text-sm">Pitch Variation</span>
          </div>
          <span className="text-white text-sm font-medium">{metrics.pitchVariation}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${metrics.pitchVariation}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-blue-400 text-xs">{getFeedback('pitchVariation', metrics.pitchVariation)}</span>
        </div>
      </div>
      
      {/* Volume Level */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <HiVolumeUp className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-white text-sm">Volume Level</span>
          </div>
          <span className="text-white text-sm font-medium">{metrics.volume}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${metrics.volume}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-green-400 text-xs">{getFeedback('volume', metrics.volume)}</span>
        </div>
      </div>
      
      {/* Filler Words */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <HiAnnotation className="w-4 h-4 text-yellow-400 mr-2" />
            <span className="text-white text-sm">Filler Words</span>
          </div>
          <span className="text-white text-sm font-medium">{metrics.fillerWords}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-yellow-500"
            initial={{ width: 0 }}
            animate={{ width: `${metrics.fillerWords}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-yellow-400 text-xs">{getFeedback('fillerWords', metrics.fillerWords)}</span>
        </div>
      </div>
      
      {/* Articulation */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <HiSpeakerphone className="w-4 h-4 text-purple-400 mr-2" />
            <span className="text-white text-sm">Articulation</span>
          </div>
          <span className="text-white text-sm font-medium">{metrics.articulation}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${metrics.articulation}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-purple-400 text-xs">{getFeedback('articulation', metrics.articulation)}</span>
        </div>
      </div>
      
      {/* Engagement */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <HiEmojiHappy className="w-4 h-4 text-red-400 mr-2" />
            <span className="text-white text-sm">Engagement</span>
          </div>
          <span className="text-white text-sm font-medium">{metrics.engagement}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${metrics.engagement}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-red-400 text-xs">{getFeedback('engagement', metrics.engagement)}</span>
        </div>
      </div>
      
      {/* Overall assessment */}
      <div className="mt-4 p-2 bg-white/5 rounded-lg">
        <p className="text-white/80 text-xs text-center">
          {
            Object.values(metrics).reduce((sum, value) => sum + value, 0) / Object.values(metrics).length >= 70
              ? "Your speaking metrics are strong. Focus on maintaining consistency."
              : "Your speaking metrics show room for improvement. Practice regularly."
          }
        </p>
      </div>
    </div>
  );
}
