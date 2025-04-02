import { NextApiRequest, NextApiResponse } from 'next';

// Define VoiceMetrics interface here to avoid import issues
interface VoiceMetrics {
  volume: number;
  clarity: number;
  pace: number;
  pitch: number;
  frequency: number;
  energy: number;
}

type FeedbackResponse = {
  feedback: string;
  source?: string;
};

/**
 * API endpoint to generate AI-powered feedback for voice analysis
 * 
 * @param req - The request object containing voice metrics
 * @param res - The response object to return generated feedback
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FeedbackResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { metrics } = req.body;

    if (!metrics) {
      return res.status(400).json({ error: 'Voice metrics are required' });
    }

    // Try to use Gemini API for feedback
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Gemini API key not found');
      }
      
      const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze these voice metrics and provide concise, actionable feedback for improvement. Keep the feedback brief and focused on 2-3 key points:
              
              Volume: ${metrics.volume}%
              Clarity: ${metrics.clarity}%
              Pace: ${metrics.pace}%
              Pitch variation: ${metrics.pitch}%
              Frequency: ${metrics.frequency}%
              Energy: ${metrics.energy}%
              
              Format the response with "Strengths:" followed by positive aspects and "Areas to improve:" followed by suggestions.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
          }
        }),
      });
      
      if (!response.ok) {
        console.error(`Gemini API error: ${response.statusText}`);
        // Instead of throwing, fall back to client-side feedback
        return res.status(200).json({ 
          feedback: generateFallbackFeedback(metrics),
          source: 'fallback'
        });
      }
      
      try {
        const data = await response.json();
        // Check if the response has the expected structure
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
          const feedback = data.candidates[0].content.parts[0].text;
          return res.status(200).json({ 
            feedback,
            source: 'gemini'
          });
        } else {
          console.error('Unexpected Gemini API response structure:', data);
          return res.status(200).json({ 
            feedback: generateFallbackFeedback(metrics),
            source: 'fallback'
          });
        }
      } catch (parseError) {
        console.error('Error parsing Gemini API response:', parseError);
        return res.status(200).json({ 
          feedback: generateFallbackFeedback(metrics),
          source: 'fallback'
        });
      }
    } catch (error) {
      console.warn('Gemini API error, falling back to client-side feedback:', error);
      // Fall back to client-side generated feedback
      const feedback = generateFallbackFeedback(metrics);
      return res.status(200).json({ feedback });
    }
  } catch (error) {
    console.error('Error generating voice feedback:', error);
    return res.status(500).json({ error: 'Failed to generate feedback' });
  }
}

/**
 * Generate fallback feedback when API is unavailable
 * 
 * @param metrics - The voice metrics to analyze
 * @returns Formatted feedback string
 */
function generateFallbackFeedback(metrics: VoiceMetrics): string {
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  // Analyze volume
  if (metrics.volume >= 70) {
    strengths.push("Your voice volume is excellent");
  } else if (metrics.volume >= 50) {
    strengths.push("Your voice volume is adequate");
  } else {
    improvements.push("Try projecting your voice more for better volume");
  }

  // Analyze clarity
  if (metrics.clarity >= 70) {
    strengths.push("Your speech clarity is excellent");
  } else if (metrics.clarity >= 50) {
    strengths.push("Your speech clarity is good");
  } else {
    improvements.push("Focus on clearer articulation of words");
  }

  // Analyze pace
  if (metrics.pace >= 40 && metrics.pace <= 70) {
    strengths.push("Your speaking pace is well-balanced");
  } else if (metrics.pace > 70) {
    improvements.push("Try slowing down your speaking pace slightly");
  } else {
    improvements.push("Consider speaking a bit faster to maintain engagement");
  }

  // Analyze pitch
  if (metrics.pitch >= 60) {
    strengths.push("Your voice has good pitch variation");
  } else {
    improvements.push("Add more pitch variation to avoid monotony");
  }

  // Create concise feedback
  let feedback = '';
  
  if (strengths.length > 0) {
    feedback += `Strengths: ${strengths.slice(0, 2).join(", ")}. `;
  }
  
  if (improvements.length > 0) {
    feedback += `Areas to improve: ${improvements.slice(0, 2).join(", ")}. `;
  }
  
  return feedback;
}