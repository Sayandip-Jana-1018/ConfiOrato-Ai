import { SessionResult } from '@/backend/bodyLanguageFeedback';

/**
 * Start a new body language analysis session
 */
export async function startBodyLanguageSession(): Promise<string> {
  try {
    const response = await fetch('http://localhost:5000/api/body-language/start-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to start session: ${response.status}`);
    }

    const data = await response.json();
    return data.session_id;
  } catch (error) {
    console.error('Error starting body language session:', error);
    throw error;
  }
}

/**
 * Analyze a single frame from the video stream
 */
export async function analyzeBodyLanguageFrame(
  sessionId: string,
  imageData: string
): Promise<{ processedImage: string; prediction: any }> {
  try {
    const response = await fetch('http://localhost:5000/api/body-language/analyze-frame', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        image_data: imageData,
      }),
    });

    if (!response.ok) {
      console.warn(`Frame analysis response not OK: ${response.status}`);
      return { processedImage: '', prediction: null };
    }

    const data = await response.json();
    
    // Check if there was an error in the response
    if (data.error) {
      console.warn(`Error from server: ${data.error}`);
      return { processedImage: '', prediction: null };
    }
    
    return {
      processedImage: data.processed_image || '',
      prediction: data.prediction,
    };
  } catch (error) {
    console.error('Error analyzing body language frame:', error);
    return { processedImage: '', prediction: null };
  }
}

// Define the interface for body language metrics
export interface BodyLanguageMetrics {
  sessionId: string;
  sessionDuration: number;
  framesProcessed: number;
  gesturePercentages: Record<string, number>;
  feedback: string;
  overallScore: number;
}

/**
 * Stop the current body language analysis session and get metrics
 */
export async function stopBodyLanguageSession(sessionId: string): Promise<BodyLanguageMetrics> {
  try {
    console.log(`Stopping body language session with ID: ${sessionId}`);
    
    const response = await fetch('http://localhost:5000/api/body-language/stop-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to stop session: ${response.status}`);
      // Return default metrics object with empty values
      return {
        sessionId: sessionId || '',
        sessionDuration: 0,
        framesProcessed: 0,
        gesturePercentages: {},
        feedback: 'Failed to retrieve feedback',
        overallScore: 0
      };
    }

    const data = await response.json();
    
    // Convert snake_case to camelCase if needed
    return {
      sessionId: data.session_id || sessionId || '',
      sessionDuration: data.duration || 0,
      framesProcessed: data.frames_processed || 0,
      gesturePercentages: data.gesture_percentages || {},
      feedback: data.feedback || 'No feedback available',
      overallScore: data.overall_score || 0
    };
  } catch (error) {
    console.error('Error stopping body language session:', error);
    // Return default metrics object with empty values
    return {
      sessionId: sessionId || '',
      sessionDuration: 0,
      framesProcessed: 0,
      gesturePercentages: {},
      feedback: 'Error retrieving feedback',
      overallScore: 0
    };
  }
}
