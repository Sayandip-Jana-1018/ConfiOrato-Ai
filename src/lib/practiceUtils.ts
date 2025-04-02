import { supabase } from './supabase';

export interface SessionMetrics {
  confidence: number;
  clarity: number;
  pace: number;
  pitchVariation: number;
  volume: number;
  fillerWords: number;
  articulation: number;
  engagement: number;
  eyeContact?: number;
  bodyLanguage?: number;
  structure?: number;
  vocalVariety?: number;
  contentQuality?: number;
  audienceEngagement?: number;
  stressManagement?: number;
  persuasiveness?: number;
}

export interface SpeechAnalysisMetrics {
  content_structure: number;
  delivery: number;
  body_language: number;
  engagement: number;
  vocal_variety: number;
  language_vocabulary: number;
  presence_confidence: number;
}

export interface PracticeSession {
  id?: string;
  user_id?: string;
  session_date?: string;
  duration: number;
  environment: string;
  metrics: SessionMetrics;
  feedback: string;
  date?: string;
}

/**
 * Save a practice session to Supabase
 */
export async function savePracticeSession(
  session: PracticeSession,
  speechMetrics: SpeechAnalysisMetrics
): Promise<string | null> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting user:", userError);
      return null;
    }
    
    if (!user) {
      console.error("No authenticated user found");
      return null;
    }
    
    console.log("Current user:", user.id);
    console.log("Saving practice session:", session);
    
    // First, insert the practice session
    const { data: practiceData, error: practiceError } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: user.id,
        session_date: session.date || new Date().toISOString(),
        duration: session.duration,
        environment: session.environment,
        metrics: session.metrics,
        feedback: session.feedback
      })
      .select('id')
      .single();
    
    if (practiceError) {
      console.error("Error saving practice session:", practiceError);
      
      // Check if it's a foreign key constraint error (user doesn't exist)
      if (practiceError.code === '23503') {
        console.error("User doesn't exist in the database. Make sure the user is properly authenticated.");
      }
      
      // Check if it's a schema validation error
      if (practiceError.code === '23502') {
        console.error("Missing required fields:", practiceError.details);
      }
      
      return null;
    }
    
    if (!practiceData) {
      console.error("No data returned from practice session insert");
      return null;
    }
    
    console.log("Practice session saved with ID:", practiceData.id);
    
    // Then, insert the speech analysis metrics
    const { error: speechError } = await supabase
      .from('speech_analysis')
      .insert({
        user_id: user.id,
        practice_session_id: practiceData.id,
        metrics: speechMetrics,
        created_at: new Date().toISOString()
      });
    
    if (speechError) {
      console.error("Error saving speech analysis:", speechError);
      // Continue anyway since we at least saved the practice session
    } else {
      console.log("Speech analysis metrics saved successfully");
    }
    
    // Generate achievements based on the session
    await generateAchievements(user.id, session);
    
    return practiceData.id;
  } catch (error) {
    console.error("Error in savePracticeSession:", error);
    return null;
  }
}

/**
 * Generate achievements based on practice session
 */
async function generateAchievements(userId: string, session: PracticeSession) {
  try {
    // Basic achievements - 50 points
    if (session.duration >= 300) { // 5 minutes
      await createAchievement(userId, {
        name: '5-Minute Milestone',
        description: 'Completed a 5-minute practice session',
        icon: 'HiClock',
        points: 50
      });
    }
    
    // Job-related achievements - 100 points
    if (session.duration >= 600) { // 10 minutes
      await createAchievement(userId, {
        name: '10-Minute Master',
        description: 'Completed a 10-minute practice session',
        icon: 'HiClock',
        points: 100
      });
    }
    
    // Higher milestone achievements - 200 points
    if (session.duration >= 1200) { // 20 minutes
      await createAchievement(userId, {
        name: 'Presentation Pro',
        description: 'Completed a 20-minute practice session',
        icon: 'HiClock',
        points: 200
      });
    }
    
    // Basic skill achievements - 50 points
    if (session.metrics.confidence >= 70) {
      await createAchievement(userId, {
        name: 'Confidence Builder',
        description: 'Achieved good confidence in your delivery',
        icon: 'HiSparkles',
        points: 50
      });
    }
    
    if (session.metrics.clarity >= 70) {
      await createAchievement(userId, {
        name: 'Clarity Communicator',
        description: 'Achieved good clarity in your speech',
        icon: 'HiChat',
        points: 50
      });
    }
    
    if (session.metrics.pace >= 70) {
      await createAchievement(userId, {
        name: 'Pace Setter',
        description: 'Maintained a good speaking pace',
        icon: 'HiChartBar',
        points: 50
      });
    }
    
    // Job-related skill achievements - 100 points
    if (session.metrics.confidence >= 80) {
      await createAchievement(userId, {
        name: 'Confidence Champion',
        description: 'Achieved high confidence in your delivery',
        icon: 'HiSparkles',
        points: 100
      });
    }
    
    if (session.metrics.clarity >= 80) {
      await createAchievement(userId, {
        name: 'Clarity Master',
        description: 'Achieved excellent clarity in your speech',
        icon: 'HiChat',
        points: 100
      });
    }
    
    if (session.metrics.pace >= 80) {
      await createAchievement(userId, {
        name: 'Perfect Pace',
        description: 'Maintained an ideal speaking pace',
        icon: 'HiChartBar',
        points: 100
      });
    }
    
    // Higher milestone skill achievements - 200 points
    if (session.metrics.confidence >= 90 && session.metrics.clarity >= 90 && session.metrics.pace >= 90) {
      await createAchievement(userId, {
        name: 'Speech Virtuoso',
        description: 'Mastered all aspects of speech delivery',
        icon: 'HiAcademicCap',
        points: 200
      });
    }
    
    // Environment-specific achievements - 100 points
    if (session.environment === 'interview' && session.metrics.confidence >= 75) {
      await createAchievement(userId, {
        name: 'Interview Ready',
        description: 'Demonstrated interview-ready confidence',
        icon: 'HiBriefcase',
        points: 100
      });
    }
    
    if (session.environment === 'presentation' && session.metrics.clarity >= 75) {
      await createAchievement(userId, {
        name: 'Executive Presence',
        description: 'Demonstrated clarity suitable for executive presentations',
        icon: 'HiPresentationChartLine',
        points: 100
      });
    }
  } catch (error) {
    console.error("Error generating achievements:", error);
  }
}

/**
 * Create a new achievement if it doesn't already exist
 */
export async function createAchievement(userId: string, achievement: {
  name: string;
  description: string;
  icon: string;
  points: number;
}) {
  try {
    // Check if the achievement already exists
    const { data: existingAchievement } = await supabase
      .from('achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('name', achievement.name)
      .single();
    
    // If it doesn't exist, create it
    if (!existingAchievement) {
      await supabase
        .from('achievements')
        .insert({
          user_id: userId,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          date_achieved: new Date().toISOString(),
          points: achievement.points,
          is_collected: false
        });
    }
  } catch (error) {
    console.error("Error creating achievement:", error);
  }
}

/**
 * Get all practice sessions for the current user
 */
export async function getUserPracticeSessions(): Promise<PracticeSession[]> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return [];
    }
    
    // Fetch practice sessions
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('session_date', { ascending: false });
      
    if (error) {
      console.error("Error fetching practice sessions:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getUserPracticeSessions:", error);
    return [];
  }
}

/**
 * Get user achievements
 */
export async function getUserAchievements() {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return [];
    }
    
    // Fetch achievements
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('date_achieved', { ascending: false });
      
    if (error) {
      console.error("Error fetching achievements:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getUserAchievements:", error);
    return [];
  }
}

/**
 * Collect achievement reward
 */
export async function collectAchievementReward(achievementId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('collect_achievement_reward', {
      p_achievement_id: achievementId
    });
    
    if (error) {
      console.error("Error collecting achievement reward:", error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error("Error in collectAchievementReward:", error);
    return false;
  }
}

/**
 * Generate speech analysis metrics from voice metrics and feedback
 */
export function generateSpeechAnalysisMetrics(
  voiceMetrics: SessionMetrics,
  feedback: string
): SpeechAnalysisMetrics {
  // Extract metrics from feedback using some basic heuristics
  // In a real app, this would be more sophisticated, possibly using NLP
  
  // Default values
  const metrics: SpeechAnalysisMetrics = {
    content_structure: Math.min(voiceMetrics.clarity * 1.1, 100),
    delivery: Math.min((voiceMetrics.pace + voiceMetrics.articulation) / 2, 100),
    body_language: Math.min(voiceMetrics.confidence * 0.9, 100),
    engagement: Math.min(voiceMetrics.engagement * 1.1, 100),
    vocal_variety: Math.min(voiceMetrics.pitchVariation * 1.2, 100),
    language_vocabulary: Math.min((voiceMetrics.clarity + voiceMetrics.articulation) / 2, 100),
    presence_confidence: Math.min(voiceMetrics.confidence * 1.1, 100)
  };
  
  // Adjust metrics based on feedback content
  if (feedback.toLowerCase().includes('structure')) {
    metrics.content_structure = adjustMetric(metrics.content_structure, feedback.includes('improve') ? -5 : 5);
  }
  
  if (feedback.toLowerCase().includes('delivery') || feedback.toLowerCase().includes('pace')) {
    metrics.delivery = adjustMetric(metrics.delivery, feedback.includes('improve') ? -5 : 5);
  }
  
  if (feedback.toLowerCase().includes('body language') || feedback.toLowerCase().includes('gesture')) {
    metrics.body_language = adjustMetric(metrics.body_language, feedback.includes('improve') ? -5 : 5);
  }
  
  if (feedback.toLowerCase().includes('engage')) {
    metrics.engagement = adjustMetric(metrics.engagement, feedback.includes('improve') ? -5 : 5);
  }
  
  if (feedback.toLowerCase().includes('vocal') || feedback.toLowerCase().includes('voice')) {
    metrics.vocal_variety = adjustMetric(metrics.vocal_variety, feedback.includes('improve') ? -5 : 5);
  }
  
  if (feedback.toLowerCase().includes('vocabulary') || feedback.toLowerCase().includes('language')) {
    metrics.language_vocabulary = adjustMetric(metrics.language_vocabulary, feedback.includes('improve') ? -5 : 5);
  }
  
  if (feedback.toLowerCase().includes('confidence') || feedback.toLowerCase().includes('presence')) {
    metrics.presence_confidence = adjustMetric(metrics.presence_confidence, feedback.includes('improve') ? -5 : 5);
  }
  
  return metrics;
}

// Helper function to adjust metrics within bounds
function adjustMetric(value: number, adjustment: number): number {
  return Math.max(0, Math.min(100, value + adjustment));
}
