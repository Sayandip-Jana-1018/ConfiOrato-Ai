import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import AppLayout from '../../components/layout/AppLayout';
import GlassCard from '../../components/ui/GlassCard';
import { HiVolumeUp, HiPlay, HiTranslate, HiHeart, HiChartBar, HiCog, HiX, HiPause, HiOutlineVolumeUp, HiOutlineEye, HiOutlineAcademicCap, HiOutlineLightBulb, HiOutlineEmojiHappy, HiMicrophone, HiLightningBolt, HiArrowRight, HiChat, HiLightBulb, HiQuestionMarkCircle, HiRefresh } from 'react-icons/hi';
import AccessibilityPanel from '../../components/accessibility/AccessibilityPanel';
import ThemeSelector from '../../components/ThemeSelector';
import { useVoiceAssistant } from '@/context/VoiceAssistantContext';
import { getMockAudioUrl } from '@/utils/textToSpeech';

// Dynamic audio lessons with AI-generated content
const audioLessons = [
  {
    id: 1,
    title: 'Building Confidence Through Voice',
    duration: '15 mins',
    description: 'Learn techniques to project confidence in your voice',
    progress: 85,
    topic: 'confidence',
    audioUrl: '',
    content: '',
    icon: <HiOutlineEmojiHappy className="w-6 h-6 text-pink-400" />
  },
  {
    id: 2,
    title: 'Mastering Speech Clarity',
    duration: '12 mins',
    description: 'Tips for clear and effective speech delivery',
    progress: 60,
    topic: 'clarity',
    audioUrl: '',
    content: '',
    icon: <HiOutlineVolumeUp className="w-6 h-6 text-blue-400" />
  },
  {
    id: 3,
    title: 'Public Speaking Fundamentals',
    duration: '12 mins',
    description: 'Essential fundamentals for effective public speaking',
    progress: 60,
    topic: 'fundamentals',
    audioUrl: '',
    content: '',
    icon: <HiOutlineAcademicCap className="w-6 h-6 text-green-400" />
  },
];

// Sign language lessons with real YouTube video IDs
const signLanguageLessons = [
  {
    id: 1,
    title: 'Introduction to Public Speaking with Sign Language',
    videoId: 'v1desDduz5M',
    duration: '10 mins',
    views: '1.2k',
    description: 'Learn basic sign language gestures for public speaking'
  },
  {
    id: 2,
    title: 'Body Language for Effective Communication',
    videoId: 'cFLjudWTuGQ',
    duration: '15 mins',
    views: '2.3k',
    description: 'Master body language techniques for better communication'
  },
  {
    id: 3,
    title: 'Sign Language for Professional Presentations',
    videoId: '0FcwzMq4iWg',
    duration: '12 mins',
    views: '1.8k',
    description: 'Professional presentation techniques using sign language'
  },
  {
    id: 4,
    title: 'Accessible Communication Strategies',
    videoId: 'DfJ9h5-YGQw',
    duration: '12 mins',
    views: '1.8k',
    description: 'Learn strategies for inclusive and accessible communication'
  }
];

export default function Accessibility() {
  const { themeColor } = useTheme();
  const [activeTab, setActiveTab] = useState<'settings' | 'audio' | 'sign'>('audio');
  const [currentAudio, setCurrentAudio] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  const { toggleEnabled, isEnabled, speak } = useVoiceAssistant();
  const [lessons, setLessons] = useState(audioLessons);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingLessonId, setGeneratingLessonId] = useState<number | null>(null);

  // Fetch AI-generated content for lessons
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const updatedLessons = [...lessons];
        
        // Fetch content for each lesson
        for (let i = 0; i < updatedLessons.length; i++) {
          const lesson = updatedLessons[i];
          
          // Set a default audio URL as fallback
          lesson.audioUrl = getMockAudioUrl(lesson.topic);
          
          try {
            // Fetch content from our API
            const response = await fetch('/api/generate-speech-content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ topic: lesson.topic })
            });
            
            if (response.ok) {
              const data = await response.json();
              lesson.content = data.content;
            }
          } catch (error) {
            console.error(`Error fetching content for lesson ${lesson.id}:`, error);
          }
        }
        
        setLessons(updatedLessons);
      } catch (error) {
        console.error('Error fetching lesson content:', error);
      }
    };
    
    fetchContent();
  }, []);

  // Generate speech for a specific lesson
  const generateSpeech = async (lessonId: number) => {
    try {
      setIsGenerating(true);
      setGeneratingLessonId(lessonId);
      
      const lesson = lessons.find(l => l.id === lessonId);
      if (!lesson || !lesson.content) return;
      
      // In a real implementation, we would use the textToSpeech utility
      // For now, we'll use the mock audio URL
      const audioUrl = getMockAudioUrl(lesson.topic);
      
      // Update the lesson with the new audio URL
      const updatedLessons = lessons.map(l => 
        l.id === lessonId ? { ...l, audioUrl } : l
      );
      
      setLessons(updatedLessons);
      
      // If this is the currently playing lesson, update the audio source
      if (currentAudio === lessonId && audioRef.current) {
        audioRef.current.src = audioUrl;
        if (isPlaying) {
          audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Error generating speech:', error);
    } finally {
      setIsGenerating(false);
      setGeneratingLessonId(null);
    }
  };

  // Handle audio playback
  const toggleAudio = (lessonId: number) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    
    if (currentAudio === lessonId) {
      if (isPlaying) {
        audioRef.current?.pause();
        // Announce to screen readers that audio is paused
        speak(`Paused: ${lesson.title}`);
      } else {
        audioRef.current?.play();
        // Read the lesson content for visually impaired users
        if (lesson.content) {
          speak(`Playing: ${lesson.title}. ${lesson.content}`);
        } else {
          speak(`Playing: ${lesson.title}. ${lesson.description}`);
        }
      }
      setIsPlaying(!isPlaying);
    } else {
      setCurrentAudio(lessonId);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = lesson.audioUrl;
        audioRef.current.play();
        
        // Read the lesson content for visually impaired users
        if (lesson.content) {
          speak(`Playing: ${lesson.title}. ${lesson.content}`);
        } else {
          speak(`Playing: ${lesson.title}. ${lesson.description}`);
        }
      }
    }
  };

  // Handle video selection
  const selectVideo = (lessonId: number) => {
    const lesson = signLanguageLessons.find(l => l.id === lessonId);
    if (!lesson) return;
    
    // If selecting a new video
    if (lessonId !== selectedVideo) {
      setSelectedVideo(lessonId);
      // Provide audio description for visually impaired users
      speak(`Playing sign language video: ${lesson.title}. ${lesson.description}`);
    } 
    // If closing a video
    else {
      setSelectedVideo(null);
      speak(`Closed video: ${lesson.title}`);
    }
  };

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <AppLayout title="Accessibility">
      <div className="flex flex-col items-center max-w-7xl mx-auto px-2 sm:px-4">
        {/* Header with colorful gradient */}
        <GlassCard className="p-4 sm:p-6 backdrop-blur-md bg-black/40 border border-purple-500/30 shadow-lg">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-4 rounded-full bg-gradient-to-r from-red-400 to-purple-500">
              <HiHeart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Accessibility Features</h1>
          </div>
          
          {/* Tab Navigation with enhanced styling */}
          <div className="flex justify-center gap-3 mt-4" role="tablist" aria-label="Accessibility options">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveTab('settings');
                speak('Switched to Accessibility Settings tab');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm ${
                activeTab === 'settings' 
                  ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-400 border border-green-500/30' 
                  : 'bg-white/5 text-white/60'
              } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
              role="tab"
              aria-selected={activeTab === 'settings'}
              aria-controls="settings-panel"
              id="settings-tab"
            >
              <HiCog className="w-5 h-5" />
              Settings
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveTab('audio');
                speak('Switched to Audio Lessons tab. This tab contains audio lessons for public speaking skills.');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm ${
                activeTab === 'audio' 
                  ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-400 border border-purple-500/30' 
                  : 'bg-white/5 text-white/60'
              } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
              role="tab"
              aria-selected={activeTab === 'audio'}
              aria-controls="audio-panel"
              id="audio-tab"
            >
              <HiVolumeUp className="w-5 h-5" />
              Audio Lessons
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveTab('sign');
                speak('Switched to Sign Language tab. This tab contains sign language video tutorials.');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm ${
                activeTab === 'sign' 
                  ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-400 border border-blue-500/30' 
                  : 'bg-white/5 text-white/60'
              } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
              role="tab"
              aria-selected={activeTab === 'sign'}
              aria-controls="sign-panel"
              id="sign-tab"
            >
              <HiTranslate className="w-5 h-5" />
              Sign Language
            </motion.button>
          </div>
        </GlassCard>

        {/* Audio player element */}
        <audio ref={audioRef} className="hidden" onEnded={() => setIsPlaying(false)} />

        {/* Main Content */}
        <div className="w-full mb-6 sm:mb-8 mt-4">
          <AnimatePresence mode="wait">
            {/* Settings Panel */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
                role="tabpanel"
                aria-labelledby="settings-tab"
              >
                <AccessibilityPanel />
              </motion.div>
            )}

            {/* Audio Lessons Panel */}
            {activeTab === 'audio' && (
              <motion.div
                key="audio"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
                role="tabpanel"
                aria-labelledby="audio-tab"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-6 sm:mb-8 mx-auto max-w-6xl">
                  {lessons.map((lesson) => (
                    <GlassCard key={lesson.id} className="p-5 relative overflow-hidden backdrop-blur-md bg-black/40 border border-purple-500/30 shadow-lg">
                      <div className="flex items-start gap-3">
                        {/* Lesson icon */}
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          {lesson.icon}
                        </div>
                        
                        {/* Lesson content */}
                        <div className="flex-grow">
                          <h3 className="text-base sm:text-lg font-semibold text-white text-left mb-1">{lesson.title}</h3>
                          <div className="flex items-center mb-2 text-white/60 text-xs sm:text-sm">
                            <span>{lesson.duration}</span>
                            <div className="w-1 h-1 rounded-full bg-white/40 mx-2"></div>
                            <span>{lesson.progress}% complete</span>
                          </div>
                          <p className="text-left text-white/70 text-xs sm:text-sm mb-3">{lesson.description}</p>
                          
                          {/* Progress bar */}
                          <div className="h-2 w-full bg-white/10 rounded-full mb-3 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" 
                              style={{ width: `${lesson.progress}%` }}
                            />
                          </div>
                          {/* AI-generated content */}
                          {lesson.content && (
                            <div className="mt-3 p-3 bg-white/5 rounded-lg">
                              <p className="text-white/70 text-xs sm:text-sm whitespace-pre-line">{lesson.content}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Controls */}
                      <div className="flex justify-center gap-3 mt-3">
                        <button
                          onClick={() => toggleAudio(lesson.id)}
                          className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                          aria-label={currentAudio === lesson.id && isPlaying ? "Pause audio" : "Play audio"}
                          aria-pressed={currentAudio === lesson.id && isPlaying}
                        >
                          {currentAudio === lesson.id && isPlaying ? (
                            <HiPause className="w-5 h-5" />
                          ) : (
                            <HiPlay className="w-5 h-5 ml-0.5" />
                          )}
                        </button>
                        <button
                          onClick={() => generateSpeech(lesson.id)}
                          className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                          aria-label="Generate new speech"
                          disabled={isGenerating && generatingLessonId === lesson.id}
                        >
                          {isGenerating && generatingLessonId === lesson.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <HiRefresh className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Sign Language Panel */}
            {activeTab === 'sign' && (
              <motion.div
                key="sign"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
                role="tabpanel"
                aria-labelledby="sign-tab"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mx-auto max-w-6xl">
                  {signLanguageLessons.map((lesson) => (
                    <GlassCard key={lesson.id} className="p-5 relative overflow-hidden backdrop-blur-md bg-black/40 border border-purple-500/30 shadow-lg">
                      <div className="flex items-start gap-3 mb-3">
                        {/* Lesson icon */}
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <HiTranslate className="w-6 h-6 text-white" />
                        </div>
                        
                        {/* Lesson content */}
                        <div className="flex-grow">
                          <h3 className="text-base sm:text-lg font-semibold text-white text-left mb-1">{lesson.title}</h3>
                          <div className="flex items-center mb-2 text-white/60 text-xs sm:text-sm">
                            <span>{lesson.duration}</span>
                            {lesson.views && (
                              <>
                                <div className="w-1 h-1 rounded-full bg-white/40 mx-2"></div>
                                <span>{lesson.views} views</span>
                              </>
                            )}
                          </div>
                          <p className="text-white/70 text-xs sm:text-sm mb-2">{lesson.description}</p>
                        </div>
                      </div>
                      
                      {/* Video thumbnail or player */}
                      {selectedVideo === lesson.id ? (
                        <div className="w-full aspect-video bg-black/40 rounded-lg overflow-hidden relative">
                          <iframe
                            src={`https://www.youtube.com/embed/${lesson.videoId}?autoplay=1`}
                            title={lesson.title}
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-video bg-black/40 rounded-lg overflow-hidden relative cursor-pointer"
                             onClick={() => selectVideo(lesson.id)}>
                          <img
                            src={`https://img.youtube.com/vi/${lesson.videoId}/hqdefault.jpg`}
                            alt={lesson.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                              <HiPlay className="w-6 h-6 ml-1" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Video controls */}
                      <div className="flex justify-start mt-3">
                        <button
                          onClick={() => selectVideo(lesson.id)}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center gap-2 text-white text-sm shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                          aria-label={selectedVideo === lesson.id ? "Close video" : "Watch video"}
                        >
                          {selectedVideo === lesson.id ? (
                            <>
                              <HiX className="w-4 h-4" />
                              <span>Close</span>
                            </>
                          ) : (
                            <>
                              <HiPlay className="w-4 h-4" />
                              <span>Watch</span>
                            </>
                          )}
                        </button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <ThemeSelector/>
    </AppLayout>
  );
}
