import { AnalyticsData, PracticeSession, Achievement } from './analyticsUtils';
import { SessionMetrics, SpeechAnalysisMetrics } from './practiceUtils';
import { getRandomColor } from './utils';

/**
 * Generate demo data for analytics visualizations
 */
export function generateDemoAnalyticsData(): AnalyticsData {
  // Generate random number of sessions between 15-30
  const sessionCount = Math.floor(Math.random() * 15) + 15;
  
  // Generate random practice sessions
  const demoSessions: PracticeSession[] = Array.from({ length: sessionCount }).map((_, index) => {
    // Generate a date within the last 30 days
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    // Random duration between 5-60 minutes
    const duration = Math.floor(Math.random() * 55) + 5;
    
    // Random environment
    const environments = ['classroom', 'conference', 'interview', 'presentation'];
    const environment = environments[Math.floor(Math.random() * environments.length)];
    
    // Generate random metrics
    const metrics: SessionMetrics = {
      confidence: Math.random() * 100,
      clarity: Math.random() * 100,
      pace: Math.random() * 100,
      pitchVariation: Math.random() * 100,
      volume: Math.random() * 100,
      fillerWords: Math.floor(Math.random() * 20),
      articulation: Math.random() * 100,
      engagement: Math.random() * 100,
      eyeContact: Math.random() * 100,
      bodyLanguage: Math.random() * 100,
      structure: Math.random() * 100,
      vocalVariety: Math.random() * 100,
      contentQuality: Math.random() * 100,
      audienceEngagement: Math.random() * 100,
      stressManagement: Math.random() * 100,
      persuasiveness: Math.random() * 100
    };
    
    // Generate random feedback
    const feedbackOptions = [
      "Great job! Your pace was consistent and your clarity was excellent.",
      "You used too many filler words. Try to be more conscious of them.",
      "Your confidence improved throughout the session. Keep practicing!",
      "Good engagement, but work on maintaining eye contact.",
      "Excellent presentation skills! Just watch your pace in the middle section."
    ];
    
    const feedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
    
    return {
      id: `demo-${index}`,
      user_id: 'demo-user',
      duration,
      environment,
      metrics,
      feedback,
      date: date.toISOString(),
      session_date: date.toISOString(),
      isMock: true
    };
  });
  
  // Calculate total time
  const totalMinutes = demoSessions.reduce((total, session) => total + (session.duration || 0), 0);
  const totalTime = {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60
  };
  
  // Calculate average session time
  const averageSessionTime = Math.round(totalMinutes / sessionCount);
  
  // Generate weekly activity data
  const weeklyActivity = generateWeeklyActivityData(demoSessions);
  
  // Generate hourly activity data
  const hourlyActivity = generateHourlyActivityData();
  
  // Generate practice distribution data
  const practiceDistribution = generatePracticeDistributionData(demoSessions);
  
  // Generate progress over time data
  const progressOverTime = generateProgressOverTimeData();
  
  // Generate top skill data
  const topSkill = {
    name: ['Confidence', 'Clarity', 'Pace', 'Engagement'][Math.floor(Math.random() * 4)],
    score: Math.floor(Math.random() * 30) + 70,
    color: getRandomColor(0.8)
  };
  
  // Generate speech metrics
  const speechMetrics: SpeechAnalysisMetrics = {
    content_structure: Math.random() * 100,
    delivery: Math.random() * 100,
    body_language: Math.random() * 100,
    engagement: Math.random() * 100,
    vocal_variety: Math.random() * 100,
    language_vocabulary: Math.random() * 100,
    presence_confidence: Math.random() * 100
  };
  
  // Generate achievements
  const achievements: Achievement[] = [
    {
      id: 'demo-achievement-1',
      name: '10 Minutes Streak',
      description: 'Practiced for at least 10 minutes',
      icon: 'streak',
      points: 30,
      is_collected: Math.random() > 0.5,
      date_achieved: new Date(Date.now() - Math.random() * 86400000 * 10).toISOString(),
      isMock: true
    },
    {
      id: 'demo-achievement-2',
      name: 'Pace Setter',
      description: 'Maintained a good speaking pace',
      icon: 'pace',
      points: 50,
      is_collected: Math.random() > 0.5,
      date_achieved: new Date(Date.now() - Math.random() * 86400000 * 5).toISOString(),
      isMock: true
    },
    {
      id: 'demo-achievement-3',
      name: 'Clarity Champion',
      description: 'Achieved excellent speech clarity',
      icon: 'clarity',
      points: 75,
      is_collected: Math.random() > 0.7,
      date_achieved: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
      isMock: true
    }
  ];
  
  return {
    totalSessions: sessionCount,
    totalTime,
    averageSessionTime,
    topSkill,
    practiceDistribution,
    weeklyActivity,
    hourlyActivity,
    progressOverTime,
    speechMetrics,
    achievements,
    sessions: demoSessions,
    hasRealData: false,
    hasMockData: true
  };
}

/**
 * Generate demo weekly activity data
 */
function generateWeeklyActivityData(sessions: PracticeSession[]): { day: string; count: number }[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData = days.map(day => ({ day, count: 0 }));
  
  // If we have sessions, use them to generate realistic data
  if (sessions && sessions.length > 0) {
    sessions.forEach(session => {
      if (session.date) {
        const date = new Date(session.date);
        const dayOfWeek = date.getDay();
        weeklyData[dayOfWeek].count += session.duration || 0;
      }
    });
    return weeklyData;
  }
  
  // Otherwise generate random data
  return days.map(day => ({
    day,
    count: Math.floor(Math.random() * 60)
  }));
}

/**
 * Generate demo hourly activity data
 */
function generateHourlyActivityData(): number[] {
  const hourlyData = Array(24).fill(0);
  
  // Create a realistic pattern with peak hours
  const peakHours = [9, 10, 11, 14, 15, 16, 17];
  const mediumHours = [8, 12, 13, 18, 19];
  
  for (let i = 0; i < 24; i++) {
    if (peakHours.includes(i)) {
      hourlyData[i] = Math.floor(Math.random() * 10) + 5;
    } else if (mediumHours.includes(i)) {
      hourlyData[i] = Math.floor(Math.random() * 5) + 2;
    } else {
      hourlyData[i] = Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0;
    }
  }
  
  return hourlyData;
}

/**
 * Generate demo practice distribution data
 */
function generatePracticeDistributionData(sessions: PracticeSession[]): {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
} {
  // Count sessions by environment
  const environmentCounts: Record<string, number> = {};
  
  if (sessions && sessions.length > 0) {
    sessions.forEach(session => {
      const env = session.environment || 'default';
      environmentCounts[env] = (environmentCounts[env] || 0) + 1;
    });
  } else {
    // Generate random distribution
    const environments = ['classroom', 'conference', 'interview', 'presentation'];
    environments.forEach(env => {
      environmentCounts[env] = Math.floor(Math.random() * 10) + 1;
    });
  }
  
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
 * Generate demo progress over time data
 */
function generateProgressOverTimeData(): {
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
  // Generate dates for the last 30 days
  const dates = Array.from({ length: 30 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  
  // Generate metrics data with realistic trends
  const confidenceData = generateTrendingData(30, 50, 90, 0.7);
  const clarityData = generateTrendingData(30, 40, 85, 0.6);
  const paceData = generateTrendingData(30, 60, 95, 0.8);
  
  return {
    labels: dates,
    datasets: [
      {
        label: 'Confidence',
        data: confidenceData,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Clarity',
        data: clarityData,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Pace',
        data: paceData,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  };
}

/**
 * Generate trending data with a general upward trend but with realistic fluctuations
 */
function generateTrendingData(length: number, min: number, max: number, trendStrength: number): number[] {
  const data: number[] = [];
  let value = min + Math.random() * (max - min) / 3;
  
  for (let i = 0; i < length; i++) {
    // Add some randomness
    const randomFactor = Math.random() * 10 - 5;
    
    // Add trend factor (tends to increase over time)
    const trendFactor = ((i / length) * (max - min) * trendStrength);
    
    // Calculate new value with constraints
    value = Math.min(max, Math.max(min, value + randomFactor + trendFactor / length));
    
    data.push(Math.round(value));
    
    // Small adjustment for next iteration to create smoother transitions
    value = value * 0.95 + (value + randomFactor) * 0.05;
  }
  
  return data;
}

/**
 * Generate demo exercise data for the exercise page
 */
export function generateDemoExerciseData() {
  // Generate random metrics for the exercise page
  const metrics: SessionMetrics = {
    confidence: Math.floor(Math.random() * 30) + 70,
    clarity: Math.floor(Math.random() * 40) + 60,
    pace: Math.floor(Math.random() * 35) + 65,
    pitchVariation: Math.floor(Math.random() * 30) + 70,
    volume: Math.floor(Math.random() * 25) + 75,
    fillerWords: Math.floor(Math.random() * 20) + 5,
    articulation: Math.floor(Math.random() * 35) + 65,
    engagement: Math.floor(Math.random() * 30) + 70,
    eyeContact: Math.floor(Math.random() * 40) + 60,
    bodyLanguage: Math.floor(Math.random() * 35) + 65,
    structure: Math.floor(Math.random() * 40) + 60,
    vocalVariety: Math.floor(Math.random() * 30) + 70,
    contentQuality: Math.floor(Math.random() * 35) + 65,
    audienceEngagement: Math.floor(Math.random() * 40) + 60,
    stressManagement: Math.floor(Math.random() * 30) + 70,
    persuasiveness: Math.floor(Math.random() * 35) + 65
  };
  
  // Generate random waveform data
  const waveformData = Array.from({ length: 100 }).map(() => Math.random());
  
  return {
    metrics,
    waveform: waveformData,
    isDemo: true
  };
}
