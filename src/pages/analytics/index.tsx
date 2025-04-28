import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import AppLayout from '../../components/layout/AppLayout';
import GlassCard from '../../components/ui/GlassCard';
import {
  Line,
  Bar,
  Doughnut,
  Radar,
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
} from 'chart.js';
import ThemeSelector from '@/components/ThemeSelector';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { CanvasRevealEffect } from '@/components/ui/CanvasRevealEffect';
import ReactMarkdown from 'react-markdown';
import {
  HiSparkles,
  HiClock,
  HiChartBar,
  HiMicrophone,
  HiChat,
  HiAcademicCap,
  HiBriefcase,
  HiPresentationChartLine,
} from 'react-icons/hi';
import { fetchAnalyticsData, formatTime, formatDate } from '@/lib/analyticsUtils';
import { PracticeSession, SessionMetrics, SpeechAnalysisMetrics, collectAchievementReward } from '@/lib/practiceUtils';
import { Achievement } from '../../lib/analyticsUtils';
import { generateDemoAnalyticsData } from '@/lib/demoData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface AnalyticsProps {}

export default function Analytics() {
  const { themeColor } = useTheme();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalTime, setTotalTime] = useState({ hours: 0, minutes: 0 });
  const [avgSession, setAvgSession] = useState(0);
  const [topSkill, setTopSkill] = useState<{ 
    name: string; 
    score: number; 
    color: string 
  }>({ name: '', score: 0, color: '' });
  const [hourlyActivity, setHourlyActivity] = useState<number[]>(Array(24).fill(0));
  const [practiceDistribution, setPracticeDistribution] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
  }>({ 
    labels: [], 
    datasets: [{
      label: '',
      data: [],
      backgroundColor: [],
      borderColor: [],
      borderWidth: 1
    }]
  });
  const [speechMetrics, setSpeechMetrics] = useState<SpeechAnalysisMetrics>({
    content_structure: 0,
    delivery: 0,
    body_language: 0,
    engagement: 0,
    vocal_variety: 0,
    language_vocabulary: 0,
    presence_confidence: 0,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<
    Achievement | null
  >(null);
  const [progressOverTime, setProgressOverTime] = useState<{
    labels: string[];
    datasets: { label: string; data: number[] }[];
  }>({
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      { label: 'Confidence', data: [0, 0, 0, 0] },
      { label: 'Clarity', data: [0, 0, 0, 0] },
      { label: 'Pace', data: [0, 0, 0, 0] }
    ]
  });
  const [hasMockData, setHasMockData] = useState(false);
  const [hasRealData, setHasRealData] = useState(false);
  const [showingDemoData, setShowingDemoData] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);

        const data = await fetchAnalyticsData();

        console.log("Analytics data received:", data);
        console.log("Total sessions:", data.totalSessions);
        console.log("Sessions array:", data.sessions);

        if (data) {
          setSessions(data.sessions);
          setTotalSessions(data.totalSessions);
          setTotalTime(data.totalTime);
          setAvgSession(data.averageSessionTime);
          setTopSkill(data.topSkill);
          // Convert weekly activity to hourly activity
          setHourlyActivity(data.hourlyActivity || Array(24).fill(0));
          setPracticeDistribution(data.practiceDistribution);
          setSpeechMetrics(data.speechMetrics);
          setAchievements(data.achievements);
          setProgressOverTime(data.progressOverTime);
          
          // Set real data flag
          setHasRealData(data.hasRealData || false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  const handleCollectReward = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowRewardAnimation(true);

    setTimeout(() => {
      setShowRewardAnimation(false);
      setSelectedAchievement(null);
    }, 3000);
  };

  const loadDemoData = () => {
    try {
      setLoading(true);
      
      const demoData = generateDemoAnalyticsData();
      console.log(`Generated ${demoData.sessions.length} demo sessions`);
      setSessions(demoData.sessions);
      setTotalSessions(demoData.totalSessions);
      setTotalTime(demoData.totalTime);
      setAvgSession(demoData.averageSessionTime);
      setTopSkill(demoData.topSkill);
      setHourlyActivity(demoData.hourlyActivity || Array(24).fill(0));
      setPracticeDistribution(demoData.practiceDistribution);
      setSpeechMetrics(demoData.speechMetrics);
      setAchievements(demoData.achievements);
      setProgressOverTime(demoData.progressOverTime);
      setShowingDemoData(true);
    } catch (err: any) {
      console.error('Error generating demo data:', err);
    } finally {
      setLoading(false);
    }
  };

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

  // Generate consistent, pleasing colors for the practice distribution chart
  const generatePracticeDistributionColors = () => {
    // Predefined pleasing colors for the donut chart
    return [
      '#FF6384', // Pink
      '#36A2EB', // Blue
      '#FFCE56', // Yellow
      '#4BC0C0', // Teal
      '#9966FF', // Purple
      '#FF9F40', // Orange
      '#7CFC00', // Lime
      '#F08080', // Light Coral
      '#20B2AA', // Light Sea Green
      '#BA55D3'  // Medium Orchid
    ];
  };

  // Update the doughnut data with consistent colors
  const doughnutData = {
    labels: practiceDistribution.labels,
    datasets: [
      {
        data: practiceDistribution.datasets[0].data,
        backgroundColor: generatePracticeDistributionColors().slice(0, practiceDistribution.labels.length),
        borderWidth: 1,
        borderColor: '#ffffff30',
      },
    ],
  };

  // Generate vibrant colors for charts
  const vibrantColors = generateVibrantColors(themeColor, 7);
  const gradientColors = vibrantColors.map(color => ({
    solid: color,
    transparent: color + '33',
    semi: color + '88'
  }));

  // Create a wave-like area chart for hourly data
  const hourlyWaveData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Practice Minutes',
        data: hourlyActivity,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, gradientColors[0].solid + 'AA');
          gradient.addColorStop(1, gradientColors[0].transparent);
          return gradient;
        },
        borderColor: gradientColors[0].solid,
        borderWidth: 2,
        pointBackgroundColor: gradientColors[0].solid,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: gradientColors[0].solid,
        tension: 0.4, // Makes the line curved for a wave-like effect
        fill: true,
      }
    ],
  };

  // Colorful bar chart for hourly activity
  const hourlyBarData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Practice Minutes',
        data: hourlyActivity,
        backgroundColor: (context: any) => {
          const index = context.dataIndex;
          const value = context.dataset.data[index];
          const opacity = 0.7 + (value / Math.max(...hourlyActivity) * 0.3);
          return gradientColors[index % gradientColors.length].solid + Math.floor(opacity * 255).toString(16).padStart(2, '0');
        },
        borderWidth: 0,
        borderRadius: 8,
        hoverBackgroundColor: gradientColors.map(c => c.solid),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        },
      },
    },
  };

  const speechRadarData = {
    labels: [
      'Content Structure',
      'Delivery',
      'Body Language',
      'Engagement',
      'Vocal Variety',
      'Language',
      'Presence',
    ],
    datasets: [
      {
        label: 'Speech Metrics',
        data: [
          speechMetrics.content_structure,
          speechMetrics.delivery,
          speechMetrics.body_language,
          speechMetrics.engagement,
          speechMetrics.vocal_variety,
          speechMetrics.language_vocabulary,
          speechMetrics.presence_confidence,
        ],
        backgroundColor: gradientColors.map(c => c.transparent).join(', '),
        borderColor: gradientColors.map(c => c.solid),
        borderWidth: 2,
        pointBackgroundColor: gradientColors.map(c => c.solid),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: gradientColors.map(c => c.solid),
      },
    ],
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

  const createRadialData = (value: number) => {
    return {
      datasets: [
        {
          data: [value, 100 - value],
          backgroundColor: [themeColor, 'rgba(255, 255, 255, 0.1)'],
          borderWidth: 0,
          circumference: 180,
          rotation: 270,
        },
      ],
    };
  };

  const radialOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.6)',
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
    },
    cutout: '70%',
  };

  const getColorForPoints = (points: number, opacity: number = 1) => {
    if (points < 100) {
      return `rgba(255, 215, 0, ${opacity})`;
    } else if (points < 500) {
      return `rgba(255, 165, 0, ${opacity})`;
    } else if (points < 1000) {
      return `rgba(255, 140, 0, ${opacity})`;
    } else {
      return `rgba(255, 105, 0, ${opacity})`;
    }
  };

  return (
    <AppLayout title="Analytics">
      <div className="mt-10 h-full overflow-y-auto space-y-6 pb-8">
        {/* Top metrics cards - equal width and height */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-6 h-full">
            <div className="flex justify-between">
              <div>
                <div className="text-white/60 mb-2">Total Sessions</div>
                <div className="text-3xl font-bold text-white">{totalSessions}</div>
                <div className="text-white/40 text-sm mt-1">+3 this week</div>
              </div>
              <div className="w-16 h-16">
                <Doughnut
                  data={createRadialData(Math.min(totalSessions, 100))}
                  options={radialOptions}
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 h-full">
            <div className="flex justify-between">
              <div>
                <div className="text-white/60 mb-2">Practice Time</div>
                <div className="text-3xl font-bold text-white">
                  {totalTime.hours}h {totalTime.minutes}m
                </div>
                <div className="text-white/40 text-sm mt-1">+2h this week</div>
              </div>
              <div className="w-16 h-16">
                <Doughnut
                  data={createRadialData(
                    Math.min(totalTime.hours * 60 + totalTime.minutes, 100)
                  )}
                  options={radialOptions}
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 h-full">
            <div className="flex justify-between">
              <div>
                <div className="text-white/60 mb-2">Avg. Session</div>
                <div className="text-3xl font-bold text-white">{avgSession}min</div>
                <div className="text-white/40 text-sm mt-1">+5min avg</div>
              </div>
              <div className="w-16 h-16">
                <Doughnut
                  data={createRadialData(Math.min(avgSession, 100))}
                  options={radialOptions}
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 h-full">
            <div className="flex justify-between">
              <div>
                <div className="text-white/60 mb-2">Top Skill</div>
                <div className="text-3xl font-bold text-white">{topSkill.name || 'N/A'}</div>
                <div className="text-white/40 text-sm mt-1">
                  {topSkill.score}% success rate
                </div>
              </div>
              <div className="w-16 h-16">
                <Doughnut
                  data={createRadialData(topSkill.score)}
                  options={radialOptions}
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Header with data source indicator */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Data source indicator */}
            {!hasRealData && (
              <div className="text-sm text-white/70">
                No real data available
              </div>
            )}
            {showingDemoData && (
              <div className="text-sm text-white/70">
                Showing demo data
              </div>
            )}
            
            {/* Debug information */}
            <div className="text-sm text-white/70">
              Total Sessions: {totalSessions}
            </div>
          </div>
        </div>

                {/* Speech Pattern Analysis and Practice Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard className="p-6 h-[550px]">
            <h2 className="text-xl font-semibold text-white mb-6">
              Speech Pattern Analysis
            </h2>
            <div className="h-[250px] overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="radar-chart-container h-[250px]">
                  <Radar
                    data={speechRadarData}
                    options={radarOptions}
                  />
                </div>
              )}
            </div>
            <div className="text-white/70 text-sm mt-6">
              <h3 className="font-semibold mb-3 text-white text-base">Analysis Insights:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Content Structure</span>
                    <span className="text-right font-bold" style={{ color: gradientColors[0].solid }}>{speechMetrics.content_structure}%</span>
                  </div>
                  <div className="text-xs mt-1">
                    {speechMetrics.content_structure > 70
                      ? 'Well organized with clear structure'
                      : 'Needs improvement in organization'}
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Delivery</span>
                    <span className="text-right font-bold" style={{ color: gradientColors[1].solid }}>{speechMetrics.delivery}%</span>
                  </div>
                  <div className="text-xs mt-1">
                    {speechMetrics.delivery > 70
                      ? 'Excellent pace and articulation'
                      : 'Work on pace and clarity'}
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Body Language</span>
                    <span className="text-right font-bold" style={{ color: gradientColors[2].solid }}>{speechMetrics.body_language}%</span>
                  </div>
                  <div className="text-xs mt-1">
                    {speechMetrics.body_language > 70
                      ? 'Confident posture and gestures'
                      : 'Improve posture and gestures'}
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Vocal Variety</span>
                    <span className="text-right font-bold" style={{ color: gradientColors[3].solid }}>{speechMetrics.vocal_variety}%</span>
                  </div>
                  <div className="text-xs mt-1">
                    {speechMetrics.vocal_variety > 70
                      ? 'Good pitch and tone variation'
                      : 'Add more vocal dynamics'}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 h-[550px]">
            <h2 className="text-xl font-semibold text-white mb-6">
              Practice Distribution
            </h2>
            <div className="h-[350px] mt-16 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              )}
            </div>
          </GlassCard>
        </div>

        {/* Progress Over Time Chart - Changed to Wave-like Area Chart */}
        <div className="grid grid-cols-1 gap-4">
          <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Progress Over Time</h2>
            </div>
            <div className="h-[300px] overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : (
                <Line 
                  data={hourlyWaveData} 
                  options={{
                    ...chartOptions,
                    elements: {
                      line: {
                        tension: 0.4 // Adds curve to the line for wave effect
                      }
                    },
                    scales: {
                      ...chartOptions.scales,
                      y: {
                        ...chartOptions.scales.y,
                        min: 0,
                        title: {
                          display: true,
                          text: 'Minutes',
                          color: 'rgba(255, 255, 255, 0.6)'
                        }
                      }
                    },
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: true,
                        position: 'top' as const,
                        labels: {
                          color: 'rgba(255, 255, 255, 0.6)',
                          font: {
                            size: 12,
                          },
                        },
                      },
                    },
                  }}
                />
              )}
            </div>
            <div className="mt-4 text-white/60 text-sm">
              <p>This chart shows your practice activity throughout the day. The wave pattern indicates your most active hours.</p>
            </div>
          </GlassCard>
        </div>

        {/* Hourly Activity and Recent Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard className="p-6 h-full">
            <h2 className="text-xl font-semibold text-white mb-6">
              Hourly Activity
            </h2>
            <div className="h-[300px] overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : (
                <Bar 
                  data={hourlyBarData} 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            return `${context.parsed.y} minutes`;
                          }
                        }
                      }
                    },
                    animation: {
                      duration: 2000,
                      easing: 'easeOutQuart'
                    }
                  }} 
                />
              )}
            </div>
            <div className="mt-4 text-white/60 text-sm">
              <p>This colorful bar chart shows your practice distribution across different hours of the day.</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6 h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <HiSparkles className="mr-2 text-yellow-400" /> Recent Achievements
              </h2>
              <button
                onClick={loadDemoData}
                className="text-xs bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-3 py-1 rounded-full transition hover:scale-105 ml-48"
              >
                Load Demo Data
              </button>
              {showingDemoData && (
                <button
                  onClick={() => {
                    setShowingDemoData(false);
                    fetchAnalyticsData().then(data => {
                      if (data) {
                        setSessions(data.sessions);
                        setTotalSessions(data.totalSessions);
                        setTotalTime(data.totalTime);
                        setAvgSession(data.averageSessionTime);
                        setTopSkill(data.topSkill);
                        // Convert weekly activity to hourly activity
                        setHourlyActivity(data.hourlyActivity || Array(24).fill(0));
                        setPracticeDistribution(data.practiceDistribution);
                        setSpeechMetrics(data.speechMetrics);
                        setAchievements(data.achievements);
                        setProgressOverTime(data.progressOverTime);
                      }
                    });
                  }}
                  className="text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full transition hover:scale-105"
                >
                  Show Real Data
                </button>
              )}
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-white/60">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : achievements.length > 0 ? (
              <div className="space-y-6 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                {achievements.slice(0, 5).map((achievement, index) => (
                  <div key={achievement.id} className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-white font-medium flex items-center">
                        {achievement.icon === 'HiSparkles' && (
                          <HiSparkles className="mr-2 text-yellow-400 text-xl" />
                        )}
                        {achievement.icon === 'HiClock' && (
                          <HiClock className="mr-2 text-green-400 text-xl" />
                        )}
                        {achievement.icon === 'HiChartBar' && (
                          <HiChartBar className="mr-2 text-blue-400 text-xl" />
                        )}
                        {achievement.icon === 'HiMicrophone' && (
                          <HiMicrophone className="mr-2 text-purple-400 text-xl" />
                        )}
                        {achievement.icon === 'HiChat' && (
                          <HiChat className="mr-2 text-green-400 text-xl" />
                        )}
                        {achievement.icon === 'HiAcademicCap' && (
                          <HiAcademicCap className="mr-2 text-indigo-400 text-xl" />
                        )}
                        {achievement.icon === 'HiBriefcase' && (
                          <HiBriefcase className="mr-2 text-blue-400 text-xl" />
                        )}
                        {achievement.icon === 'HiPresentationChartLine' && (
                          <HiPresentationChartLine className="mr-2 text-purple-400 text-xl" />
                        )}
                        <span className="text-base">{achievement.name}</span>
                      </div>
                      <div className="flex items-center bg-white/10 px-3 py-1 rounded-full">
                        <span className="text-yellow-300 font-bold mr-1">+{achievement.points}</span>
                        <span className="text-white/60 text-sm">pts</span>
                      </div>
                    </div>
                    <p className="text-white/70 text-sm mb-3">{achievement.description}</p>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ 
                          width: '100%', 
                          background: `linear-gradient(90deg, ${getColorForPoints(achievement.points)} 0%, ${getColorForPoints(achievement.points, 0.7)} 100%)` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-white/40 text-xs">
                        {formatDate(achievement.date_achieved)}
                      </div>
                      {!achievement.is_collected && (
                        <button
                          onClick={() => handleCollectReward(achievement)}
                          className="text-xs bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-3 py-1 rounded-full transition hover:scale-105"
                        >
                          Collect Reward
                        </button>
                      )}
                      {achievement.is_collected && (
                        <div className="text-xs bg-white/10 text-white/60 px-3 py-1 rounded-full">
                          Collected
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-white/60">
                <div className="text-5xl mb-4">🏆</div>
                <div className="text-center">
                  <p className="mb-2">No achievements yet</p>
                  <p className="text-sm">
                    Complete practice sessions to earn achievements
                  </p>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Reward animation */}
        {showRewardAnimation && selectedAchievement && (
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
                <p className="text-white/80 text-lg">+{selectedAchievement?.points || 0} points</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <ThemeSelector/>
    </AppLayout>
  );
}
