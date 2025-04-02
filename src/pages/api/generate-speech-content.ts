import { NextApiRequest, NextApiResponse } from 'next';

// Mock Gemini API integration
// In a real implementation, you would use the actual Gemini API
async function generateSpeechContent(topic: string): Promise<string> {
  // Topics and their corresponding content
  const contentLibrary = {
    'confidence': `
      Building confidence in public speaking begins with preparation and practice. 
      Start by thoroughly understanding your material and organizing it in a logical flow.
      Practice your delivery multiple times, ideally in front of a mirror or recording yourself.
      Focus on your posture - stand tall with your shoulders back and feet shoulder-width apart.
      Make deliberate eye contact with different sections of your audience.
      Remember that nervousness is normal, even for experienced speakers.
      Use deep breathing techniques before speaking to calm your nerves.
      Visualize yourself succeeding and receiving positive feedback.
      The more you speak publicly, the more your confidence will naturally grow.
    `,
    'clarity': `
      Speaking with clarity is essential for effective communication.
      Articulate each word fully, avoiding mumbling or rushing through sentences.
      Vary your pace - slow down for important points and use strategic pauses.
      Eliminate filler words like "um," "uh," and "like" from your speech.
      Practice proper pronunciation of technical terms or difficult words.
      Project your voice from your diaphragm, not your throat.
      Record yourself speaking and listen critically to identify areas for improvement.
      Speak in shorter sentences when delivering complex information.
      Use concrete examples to illustrate abstract concepts.
      Remember that clarity comes from clear thinking - organize your thoughts before speaking.
    `,
    'fundamentals': `
      The fundamentals of public speaking form the foundation of effective communication.
      Start with a clear structure: introduction, body, and conclusion.
      Your introduction should grab attention and establish your credibility.
      The body should contain 3-5 main points, each supported by evidence.
      Your conclusion should summarize key points and end with a call to action.
      Use rhetorical devices like metaphors, stories, and repetition to enhance engagement.
      Incorporate vocal variety by changing your pitch, volume, and pace.
      Use gestures purposefully to emphasize points and express emotion.
      Prepare for questions by anticipating what your audience might ask.
      Always practice with your actual presentation materials and in conditions similar to the real event.
    `,
    'emotion': `
      Emotional expression in speaking creates connection and memorability.
      Begin by identifying the emotional core of your message - what do you want your audience to feel?
      Use stories and personal experiences to evoke specific emotions.
      Match your vocal tone to the emotion you're trying to convey.
      Facial expressions are powerful emotional communicators - practice expressing genuine emotion.
      Use pauses to let emotional moments land with your audience.
      Vary your emotional delivery - contrast serious moments with lighter ones.
      Physical movement can amplify emotional expression - move purposefully on stage.
      Be authentic - audiences can detect forced or insincere emotional displays.
      Remember that vulnerability, when appropriate, creates powerful connections with your audience.
    `
  };

  // Default content if topic doesn't match
  const defaultContent = `
    Public speaking is a skill that can be developed through practice and dedication.
    Focus on knowing your material thoroughly and connecting with your audience.
    Use clear, concise language and organize your thoughts logically.
    Practice regularly, record yourself, and seek feedback to improve.
    Remember that even the most accomplished speakers started as beginners.
  `;

  // Return content based on topic or default if not found
  const normalizedTopic = topic.toLowerCase();
  let content = defaultContent;

  if (normalizedTopic.includes('confidence')) {
    content = contentLibrary.confidence;
  } else if (normalizedTopic.includes('clarity')) {
    content = contentLibrary.clarity;
  } else if (normalizedTopic.includes('fundamental')) {
    content = contentLibrary.fundamentals;
  } else if (normalizedTopic.includes('emotion')) {
    content = contentLibrary.emotion;
  }

  return content.trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const content = await generateSpeechContent(topic);
    
    return res.status(200).json({ content });
  } catch (error) {
    console.error('Error generating speech content:', error);
    return res.status(500).json({ error: 'Failed to generate speech content' });
  }
}
