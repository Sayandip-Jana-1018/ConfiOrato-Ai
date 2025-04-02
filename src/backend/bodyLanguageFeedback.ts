/**
 * Body Language Analysis Types and Utilities
 */

export interface BodyLanguageMetrics {
  sessionId: string;
  sessionDuration: number;
  framesProcessed: number;
  gesturePercentages: Record<string, number>;
  feedback: string;
  overallScore: number;
}

export interface GestureDetection {
  class: string;
  confidence: number;
}

export interface BodyLanguageAnalysisResult {
  processedImage: string;
  prediction: GestureDetection | null;
}

export interface SessionResult {
  sessionId: string;
  duration: number;
  framesProcessed: number;
  gesturePercentages: Record<string, number>;
  feedback: string;
  overallScore: number;
}

/**
 * Format body language feedback for display
 */
export function formatBodyLanguageFeedback(feedback: string): string {
  return feedback;
}

/**
 * Calculate metrics based on gesture percentages
 */
export function calculateMetrics(
  sessionResult: SessionResult
): BodyLanguageMetrics {
  return {
    sessionId: sessionResult.sessionId,
    sessionDuration: sessionResult.duration,
    framesProcessed: sessionResult.framesProcessed,
    gesturePercentages: sessionResult.gesturePercentages,
    feedback: sessionResult.feedback,
    overallScore: sessionResult.overallScore
  };
}

/**
 * Get gesture status (positive, negative, neutral)
 */
export function getGestureStatus(gestureName: string): 'positive' | 'negative' | 'neutral' {
  const positiveGestures = [
    'Open Palm', 
    'Thumbs Up', 
    'Victorious',
    'Pointing',
    'Head Nodding'
  ];
  
  const negativeGestures = [
    'Crossed Arms',
    'Hands In Pockets',
    'Face Touching',
    'Slouching'
  ];
  
  if (positiveGestures.some(g => gestureName.includes(g))) {
    return 'positive';
  } else if (negativeGestures.some(g => gestureName.includes(g))) {
    return 'negative';
  } else {
    return 'neutral';
  }
}

/**
 * Get color for gesture based on status
 */
export function getGestureColor(gestureName: string): string {
  const status = getGestureStatus(gestureName);
  
  switch (status) {
    case 'positive':
      return 'rgb(34, 197, 94)'; // green
    case 'negative':
      return 'rgb(239, 68, 68)'; // red
    default:
      return 'rgb(59, 130, 246)'; // blue
  }
}

/**
 * Get description for gesture
 */
export function getGestureDescription(gestureName: string): string {
  const descriptions: Record<string, string> = {
    'Open Palm': 'Open palm gestures indicate openness and honesty',
    'Thumbs Up': 'Thumbs up shows approval and positive reinforcement',
    'Victorious': 'Victory sign can appear confident but may be distracting if overused',
    'Pointing': 'Pointing can be used to emphasize key points',
    'Crossed Arms': 'Crossed arms may appear defensive or closed off',
    'Hands In Pockets': 'Hands in pockets can appear casual or nervous',
    'Face Touching': 'Touching your face can be distracting and appear nervous'
  };
  
  return descriptions[gestureName] || 'A body language gesture detected during your presentation';
}
