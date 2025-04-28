/**
 * Body Language Analysis Types and Utilities
 * Enhanced with better gesture recognition and classification
 */

export interface BodyLanguageMetrics {
  sessionId: string;
  sessionDuration: number;
  framesProcessed: number;
  gesturePercentages: Record<string, number>;
  gestureHistory?: GestureHistoryItem[];
  feedback: string;
  overallScore: number;
  allowedGesturePercentage?: number;
  disallowedGesturePercentage?: number;
}

export interface GestureDetection {
  class: string;
  confidence: number;
  timestamp?: number;
}

export interface BodyLanguageAnalysisResult {
  processedImage: string;
  prediction: GestureDetection | null;
  error?: string;
}

export interface GestureHistoryItem {
  gesture: string;
  confidence: number;
  timestamp: number;
  isAllowed: boolean;
}

export interface SessionResult {
  sessionId: string;
  duration: number;
  framesProcessed: number;
  gesturePercentages: Record<string, number>;
  allowedGestures?: Record<string, number>;
  disallowedGestures?: Record<string, number>;
  feedback: string;
  overallScore: number;
}

/**
 * Format body language feedback for display with improved styling
 */
export function formatBodyLanguageFeedback(feedback: string): string {
  // Replace checkmarks and x marks with styled versions
  const formattedFeedback = feedback
    .replace(/✓/g, '<span class="text-green-500 font-bold">✓</span>')
    .replace(/✗/g, '<span class="text-red-500 font-bold">✗</span>')
    .replace(/!/g, '<span class="text-yellow-500 font-bold">!</span>')
    .replace(/•/g, '<span class="text-blue-400">•</span>');
  
  return formattedFeedback;
}

/**
 * Calculate metrics based on gesture percentages with enhanced analytics
 */
export function calculateMetrics(
  sessionResult: SessionResult
): BodyLanguageMetrics {
  // Calculate allowed vs disallowed gesture percentages
  const allowedGesturePercentage = sessionResult.allowedGestures ? 
    Object.values(sessionResult.allowedGestures).reduce((sum, gesture: any) => 
      sum + (gesture.gesture_percentage || 0), 0) : 0;
  
  const disallowedGesturePercentage = sessionResult.disallowedGestures ? 
    Object.values(sessionResult.disallowedGestures).reduce((sum, gesture: any) => 
      sum + (gesture.gesture_percentage || 0), 0) : 0;
  
  // Create gesture history if available
  const gestureHistory: GestureHistoryItem[] = [];
  
  // Convert gesture percentages to a more usable format
  const gesturePercentages: Record<string, number> = {};
  if (sessionResult.gesturePercentages) {
    Object.entries(sessionResult.gesturePercentages).forEach(([gesture, data]: [string, any]) => {
      gesturePercentages[gesture] = data.gesture_percentage || 0;
      
      // Add to history if we have count data
      if (data.gesture_count) {
        const isAllowed = isAllowedGesture(gesture);
        gestureHistory.push({
          gesture,
          confidence: data.gesture_percentage / 100 || 0,
          timestamp: Date.now() - (Math.random() * sessionResult.duration * 1000), // Simulate timestamps
          isAllowed
        });
      }
    });
  }
  
  return {
    sessionId: sessionResult.sessionId,
    sessionDuration: sessionResult.duration,
    framesProcessed: sessionResult.framesProcessed,
    gesturePercentages,
    gestureHistory: gestureHistory.sort((a, b) => a.timestamp - b.timestamp),
    feedback: sessionResult.feedback,
    overallScore: sessionResult.overallScore,
    allowedGesturePercentage,
    disallowedGesturePercentage
  };
}

/**
 * Check if a gesture is allowed for public speaking
 */
export function isAllowedGesture(gestureName: string): boolean {
  // List of allowed gestures for public speaking
  const allowedGestures = [
    'Open Palm',
    'Thumbs Up',
    'Pointing',
    'Victorious',
    'Confident',
    'Expressive',
    'Hand Emphasis',
    'Balanced Posture'
  ];
  
  // List of explicitly disallowed gestures to handle edge cases
  const disallowedGestures = [
    'Leaning',
    'Crossed Arms',
    'Arms Crossed',
    'Hands In Pockets',
    'Hands Behind Back',
    'Fidgeting',
    'Face Touching',
    'Slouching',
    'Nervous',
    'Closed'
  ];
  
  // First check if it's explicitly disallowed
  if (disallowedGestures.some(g => gestureName.includes(g))) {
    return false;
  }
  
  // Then check if it's allowed
  return allowedGestures.some(g => gestureName.includes(g));
}

/**
 * Get gesture status (allowed, disallowed, neutral) with improved classification
 */
export function getGestureStatus(gestureName: string): 'allowed' | 'disallowed' | 'neutral' {
  // Allowed gestures for public speaking
  const allowedGestures = [
    'Open Palm',
    'Thumbs Up', 
    'Pointing',
    'Victorious',
    'Hand Emphasis',
    'Balanced Posture',
    'Confident',
    'Expressive'
  ];
  
  // Disallowed gestures for public speaking
  const disallowedGestures = [
    'Crossed Arms',
    'Arms Crossed',
    'Hands In Pockets',
    'Hands Behind Back',
    'Face Touching',
    'Fidgeting',
    'Slouching',
    'Leaning',  
    'Nervous',
    'Closed'
  ];
  
  // Check if gesture is in disallowed list first (prioritize disallowed)
  if (disallowedGestures.some(g => gestureName.includes(g))) {
    return 'disallowed';
  }
  
  // Check if gesture is in allowed list
  if (allowedGestures.some(g => gestureName.includes(g))) {
    return 'allowed';
  }
  
  // Default to neutral
  return 'neutral';
}

/**
 * Get stability color based on score
 */
export function getStabilityColor(stabilityScore: number): string {
  if (stabilityScore >= 0.8) {
    return 'rgb(34, 197, 94)'; // green for high stability
  } else if (stabilityScore >= 0.5) {
    return 'rgb(234, 179, 8)'; // yellow for medium stability
  } else {
    return 'rgb(239, 68, 68)'; // red for low stability
  }
}

/**
 * Get color for gesture based on status with enhanced color scheme
 */
export function getGestureColor(gestureName: string): string {
  const status = getGestureStatus(gestureName);
  
  switch (status) {
    case 'allowed':
      return 'rgb(34, 197, 94)'; // green
    case 'disallowed':
      return 'rgb(239, 68, 68)'; // red
    default:
      // For neutral gestures, use a gradient based on whether they're allowed
      return isAllowedGesture(gestureName) ? 
        'rgb(59, 130, 246)' : // blue for allowed neutral
        'rgb(234, 179, 8)';   // yellow for questionable neutral
  }
}

/**
 * Get confidence color gradient
 */
export function getConfidenceColor(confidence: number): string {
  // Red to green gradient based on confidence
  if (confidence < 0.3) {
    return 'rgb(239, 68, 68)'; // red for low confidence
  } else if (confidence < 0.6) {
    return 'rgb(234, 179, 8)'; // yellow for medium confidence
  } else {
    return 'rgb(34, 197, 94)'; // green for high confidence
  }
}

/**
 * Get description for gesture with more comprehensive descriptions
 */
export function getGestureDescription(gestureName: string): string {
  const descriptions: Record<string, string> = {
    // Allowed gestures
    'Open Palm': 'Open palm gestures convey openness and honesty.',
    'Thumbs Up': 'Thumbs up indicates approval and confidence.',
    'Pointing': 'Pointing can emphasize key points (use sparingly).',
    'Victorious': 'Victory sign shows confidence and success.',
    'Hand Emphasis': 'Using hands for emphasis helps engage your audience.',
    'Balanced Posture': 'Your balanced posture conveys confidence and professionalism.',
    'Confident': 'Your posture conveys confidence and authority.',
    'Expressive': 'Expressive gestures help engage your audience.',
    
    // Disallowed gestures
    'Arms Crossed': 'Crossed arms may appear defensive or closed off.',
    'Crossed Arms': 'Crossed arms may appear defensive or closed off.',
    'Hands Behind Back': 'Hands behind back can seem rigid or nervous.',
    'Hands In Pockets': 'Hands in pockets can appear casual or unprepared.',
    'Fidgeting': 'Fidgeting can distract from your message.',
    'Face Touching': 'Touching your face can indicate nervousness or uncertainty.',
    'Slouching': 'Slouching posture may convey lack of confidence or interest.',
    'Leaning': 'Leaning to one side can appear casual or imbalanced.',
    'Nervous': 'Your body language may be conveying nervousness.',
    'Closed': 'Closed body language may create distance with audience.'
  };

  // Check for exact match first
  if (descriptions[gestureName]) {
    return descriptions[gestureName];
  }
  
  // Try to find partial matches if exact match not found
  for (const [key, description] of Object.entries(descriptions)) {
    if (gestureName.toLowerCase().includes(key.toLowerCase())) {
      return description;
    }
  }
  
  return 'Maintain natural, open body language while speaking.';
}

/**
 * Get usage tip for gesture
 */
export function getGestureTip(gestureName: string): string {
  // More comprehensive gesture tips
  const tips: Record<string, string> = {
    // Allowed gestures
    'Open Palm': 'Continue using open palm gestures to build trust.',
    'Thumbs Up': 'Good use of positive reinforcement.',
    'Pointing': 'Use pointing sparingly and with purpose.',
    'Victorious': 'Channel this confidence throughout your talk.',
    'Hand Emphasis': 'Great job using your hands to emphasize key points.',
    'Balanced Posture': 'Maintain this balanced posture throughout your presentation.',
    'Confident': 'Maintain this confident posture throughout.',
    'Expressive': 'Great job using expressive gestures to engage.',
    
    // Disallowed gestures
    'Arms Crossed': 'Try to keep your arms uncrossed to appear more open.',
    'Crossed Arms': 'Try to keep your arms uncrossed to appear more open.',
    'Hands Behind Back': 'Bring your hands forward for more natural gestures.',
    'Hands In Pockets': 'Take your hands out of your pockets for a more professional appearance.',
    'Fidgeting': 'Take a deep breath and be mindful of nervous movements.',
    'Face Touching': 'Avoid touching your face as it can distract your audience.',
    'Slouching': 'Stand up straight with your shoulders back for a more confident appearance.',
    'Leaning': 'Try to maintain a balanced stance without leaning to one side.',
    'Nervous': 'Take a deep breath and relax your shoulders.',
    'Closed': 'Open your posture to connect better with your audience.'
  };

  // Check for exact match first
  if (tips[gestureName]) {
    return tips[gestureName];
  }
  
  // Try to find partial matches if exact match not found
  for (const [key, tip] of Object.entries(tips)) {
    if (gestureName.toLowerCase().includes(key.toLowerCase())) {
      return tip;
    }
  }
  
  return 'Use purposeful gestures to emphasize your points.';
}
