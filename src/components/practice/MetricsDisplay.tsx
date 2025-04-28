import { motion } from 'framer-motion';
import { VoiceMetrics } from './VoiceAnalyzer';

interface MetricsDisplayProps {
  metrics: VoiceMetrics;
  title: string;
  color: string;
  icon: React.ReactNode;
}

export default function MetricsDisplay({ metrics, title, color, icon }: MetricsDisplayProps) {
  const getMetricFeedback = (metricName: string, value: number) => {
    if (value >= 85) return 'Excellent!';
    if (value >= 70) return 'Good progress!';
    if (value >= 50) return 'Keep improving!';
    return 'Needs work';
  };

  const getMetricChange = (metricName: string) => {
    // Use deterministic values based on metric name to avoid hydration errors
    const metricMap: Record<string, string> = {
      'confidence': '+5%',
      'clarity': '+7%',
      'pace': '+3%',
      'pitchVariation': '+4%',
      'volume': '+6%',
      'fillerWords': '+8%',
      'articulation': '+5%',
      'engagement': '+4%'
    };
    
    return metricMap[metricName] || '+5%';
  };

  // Define colors for each metric
  const metricColors: Record<string, string> = {
    'confidence': '#4f46e5', // indigo
    'clarity': '#0ea5e9', // sky blue
    'pace': '#10b981', // emerald
    'pitchVariation': '#8b5cf6', // violet
    'volume': '#f59e0b', // amber
    'fillerWords': '#ef4444', // red
    'articulation': '#ec4899', // pink
    'engagement': '#6366f1' // indigo
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white text-center flex items-center justify-center gap-2">
        {icon}
        <span>{title}</span>
      </h2>

      {/* Confidence */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-white font-medium">Confidence</span>
          <span className="text-white">{metrics.confidence}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: metricColors.confidence }}
            initial={{ width: 0 }}
            animate={{ width: `${metrics.confidence}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/60">{getMetricFeedback('confidence', metrics.confidence)}</span>
          <span className="text-green-400">{getMetricChange('confidence')}</span>
        </div>
      </div>

      {/* Clarity */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-white font-medium">Clarity</span>
          <span className="text-white">{metrics.clarity}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: metricColors.clarity }}
            initial={{ width: 0 }}
            animate={{ width: `${metrics.clarity}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/60">{getMetricFeedback('clarity', metrics.clarity)}</span>
          <span className="text-green-400">{getMetricChange('clarity')}</span>
        </div>
      </div>

      {/* Pace */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-white font-medium">Pace</span>
          <span className="text-white">{metrics.pace}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: metricColors.pace }}
            initial={{ width: 0 }}
            animate={{ width: `${metrics.pace}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/60">{getMetricFeedback('pace', metrics.pace)}</span>
          <span className="text-green-400">{getMetricChange('pace')}</span>
        </div>
      </div>
    </div>
  );
}
