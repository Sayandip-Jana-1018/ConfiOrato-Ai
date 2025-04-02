import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { HiMicrophone, HiVolumeUp, HiOutlineChartBar } from 'react-icons/hi';
import { BsMusicNoteBeamed, BsSoundwave } from 'react-icons/bs';
import { MdOutlineTimer, MdTune } from 'react-icons/md';
import { RiSoundModuleFill } from 'react-icons/ri';
import { IoSpeedometerOutline } from 'react-icons/io5';
import { Tooltip } from '../ui/Tooltip';

interface VoiceAnalysisProps {
  stream: MediaStream | null;
  isRecording?: boolean;
  onFeedbackGenerated?: (feedback: string) => void;
}

export interface VoiceMetrics {
  volume: number;
  clarity: number;
  pace: number;
  pitch: number;
  frequency: number;
  energy: number;
}

interface VoiceAnalysisResult {
  averageMetrics: VoiceMetrics;
  feedback: string | null;
  isAnalyzed: boolean;
}

export default function VoiceAnalysis({ stream, isRecording = false, onFeedbackGenerated }: VoiceAnalysisProps) {
  const [metrics, setMetrics] = useState<VoiceMetrics>({
    volume: 0,
    clarity: 0,
    pace: 0,
    pitch: 0,
    frequency: 0,
    energy: 0
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordedMetrics, setRecordedMetrics] = useState<VoiceMetrics[]>([]);
  const [analysisResult, setAnalysisResult] = useState<VoiceAnalysisResult>({
    averageMetrics: {
      volume: 0,
      clarity: 0,
      pace: 0,
      pitch: 0,
      frequency: 0,
      energy: 0
    },
    feedback: null,
    isAnalyzed: false
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Store all metrics in a ref to ensure we don't miss any due to state batching
  const allMetricsRef = useRef<VoiceMetrics[]>([]);

  useEffect(() => {
    let mounted = true;

    const initializeAudioAnalysis = async () => {
      try {
        if (!stream) {
          setError('No audio stream available');
          return;
        }

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          setError('No audio track found in stream');
          return;
        }

        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 2048;

        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyzerRef.current);

        setIsAnalyzing(true);
        setError(null);

        const analyze = () => {
          if (!mounted || !analyzerRef.current) return;

          const bufferLength = analyzerRef.current.frequencyBinCount;
          const timeData = new Uint8Array(bufferLength);
          const freqData = new Uint8Array(bufferLength);

          analyzerRef.current.getByteTimeDomainData(timeData);
          analyzerRef.current.getByteFrequencyData(freqData);

          // Calculate RMS volume
          const rms = Math.sqrt(timeData.reduce((acc, val) => acc + Math.pow((val - 128) / 128, 2), 0) / bufferLength);
          const volume = Math.min(100, Math.round(rms * 100 * 2));

          // Calculate frequency characteristics
          const freqSum = freqData.reduce((acc, val) => acc + val, 0);
          const avgFreq = freqSum / bufferLength;
          const normalizedFreq = Math.min(100, Math.round((avgFreq / 255) * 100));

          // Calculate clarity based on frequency distribution
          const midFreqs = freqData.slice(Math.floor(bufferLength * 0.1), Math.floor(bufferLength * 0.5));
          const midFreqAvg = midFreqs.reduce((acc, val) => acc + val, 0) / midFreqs.length;
          const clarity = Math.min(100, Math.round((midFreqAvg / 255) * 100));

          // Calculate pitch variation
          const pitchVariation = Math.min(100, Math.round((freqData.slice(0, 20).reduce((acc, val) => acc + val, 0) / (20 * 255)) * 100));

          // Calculate speaking pace based on volume changes
          const volumeChanges = timeData.reduce((acc, val, i) => {
            if (i === 0) return 0;
            return acc + Math.abs(val - timeData[i - 1]);
          }, 0);
          const pace = Math.min(100, Math.round((volumeChanges / bufferLength) * 50));

          // Calculate energy based on overall dynamics
          const energy = Math.min(100, Math.round((volume + normalizedFreq + clarity) / 3));

          const currentMetrics = {
            volume,
            clarity,
            pace,
            pitch: pitchVariation,
            frequency: normalizedFreq,
            energy
          };

          setMetrics(currentMetrics);
          allMetricsRef.current.push(currentMetrics);

          animationFrameRef.current = requestAnimationFrame(analyze);
        };

        analyze();
      } catch (err) {
        console.error('Error initializing audio analysis:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize audio analysis');
        setIsAnalyzing(false);
      }
    };

    initializeAudioAnalysis();

    return () => {
      mounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [stream]);

  // Handle recording state changes
  useEffect(() => {
    if (isRecording) {
      // Reset previous analysis and metrics collection
      setRecordedMetrics([]);
      allMetricsRef.current = [];
      
      setAnalysisResult({
        averageMetrics: {
          volume: 0,
          clarity: 0,
          pace: 0,
          pitch: 0,
          frequency: 0,
          energy: 0
        },
        feedback: null,
        isAnalyzed: false
      });
      
      // Start recording metrics at intervals (more frequent sampling)
      recordingIntervalRef.current = setInterval(() => {
        // Only record metrics if they have meaningful values
        if (metrics.volume > 2 || metrics.clarity > 2 || metrics.pace > 2) {
          const metricsCopy = { ...metrics };
          allMetricsRef.current.push(metricsCopy);
          setRecordedMetrics(prev => [...prev, metricsCopy]);
        }
      }, 300); // Sample every 300ms for more data points
    } else if (recordingIntervalRef.current) {
      // Stop recording and calculate averages
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
      
      // Add the final metrics reading to ensure we capture the latest state
      if (metrics.volume > 0 || metrics.clarity > 0 || metrics.pace > 0) {
        const finalMetrics = { ...metrics };
        allMetricsRef.current.push(finalMetrics);
      }
      
      // Calculate averages from ALL collected metrics
      if (allMetricsRef.current.length > 0) {
        console.log(`Processing ${allMetricsRef.current.length} total metric samples from entire session`);
        
        // Calculate averages from all collected metrics
        const averages = calculateAverageMetrics(allMetricsRef.current);
        
        // Update analysis result with calculated averages
        setAnalysisResult({
          averageMetrics: averages,
          feedback: null,
          isAnalyzed: true
        });
        
        // Also update the recorded metrics state for consistency
        setRecordedMetrics(allMetricsRef.current);
      } else {
        console.warn('No valid metrics were recorded during the session');
      }
    }
    
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording, metrics]);

  const calculateAverageMetrics = (metrics: VoiceMetrics[]): VoiceMetrics => {
    if (metrics.length === 0) return {
      volume: 0,
      clarity: 0,
      pace: 0,
      pitch: 0,
      frequency: 0,
      energy: 0
    };
    
    console.log(`Calculating average from ${metrics.length} total metrics`);
    
    // Filter out metrics with all zeros or very low values (likely noise or silence)
    const validMetrics = metrics.filter(m => 
      (m.volume > 10 || m.clarity > 10 || m.pace > 10 || m.pitch > 10) &&
      // Exclude metrics where everything is zero (likely silence)
      !(m.volume === 0 && m.clarity === 0 && m.pitch === 0 && m.frequency === 0)
    );
    
    console.log(`Found ${validMetrics.length} valid metrics after filtering`);
    
    // If no valid metrics after filtering, use all metrics
    const metricsToUse = validMetrics.length > 0 ? validMetrics : metrics;
    
    // Log some sample metrics for debugging
    if (metricsToUse.length > 0) {
      console.log('Sample metrics being used for average:');
      console.log(metricsToUse.slice(0, 3));
      console.log(`...and ${metricsToUse.length - 3} more`);
    }
    
    // Calculate sum of all metrics
    const sum = metricsToUse.reduce(
      (acc, curr) => ({
        volume: acc.volume + curr.volume,
        clarity: acc.clarity + curr.clarity,
        pace: acc.pace + curr.pace,
        pitch: acc.pitch + curr.pitch,
        frequency: acc.frequency + curr.frequency,
        energy: acc.energy + curr.energy
      }),
      {
        volume: 0,
        clarity: 0,
        pace: 0,
        pitch: 0,
        frequency: 0,
        energy: 0
      }
    );
    
    // Calculate average
    const result = {
      volume: Math.round(sum.volume / metricsToUse.length),
      clarity: Math.round(sum.clarity / metricsToUse.length),
      pace: Math.round(sum.pace / metricsToUse.length),
      pitch: Math.round(sum.pitch / metricsToUse.length),
      frequency: Math.round(sum.frequency / metricsToUse.length),
      energy: Math.round(sum.energy / metricsToUse.length)
    };
    
    console.log('Final calculated averages:', result);
    
    return result;
  };

  const generateFeedback = async () => {
    setIsLoading(true);
    try {
      // Try to use Gemini API for feedback
      const response = await fetch('/api/voice-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: analysisResult.averageMetrics
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(prev => ({
          ...prev,
          feedback: data.feedback
        }));
        
        // Pass feedback to parent component if callback exists
        if (onFeedbackGenerated) {
          onFeedbackGenerated(data.feedback);
        }
      } else {
        // Fallback to client-side generated feedback
        const feedback = generateClientSideFeedback(analysisResult.averageMetrics);
        setAnalysisResult(prev => ({
          ...prev,
          feedback
        }));
        
        // Pass feedback to parent component if callback exists
        if (onFeedbackGenerated) {
          onFeedbackGenerated(feedback);
        }
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
      // Fallback to client-side generated feedback
      const feedback = generateClientSideFeedback(analysisResult.averageMetrics);
      setAnalysisResult(prev => ({
        ...prev,
        feedback
      }));
      
      // Pass feedback to parent component if callback exists
      if (onFeedbackGenerated) {
        onFeedbackGenerated(feedback);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateClientSideFeedback = (metrics: VoiceMetrics): string => {
    const strengths = [];
    const improvements = [];
    
    // Volume feedback
    if (metrics.volume < 30) {
      improvements.push("Try speaking louder to ensure your audience can hear you clearly.");
    } else if (metrics.volume > 80) {
      improvements.push("Consider moderating your volume for a more balanced delivery.");
    } else {
      strengths.push("Your voice volume is at a good level, making it easy for listeners to hear you.");
    }
    
    // Clarity feedback
    if (metrics.clarity < 40) {
      improvements.push("Articulate words more distinctly and reduce mumbling.");
    } else if (metrics.clarity > 70) {
      strengths.push("Your speech clarity is excellent, making your message easy to understand.");
    } else {
      improvements.push("Improve articulation for better clarity.");
    }
    
    // Pace feedback
    if (metrics.pace < 30) {
      improvements.push("Consider speaking a bit faster to maintain audience engagement.");
    } else if (metrics.pace > 70) {
      improvements.push("Try slowing down to ensure your audience can follow along.");
    } else {
      strengths.push("Your speaking pace is well-balanced, making it easy for listeners to follow your speech.");
    }
    
    // Pitch feedback
    if (metrics.pitch < 30) {
      improvements.push("Add more vocal inflection to make your speech more engaging.");
    } else if (metrics.pitch > 70) {
      strengths.push("Your pitch variation is excellent, adding interest and emphasis to your speech.");
    } else {
      improvements.push("Enhance your pitch variation to make your delivery more dynamic.");
    }
    
    // Format the feedback with strengths and improvements
    let feedback = "";
    
    if (strengths.length > 0) {
      feedback += `Strengths: ${strengths.join(" ")}`;
    } else {
      feedback += "Strengths: Your voice has potential for improvement with practice.";
    }
    
    if (improvements.length > 0) {
      feedback += ` Areas to improve: ${improvements.join(" ")}`;
    }
    
    return feedback;
  };

  // Render metrics grid
  const renderMetricsGrid = (data: VoiceMetrics) => (
    <div className="grid grid-cols-3 gap-3">
      {/* Volume */}
      <Tooltip content="How loud your voice is">
        <motion.div
          className="glass-card p-3 rounded-lg bg-opacity-20 backdrop-blur-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 ml-6 rounded-lg bg-purple-500 bg-opacity-20">
              <HiVolumeUp className="text-xl text-purple-400" />
            </div>
          </div>
          <span className="font-medium text-sm text-white truncate">Volume</span>
          <div className="relative h-2 bg-purple-900/30 rounded-full overflow-hidden mb-1">
            <motion.div
              className="absolute h-full bg-purple-500"
              initial={{ width: "0%" }}
              animate={{ width: `${data.volume}%` }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          </div>
          <span className="text-sm font-medium text-purple-300">{data.volume}%</span>
        </motion.div>
      </Tooltip>

      {/* Clarity */}
      <Tooltip content="How clear and understandable your speech is">
        <motion.div
          className="glass-card p-3 rounded-lg bg-opacity-20 backdrop-blur-lg"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 ml-6 rounded-lg bg-blue-500 bg-opacity-20">
              <RiSoundModuleFill className="text-xl text-blue-400" />
            </div>
          </div>
            <span className="font-medium text-sm text-white truncate">Clarity</span>
          <div className="relative h-2 bg-blue-900/30 rounded-full overflow-hidden mb-1">
            <motion.div
              className="absolute h-full bg-blue-500"
              animate={{ width: `${data.clarity}%` }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          </div>
          <span className="text-sm font-medium text-blue-300">{data.clarity}%</span>
        </motion.div>
      </Tooltip>

      {/* Pace */}
      <Tooltip content="Your speaking speed">
        <motion.div
          className="glass-card p-3 rounded-lg bg-opacity-20 backdrop-blur-lg"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 ml-6 rounded-lg bg-green-500 bg-opacity-20">
              <IoSpeedometerOutline className="text-xl text-green-400" />
            </div>
          </div>
            <span className="font-medium text-sm text-white truncate">Pace</span>
          <div className="relative h-2 bg-green-900/30 rounded-full overflow-hidden mb-1">
            <motion.div
              className="absolute h-full bg-green-500"
              animate={{ width: `${data.pace}%` }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          </div>
          <span className="text-sm font-medium text-green-300">{data.pace}%</span>
        </motion.div>
      </Tooltip>

      {/* Pitch */}
      <Tooltip content="Variation in your voice pitch">
        <motion.div
          className="glass-card p-3 rounded-lg bg-opacity-20 backdrop-blur-lg"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 ml-6 rounded-lg bg-yellow-500 bg-opacity-20">
              <BsMusicNoteBeamed className="text-xl text-yellow-400" />
            </div>
          </div>
            <span className="font-medium text-sm text-white truncate">Pitch</span>
          <div className="relative h-2 bg-yellow-900/30 rounded-full overflow-hidden mb-1">
            <motion.div
              className="absolute h-full bg-yellow-500"
              animate={{ width: `${data.pitch}%` }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          </div>
          <span className="text-sm font-medium text-yellow-300">{data.pitch}%</span>
        </motion.div>
      </Tooltip>

      {/* Frequency */}
      <Tooltip content="Tonal characteristics of your voice">
        <motion.div
          className="glass-card p-3 rounded-lg bg-opacity-20 backdrop-blur-lg"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 ml-6 rounded-lg bg-red-500 bg-opacity-20">
              <BsSoundwave className="text-xl text-red-400" />
            </div>
          </div>
            <span className="font-medium text-sm text-white truncate">Frequency</span>
          <div className="relative h-2 bg-red-900/30 rounded-full overflow-hidden mb-1">
            <motion.div
              className="absolute h-full bg-red-500"
              animate={{ width: `${data.frequency}%` }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          </div>
          <span className="text-sm font-medium text-red-300">{data.frequency}%</span>
        </motion.div>
      </Tooltip>

      {/* Energy */}
      <Tooltip content="Overall energy and dynamism in your voice">
        <motion.div
          className="glass-card p-3 rounded-lg bg-opacity-20 backdrop-blur-lg"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 ml-6 rounded-lg bg-pink-500 bg-opacity-20">
              <MdTune className="text-xl text-pink-400" />
            </div>
          </div>
            <span className="font-medium text-sm text-white truncate">Energy</span>
          <div className="relative h-2 bg-pink-900/30 rounded-full overflow-hidden mb-1">
            <motion.div
              className="absolute h-full bg-pink-500"
              animate={{ width: `${data.energy}%` }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          </div>
          <span className="text-sm font-medium text-pink-300">{data.energy}%</span>
        </motion.div>
      </Tooltip>
    </div>
  );

  return (
    <div className="p-3 space-y-4">
      {stream ? (
        <>
          {/* Live Metrics during recording */}
          {isRecording && (
            <>
              <div className="flex items-center justify-center mb-4">
                <div className="p-2 rounded-full bg-green-500/20 mr-2">
                  <HiMicrophone className="text-xl text-green-400" />
                </div>
                <h3 className="text-lg font-medium">Analyzing voice</h3>
              </div>
              {renderMetricsGrid(metrics)}
            </>
          )}

          {/* Analysis Results after recording */}
          {!isRecording && analysisResult.isAnalyzed && (
            <>
              <div className="flex items-center justify-center mb-4">
                <div className="p-2 rounded-full bg-purple-500/20 mr-2">
                  <HiOutlineChartBar className="text-xl text-purple-400" />
                </div>
                <h3 className="text-lg font-medium">Voice Analysis Results</h3>
              </div>
              
              {/* Average Metrics */}
              {renderMetricsGrid(analysisResult.averageMetrics)}
              
              {/* Analyze Button */}
              {!analysisResult.feedback && (
                <div className="mt-6 flex justify-center">
                  <motion.button
                    onClick={generateFeedback}
                    className="px-6 py-2 bg-purple-600 rounded-lg text-white font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </span>
                    ) : (
                      'Analyze Voice'
                    )}
                  </motion.button>
                </div>
              )}
              
              {/* Session Summary */}
              <div className="mt-6 p-3 bg-purple-900/20 rounded-lg">
                <h3 className="text-purple-300 font-semibold text-center mb-2">Session Summary</h3>
                <div className="text-white/80 text-sm">
                  <p>Your average metrics during this session:</p>
                  <ul className="mt-2 space-y-1">
                    <li><span className="text-purple-300">Volume:</span> {analysisResult.averageMetrics.volume}%</li>
                    <li><span className="text-blue-300">Clarity:</span> {analysisResult.averageMetrics.clarity}%</li>
                    <li><span className="text-green-300">Pace:</span> {analysisResult.averageMetrics.pace}%</li>
                    <li><span className="text-yellow-300">Pitch:</span> {analysisResult.averageMetrics.pitch}%</li>
                    <li><span className="text-red-300">Frequency:</span> {analysisResult.averageMetrics.frequency}%</li>
                    <li><span className="text-pink-300">Energy:</span> {analysisResult.averageMetrics.energy}%</li>
                  </ul>
                </div>
              </div>
            </>
          )}
          
          {/* Initial state when no recording has been done yet or when waiting for analysis */}
          {!isRecording && !analysisResult.isAnalyzed && (
            <>
              <div className="flex items-center justify-center mb-4">
                <div className="p-2 rounded-full bg-blue-500/20 mr-2">
                  <HiMicrophone className="text-xl text-blue-400" />
                </div>
                <h3 className="text-lg font-medium">Ready to record</h3>
              </div>
              {renderMetricsGrid(metrics)}
            </>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-white/60">
          {error ? (
            <div className="text-red-400">{error}</div>
          ) : (
            <>
              <HiMicrophone className="text-4xl mb-4" />
              <p>Enable microphone to begin voice analysis</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
