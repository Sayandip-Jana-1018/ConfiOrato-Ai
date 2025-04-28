/**
 * Gesture definitions for body language analysis
 */

// Allowed gestures for public speaking
export const ALLOWED_GESTURES = [
  "Open Palm", 
  "Controlled Hand Movement", 
  "Head Nodding", 
  "Balanced Posture", 
  "Moderate Expressions", 
  "Steady Eye Contact", 
  "Purposeful Walking", 
  "Emphasis Gestures", 
  "Occasional Smiling", 
  "Limited Fist Gestures",
  "Thumbs Up",
  "Victorious",
  "Open"
];

// Disallowed gestures for public speaking
export const DISALLOWED_GESTURES = [
  "Crossed Arms", 
  "Hands in Pockets", 
  "Excessive Movements", 
  "Fidgeting", 
  "Slouching", 
  "Looking Away", 
  "Face Touching", 
  "Jumping", 
  "Restlessness", 
  "Crouching", 
  "Bending",
  "Victory Signs"
];

// Gesture descriptions for UI display
export const GESTURE_DESCRIPTIONS: Record<string, string> = {
  // Allowed gestures
  "Open Palm": "Hands open with palms visible, conveying openness and honesty",
  "Controlled Hand Movement": "Deliberate hand gestures that emphasize points",
  "Head Nodding": "Affirmative head movements showing engagement",
  "Balanced Posture": "Standing with weight evenly distributed and spine straight",
  "Moderate Expressions": "Facial expressions that convey emotion without being excessive",
  "Steady Eye Contact": "Maintaining appropriate eye contact with audience",
  "Purposeful Walking": "Deliberate movement across the stage",
  "Emphasis Gestures": "Hand movements that emphasize key points",
  "Occasional Smiling": "Appropriate smiling to build rapport",
  "Limited Fist Gestures": "Occasional closed hand gestures for emphasis",
  "Thumbs Up": "Positive affirmation gesture showing approval",
  "Victorious": "Confident gesture showing success or achievement",
  "Open": "Open body language conveying receptiveness and confidence",
  
  // Disallowed gestures
  "Crossed Arms": "Arms folded across chest, conveying defensiveness",
  "Hands in Pockets": "Hands hidden in pockets, reducing expressiveness",
  "Excessive Movements": "Overly frequent or large gestures that distract",
  "Fidgeting": "Small, nervous movements showing anxiety",
  "Slouching": "Poor posture with rounded shoulders and bent spine",
  "Looking Away": "Avoiding eye contact with audience",
  "Face Touching": "Touching face, hair, or neck in nervous gestures",
  "Jumping": "Excessive vertical movement showing nervousness",
  "Restlessness": "Inability to maintain a steady position",
  "Crouching": "Lowering body position, reducing presence",
  "Bending": "Excessive forward lean, showing poor posture",
  "Victory Signs": "Overuse of victory or peace signs"
};

// Helper function to determine if a detected gesture matches any in our defined lists
export const matchesGesture = (detectedGesture: string, gestureList: string[]): boolean => {
  // First check for exact matches (case insensitive)
  if (gestureList.some(g => detectedGesture.toLowerCase() === g.toLowerCase())) {
    return true;
  }
  
  // Define gesture aliases and synonyms for more accurate matching
  const gestureAliases: Record<string, string[]> = {
    "Thumbs Up": ["thumbs", "thumb up", "thumbs-up"],
    "Victorious": ["victory", "v sign", "peace sign", "v gesture"],
    "Crossed Arms": ["arms crossed", "folded arms", "cross arm", "defensive posture"],
    "Open Palm": ["palm open", "open hand", "palm facing", "palm up", "palm down"],
    "Pointing": ["point", "finger point", "index finger"],
    "Balanced Posture": ["balanced", "good posture", "straight posture", "upright"],
    "Slouching": ["slouch", "hunched", "poor posture", "leaning", "bent posture"],
    "Face Touching": ["touch face", "face touch", "touching face", "hand on face"]
  };
  
  // Check if the detected gesture matches any of our defined gestures or their aliases
  for (const gesture of gestureList) {
    // Check for the gesture name within the detected gesture
    if (detectedGesture.toLowerCase().includes(gesture.toLowerCase())) {
      return true;
    }
    
    // Check aliases if they exist for this gesture
    const aliases = gestureAliases[gesture];
    if (aliases) {
      for (const alias of aliases) {
        if (detectedGesture.toLowerCase().includes(alias.toLowerCase())) {
          return true;
        }
      }
    }
  }
  
  return false;
};

// Get description for a gesture
export const getGestureDescription = (gestureName: string): string => {
  // Check for exact matches first
  if (GESTURE_DESCRIPTIONS[gestureName]) {
    return GESTURE_DESCRIPTIONS[gestureName];
  }
  
  // Check for partial matches
  for (const [key, description] of Object.entries(GESTURE_DESCRIPTIONS)) {
    if (gestureName.toLowerCase().includes(key.toLowerCase())) {
      return description;
    }
  }
  
  // Default description
  return `${gestureName} detected during presentation`;
};
