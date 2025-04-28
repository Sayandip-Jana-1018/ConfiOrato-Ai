import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  HiMicrophone, HiCog, HiChartBar, HiLightBulb, HiSparkles, HiClock, HiChat, 
  HiAcademicCap, HiBriefcase, HiUsers, HiPresentationChartLine, HiVolumeUp 
} from 'react-icons/hi';
import AppLayout from '@/components/layout/AppLayout';
import GlassCard from '@/components/ui/GlassCard';
import { useRouter } from 'next/router';
import { useTheme } from '@/context/ThemeContext';
import ThemeSelector from '@/components/ThemeSelector';
import CoachAvatar from '@/components/practice/CoachAvatar';
import MetricsDisplay from '@/components/practice/MetricsDisplay';
import AdvancedMetrics from '@/components/practice/AdvancedMetrics';
import VoiceAnalyzer from '@/components/practice/VoiceAnalyzer';
import CanvasRevealEffect from '@/components/ui/CanvasRevealEffect';
import VirtualCoach from '@/components/ui/VirtualCoach';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import { 
  savePracticeSession, 
  PracticeSession, 
  generateSpeechAnalysisMetrics,
  collectAchievementReward,
  createAchievement,
  SessionMetrics, 
  SpeechAnalysisMetrics 
} from '@/lib/practiceUtils';

// Types
interface PracticeEnvironment {
  id: string;
  name: string;
  icon: any;
  color: string;
  difficulty: number;
}

interface VoiceMetrics {
  confidence: number;
  clarity: number;
  pace: number;
  pitchVariation: number;
  volume: number;
  fillerWords: number;
  articulation: number;
  engagement: number;
}

// Practice environments
const practiceEnvironments: PracticeEnvironment[] = [
  { id: 'classroom', name: 'Classroom', icon: HiAcademicCap, color: 'green', difficulty: 1 },
  { id: 'interview', name: 'Job Interview', icon: HiBriefcase, color: 'blue', difficulty: 2 },
  { id: 'conference', name: 'Conference', icon: HiUsers, color: 'purple', difficulty: 3 },
  { id: 'presentation', name: 'Executive Presentation', icon: HiPresentationChartLine, color: 'red', difficulty: 4 },
];

// Achievement badges
const achievementBadges = [
  { id: 'first_practice', name: 'First Practice', icon: HiSparkles, color: 'blue', points: 10 },
  { id: '5min_streak', name: '5 Minutes Streak', icon: HiClock, color: 'green', points: 20 },
  { id: '10min_streak', name: '10 Minutes Streak', icon: HiClock, color: 'yellow', points: 30 },
  { id: 'confidence_master', name: 'Confidence Master', icon: HiChartBar, color: 'blue', points: 40 },
  { id: 'pitch_perfect', name: 'Pitch Perfect', icon: HiMicrophone, color: 'purple', points: 50 },
  { id: 'clarity_champion', name: 'Clarity Champion', icon: HiChat, color: 'green', points: 60 }
];

export default function Practice() {
  const { themeColor } = useTheme();
  const router = useRouter();
  
  // State for practice environment
  const [selectedEnvironment, setSelectedEnvironment] = useState<PracticeEnvironment>(practiceEnvironments[0]);
  
  // Recording state
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  
  // Metrics state
  const [metrics, setMetrics] = useState<VoiceMetrics>({
    confidence: 0,
    clarity: 0,
    pace: 0,
    pitchVariation: 0,
    volume: 0,
    fillerWords: 0,
    articulation: 0,
    engagement: 0
  });
  
  // Feedback state
  const [aiFeedback, setAIFeedback] = useState<string | null>(null);
  const [feedbackPoints, setFeedbackPoints] = useState<string[]>([]);
  
  // Session history
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [totalPracticeTime, setTotalPracticeTime] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Refs for audio processing
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Session timer
  const [timerActive, setTimerActive] = useState(false);
  
  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = setInterval(() => {
        setSessionTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timerActive]);
  
  // Load saved state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('practicePageState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      setAudioURL(parsedState.audioURL);
      setSessionTime(parsedState.sessionTime);
      setMetrics(parsedState.metrics);
      setAIFeedback(parsedState.aiFeedback);
      setFeedbackPoints(parsedState.feedbackPoints);
      
      // Set the selected environment
      const savedEnvironment = practiceEnvironments.find(env => env.id === parsedState.selectedEnvironmentId);
      if (savedEnvironment) {
        setSelectedEnvironment(savedEnvironment);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (audioURL) {
      const stateToSave = {
        audioURL,
        sessionTime,
        metrics,
        aiFeedback,
        feedbackPoints,
        selectedEnvironmentId: selectedEnvironment.id
      };
      localStorage.setItem('practicePageState', JSON.stringify(stateToSave));
    }
  }, [audioURL, sessionTime, metrics, aiFeedback, feedbackPoints, selectedEnvironment]);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  // Function to check if user is authenticated
  const checkAuthStatus = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Auth error:", error);
        setIsAuthenticated(false);
      } else if (user) {
        console.log("User authenticated:", user.id);
        setIsAuthenticated(true);
      } else {
        console.log("No user found");
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
    } finally {
      setAuthChecked(true);
    }
  };

  // Audio stream references
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load initial session history on client-side only
  useEffect(() => {
    setSessionHistory([
      {
        date: '2025-03-23T12:00:00.000Z',
        environment: 'Conference',
        duration: 300,
        metrics: { confidence: 97, clarity: 81, pace: 87, pitchVariation: 75, volume: 82, fillerWords: 65, articulation: 78, engagement: 85 }
      },
      {
        date: '2025-03-23T14:00:00.000Z',
        environment: 'Conference',
        duration: 240,
        metrics: { confidence: 61, clarity: 91, pace: 85, pitchVariation: 70, volume: 75, fillerWords: 60, articulation: 65, engagement: 80 }
      }
    ]);
  }, []);

  // Initialize metrics state
  const [initialMetrics, setInitialMetrics] = useState<VoiceMetrics>({
    confidence: 0,
    clarity: 0,
    pace: 0,
    pitchVariation: 0,
    volume: 0,
    fillerWords: 0,
    articulation: 0,
    engagement: 0
  });

  // Initially unlocked achievements (only the first one)
  const [initialUnlockedAchievements, setInitialUnlockedAchievements] = useState<string[]>(['first_practice']);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      return () => {
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
    }
  }, []);

  // Handle metrics update
  const handleMetricsUpdate = (newMetrics: VoiceMetrics) => {
    setMetrics(newMetrics);
  };

  // Start recording
  const startRecording = async (): Promise<void> => {
    try {
      if (isListening) {
        return;
      }
      
      // Reset audio chunks
      audioChunksRef.current = [];
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      // Create audio context and analyzer
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 2048; // Set FFT size for better analysis
        source.connect(analyser);
        analyserNodeRef.current = analyser;
      }
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
      };
      
      // Start recording
      mediaRecorder.start();
      setIsListening(true);
      
      // Start session timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      // Reset session time when starting a new recording
      setSessionTime(0);
      
      // Update session time every second
      timerIntervalRef.current = setInterval(() => {
        setSessionTime(prevTime => prevTime + 1);
      }, 1000);
      
      // Generate metrics for demo
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
      
      metricsIntervalRef.current = setInterval(() => {
        if (isListening) {
          const newMetrics = {
            confidence: 85,
            clarity: 78,
            pace: 82,
            pitchVariation: 70,
            volume: 75,
            fillerWords: 60,
            articulation: 72,
            engagement: 80
          };
          setMetrics(newMetrics);
        }
      }, 2000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (!isListening) return;
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          
          // Create a new blob from all chunks
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          
          // Set the audio URL for playback
          setAudioURL(url);
          
          // Reset audio chunks
          audioChunksRef.current = [];
        }
      };
    }
    
    // Stop the audio stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Stop the timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerActive(false);
    
    setIsListening(false);
  };

  // Format time (client-side only)
  const formatTime = (seconds: number): string => {
    if (typeof window === 'undefined') return '00:00'; // Return fixed value during SSR
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Analyze recording
  const analyzeRecording = async () => {
    if (!audioURL) return;
    
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
    }
    
    setIsListening(false);
    setIsAnalyzing(true);
    
    try {
      // In a real app, we would transcribe the audio here
      // For demo purposes, we'll use a placeholder transcription
      const transcription = "This is a sample transcription of what would be the actual speech content. In a production app, this would be generated from the audio recording using a speech-to-text service.";
      
      // Prepare metrics for API call
      const apiMetrics = {
        confidence: metrics.confidence / 100,
        speechPace: metrics.pace / 100,
        voiceClarity: metrics.clarity / 100
      };
      
      // Make actual API call with environment information
      const response = await fetch('/api/analyze-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription,
          metrics: apiMetrics,
          environment: selectedEnvironment.id
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze speech');
      }
      
      const data = await response.json();
      
      // Use the feedback from the API
      setAIFeedback(data.feedback);
      
      // Extract key points from feedback
      const points = extractFeedbackPoints(data.feedback);
      setFeedbackPoints(points);
      
      // Save practice session to Supabase
      const practiceSession: PracticeSession = {
        duration: sessionTime,
        environment: selectedEnvironment.id,
        metrics: metrics,
        feedback: data.feedback,
        date: new Date().toISOString() // Add current date
      };
      
      // Generate speech analysis metrics
      const speechMetrics = generateSpeechAnalysisMetrics(metrics, data.feedback);
      
      // Check authentication before saving to Supabase
      if (!isAuthenticated) {
        console.warn("User not authenticated. Checking auth status again...");
        await checkAuthStatus();
        
        if (!isAuthenticated) {
          console.error("Cannot save practice session: User not authenticated");
          setIsAnalyzing(false);
          return;
        }
      }
      
      // Save to Supabase - log the data being sent
      console.log("Saving practice session to Supabase:", practiceSession);
      console.log("Speech metrics:", speechMetrics);
      
      const sessionId = await savePracticeSession(practiceSession, speechMetrics);
      console.log("Practice session saved with ID:", sessionId);
      
      if (!sessionId) {
        console.error("Failed to save practice session. Session ID is null.");
      }
      
      // Update session history with the new session
      const newSession = {
        date: new Date().toISOString(),
        environment: selectedEnvironment.name,
        duration: sessionTime,
        metrics: metrics
      };
      
      setSessionHistory(prevHistory => [newSession, ...prevHistory]);
      
      // Update total practice time
      setTotalPracticeTime(prevTime => prevTime + sessionTime);
      
      // Check for achievements (in a real app, this would come from the backend)
      if (sessionTime > 300 && !unlockedAchievements.includes('5min_streak')) {
        setUnlockedAchievements(prev => [...prev, '5min_streak']);
        setRewardPoints(prev => prev + 50);
      }
      
      if (totalPracticeTime + sessionTime >= 600 && !unlockedAchievements.includes('10min_streak')) {
        setUnlockedAchievements(prev => [...prev, '10min_streak']);
        setRewardPoints(prev => prev + 100);
      }
      
      if (metrics.confidence > 80 && !unlockedAchievements.includes('confidence_master')) {
        setUnlockedAchievements(prev => [...prev, 'confidence_master']);
        setRewardPoints(prev => prev + 75);
      }
      
    } catch (error) {
      console.error("Error analyzing recording:", error);
      
      // Generate fallback AI feedback
      const feedback = generateAIFeedback(selectedEnvironment);
      setAIFeedback(feedback);
      
      // Extract key points from feedback
      const points = extractFeedbackPoints(feedback);
      setFeedbackPoints(points);
      
      // Save practice session to Supabase with fallback feedback
      const practiceSession: PracticeSession = {
        duration: sessionTime,
        environment: selectedEnvironment.id,
        metrics: metrics,
        feedback: feedback,
        date: new Date().toISOString()
      };
      
      // Generate speech analysis metrics
      const speechMetrics = generateSpeechAnalysisMetrics(metrics, feedback);
      
      try {
        // Save to Supabase
        const sessionId = await savePracticeSession(practiceSession, speechMetrics);
        
        // Update session history with the new session
        const newSession = {
          date: new Date().toISOString(),
          environment: selectedEnvironment.name,
          duration: sessionTime,
          metrics: metrics
        };
        
        setSessionHistory(prevHistory => [newSession, ...prevHistory]);
      } catch (saveError) {
        console.error("Error saving practice session:", saveError);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset the analysis
  const resetAnalysis = () => {
    setAudioURL(null);
    setSessionTime(0); 
    setMetrics({
      confidence: 0,
      clarity: 0,
      pace: 0,
      pitchVariation: 0,
      volume: 0,
      fillerWords: 0,
      articulation: 0,
      engagement: 0
    });
    setAIFeedback(null);
    setFeedbackPoints([]);
    
    // Clear the saved state in localStorage
    localStorage.removeItem('practicePageState');
  };

  // Handle environment selection
  const handleEnvironmentSelection = (environment: PracticeEnvironment) => {
    setSelectedEnvironment(environment);
  };

  // Update total practice time when session ends
  useEffect(() => {
    if (!isListening && sessionTime > 0) {
      setTotalPracticeTime((prev: number) => prev + sessionTime);
      
      // Unlock achievements based on practice time
      if (sessionTime >= 300 && !unlockedAchievements.includes('5min_streak')) {
        setUnlockedAchievements(prev => [...prev, '5min_streak']);
      }
      
      if (totalPracticeTime + sessionTime >= 600 && !unlockedAchievements.includes('10min_streak')) {
        setUnlockedAchievements(prev => [...prev, '10min_streak']);
      }
    }
  }, [isListening, sessionTime, totalPracticeTime, unlockedAchievements]);

  // Handle end of practice session
  const endPracticeSession = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      setTimerActive(false);
    }
    
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
    }
    
    setIsListening(false);
    setIsAnalyzing(true);
    
    // Generate AI feedback
    const feedback = generateAIFeedback(selectedEnvironment);
    setAIFeedback(feedback);
    
    // Extract key points from feedback
    const points = extractFeedbackPoints(feedback);
    setFeedbackPoints(points);
    
    // Save practice session to Supabase
    const practiceSession: PracticeSession = {
      duration: sessionTime,
      environment: selectedEnvironment.id,
      metrics: metrics,
      feedback: feedback,
      date: new Date().toISOString() // Add current date
    };
    
    // Generate speech analysis metrics
    const speechMetrics = generateSpeechAnalysisMetrics(metrics, feedback);
    
    // Save to Supabase
    const sessionId = await savePracticeSession(practiceSession, speechMetrics);
    
    // Update session history with the new session
    const newSession = {
      date: new Date().toISOString(),
      environment: selectedEnvironment.name,
      duration: sessionTime,
      metrics: metrics
    };
    
    setSessionHistory(prevHistory => [newSession, ...prevHistory]);
    
    // Update total practice time
    setTotalPracticeTime(prevTime => prevTime + sessionTime);
    
    // Check for achievements (in a real app, this would come from the backend)
    if (sessionTime > 300 && !unlockedAchievements.includes('5min_streak')) {
      setUnlockedAchievements(prev => [...prev, '5min_streak']);
    }
    
    if (sessionTime > 600 && !unlockedAchievements.includes('10min_streak')) {
      setUnlockedAchievements(prev => [...prev, '10min_streak']);
    }
    
    if (metrics.confidence > 80 && !unlockedAchievements.includes('confidence_master')) {
      setUnlockedAchievements(prev => [...prev, 'confidence_master']);
    }
    
    setIsAnalyzing(false);
  };

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Function to extract key points from AI feedback
  const extractFeedbackPoints = (feedback: string | null): string[] => {
    if (!feedback) return [];
    
    // Split feedback by new lines and filter out empty lines
    const lines = feedback.split('\n').filter(line => line.trim() !== '');
    
    // Look for bullet points or numbered lists
    const points = lines.filter(line => 
      line.trim().startsWith('•') || 
      line.trim().startsWith('-') || 
      /^\d+\./.test(line.trim())
    );
    
    // If no bullet points found, try to extract sentences
    if (points.length === 0) {
      const sentences = feedback.split(/[.!?]+/).filter(sentence => 
        sentence.trim().length > 10 && sentence.trim().length < 100
      );
      
      // Return up to 5 sentences
      return sentences.slice(0, 5).map(s => s.trim());
    }
    
    // Clean up the points (remove bullet markers)
    return points.map(point => 
      point.replace(/^[•\-]\s*/, '').replace(/^\d+\.\s*/, '').trim()
    ).slice(0, 5); // Return up to 5 points
  };

  // State for reward points and collection animation
  const [rewardPoints, setRewardPoints] = useState(0);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Collect rewards
  const collectRewards = async () => {
    if (unlockedAchievements.length === 0) return;
    
    try {
      // In a real app, this would call an API to update the user's rewards in the database
      // For now, we'll just simulate the collection process
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("User not authenticated");
        return;
      }
      
      // Collect each achievement reward
      for (const achievementId of unlockedAchievements) {
        const badge = achievementBadges.find(b => b.id === achievementId);
        if (badge) {
          // Create the achievement in the database if it doesn't exist
          await createAchievement(user.id, {
            name: badge.name,
            description: `Earned the ${badge.name} badge`,
            icon: badge.icon.name,
            points: badge.points
          });
          
          // Mark the achievement as collected
          const result = await collectAchievementReward(achievementId);
          console.log(`Collected reward for ${achievementId}:`, result);
        }
      }
      
      // Show the reward animation
      setShowRewardAnimation(true);
      
      // Clear the unlocked achievements after collection
      setUnlockedAchievements([]);
      
      // After 5 seconds, hide the reward animation
      setTimeout(() => {
        setShowRewardAnimation(false);
      }, 5000);
    } catch (error) {
      console.error("Error collecting rewards:", error);
    }
  };

  return (
    <AppLayout>
      <div className="mt-10 grid grid-cols-3 gap-6 max-w-8xl mx-auto">
        {/* Left column */}
        <div className="space-y-6 flex flex-col">
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center">
              <HiCog className="mr-2 text-blue-400" /> Practice Modes
            </h2>
            <div className="flex flex-col space-y-3">
              {practiceEnvironments.map((environment, index) => (
                <button
                  key={index}
                  onClick={() => handleEnvironmentSelection(environment)}
                  className={`py-3 px-6 rounded-lg text-white font-medium transition-all flex items-center justify-center ${
                    selectedEnvironment.id === environment.id 
                      ? `bg-${environment.color}-600 hover:bg-${environment.color}-700` 
                      : `bg-white/10 hover:bg-white/20`
                  }`}
                >
                  <environment.icon className={`mr-2 ${selectedEnvironment.id === environment.id ? 'text-white' : `text-${environment.color}-400`}`} /> 
                  {environment.name}
                </button>
              ))}
            </div>
          </GlassCard>
          
          {/* Speaking Tips */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <HiLightBulb className="mr-2 text-yellow-400" /> Speaking Tips
            </h2>
            
            <div className="space-y-3">
              {selectedEnvironment && (
                <>
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-3 rounded-lg">
                    <h3 className="text-white font-medium mb-1 flex items-center">
                      <HiUsers className="text-blue-400 mr-2" /> Audience Connection
                    </h3>
                    <p className="text-white/80 text-sm">
                      Make eye contact with different sections of your {selectedEnvironment.id === 'interview' ? 'interviewers' : 'audience'} to create a personal connection.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-3 rounded-lg">
                    <h3 className="text-white font-medium mb-1 flex items-center">
                      <HiVolumeUp className="text-green-400 mr-2" /> Voice Projection
                    </h3>
                    <p className="text-white/80 text-sm">
                      Speak clearly and project your voice to ensure everyone can hear you. Vary your tone to emphasize key points.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 p-3 rounded-lg">
                    <h3 className="text-white font-medium mb-1 flex items-center">
                      <HiClock className="text-amber-400 mr-2" /> Pacing
                    </h3>
                    <p className="text-white/80 text-sm">
                      Maintain a steady pace, slowing down for important points. Aim for 120-150 words per minute for optimal comprehension.
                    </p>
                  </div>
                  
                  {selectedEnvironment.id === 'interview' && (
                    <div className="bg-gradient-to-r from-blue-500/20 to-sky-500/20 p-3 rounded-lg">
                      <h3 className="text-white font-medium mb-1 flex items-center">
                        <HiChat className="text-blue-400 mr-2" /> STAR Method
                      </h3>
                      <p className="text-white/80 text-sm">
                        Structure your answers using the STAR method: Situation, Task, Action, Result to provide comprehensive responses.
                      </p>
                    </div>
                  )}
                  
                  {selectedEnvironment.id === 'classroom' && (
                    <div className="bg-gradient-to-r from-indigo-500/20 to-violet-500/20 p-3 rounded-lg">
                      <h3 className="text-white font-medium mb-1 flex items-center">
                        <HiAcademicCap className="text-indigo-400 mr-2" /> Engagement
                      </h3>
                      <p className="text-white/80 text-sm">
                        Ask rhetorical questions to keep students engaged and encourage participation throughout your lesson.
                      </p>
                    </div>
                  )}
                  
                  {selectedEnvironment.id === 'conference' && (
                    <div className="bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 p-3 rounded-lg">
                      <h3 className="text-white font-medium mb-1 flex items-center">
                        <HiPresentationChartLine className="text-purple-400 mr-2" /> Technical Clarity
                      </h3>
                      <p className="text-white/80 text-sm">
                        Define technical terms before using them and provide real-world examples to illustrate complex concepts.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* History button in speaking tips section */}
            <div className="mt-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium text-sm transition-all flex items-center justify-center"
              >
                <HiClock className="mr-2" /> {showHistory ? 'Hide Practice History' : 'Show Practice History'}
              </button>
            </div>
          </GlassCard>
          
          {/* Practice History - Separate card that shows when button is clicked */}
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 text-center">Practice History</h2>
                
                {sessionHistory.length === 0 ? (
                  <p className="text-white/60 text-center py-4">No practice sessions yet</p>
                ) : (
                  <div className="space-y-3">
                    {sessionHistory.map((session, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white/80 text-xs">
                            {new Date(session.date).toLocaleDateString()}
                          </span>
                          <span className="text-white/80 text-xs">
                            {formatTime(session.duration)}
                          </span>
                        </div>
                        <p className="text-white text-sm font-medium">{session.environment}</p>
                        <div className="grid grid-cols-3 gap-1 mt-1">
                          <div className="text-center">
                            <p className="text-white/60 text-xs">Confidence</p>
                            <p className="text-white text-sm">{session.metrics.confidence}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-white/60 text-xs">Clarity</p>
                            <p className="text-white text-sm">{session.metrics.clarity}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-white/60 text-xs">Pace</p>
                            <p className="text-white text-sm">{session.metrics.pace}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
          
          {/* Achievements - Separate card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <HiSparkles className="mr-2 text-yellow-400" /> Achievements
                </h2>
                <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-4 py-2 rounded-full flex items-center">
                  <HiSparkles className="text-yellow-400 mr-2" />
                  <span className="text-white font-bold">{rewardPoints}</span>
                  <span className="text-white/60 text-sm ml-1">pts</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {achievementBadges.slice(0, 4).map(badge => (
                  <div 
                    key={badge.id}
                    className={`p-3 rounded-lg flex items-center space-x-3 ${
                      unlockedAchievements.includes(badge.id) 
                        ? `bg-${badge.color}-500/20 border border-${badge.color}-500/30` 
                        : 'bg-white/5 border border-white/10 opacity-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      unlockedAchievements.includes(badge.id) 
                        ? `bg-gradient-to-br from-${badge.color}-400 to-${badge.color}-600 text-white` 
                        : 'bg-white/10 text-white/30'
                    }`}>
                      <badge.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        unlockedAchievements.includes(badge.id) ? 'text-white' : 'text-white/50'
                      }`}>
                        {badge.name}
                      </p>
                      {unlockedAchievements.includes(badge.id) && (
                        <p className="text-xs text-yellow-300">+{badge.points} pts</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {unlockedAchievements.length > 0 && (
                <button
                  onClick={collectRewards}
                  className="mt-4 w-full py-2 px-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg text-white font-medium text-sm transition-all hover:scale-105 flex items-center justify-center"
                >
                  <HiSparkles className="mr-2" /> Collect Rewards
                </button>
              )}
              
              {showRewardAnimation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/50" onClick={() => setShowRewardAnimation(false)}></div>
                  <div className="relative z-10 w-full max-w-md">
                    <CanvasRevealEffect 
                      animationSpeed={1.2}
                      colors={[[255, 215, 0], [255, 165, 0], [255, 140, 0]]}
                      containerClassName="h-64 rounded-xl"
                      active={true}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <h3 className="text-2xl font-bold text-white mb-2">Rewards Collected!</h3>
                      <p className="text-white/80 text-lg mb-4">+{rewardPoints} points</p>
                      <div className="flex space-x-2">
                        {unlockedAchievements.map((id) => {
                          const badge = achievementBadges.find(b => b.id === id);
                          if (!badge) return null;
                          return (
                            <div 
                              key={id}
                              className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-${badge.color}-400 to-${badge.color}-600`}
                            >
                              <badge.icon className="w-6 h-6 text-white" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>
        
        {/* Middle column */}
        <div className="flex flex-col space-y-6">
          <GlassCard className="p-6 flex-grow">
            <h2 className="text-xl font-bold text-white mb-4 text-center">AI Coach</h2>
            <div className="w-full">
              <CoachAvatar 
                metrics={metrics} 
                isListening={isListening} 
                feedbackPoints={feedbackPoints}
                onStartListening={startRecording}
                onStopListening={stopRecording}
                audioURL={audioURL}
              />
            </div>
            
            {/* Session timer */}
            <div className="mt-6 w-full">
              <div className="flex items-center space-x-2 mb-2 justify-center">
                <HiClock className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-bold text-white text-center">Session Timer</h3>
              </div>
              
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Track your practice time</p>
                <p className="text-white text-4xl font-bold mb-2">
                  {formatTime(sessionTime)}
                </p>
                <p className="text-white/60 text-sm">Target: 5 minutes</p>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="mt-6 space-y-3">
              {/* Analyze button */}
              {!isListening && audioURL && (
                <button
                  className={`py-3 px-6 rounded-lg text-white font-medium transition-colors w-full ${
                    isAnalyzing 
                      ? 'bg-purple-600 cursor-wait shadow-lg shadow-purple-600/30' 
                      : `bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20`
                  }`}
                  onClick={analyzeRecording}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Recording'}
                </button>
              )}
              
              {/* Try again button */}
              {audioURL && !isListening && !isAnalyzing && (
                <button
                  className={`py-3 px-6 rounded-lg text-white font-medium transition-colors w-full bg-white/10 hover:bg-white/20`}
                  onClick={resetAnalysis}
                >
                  Try Again
                </button>
              )}
            </div>
            
            {/* Voice analyzer (hidden component) */}
            {isListening && (
              <VoiceAnalyzer
                isListening={isListening}
                audioStream={audioStreamRef.current}
                analyserNode={analyserNodeRef.current}
                onMetricsUpdate={handleMetricsUpdate}
              />
            )}
          </GlassCard>
          
          {/* Virtual Coach 3D Model */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Virtual Coach</h2>
            <div className="h-[300px] w-full relative">
              <VirtualCoach 
                modelUrl="/models/virtual_coach.glb" 
                className="h-full w-full" 
              />
            </div>
          </GlassCard>
        </div>
        
        {/* Right column */}
        <div className="space-y-6 flex flex-col">
          {/* Basic metrics card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-grow"
          >
            <GlassCard className="p-6 h-full flex flex-col">
              <div className="flex-grow overflow-y-auto">
                <MetricsDisplay 
                  metrics={isListening ? metrics : {
                    confidence: 0,
                    clarity: 0,
                    pace: 0,
                    pitchVariation: 0,
                    volume: 0,
                    fillerWords: 0,
                    articulation: 0,
                    engagement: 0
                  }} 
                  title="Basic Metrics" 
                  color={themeColor} 
                  icon={<HiChartBar className="text-blue-400" />} 
                />
              </div>
            </GlassCard>
          </motion.div>
          
          {/* Advanced metrics card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-grow"
          >
            <GlassCard className="p-6 h-full flex flex-col">
              <h2 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center">
                <HiCog className="mr-2 text-purple-400" /> Advanced Metrics
              </h2>
              <div className="flex-grow overflow-y-auto">
                <AdvancedMetrics metrics={isListening ? metrics : {
                  confidence: 0,
                  clarity: 0,
                  pace: 0,
                  pitchVariation: 0,
                  volume: 0,
                  fillerWords: 0,
                  articulation: 0,
                  engagement: 0
                }} />
              </div>
            </GlassCard>
          </motion.div>
          
          {/* AI Feedback card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-grow"
          >
            <GlassCard className="p-6 h-full flex flex-col">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <HiLightBulb className="mr-2 text-yellow-400" /> AI Feedback
              </h2>
              
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin mb-4"></div>
                  <p className="text-white/70">Analyzing your speech patterns...</p>
                </div>
              ) : aiFeedback ? (
                <div className="prose prose-invert max-w-none h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  <ReactMarkdown>{aiFeedback}</ReactMarkdown>
                  
                  {feedbackPoints && feedbackPoints.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h3 className="text-lg font-medium text-white">Key Points</h3>
                      <ul className="space-y-1">
                        {feedbackPoints.map((point, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-400 mr-2">•</span>
                            <span className="text-white/80">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => router.push('/analytics')}
                      className="py-2 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg text-white font-medium text-sm transition-all hover:scale-105 flex items-center"
                    >
                      <HiChartBar className="mr-2" /> Want Analysis?
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-white/60">Complete a practice session to receive AI feedback</p>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <ThemeSelector />
      </div>
    </AppLayout>
  );
}

// Helper function to generate AI feedback
function generateAIFeedback(environment: PracticeEnvironment) {
  // Feedback options based on environment
  const feedbackOptions = {
    classroom: [
      `## Classroom Presentation Feedback

**Overall Assessment**: Your presentation style is well-suited for a classroom setting.

### Strengths:
* **Clear articulation** helps students follow along effectively
* Maintained good **pacing** throughout most of the presentation
* Demonstrated **subject knowledge** with appropriate terminology

### Areas for Improvement:
* Incorporate more **interactive elements** to maintain student engagement
* Add more **strategic pauses** after key points to allow processing time
* Consider using more **visual aids** to reinforce complex concepts

### Next Steps:
Try implementing *one specific technique* in your next practice session, such as adding deliberate pauses or asking rhetorical questions to improve engagement.`
    ],
    interview: [
      `## Job Interview Response Feedback

**Overall Assessment**: Your interview responses demonstrate good confidence and clarity.

### Strengths:
* **Professional tone** appropriate for interview settings
* **Structured answers** with clear beginnings and conclusions
* Good **technical vocabulary** relevant to the position

### Areas for Improvement:
* Focus on keeping answers more **concise** while still providing enough detail
* Incorporate more **specific examples** to make responses memorable
* Reduce **filler words** to convey greater confidence

### Next Steps:
Practice the *STAR method* (Situation, Task, Action, Result) for your responses to ensure they're comprehensive yet focused.`
    ],
    conference: [
      `## Conference Presentation Feedback

**Overall Assessment**: Your presentation style works well for a conference setting.

### Strengths:
* **Clear articulation** helps the audience follow complex ideas
* **Professional demeanor** appropriate for expert audiences
* Good **topic transitions** between different sections

### Areas for Improvement:
* Incorporate more **dynamic vocal variety** to maintain audience interest
* Add **strategic pauses** after introducing new concepts
* Consider more **audience engagement techniques** for this formal setting

### Next Steps:
For your next practice, focus on *varying your tone and pace* more deliberately to emphasize key points and maintain audience attention.`
    ],
    presentation: [
      `## Executive Presentation Feedback

**Overall Assessment**: Your executive presentation demonstrates good command of the material.

### Strengths:
* **Confident delivery** appropriate for senior leadership
* **Focused content** addressing key business concerns
* Good use of **data points** to support arguments

### Areas for Improvement:
* Practice distilling complex information into more **impactful, brief statements**
* Incorporate more **strategic recommendations** alongside data
* Enhance **executive presence** through more deliberate body language

### Next Steps:
For your next practice, try the *"So What?" technique* - after each point, explicitly state its business implication to ensure relevance for executives.`
    ]
  };

  // Use deterministic selection based on environment id instead of random
  // This ensures consistent rendering between server and client
  const environmentFeedback = feedbackOptions[environment.id as keyof typeof feedbackOptions] || feedbackOptions.classroom;
  
  // Use the first feedback for each environment type to ensure consistency
  // In a real app, this could use a hash of the user ID or other stable identifier
  return environmentFeedback[0];
}
