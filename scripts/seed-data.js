// This script seeds the Supabase database with initial test data
// Run with: node seed-data.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data for seeding
const seedData = async (userId) => {
  if (!userId) {
    console.error('No user ID provided. Please sign in first and provide your user ID.');
    process.exit(1);
  }

  console.log(`Seeding data for user ID: ${userId}`);

  try {
    // Clear existing data for this user
    await clearUserData(userId);

    // Create practice sessions
    const sessionIds = await createPracticeSessions(userId);
    
    // Create speech analysis records
    await createSpeechAnalysis(userId, sessionIds);
    
    // Create achievements
    await createAchievements(userId);

    console.log('Data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

// Clear existing user data
const clearUserData = async (userId) => {
  console.log('Clearing existing user data...');
  
  // Delete speech analysis records
  const { error: speechError } = await supabase
    .from('speech_analysis')
    .delete()
    .eq('user_id', userId);
  
  if (speechError) console.error('Error clearing speech analysis:', speechError);
  
  // Delete achievements
  const { error: achievementsError } = await supabase
    .from('achievements')
    .delete()
    .eq('user_id', userId);
  
  if (achievementsError) console.error('Error clearing achievements:', achievementsError);
  
  // Delete practice sessions
  const { error: sessionsError } = await supabase
    .from('practice_sessions')
    .delete()
    .eq('user_id', userId);
  
  if (sessionsError) console.error('Error clearing practice sessions:', sessionsError);
  
  console.log('Existing data cleared.');
};

// Create practice sessions
const createPracticeSessions = async (userId) => {
  console.log('Creating practice sessions...');
  
  const environments = ['classroom', 'interview', 'conference', 'presentation'];
  const sessionIds = [];
  
  // Create sessions for the past 14 days
  for (let i = 0; i < 14; i++) {
    // Skip some days to make the data more realistic
    if (Math.random() > 0.7) continue;
    
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Create 1-3 sessions per day
    const sessionsPerDay = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < sessionsPerDay; j++) {
      const environment = environments[Math.floor(Math.random() * environments.length)];
      const duration = Math.floor(Math.random() * 20) + 5; // 5-25 minutes
      
      // Generate random metrics
      const metrics = {
        confidence: Math.floor(Math.random() * 30) + 60, // 60-90
        clarity: Math.floor(Math.random() * 30) + 60, // 60-90
        pace: Math.floor(Math.random() * 30) + 60, // 60-90
        pitchVariation: Math.floor(Math.random() * 30) + 60, // 60-90
        volume: Math.floor(Math.random() * 30) + 60, // 60-90
        fillerWords: Math.floor(Math.random() * 30) + 60, // 60-90
        articulation: Math.floor(Math.random() * 30) + 60, // 60-90
        engagement: Math.floor(Math.random() * 30) + 60 // 60-90
      };
      
      // Generate sample feedback
      const feedback = generateFeedback(environment, metrics);
      
      // Insert the session
      const { data, error } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: userId,
          session_date: date.toISOString(),
          duration: duration,
          environment: environment,
          metrics: metrics,
          feedback: feedback
        })
        .select();
      
      if (error) {
        console.error('Error creating practice session:', error);
      } else if (data && data.length > 0) {
        sessionIds.push(data[0].id);
        console.log(`Created practice session: ${data[0].id}`);
      }
    }
  }
  
  console.log(`Created ${sessionIds.length} practice sessions.`);
  return sessionIds;
};

// Create speech analysis records
const createSpeechAnalysis = async (userId, sessionIds) => {
  console.log('Creating speech analysis records...');
  
  // Create a speech analysis record for each session
  for (const sessionId of sessionIds) {
    // Generate random metrics
    const metrics = {
      content_structure: Math.floor(Math.random() * 30) + 60, // 60-90
      delivery: Math.floor(Math.random() * 30) + 60, // 60-90
      body_language: Math.floor(Math.random() * 30) + 60, // 60-90
      engagement: Math.floor(Math.random() * 30) + 60, // 60-90
      vocal_variety: Math.floor(Math.random() * 30) + 60, // 60-90
      language_vocabulary: Math.floor(Math.random() * 30) + 60, // 60-90
      presence_confidence: Math.floor(Math.random() * 30) + 60 // 60-90
    };
    
    // Insert the speech analysis
    const { error } = await supabase
      .from('speech_analysis')
      .insert({
        user_id: userId,
        practice_session_id: sessionId,
        metrics: metrics
      });
    
    if (error) {
      console.error('Error creating speech analysis:', error);
    }
  }
  
  console.log(`Created ${sessionIds.length} speech analysis records.`);
};

// Create achievements
const createAchievements = async (userId) => {
  console.log('Creating achievements...');
  
  const achievements = [
    {
      name: 'First Practice',
      description: 'Completed your first practice session',
      icon: 'HiSparkles',
      points: 10,
      is_collected: true
    },
    {
      name: 'Consistency Champion',
      description: 'Completed 7 days practice streak',
      icon: 'HiClock',
      points: 25,
      is_collected: false
    },
    {
      name: 'Interview Master',
      description: 'Completed 10 interview practices',
      icon: 'HiChartBar',
      points: 30,
      is_collected: false
    },
    {
      name: 'Voice Control',
      description: 'Maintained optimal pace for 15 minutes',
      icon: 'HiMicrophone',
      points: 20,
      is_collected: false
    }
  ];
  
  // Insert the achievements
  for (const achievement of achievements) {
    const { error } = await supabase
      .from('achievements')
      .insert({
        user_id: userId,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        points: achievement.points,
        is_collected: achievement.is_collected,
        date_achieved: new Date().toISOString()
      });
    
    if (error) {
      console.error(`Error creating achievement ${achievement.name}:`, error);
    }
  }
  
  console.log(`Created ${achievements.length} achievements.`);
};

// Generate feedback based on environment and metrics
const generateFeedback = (environment, metrics) => {
  const strengths = [];
  const improvements = [];
  
  // Add environment-specific feedback
  switch (environment) {
    case 'classroom':
      strengths.push('You explained concepts clearly');
      strengths.push('Your examples were relevant and helpful');
      improvements.push('Try to engage more with all students');
      improvements.push('Consider using more visual aids');
      break;
    case 'interview':
      strengths.push('You articulated your experience well');
      strengths.push('Your answers were concise and relevant');
      improvements.push('Work on maintaining consistent eye contact');
      improvements.push('Prepare more specific examples for common questions');
      break;
    case 'conference':
      strengths.push('Your presentation was well-structured');
      strengths.push('You handled questions confidently');
      improvements.push('Consider slowing down during technical explanations');
      improvements.push('Use more data visualizations to support your points');
      break;
    case 'presentation':
      strengths.push('Your opening captured attention effectively');
      strengths.push('Your slides were well-designed and not overcrowded');
      improvements.push('Practice smoother transitions between topics');
      improvements.push('Work on your closing to leave a stronger impression');
      break;
  }
  
  // Add metrics-based feedback
  if (metrics.confidence > 80) {
    strengths.push('Your confidence level was excellent');
  } else if (metrics.confidence < 70) {
    improvements.push('Work on building more confidence in your delivery');
  }
  
  if (metrics.clarity > 80) {
    strengths.push('Your speech was very clear and easy to understand');
  } else if (metrics.clarity < 70) {
    improvements.push('Focus on improving clarity by enunciating more carefully');
  }
  
  if (metrics.pace > 80) {
    strengths.push('Your speaking pace was well-balanced');
  } else if (metrics.pace < 70) {
    improvements.push('Adjust your speaking pace - you may be speaking too quickly or too slowly');
  }
  
  // Format the feedback
  let feedback = `# Feedback for your ${environment} practice\n\n`;
  
  feedback += '## Strengths\n';
  strengths.forEach(strength => {
    feedback += `- ${strength}\n`;
  });
  
  feedback += '\n## Areas for Improvement\n';
  improvements.forEach(improvement => {
    feedback += `- ${improvement}\n`;
  });
  
  feedback += '\n## Overall Assessment\n';
  const overallScore = Object.values(metrics).reduce((sum, value) => sum + value, 0) / Object.values(metrics).length;
  
  if (overallScore > 80) {
    feedback += 'Excellent work! You\'re performing at a high level. Keep practicing to maintain your skills.';
  } else if (overallScore > 70) {
    feedback += 'Good job! You\'re showing solid skills. Focus on the improvement areas to reach the next level.';
  } else {
    feedback += 'You\'re making progress. Consistent practice focusing on the improvement areas will help you advance quickly.';
  }
  
  return feedback;
};

// Main function
const main = async () => {
  // Get user ID from command line argument
  const userId = process.argv[2];
  
  if (!userId) {
    console.error('Please provide your user ID as a command line argument:');
    console.error('node seed-data.js YOUR_USER_ID');
    process.exit(1);
  }
  
  await seedData(userId);
};

// Run the script
main().catch(console.error);
