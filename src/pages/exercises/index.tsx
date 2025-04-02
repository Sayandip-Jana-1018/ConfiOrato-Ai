import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import AppLayout from '../../components/layout/AppLayout';
import GlassCard from '../../components/ui/GlassCard';
import {
  Line,
  Bar,
  Radar,
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import ThemeSelector from '@/components/ThemeSelector';
import { HiClock, HiTrendingUp, HiCheck, HiRefresh, HiLightningBolt, HiAcademicCap } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { SpeechAnalysisMetrics } from '@/lib/practiceUtils';
import { generateDemoExerciseData } from '@/lib/demoData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
);

type Progress = {
  [key: string]: number;
};

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: string;
  completed: boolean;
};

export default function Exercises() {
  const { themeColor } = useTheme();
  const [loading, setLoading] = useState(true);
  const [showingDemoData, setShowingDemoData] = useState(false);
  const [speechMetrics, setSpeechMetrics] = useState<SpeechAnalysisMetrics>({
    content_structure: 40,
    delivery: 55,
    body_language: 60,
    engagement: 45,
    vocal_variety: 50,
    language_vocabulary: 65,
    presence_confidence: 70,
  });
  const [skillsData, setSkillsData] = useState({
    clarity: 60,
    pace: 70,
    confidence: 55,
    structure: 65,
  });
  
  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  
  // Learn to Win tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [completedTaskCount, setCompletedTaskCount] = useState(0);
  
  // Generate vibrant colors based on theme color
  const generateVibrantColors = (baseColor: string, count: number) => {
    const colors = [];
    const hueShift = 360 / count;
    
    // Extract RGB from the hex color
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    
    // Convert to HSL
    const [h, s, l] = rgbToHsl(r, g, b);
    
    for (let i = 0; i < count; i++) {
      // Shift the hue
      const newHue = (h + hueShift * i) % 360;
      // Convert back to RGB
      const [newR, newG, newB] = hslToRgb(newHue, s, l);
      // Convert to hex
      const hex = '#' + 
        Math.round(newR).toString(16).padStart(2, '0') + 
        Math.round(newG).toString(16).padStart(2, '0') + 
        Math.round(newB).toString(16).padStart(2, '0');
      colors.push(hex);
    }
    
    return colors;
  };
  
  // RGB to HSL conversion
  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    return [h * 360, s, l];
  };
  
  // HSL to RGB conversion
  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return [r * 255, g * 255, b * 255];
  };

  // Generate vibrant colors for charts
  const vibrantColors = generateVibrantColors(themeColor, 7);
  const gradientColors = vibrantColors.map(color => ({
    solid: color,
    transparent: color + '33',
    semi: color + '88'
  }));

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch user data
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error("No user logged in");
          setLoading(false);
          return;
        }
        
        // Fetch speech metrics
        const { data: metricsData, error: metricsError } = await supabase
          .from('speech_metrics')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (metricsError) {
          console.error("Error fetching speech metrics:", metricsError);
        } else if (metricsData && metricsData.length > 0) {
          setSpeechMetrics({
            content_structure: metricsData[0].content_structure || 40,
            delivery: metricsData[0].delivery || 55,
            body_language: metricsData[0].body_language || 60,
            engagement: metricsData[0].engagement || 45,
            vocal_variety: metricsData[0].vocal_variety || 50,
            language_vocabulary: metricsData[0].language_vocabulary || 65,
            presence_confidence: metricsData[0].presence_confidence || 70,
          });
        }
        
        // Fetch skills data
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('practice_sessions')
          .select('metrics')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (sessionsError) {
          console.error("Error fetching sessions:", sessionsError);
        } else if (sessionsData && sessionsData.length > 0) {
          // Calculate average metrics from last 5 sessions
          const avgMetrics = sessionsData.reduce((acc, session) => {
            if (session.metrics) {
              acc.clarity += session.metrics.clarity || 0;
              acc.pace += session.metrics.pace || 0;
              acc.confidence += session.metrics.confidence || 0;
              acc.structure += session.metrics.structure || 0;
              acc.count++;
            }
            return acc;
          }, { clarity: 0, pace: 0, confidence: 0, structure: 0, count: 0 });
          
          if (avgMetrics.count > 0) {
            setSkillsData({
              clarity: Math.round(avgMetrics.clarity / avgMetrics.count) || 60,
              pace: Math.round(avgMetrics.pace / avgMetrics.count) || 70,
              confidence: Math.round(avgMetrics.confidence / avgMetrics.count) || 55,
              structure: Math.round(avgMetrics.structure / avgMetrics.count) || 65,
            });
          }
        }
        
        // Generate initial quiz questions
        generateQuizQuestions();
        
        // Generate initial tasks
        generateTasks();
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Function to handle task completion
  const handleTaskCompletion = useCallback((taskId: string) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: true } : task
      );
      
      // Count completed tasks
      const completedCount = updatedTasks.filter(task => task.completed).length;
      setCompletedTaskCount(completedCount);
      
      // If all tasks are completed, generate new ones after a delay
      if (completedCount === 4) {
        setTimeout(() => {
          generateTasks();
        }, 1500);
      }
      
      return updatedTasks;
    });
  }, []);
  
  // Function to generate quiz questions based on weaknesses
  const generateQuizQuestions = async () => {
    try {
      // Identify weaknesses
      const weakAreas = [];
      
      if (speechMetrics.content_structure < 60) weakAreas.push('content structure');
      if (speechMetrics.delivery < 60) weakAreas.push('delivery');
      if (speechMetrics.body_language < 60) weakAreas.push('body language');
      if (speechMetrics.engagement < 60) weakAreas.push('audience engagement');
      if (speechMetrics.vocal_variety < 60) weakAreas.push('vocal variety');
      if (speechMetrics.language_vocabulary < 60) weakAreas.push('language and vocabulary');
      if (speechMetrics.presence_confidence < 60) weakAreas.push('presence and confidence');
      
      if (skillsData.clarity < 60) weakAreas.push('clarity');
      if (skillsData.pace < 60) weakAreas.push('speaking pace');
      if (skillsData.confidence < 60) weakAreas.push('confidence');
      if (skillsData.structure < 60) weakAreas.push('speech structure');
      
      // If no weak areas, focus on general public speaking skills
      const focusAreas = weakAreas.length > 0 ? weakAreas.join(', ') : 'general public speaking skills';
      
      // For now, use mock data - in a real app, this would call the Gemini API
      const mockQuestions: QuizQuestion[] = [
        {
          question: "You notice your audience seems disengaged during your presentation. What's the best course of action?",
          options: [
            "Continue with your planned content without changes",
            "Ask a direct question to the audience to increase engagement",
            "Speak louder to capture their attention",
            "Rush through the remaining slides to finish sooner"
          ],
          correctAnswer: 1,
          explanation: "Asking a direct question creates immediate engagement and helps reconnect with your audience."
        },
        {
          question: "During a presentation, you completely forget what you were going to say next. What's the most professional response?",
          options: [
            "Apologize repeatedly for your mistake",
            "Pretend nothing happened and improvise something unrelated",
            "Briefly pause, check your notes, and continue calmly",
            "End the presentation early"
          ],
          correctAnswer: 2,
          explanation: "A calm pause to collect your thoughts shows confidence and professionalism."
        },
        {
          question: "What's the most effective way to structure a persuasive speech?",
          options: [
            "Start with all the technical details and gradually simplify",
            "Begin with a powerful story, present your argument with evidence, then call to action",
            "Present all possible perspectives with equal weight",
            "Focus exclusively on facts without emotional appeals"
          ],
          correctAnswer: 1,
          explanation: "A story creates connection, evidence builds credibility, and a call to action drives results."
        },
        {
          question: "You're speaking too quickly during an important presentation. What technique would help most?",
          options: [
            "Drink water between major points",
            "Add more content to fill your allocated time",
            "Focus on technical terminology to slow yourself down",
            "Skip sections to have less to cover"
          ],
          correctAnswer: 0,
          explanation: "Taking small water breaks creates natural pauses and helps regulate your speaking pace."
        },
        {
          question: "What's the best approach when using slides in a presentation?",
          options: [
            "Include all your talking points as text on the slides",
            "Use minimal text with supporting visuals that enhance your message",
            "Read directly from text-heavy slides to ensure accuracy",
            "Create complex, detailed graphics to impress the audience"
          ],
          correctAnswer: 1,
          explanation: "Slides should support your message, not be your message. Visual aids enhance retention."
        }
      ];
      
      setQuizQuestions(mockQuestions);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setQuizScore(0);
      
    } catch (error) {
      console.error("Error generating quiz questions:", error);
    }
  };
  
  // Function to generate learning tasks
  const generateTasks = async () => {
    setIsLoadingTasks(true);
    setCompletedTaskCount(0);
    
    try {
      // In a real app, this would call the Gemini API
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          title: "One-Minute Wonder",
          description: "Practice a 1-minute speech on 'The most important lesson I've learned' and record yourself.",
          icon: "HiLightningBolt",
          difficulty: "Easy",
          completed: false,
        },
        {
          id: 'task-2',
          title: "Mirror Practice",
          description: "Stand in front of a mirror and practice maintaining eye contact with yourself while explaining your favorite hobby.",
          icon: "HiAcademicCap",
          difficulty: "Medium",
          completed: false,
        },
        {
          id: 'task-3',
          title: "Tongue Twisters",
          description: "Practice these tongue twisters for 5 minutes to improve articulation: 'She sells seashells by the seashore' and 'Peter Piper picked a peck of pickled peppers'.",
          icon: "HiLightningBolt",
          difficulty: "Hard",
          completed: false,
        },
        {
          id: 'task-4',
          title: "Elevator Pitch",
          description: "Create a 30-second elevator pitch about yourself that you could use in a networking event.",
          icon: "HiAcademicCap",
          difficulty: "Medium",
          completed: false,
        }
      ];
      
      setTasks(mockTasks);
    } catch (error) {
      console.error("Error generating tasks:", error);
    } finally {
      setIsLoadingTasks(false);
    }
  };
  
  // Function to load demo data
  const loadDemoData = () => {
    try {
      setLoading(true);
      const demoData = generateDemoExerciseData();
      console.log('Generated demo exercise data:', demoData);
      
      // Update metrics with demo data
      if (demoData.metrics) {
        setSpeechMetrics({
          content_structure: Math.round(demoData.metrics.structure || 75),
          delivery: Math.round(demoData.metrics.clarity || 80),
          body_language: Math.round(demoData.metrics.bodyLanguage || 70),
          engagement: Math.round(demoData.metrics.engagement || 85),
          vocal_variety: Math.round(demoData.metrics.vocalVariety || 65),
          language_vocabulary: Math.round(demoData.metrics.contentQuality || 75),
          presence_confidence: Math.round(demoData.metrics.confidence || 80),
        });
        
        setSkillsData({
          clarity: Math.round(demoData.metrics.clarity || 80),
          pace: Math.round(demoData.metrics.pace || 75),
          confidence: Math.round(demoData.metrics.confidence || 70),
          structure: Math.round(demoData.metrics.structure || 65),
        });
      }
      
      setShowingDemoData(true);
    } catch (err) {
      console.error('Error loading demo data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle quiz answer selection
  const handleAnswerSelect = (optionIndex: number) => {
    if (isAnswered) return;
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    if (optionIndex === quizQuestions[currentQuestionIndex].correctAnswer) {
      setQuizScore(prevScore => prevScore + 1);
    }
    
    // Move to next question after a delay
    setTimeout(() => {
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      }
    }, 1500);
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        },
        min: 0,
        max: 100,
      },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 12,
          },
        },
        ticks: {
          backdropColor: 'transparent',
          color: 'rgba(255, 255, 255, 0.6)',
          z: 1,
          stepSize: 20,
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <AppLayout title="Exercises">
      <div className="mt-10 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white text-center">SWOT Analysis</h2>
              <div className="flex">
                <button
                  onClick={loadDemoData}
                  className="text-xs bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-3 py-1 rounded-full transition hover:scale-105 mr-2"
                >
                  Load Demo Data
                </button>
                {showingDemoData && (
                  <button
                    onClick={() => {
                      setLoading(true);
                      setShowingDemoData(false);
                      const fetchRealData = async () => {
                        try {
                          setLoading(true);
                          
                          // Get current user
                          const { data: { user } } = await supabase.auth.getUser();
                          
                          if (!user) {
                            console.error("No user found");
                            return;
                          }
                          
                          // Fetch speech metrics
                          const { data: metricsData, error: metricsError } = await supabase
                            .from('speech_metrics')
                            .select('*')
                            .eq('user_id', user.id)
                            .order('created_at', { ascending: false })
                            .limit(1);
                            
                          if (metricsError) {
                            console.error("Error fetching speech metrics:", metricsError);
                          } else if (metricsData && metricsData.length > 0) {
                            setSpeechMetrics({
                              content_structure: metricsData[0].content_structure || 40,
                              delivery: metricsData[0].delivery || 55,
                              body_language: metricsData[0].body_language || 60,
                              engagement: metricsData[0].engagement || 45,
                              vocal_variety: metricsData[0].vocal_variety || 50,
                              language_vocabulary: metricsData[0].language_vocabulary || 65,
                              presence_confidence: metricsData[0].presence_confidence || 70,
                            });
                          }
                          
                          // Fetch skills data
                          const { data: sessionsData, error: sessionsError } = await supabase
                            .from('practice_sessions')
                            .select('metrics')
                            .eq('user_id', user.id)
                            .order('created_at', { ascending: false })
                            .limit(5);
                            
                          if (sessionsError) {
                            console.error("Error fetching sessions:", sessionsError);
                          } else if (sessionsData && sessionsData.length > 0) {
                            // Calculate average metrics from last 5 sessions
                            const avgMetrics = sessionsData.reduce((acc, session) => {
                              if (session.metrics) {
                                acc.clarity += session.metrics.clarity || 0;
                                acc.pace += session.metrics.pace || 0;
                                acc.confidence += session.metrics.confidence || 0;
                                acc.structure += session.metrics.structure || 0;
                                acc.count++;
                              }
                              return acc;
                            }, { clarity: 0, pace: 0, confidence: 0, structure: 0, count: 0 });
                            
                            if (avgMetrics.count > 0) {
                              setSkillsData({
                                clarity: Math.round(avgMetrics.clarity / avgMetrics.count) || 60,
                                pace: Math.round(avgMetrics.pace / avgMetrics.count) || 70,
                                confidence: Math.round(avgMetrics.confidence / avgMetrics.count) || 55,
                                structure: Math.round(avgMetrics.structure / avgMetrics.count) || 65,
                              });
                            }
                          }
                          
                          // Generate quiz questions
                          generateQuizQuestions();
                          
                          // Generate tasks
                          generateTasks();
                        } catch (error) {
                          console.error("Error fetching data:", error);
                        } finally {
                          setLoading(false);
                        }
                      };
                      
                      fetchRealData();
                    }}
                    className="text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full transition hover:scale-105"
                  >
                    Show Real Data
                  </button>
                )}
              </div>
            </div>
            <div className="h-[300px] flex items-center justify-center">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : (
                <>
                  <Line 
                    data={{
                      labels: ['Content', 'Delivery', 'Presence', 'Language', 'Vocal Variety', 'Body Language', 'Engagement'],
                      datasets: [{
                        label: 'Speech Metrics',
                        data: [
                          speechMetrics.content_structure,
                          speechMetrics.delivery,
                          speechMetrics.presence_confidence,
                          speechMetrics.language_vocabulary,
                          speechMetrics.vocal_variety,
                          speechMetrics.body_language,
                          speechMetrics.engagement,
                        ],
                        borderColor: '#f59e0b', // Amber color like in the image
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2,
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#f59e0b',
                        pointRadius: 4,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                          },
                          ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            stepSize: 10,
                          }
                        },
                        x: {
                          grid: {
                            display: false,
                          },
                          ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top',
                          labels: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            boxWidth: 12,
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderWidth: 1,
                        }
                      }
                    }}
                  />
                </>
              )}
            </div>
          </GlassCard>
          
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4 text-center">Skills</h2>
            <div className="h-[300px] flex items-center justify-center">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : (
                <Bar
                  data={{
                    labels: ['Clarity', 'Pace', 'Confidence', 'Structure'],
                    datasets: [{
                      label: 'Skill Level',
                      data: [
                        skillsData.clarity,
                        skillsData.pace,
                        skillsData.confidence,
                        skillsData.structure,
                      ],
                      backgroundColor: [
                        gradientColors[0].solid,
                        gradientColors[1].solid,
                        gradientColors[2].solid,
                        gradientColors[3].solid,
                      ],
                      borderRadius: 6,
                    }]
                  }}
                  options={{
                    ...chartOptions,
                    indexAxis: 'y',
                  }}
                />
              )}
            </div>
          </GlassCard>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quizzes Section */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center justify-center">
            <HiAcademicCap className="mr-2 text-blue-400" /> Public Speaking Quizzes
          </h2>
          <div className="h-[500px] flex flex-col mt-16">
            {quizQuestions.length > 0 ? (
              <div className="flex-grow flex flex-col">
                <div className="mb-4 flex justify-between items-center">
                  <span className="text-white/70">Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                  <span className="text-white/70">Score: {quizScore}/{currentQuestionIndex}</span>
                </div>
                
                <div className="bg-white/5 rounded-lg p-6 mb-6">
                  <h3 className="text-lg text-white mb-4 text-center">{quizQuestions[currentQuestionIndex].question}</h3>
                  
                  <div className="space-y-3">
                    {quizQuestions[currentQuestionIndex].options.map((option, index) => (
                      <motion.button
                        key={index}
                        className={`w-full text-left p-4 rounded-lg transition-colors ${
                          selectedOption === null 
                            ? 'bg-white/10 hover:bg-white/20 text-white' 
                            : selectedOption === index
                              ? index === quizQuestions[currentQuestionIndex].correctAnswer
                                ? 'bg-green-500/20 border border-green-500 text-white'
                                : 'bg-red-500/20 border border-red-500 text-white'
                              : index === quizQuestions[currentQuestionIndex].correctAnswer && isAnswered
                                ? 'bg-green-500/20 border border-green-500 text-white'
                                : 'bg-white/10 text-white/60'
                        }`}
                        onClick={() => handleAnswerSelect(index)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                            selectedOption === null 
                              ? 'bg-white/20' 
                              : selectedOption === index
                                ? index === quizQuestions[currentQuestionIndex].correctAnswer
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                                : index === quizQuestions[currentQuestionIndex].correctAnswer && isAnswered
                                  ? 'bg-green-500'
                                  : 'bg-white/20'
                          }`}>
                            {selectedOption !== null && (
                              index === quizQuestions[currentQuestionIndex].correctAnswer
                                ? <HiCheck className="text-white" />
                                : selectedOption === index
                                  ? <span className="text-white">✕</span>
                                  : null
                            )}
                          </div>
                          {option}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                {isAnswered && (
                  <motion.div 
                    className="bg-white/5 rounded-lg p-4 mb-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-white">
                      <span className="font-semibold">Explanation: </span>
                      {quizQuestions[currentQuestionIndex].explanation}
                    </p>
                  </motion.div>
                )}
                
                <div className="mt-auto flex justify-center">
                  <button
                    onClick={generateQuizQuestions}
                    className="px-4 py-2 mb-16 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center"
                  >
                    <HiRefresh className="mr-2" /> New Questions
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        </GlassCard>
        
        {/* Learn to Win Section */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center justify-center">
            <HiLightningBolt className="mr-2 text-yellow-400" /> Learn to Win
          </h2>
          <div className="h-[550px]">
            {isLoadingTasks ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto pr-2 custom-scrollbar">
                {tasks.map((task, index) => (
                  <motion.div
                    key={index}
                    className={`bg-white/5 rounded-lg p-6 flex flex-col h-full ${task.completed ? 'border border-green-500' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex items-start mb-4">
                      <div className={`w-10 h-10 rounded-full ${task.completed ? 'bg-green-500/30' : 'bg-gradient-to-br from-blue-500/30 to-purple-500/30'} flex items-center justify-center mr-3`}>
                        {task.completed ? (
                          <HiCheck className="text-green-400 text-xl" />
                        ) : task.icon === "HiLightningBolt" ? (
                          <HiLightningBolt className="text-yellow-400 text-xl" />
                        ) : (
                          <HiAcademicCap className="text-blue-400 text-xl" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{task.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${task.completed ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/70'}`}>
                          {task.completed ? 'Completed' : task.difficulty}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-white/80 flex-grow">
                      {task.description}
                    </p>
                    
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => handleTaskCompletion(task.id)}
                        className={`px-3 py-1.5 rounded-lg text-white text-sm ${
                          task.completed 
                            ? 'bg-green-500/20 cursor-not-allowed' 
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                        disabled={task.completed}
                      >
                        {task.completed ? 'Completed' : 'Start Task'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={generateTasks}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center"
                disabled={isLoadingTasks}
              >
                <HiRefresh className="mr-2" /> Refresh Tasks
              </button>
            </div>
          </div>
        </GlassCard>
        </div>
      </div>
      <ThemeSelector />
    </AppLayout>
  );
}
