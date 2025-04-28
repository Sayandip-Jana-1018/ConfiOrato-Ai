import { supabase } from './supabase';
import { 
  SessionMetrics, 
  SpeechAnalysisMetrics, 
  getUserAchievements,
  collectAchievementReward
} from './practiceUtils';

// Define the PracticeSession interface for analytics
export interface PracticeSession {
  id?: string;
  user_id?: string;
  session_date?: string;
  duration: number;
  environment: string;
  metrics: SessionMetrics;
  feedback: string;
  date?: string;
  isMock?: boolean; // Add this to support mock data flag
}

// Define the Achievement interface for analytics
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  is_collected: boolean;
  date_achieved: string;
  created_at?: string;
  isMock?: boolean;
}

// Define the AnalyticsData interface for analytics
export interface AnalyticsData {
  totalSessions: number;
  totalTime: {
    hours: number;
    minutes: number;
  };
  averageSessionTime: number;
  topSkill: {
    name: string;
    score: number;
    color: string;
  };
  practiceDistribution: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
  };
  weeklyActivity: {
    day: string;
    count: number;
  }[];
  hourlyActivity: number[];
  progressOverTime: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
      fill: boolean;
    }[];
  };
  speechMetrics: SpeechAnalysisMetrics;
  achievements: Achievement[];
  sessions: PracticeSession[];
  hasMockData?: boolean;
  hasRealData?: boolean;
}

// Color mapping for practice environments
const environmentColors: Record<string, string> = {
  classroom: '#4F46E5',
  interview: '#10B981',
  conference: '#F59E0B',
  presentation: '#EF4444',
  default: '#6366F1'
};

/**
 * Generate a random color with specified opacity
 * @param opacity Opacity value between 0 and 1
 * @returns RGBA color string
 */
export function getRandomColor(opacity: number = 1): string {
  const colors = [
    `rgba(255, 99, 132, ${opacity})`,   // Red
    `rgba(54, 162, 235, ${opacity})`,   // Blue
    `rgba(255, 206, 86, ${opacity})`,   // Yellow
    `rgba(75, 192, 192, ${opacity})`,   // Teal
    `rgba(153, 102, 255, ${opacity})`,  // Purple
    `rgba(255, 159, 64, ${opacity})`,   // Orange
    `rgba(199, 199, 199, ${opacity})`,  // Gray
    `rgba(83, 102, 255, ${opacity})`,   // Indigo
    `rgba(255, 99, 255, ${opacity})`,   // Pink
    `rgba(99, 255, 132, ${opacity})`,   // Green
    `rgba(255, 128, 0, ${opacity})`,    // Bright Orange
    `rgba(0, 204, 204, ${opacity})`,    // Turquoise
    `rgba(204, 0, 204, ${opacity})`,    // Magenta
    `rgba(102, 204, 0, ${opacity})`,    // Lime
    `rgba(204, 102, 0, ${opacity})`,    // Brown
    `rgba(0, 102, 204, ${opacity})`     // Royal Blue
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Fetch all analytics data for the current user
 */
export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log("Current user:", user);
    
    // If no user, return empty data
    if (!user) {
      console.log("No authenticated user found, returning empty data");
      return getEmptyAnalyticsData();
    }
    
    // Fetch ALL practice sessions without filtering by user_id
    // This ensures we see all data in the database
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('practice_sessions')
      .select('*')
      .order('session_date', { ascending: false });
    
    console.log("All sessions in database:", sessionsData ? sessionsData.length : 0);
    
    // If no data, return empty data
    if (sessionsError || !sessionsData || sessionsData.length === 0) {
      console.log("No practice sessions found or error occurred, returning empty data");
      return getEmptyAnalyticsData();
    }
    
    // Convert to PracticeSession format
    const realSessions: PracticeSession[] = sessionsData.map(session => ({
      id: session.id,
      user_id: session.user_id,
      duration: session.duration,
      environment: session.environment,
      metrics: session.metrics,
      feedback: session.feedback,
      date: session.session_date,
      session_date: session.session_date
    }));
    
    // Fetch achievements
    const achievements = await getUserAchievements();
    
    // Fetch latest speech analysis
    const { data: speechData, error: speechError } = await supabase
      .from('speech_analysis')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (speechError) {
      console.error("Error fetching speech analysis:", speechError);
    }
    
    // Calculate analytics metrics for real data
    const totalSessions = realSessions.length;
    const totalMinutes = realSessions.reduce((total, session) => total + (session.duration || 0), 0);
    const totalTime = {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60
    };
    const averageSessionTime = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
    
    // Get weekly activity data
    const weeklyActivity = getWeeklyActivity(realSessions);
    
    // Get hourly activity data
    const hourlyActivity = getHourlyActivity(realSessions);
    
    // Get practice distribution by environment
    const practiceDistribution = getPracticeDistribution(realSessions);
    
    // Get progress over time data for real sessions
    const progressOverTime = getProgressOverTime(realSessions);
    
    // Get top skill
    const topSkill = getTopSkill(realSessions);
    
    // Get speech metrics
    let speechMetrics: SpeechAnalysisMetrics = {
      content_structure: 0,
      delivery: 0,
      body_language: 0,
      engagement: 0,
      vocal_variety: 0,
      language_vocabulary: 0,
      presence_confidence: 0
    };
    
    if (speechData && speechData.length > 0) {
      speechMetrics = speechData[0].metrics;
    }
    
    // Format data for the analytics page
    return {
      totalSessions,
      totalTime,
      averageSessionTime,
      topSkill,
      practiceDistribution,
      weeklyActivity,
      hourlyActivity,
      progressOverTime,
      speechMetrics,
      achievements,
      sessions: realSessions,
      hasRealData: true
    };
  } catch (error) {
    console.error("Error in fetchAnalyticsData:", error);
    
    // Return empty data in case of error
    return getEmptyAnalyticsData();
  }
}

/**
 * Generate mock analytics data for development
 */
export function generateMockAnalyticsData(): AnalyticsData {
  // Helper function to generate random color
  function getRandomColor(opacity: number = 1): string {
    const colors = [
      `rgba(255, 99, 132, ${opacity})`,   // Red
      `rgba(54, 162, 235, ${opacity})`,   // Blue
      `rgba(255, 206, 86, ${opacity})`,   // Yellow
      `rgba(75, 192, 192, ${opacity})`,   // Teal
      `rgba(153, 102, 255, ${opacity})`,  // Purple
      `rgba(255, 159, 64, ${opacity})`,   // Orange
      `rgba(199, 199, 199, ${opacity})`,  // Gray
      `rgba(83, 102, 255, ${opacity})`,   // Indigo
      `rgba(255, 99, 255, ${opacity})`,   // Pink
      `rgba(99, 255, 132, ${opacity})`,   // Green
      `rgba(255, 128, 0, ${opacity})`,    // Bright Orange
      `rgba(0, 204, 204, ${opacity})`,    // Turquoise
      `rgba(204, 0, 204, ${opacity})`,    // Magenta
      `rgba(102, 204, 0, ${opacity})`,    // Lime
      `rgba(204, 102, 0, ${opacity})`,    // Brown
      `rgba(0, 102, 204, ${opacity})`     // Royal Blue
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Helper function to generate a gradient of colors
  function generateColorGradient(count: number, baseColor: string, opacity: number = 0.7): string[] {
    const result: string[] = [];
    const rgb = baseColor.match(/\d+/g)?.map(Number) || [255, 0, 0];
    
    for (let i = 0; i < count; i++) {
      const factor = i / (count - 1);
      const r = Math.round(rgb[0] * (1 - factor * 0.5));
      const g = Math.round(rgb[1] * (1 - factor * 0.5));
      const b = Math.round(rgb[2] * (1 - factor * 0.5));
      result.push(`rgba(${r}, ${g}, ${b}, ${opacity})`);
    }
    
    return result;
  }

  // Helper function to generate a complementary color
  function getComplementaryColor(color: string, opacity: number = 1): string {
    const rgb = color.match(/\d+/g)?.map(Number) || [255, 0, 0];
    const r = 255 - rgb[0];
    const g = 255 - rgb[1];
    const b = 255 - rgb[2];
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Helper function to generate a vibrant color palette
  function generateVibrantPalette(count: number): string[] {
    const hueStep = 360 / count;
    const palette: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const hue = Math.floor(i * hueStep);
      palette.push(`hsl(${hue}, 85%, 60%)`);
    }
    
    return palette;
  }

  // Generate 90 days of mock data
  const today = new Date();
  const mockSessions: PracticeSession[] = [];
  const environments = ['interview', 'presentation', 'classroom', 'conference', 'casual'];
  const totalDays = 90;
  
  // Generate sessions with an upward trend in metrics to simulate improvement
  for (let i = 0; i < totalDays; i++) {
    // Skip some days to make it more realistic
    if (Math.random() > 0.3) {
      const sessionDate = new Date(today);
      sessionDate.setDate(today.getDate() - (totalDays - i));
      
      // Improvement factor increases as we get closer to today
      const improvementFactor = i / totalDays;
      
      // Base metrics start lower and improve over time
      const baseConfidence = 50 + improvementFactor * 40;
      const baseClarity = 60 + improvementFactor * 30;
      const basePace = 55 + improvementFactor * 35;
      
      // Add randomness to make the data more interesting
      const randomFactor = Math.random() * 20 - 10; // -10 to +10
      
      // Create 1-3 sessions per day sometimes
      const sessionsPerDay = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 1;
      
      for (let j = 0; j < sessionsPerDay; j++) {
        // Randomize the environment
        const environment = environments[Math.floor(Math.random() * environments.length)];
        
        // Duration increases over time (5-20 minutes)
        const duration = Math.floor(5 + (improvementFactor * 15) + (Math.random() * 5));
        
        // Create session metrics with some randomness
        const metrics: SessionMetrics = {
          confidence: Math.min(100, Math.max(0, baseConfidence + randomFactor + (Math.random() * 10 - 5))),
          clarity: Math.min(100, Math.max(0, baseClarity + randomFactor + (Math.random() * 10 - 5))),
          pace: Math.min(100, Math.max(0, basePace + randomFactor + (Math.random() * 10 - 5))),
          fillerWords: Math.max(0, 50 - (improvementFactor * 40) + (Math.random() * 10 - 5)),
          structure: Math.min(100, Math.max(0, 60 + (improvementFactor * 30) + (Math.random() * 10 - 5))),
          engagement: Math.min(100, Math.max(0, 55 + (improvementFactor * 35) + (Math.random() * 10 - 5))),
          eyeContact: Math.min(100, Math.max(0, 50 + (improvementFactor * 40) + (Math.random() * 10 - 5))),
          bodyLanguage: Math.min(100, Math.max(0, 45 + (improvementFactor * 45) + (Math.random() * 10 - 5))),
          // Add more detailed metrics
          vocalVariety: Math.min(100, Math.max(0, 40 + (improvementFactor * 50) + (Math.random() * 15 - 7.5))),
          contentQuality: Math.min(100, Math.max(0, 55 + (improvementFactor * 35) + (Math.random() * 12 - 6))),
          audienceEngagement: Math.min(100, Math.max(0, 45 + (improvementFactor * 45) + (Math.random() * 10 - 5))),
          stressManagement: Math.min(100, Math.max(0, 30 + (improvementFactor * 60) + (Math.random() * 15 - 7.5))),
          persuasiveness: Math.min(100, Math.max(0, 50 + (improvementFactor * 40) + (Math.random() * 12 - 6))),
          // Required properties from SessionMetrics interface
          pitchVariation: Math.min(100, Math.max(0, 45 + (improvementFactor * 45) + (Math.random() * 10 - 5))),
          volume: Math.min(100, Math.max(0, 60 + (improvementFactor * 30) + (Math.random() * 10 - 5))),
          articulation: Math.min(100, Math.max(0, 55 + (improvementFactor * 35) + (Math.random() * 10 - 5)))
        };
        
        // Create the session
        mockSessions.push({
          id: `mock-${i}-${j}`,
          user_id: 'mock-user',
          session_date: sessionDate.toISOString(),
          date: sessionDate.toISOString(),
          duration,
          environment,
          metrics,
          feedback: generateMockFeedback(environment, metrics),
          isMock: true
        });
      }
    }
  }
  
  // Calculate total sessions and practice time
  const totalSessions = mockSessions.length;
  const totalMinutes = mockSessions.reduce((total, session) => total + session.duration, 0);
  const totalTime = {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60
  };
  
  // Calculate average session time
  const averageSessionTime = Math.round(totalMinutes / totalSessions);
  
  // Generate hourly activity data
  const hourlyActivity = Array(24).fill(0);
  mockSessions.forEach(session => {
    const hour = new Date(session.date!).getHours();
    hourlyActivity[hour] += 1;
  });
  
  // Generate practice distribution by environment with vibrant colors
  const environmentLabels = ['Interview', 'Presentation', 'Classroom', 'Conference', 'Casual'];
  const vibrantColors = generateVibrantPalette(environmentLabels.length);
  
  const practiceDistribution = {
    labels: environmentLabels,
    datasets: [{
      label: 'Practice Sessions',
      data: [0, 0, 0, 0, 0],
      backgroundColor: vibrantColors.map(color => color.replace('hsl', 'hsla').replace(')', ', 0.8)')),
      borderColor: vibrantColors,
      borderWidth: 1
    }]
  };
  
  mockSessions.forEach(session => {
    const index = environments.indexOf(session.environment);
    if (index !== -1) {
      practiceDistribution.datasets[0].data[index]++;
    }
  });
  
  // Generate progress over time data
  const progressLabels: string[] = [];
  const confidenceData: number[] = [];
  const clarityData: number[] = [];
  const paceData: number[] = [];
  const engagementData: number[] = [];
  const structureData: number[] = [];
  const vocalVarietyData: number[] = [];
  const contentQualityData: number[] = [];
  const audienceEngagementData: number[] = [];
  const stressManagementData: number[] = [];
  const persuasivenessData: number[] = [];
  
  // Group sessions by date
  const sessionsByDate = new Map<string, PracticeSession[]>();
  
  mockSessions.forEach(session => {
    const dateStr = new Date(session.date!).toISOString().split('T')[0];
    if (!sessionsByDate.has(dateStr)) {
      sessionsByDate.set(dateStr, []);
    }
    sessionsByDate.get(dateStr)!.push(session);
  });
  
  // Sort dates and calculate average metrics per day
  const sortedDates = Array.from(sessionsByDate.keys()).sort();
  
  sortedDates.forEach(dateStr => {
    const sessions = sessionsByDate.get(dateStr)!;
    
    // Calculate average metrics for the day
    const avgConfidence = sessions.reduce((sum, s) => sum + s.metrics.confidence, 0) / sessions.length;
    const avgClarity = sessions.reduce((sum, s) => sum + s.metrics.clarity, 0) / sessions.length;
    const avgPace = sessions.reduce((sum, s) => sum + s.metrics.pace, 0) / sessions.length;
    const avgEngagement = sessions.reduce((sum, s) => sum + (s.metrics.engagement || 0), 0) / sessions.length;
    const avgStructure = sessions.reduce((sum, s) => sum + (s.metrics.structure || 0), 0) / sessions.length;
    const avgVocalVariety = sessions.reduce((sum, s) => sum + (s.metrics.vocalVariety || 0), 0) / sessions.length;
    const avgContentQuality = sessions.reduce((sum, s) => sum + (s.metrics.contentQuality || 0), 0) / sessions.length;
    const avgAudienceEngagement = sessions.reduce((sum, s) => sum + (s.metrics.audienceEngagement || 0), 0) / sessions.length;
    const avgStressManagement = sessions.reduce((sum, s) => sum + (s.metrics.stressManagement || 0), 0) / sessions.length;
    const avgPersuasiveness = sessions.reduce((sum, s) => sum + (s.metrics.persuasiveness || 0), 0) / sessions.length;
    
    // Add to arrays
    progressLabels.push(dateStr);
    confidenceData.push(avgConfidence);
    clarityData.push(avgClarity);
    paceData.push(avgPace);
    engagementData.push(avgEngagement);
    structureData.push(avgStructure);
    vocalVarietyData.push(avgVocalVariety);
    contentQualityData.push(avgContentQuality);
    audienceEngagementData.push(avgAudienceEngagement);
    stressManagementData.push(avgStressManagement);
    persuasivenessData.push(avgPersuasiveness);
  });
  
  // Create colorful progress chart with expanded metrics
  const progressColors = generateVibrantPalette(10);
  const progressOverTime = {
    labels: progressLabels,
    datasets: [
      {
        label: 'Confidence',
        data: confidenceData,
        borderColor: progressColors[0],
        backgroundColor: progressColors[0].replace('hsl', 'hsla').replace(')', ', 0.2)'),
        tension: 0.4,
        fill: true
      },
      {
        label: 'Clarity',
        data: clarityData,
        borderColor: progressColors[1],
        backgroundColor: progressColors[1].replace('hsl', 'hsla').replace(')', ', 0.2)'),
        tension: 0.4,
        fill: true
      },
      {
        label: 'Pace',
        data: paceData,
        borderColor: progressColors[2],
        backgroundColor: progressColors[2].replace('hsl', 'hsla').replace(')', ', 0.2)'),
        tension: 0.4,
        fill: true
      },
      {
        label: 'Engagement',
        data: engagementData,
        borderColor: progressColors[3],
        backgroundColor: progressColors[3].replace('hsl', 'hsla').replace(')', ', 0.2)'),
        tension: 0.4,
        fill: true
      },
      {
        label: 'Structure',
        data: structureData,
        borderColor: progressColors[4],
        backgroundColor: progressColors[4].replace('hsl', 'hsla').replace(')', ', 0.2)'),
        tension: 0.4,
        fill: true
      },
      {
        label: 'Vocal Variety',
        data: vocalVarietyData,
        borderColor: progressColors[5],
        backgroundColor: progressColors[5].replace('hsl', 'hsla').replace(')', ', 0.2)'),
        tension: 0.4,
        fill: true
      },
      {
        label: 'Content Quality',
        data: contentQualityData,
        borderColor: progressColors[6],
        backgroundColor: progressColors[6].replace('hsl', 'hsla').replace(')', ', 0.2)'),
        tension: 0.4,
        fill: true
      },
      {
        label: 'Audience Engagement',
        data: audienceEngagementData,
        borderColor: progressColors[7],
        backgroundColor: progressColors[7].replace('hsl', 'hsla').replace(')', ', 0.2)'),
        tension: 0.4,
        fill: true
      },
      {
        label: 'Stress Management',
        data: stressManagementData,
        borderColor: progressColors[8],
        backgroundColor: progressColors[8].replace('hsl', 'hsla').replace(')', ', 0.2)'),
        tension: 0.4,
        fill: true
      },
      {
        label: 'Persuasiveness',
        data: persuasivenessData,
        borderColor: progressColors[9],
        backgroundColor: progressColors[9].replace('hsl', 'hsla').replace(')', ', 0.2)'),
        tension: 0.4,
        fill: true
      }
    ]
  };
  
  // Generate speech analysis metrics with more comprehensive data
  const speechMetrics: SpeechAnalysisMetrics = {
    content_structure: 85,
    delivery: 78,
    body_language: 72,
    engagement: 88,
    vocal_variety: 81,
    language_vocabulary: 90,
    presence_confidence: 83
  };
  
  // Generate more diverse mock achievements
  const achievements: Achievement[] = [
    {
      id: '1',
      name: '5 Minutes Streak',
      description: 'Practiced for 5 minutes straight',
      icon: 'clock',
      points: 20,
      is_collected: true,
      date_achieved: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      isMock: true
    },
    {
      id: '2',
      name: '10 Minutes Streak',
      description: 'Practiced for 10 minutes straight',
      icon: 'clock',
      points: 30,
      is_collected: true,
      date_achieved: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      isMock: true
    },
    {
      id: '3',
      name: 'Confidence Master',
      description: 'Achieved 90% confidence in a session',
      icon: 'chart-bar',
      points: 40,
      is_collected: true,
      date_achieved: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      isMock: true
    },
    {
      id: '4',
      name: 'Pitch Perfect',
      description: 'Maintained excellent vocal variety',
      icon: 'microphone',
      points: 50,
      is_collected: false,
      date_achieved: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isMock: true
    },
    {
      id: '5',
      name: 'Clarity Champion',
      description: 'Achieved 95% clarity in a session',
      icon: 'chat',
      points: 60,
      is_collected: false,
      date_achieved: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isMock: true
    },
    {
      id: '6',
      name: 'Interview Ace',
      description: 'Completed 5 interview practice sessions',
      icon: 'user-tie',
      points: 45,
      is_collected: true,
      date_achieved: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      isMock: true
    },
    {
      id: '7',
      name: 'Presentation Pro',
      description: 'Delivered a perfect presentation',
      icon: 'presentation',
      points: 70,
      is_collected: false,
      date_achieved: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isMock: true
    },
    {
      id: '8',
      name: 'Consistent Performer',
      description: 'Practiced 5 days in a row',
      icon: 'calendar-check',
      points: 55,
      is_collected: true,
      date_achieved: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      isMock: true
    }
  ];
  
  // Determine top skill with more accurate data
  const allMetrics = mockSessions.flatMap(session => {
    return [
      { name: 'Confidence', score: session.metrics.confidence, color: progressColors[0] },
      { name: 'Clarity', score: session.metrics.clarity, color: progressColors[1] },
      { name: 'Pace', score: session.metrics.pace, color: progressColors[2] },
      { name: 'Engagement', score: session.metrics.engagement || 0, color: progressColors[3] },
      { name: 'Structure', score: session.metrics.structure || 0, color: progressColors[4] },
      { name: 'Vocal Variety', score: session.metrics.vocalVariety || 0, color: progressColors[5] },
      { name: 'Content Quality', score: session.metrics.contentQuality || 0, color: progressColors[6] },
      { name: 'Audience Engagement', score: session.metrics.audienceEngagement || 0, color: progressColors[7] },
      { name: 'Stress Management', score: session.metrics.stressManagement || 0, color: progressColors[8] },
      { name: 'Persuasiveness', score: session.metrics.persuasiveness || 0, color: progressColors[9] }
    ];
  });
  
  // Group by name and calculate average
  const metricsByName = new Map<string, { totalScore: number, count: number, color: string }>();
  allMetrics.forEach(metric => {
    if (!metricsByName.has(metric.name)) {
      metricsByName.set(metric.name, { totalScore: 0, count: 0, color: metric.color });
    }
    const current = metricsByName.get(metric.name)!;
    current.totalScore += metric.score;
    current.count += 1;
  });
  
  // Find the top skill
  let topSkillName = '';
  let topSkillScore = 0;
  let topSkillColor = '';
  
  metricsByName.forEach((value, name) => {
    const avgScore = value.totalScore / value.count;
    if (avgScore > topSkillScore) {
      topSkillScore = avgScore;
      topSkillName = name;
      topSkillColor = value.color;
    }
  });
  
  const topSkill = {
    name: topSkillName,
    score: Math.round(topSkillScore),
    color: topSkillColor
  };
  
  // Generate weekly activity data with more realistic patterns
  const weeklyActivity = [
    { day: 'Mon', count: Math.floor(Math.random() * 5) + 2 },
    { day: 'Tue', count: Math.floor(Math.random() * 5) + 3 },
    { day: 'Wed', count: Math.floor(Math.random() * 5) + 1 },
    { day: 'Thu', count: Math.floor(Math.random() * 5) + 2 },
    { day: 'Fri', count: Math.floor(Math.random() * 5) + 1 },
    { day: 'Sat', count: Math.floor(Math.random() * 5) + 4 },
    { day: 'Sun', count: Math.floor(Math.random() * 5) + 3 }
  ];
  
  return {
    totalSessions,
    totalTime,
    averageSessionTime,
    topSkill,
    practiceDistribution,
    weeklyActivity,
    hourlyActivity,
    progressOverTime,
    speechMetrics,
    achievements,
    sessions: mockSessions
  };
}

// Generate mock feedback based on environment and metrics
function generateMockFeedback(environment: string, metrics: SessionMetrics): string {
  const confidenceLevel = metrics.confidence > 80 ? 'excellent' : metrics.confidence > 60 ? 'good' : 'needs improvement';
  const clarityLevel = metrics.clarity > 80 ? 'excellent' : metrics.clarity > 60 ? 'good' : 'needs improvement';
  const paceLevel = metrics.pace > 80 ? 'excellent' : metrics.pace > 60 ? 'good' : 'needs improvement';
  
  let feedback = `# Speech Analysis Feedback\n\n`;
  
  feedback += `## Strengths\n`;
  if (metrics.confidence > 60) feedback += `- Your confidence level was ${confidenceLevel} at ${Math.round(metrics.confidence)}%\n`;
  if (metrics.clarity > 60) feedback += `- Your clarity was ${clarityLevel} at ${Math.round(metrics.clarity)}%\n`;
  if (metrics.pace > 60) feedback += `- Your speaking pace was ${paceLevel} at ${Math.round(metrics.pace)}%\n`;
  if (metrics.engagement && metrics.engagement > 60) feedback += `- Your audience engagement was good at ${Math.round(metrics.engagement)}%\n`;
  
  feedback += `\n## Areas for Improvement\n`;
  if (metrics.confidence <= 60) feedback += `- Work on your confidence level, currently at ${Math.round(metrics.confidence)}%\n`;
  if (metrics.clarity <= 60) feedback += `- Improve your clarity, currently at ${Math.round(metrics.clarity)}%\n`;
  if (metrics.pace <= 60) feedback += `- Adjust your speaking pace, currently at ${Math.round(metrics.pace)}%\n`;
  if (metrics.fillerWords > 30) feedback += `- Reduce filler words in your speech\n`;
  
  feedback += `\n## Environment-Specific Tips (${environment})\n`;
  
  switch (environment) {
    case 'interview':
      feedback += `- Structure your answers using the STAR method\n`;
      feedback += `- Keep your responses concise but thorough\n`;
      feedback += `- Maintain good eye contact with the interviewer\n`;
      break;
    case 'presentation':
      feedback += `- Use visual aids effectively\n`;
      feedback += `- Practice smooth transitions between slides\n`;
      feedback += `- Engage with your audience through questions\n`;
      break;
    case 'classroom':
      feedback += `- Vary your teaching methods to keep students engaged\n`;
      feedback += `- Check for understanding frequently\n`;
      feedback += `- Use examples that relate to students' experiences\n`;
      break;
    case 'conference':
      feedback += `- Tailor your content to the technical level of your audience\n`;
      feedback += `- Define specialized terms before using them\n`;
      feedback += `- Allow time for questions at the end\n`;
      break;
    default:
      feedback += `- Maintain a conversational tone\n`;
      feedback += `- Use appropriate gestures to emphasize points\n`;
      feedback += `- Practice active listening when others speak\n`;
  }
  
  return feedback;
}

// Function to get empty analytics data
function getEmptyAnalyticsData(): AnalyticsData {
  return {
    totalSessions: 0,
    totalTime: {
      hours: 0,
      minutes: 0
    },
    averageSessionTime: 0,
    topSkill: {
      name: 'N/A',
      score: 0,
      color: 'gray'
    },
    practiceDistribution: {
      labels: ['No Data'],
      datasets: [{
        label: 'Practice Sessions',
        data: [0],
        backgroundColor: ['rgba(200, 200, 200, 0.2)'],
        borderColor: ['rgba(200, 200, 200, 1)'],
        borderWidth: 1
      }]
    },
    weeklyActivity: [
      { day: 'Mon', count: 0 },
      { day: 'Tue', count: 0 },
      { day: 'Wed', count: 0 },
      { day: 'Thu', count: 0 },
      { day: 'Fri', count: 0 },
      { day: 'Sat', count: 0 },
      { day: 'Sun', count: 0 }
    ],
    hourlyActivity: Array(24).fill(0),
    progressOverTime: {
      labels: [],
      datasets: []
    },
    speechMetrics: {
      content_structure: 0,
      delivery: 0,
      body_language: 0,
      engagement: 0,
      vocal_variety: 0,
      language_vocabulary: 0,
      presence_confidence: 0
    },
    achievements: [],
    sessions: [],
    hasMockData: false,
    hasRealData: false
  };
}

/**
 * Get progress over time data for the last 4 weeks
 */
export function getProgressOverTime(sessions: PracticeSession[]): {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill: boolean;
  }[];
} {
  // Sort sessions by date
  const sortedSessions = [...sessions].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  // Get unique dates
  const uniqueDates = Array.from(new Set(sortedSessions.map(session => session.date || '')))
    .filter(date => date !== '');
  
  // If we have more than 10 dates, only show every nth date to avoid crowding
  const labels = uniqueDates.length > 10 
    ? uniqueDates.filter((_, index) => index % Math.ceil(uniqueDates.length / 10) === 0)
    : uniqueDates;
  
  // Calculate average metrics for each date
  const confidenceData: number[] = [];
  const clarityData: number[] = [];
  const paceData: number[] = [];
  
  labels.forEach(date => {
    const sessionsOnDate = sortedSessions.filter(session => session.date === date);
    
    if (sessionsOnDate.length > 0) {
      const avgConfidence = sessionsOnDate.reduce((sum, session) => sum + (session.metrics?.confidence || 0), 0) / sessionsOnDate.length;
      const avgClarity = sessionsOnDate.reduce((sum, session) => sum + (session.metrics?.clarity || 0), 0) / sessionsOnDate.length;
      const avgPace = sessionsOnDate.reduce((sum, session) => sum + (session.metrics?.pace || 0), 0) / sessionsOnDate.length;
      
      confidenceData.push(Math.round(avgConfidence));
      clarityData.push(Math.round(avgClarity));
      paceData.push(Math.round(avgPace));
    } else {
      confidenceData.push(0);
      clarityData.push(0);
      paceData.push(0);
    }
  });
  
  // Format dates for display
  const formattedLabels = labels.map(date => formatDate(date));
  
  // Default colors
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B'  // Amber
  ];
  
  return {
    labels: formattedLabels,
    datasets: [
      {
        label: 'Confidence',
        data: confidenceData,
        borderColor: colors[0],
        backgroundColor: colors[0] + '20', // Add transparency
        tension: 0.4,
        fill: true
      },
      {
        label: 'Clarity',
        data: clarityData,
        borderColor: colors[1],
        backgroundColor: colors[1] + '20', // Add transparency
        tension: 0.4,
        fill: true
      },
      {
        label: 'Pace',
        data: paceData,
        borderColor: colors[2],
        backgroundColor: colors[2] + '20', // Add transparency
        tension: 0.4,
        fill: true
      }
    ]
  };
}

/**
 * Get the user's top skill based on practice sessions
 */
function getTopSkill(sessions: PracticeSession[]): { name: string; score: number; color: string } {
  if (sessions.length === 0) {
    return { name: 'N/A', score: 0, color: 'gray' };
  }
  
  // Aggregate all metrics
  const aggregatedMetrics: Record<string, number> = {};
  let totalSessions = 0;
  
  sessions.forEach(session => {
    if (session.metrics) {
      Object.entries(session.metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          aggregatedMetrics[key] = (aggregatedMetrics[key] || 0) + value;
        }
      });
      totalSessions++;
    }
  });
  
  // Calculate averages
  const averageMetrics: Record<string, number> = {};
  Object.entries(aggregatedMetrics).forEach(([key, value]) => {
    averageMetrics[key] = Math.round(value / totalSessions);
  });
  
  // Find the highest metric
  let topMetricName = 'confidence';
  let topMetricValue = 0;
  
  Object.entries(averageMetrics).forEach(([key, value]) => {
    if (value > topMetricValue) {
      topMetricName = key;
      topMetricValue = value;
    }
  });
  
  // Format the metric name for display
  const formattedName = topMetricName.charAt(0).toUpperCase() + 
    topMetricName.slice(1).replace(/([A-Z])/g, ' $1');
  
  // Determine color based on top skill
  let color = 'gray';
  switch (topMetricName) {
    case 'confidence':
      color = 'red';
      break;
    case 'clarity':
      color = 'green';
      break;
    case 'pace':
      color = 'blue';
      break;
    default:
      color = 'gray';
  }
  
  return {
    name: formattedName,
    score: topMetricValue,
    color
  };
}

/**
 * Get practice distribution by environment
 */
function getPracticeDistribution(sessions: PracticeSession[]): { labels: string[]; datasets: { label: string; data: number[]; backgroundColor: string[]; borderColor: string[]; borderWidth: number }[] } {
  if (sessions.length === 0) {
    return { labels: [], datasets: [] };
  }
  
  // Count sessions by environment
  const environmentCounts: Record<string, number> = {};
  
  sessions.forEach(session => {
    const env = session.environment || 'default';
    environmentCounts[env] = (environmentCounts[env] || 0) + 1;
  });
  
  // Convert to array format with proper labels and data
  const environments = Object.keys(environmentCounts);
  const counts = Object.values(environmentCounts);
  
  // Generate colors for each environment
  const colors = environments.map(() => getRandomColor(0.8));
  
  return {
    labels: environments.map(env => env.charAt(0).toUpperCase() + env.slice(1)),
    datasets: [{
      label: 'Practice Sessions',
      data: counts,
      backgroundColor: colors,
      borderColor: colors.map(color => color.replace('0.8', '1')),
      borderWidth: 1
    }]
  };
}

/**
 * Get weekly activity data
 */
function getWeeklyActivity(sessions: PracticeSession[]): { day: string; count: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayCounts = Array(7).fill(0);
  
  // Count sessions by day of week
  sessions.forEach(session => {
    if (session.date) {
      const date = new Date(session.date);
      const dayIndex = date.getDay(); // 0 = Sunday, 6 = Saturday
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert to 0 = Monday, 6 = Sunday
      dayCounts[adjustedIndex] += session.duration || 0;
    }
  });
  
  return days.map((day, index) => ({ day, count: dayCounts[index] }));
}

/**
 * Get hourly activity data
 */
function getHourlyActivity(sessions: PracticeSession[]): number[] {
  const hourCounts = Array(24).fill(0);
  
  // Count practice minutes by hour of day
  sessions.forEach(session => {
    if (session.date) {
      const date = new Date(session.date);
      const hour = date.getHours();
      hourCounts[hour] += session.duration || 0;
    }
  });
  
  return hourCounts;
}

/**
 * Format minutes into a readable time string
 */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  
  return `${mins}m`;
}

/**
 * Format date to a readable string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Adjust color brightness
 * @param color Hex color
 * @param amount Amount to adjust (-100 to 100)
 */
function adjustColor(color: string, amount: number): string {
  // Remove # if present
  let hex = color.replace('#', '');
  
  // Convert to RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
