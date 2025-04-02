import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcription, metrics, environment } = req.body;

    if (!transcription || !metrics) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { confidence, speechPace, voiceClarity } = metrics;
    const environmentContext = environment || 'general';

    try {
      // Try to use Gemini API first
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `You are an expert public speaking coach. Analyze the speech transcript and metrics provided for a ${environmentContext} environment, and give constructive feedback focusing on:
      1. Content structure and clarity
      2. Confidence indicators in language
      3. Specific improvement suggestions tailored to the ${environmentContext} environment
      4. Positive reinforcement
      
      Format your response using proper markdown:
      - Start with a "# Speech Analysis" heading
      - Follow with a brief *italicized* summary of overall performance
      - Use bullet points (- ) for specific feedback items
      - Use **bold** for important keywords or phrases
      - End with a "## Key Takeaway" section with 1-3 bullet points
      
      Keep the feedback concise, encouraging, and actionable.
      
      Speech Transcript: "${transcription}"
      
      Metrics:
      - Confidence: ${confidence * 100}%
      - Speech Pace: ${speechPace * 100}%
      - Voice Clarity: ${voiceClarity * 100}%
      - Speaking Environment: ${environmentContext}
      
      Please provide feedback on this speech.`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return res.status(200).json({
        feedback: text,
        metrics: {
          confidence: confidence * 100,
          speechPace: speechPace * 100,
          voiceClarity: voiceClarity * 100
        }
      });
    } catch (apiError) {
      console.error('Error with Gemini API:', apiError);
      
      // Fallback to pre-defined feedback based on environment and metrics
      const fallbackFeedback = generateFallbackFeedback(environmentContext, confidence, speechPace, voiceClarity);
      
      return res.status(200).json({
        feedback: fallbackFeedback,
        metrics: {
          confidence: confidence * 100,
          speechPace: speechPace * 100,
          voiceClarity: voiceClarity * 100
        }
      });
    }
  } catch (error) {
    console.error('Error analyzing speech:', error);
    return res.status(500).json({ error: 'Error analyzing speech' });
  }
}

// Function to generate fallback feedback when API is unavailable
function generateFallbackFeedback(environment: string, confidence: number, pace: number, clarity: number): string {
  // Convert to percentages for easier reading
  const confidencePercent = confidence * 100;
  const pacePercent = pace * 100;
  const clarityPercent = clarity * 100;
  
  // Calculate overall score
  const overallScore = (confidencePercent + pacePercent + clarityPercent) / 3;
  
  // Performance level determination
  let performanceLevel = "needs improvement";
  if (overallScore >= 80) performanceLevel = "excellent";
  else if (overallScore >= 70) performanceLevel = "very good";
  else if (overallScore >= 60) performanceLevel = "good";
  else if (overallScore >= 50) performanceLevel = "fair";
  
  // Environment-specific feedback
  const environmentFeedback = {
    classroom: "educational setting",
    interview: "interview setting",
    conference: "conference environment",
    presentation: "presentation context",
    general: "speaking context"
  }[environment] || "speaking context";
  
  // Generate markdown formatted feedback
  return `# Speech Analysis

*Your overall performance was **${performanceLevel}** with a score of ${Math.round(overallScore)}%. Here's a breakdown of your metrics and some suggestions for improvement in this ${environmentFeedback}.*

## Performance Metrics

- **Confidence**: ${Math.round(confidencePercent)}% - ${getMetricFeedback('confidence', confidencePercent)}
- **Speaking Pace**: ${Math.round(pacePercent)}% - ${getMetricFeedback('pace', pacePercent)}
- **Voice Clarity**: ${Math.round(clarityPercent)}% - ${getMetricFeedback('clarity', clarityPercent)}

## Improvement Suggestions

${getImprovementSuggestions(environment, confidencePercent, pacePercent, clarityPercent)}

## Key Takeaway

- Focus on maintaining consistent **${getWeakestMetric(confidencePercent, pacePercent, clarityPercent)}** to improve your overall delivery.
- Practice regularly in similar ${environmentFeedback}s to build comfort and familiarity.
- Record yourself speaking and review to identify specific areas for improvement.`;
}

// Helper function to get feedback for specific metrics
function getMetricFeedback(metric: string, value: number): string {
  if (value >= 80) return "Excellent performance in this area";
  if (value >= 70) return "Very good, with minor room for improvement";
  if (value >= 60) return "Good, but could use some refinement";
  if (value >= 50) return "Fair, with noticeable room for improvement";
  return "Needs significant improvement";
}

// Helper function to get the weakest metric name
function getWeakestMetric(confidence: number, pace: number, clarity: number): string {
  const metrics = [
    { name: "confidence", value: confidence },
    { name: "pace", value: pace },
    { name: "clarity", value: clarity }
  ];
  
  metrics.sort((a, b) => a.value - b.value);
  return metrics[0].name;
}

// Helper function to get environment-specific improvement suggestions
function getImprovementSuggestions(environment: string, confidence: number, pace: number, clarity: number): string {
  const suggestions = {
    classroom: [
      "- Use more **interactive elements** to engage your audience",
      "- Incorporate **pauses after key points** to allow students to process information",
      "- Consider using more **visual aids** to support your verbal explanations"
    ],
    interview: [
      "- Practice **concise responses** that showcase your expertise without rambling",
      "- Prepare **specific examples** to strengthen your answers and make them memorable",
      "- Work on reducing **filler words** and maintaining consistent **eye contact**"
    ],
    conference: [
      "- Add more **dynamic vocal variety** to keep your audience engaged",
      "- Use **strategic pauses** after introducing new concepts",
      "- Incorporate more **engaging gestures** and vary your position on stage"
    ],
    presentation: [
      "- Focus on **strategic emphasis** of key points",
      "- Add **concise summaries** at transition points",
      "- Practice **distilling complex information** into brief, impactful statements"
    ],
    general: [
      "- Work on maintaining consistent **eye contact** with your audience",
      "- Practice **varying your tone** to emphasize important points",
      "- Focus on **eliminating filler words** for more polished delivery"
    ]
  };
  
  // Get the appropriate suggestions based on environment
  const environmentSuggestions = suggestions[environment as keyof typeof suggestions] || suggestions.general;
  
  // Add metric-specific suggestions based on the weakest areas
  let metricSuggestions = "";
  
  if (confidence < 70) {
    metricSuggestions += "- To improve **confidence**, practice your material thoroughly and record yourself to become more comfortable with your delivery.\n";
  }
  
  if (pace < 70) {
    metricSuggestions += "- For better **pacing**, try marking your script with pause indicators and practice with a metronome to maintain a steady rhythm.\n";
  }
  
  if (clarity < 70) {
    metricSuggestions += "- Enhance **clarity** by practicing articulation exercises and recording yourself to identify words or phrases that may be unclear.\n";
  }
  
  // Combine environment and metric suggestions
  return environmentSuggestions.join("\n") + "\n\n" + metricSuggestions;
}
