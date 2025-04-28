/**
 * Utility function to convert text to speech and return an audio blob URL
 * This uses the Web Speech API's speech synthesis
 */
export async function textToSpeech(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if browser supports speech synthesis
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      reject(new Error('Speech synthesis not supported in this browser'));
      return;
    }

    try {
      // Create utterance with the provided text
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings
      utterance.rate = 1.0; // Normal speaking rate
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 1.0; // Full volume
      
      // Use a more natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Natural') || 
        voice.name.includes('Female')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Create an audio context to record the speech
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const mediaStreamDestination = audioContext.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
      
      const audioChunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        resolve(audioUrl);
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
      
      // When speech ends, stop recording
      utterance.onend = () => {
        mediaRecorder.stop();
        audioContext.close();
      };
      
      // Handle errors
      utterance.onerror = (event) => {
        mediaRecorder.stop();
        audioContext.close();
        reject(new Error(`Speech synthesis error: ${event}`));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Alternative implementation using a mock function that returns predefined audio URLs
 * This is useful as a fallback when the browser doesn't support the MediaRecorder API
 */
export function getMockAudioUrl(topic: string): string {
  // Map of topics to predefined audio URLs
  const audioMap: Record<string, string> = {
    'confidence': 'https://media.blubrry.com/toastmasters/content.blubrry.com/toastmasters/Toastmasters_Podcast_178_2021_04_21.mp3',
    'clarity': 'https://media.blubrry.com/toastmasters/content.blubrry.com/toastmasters/Toastmasters_Podcast_175_2021_01_20.mp3',
    'fundamentals': 'https://media.blubrry.com/toastmasters/content.blubrry.com/toastmasters/Toastmasters_Podcast_174_2020_12_16.mp3',
    'emotion': 'https://media.blubrry.com/toastmasters/content.blubrry.com/toastmasters/Toastmasters_Podcast_173_2020_11_18.mp3'
  };
  
  // Normalize the topic and find a matching URL
  const normalizedTopic = topic.toLowerCase();
  
  if (normalizedTopic.includes('confidence')) {
    return audioMap.confidence;
  } else if (normalizedTopic.includes('clarity')) {
    return audioMap.clarity;
  } else if (normalizedTopic.includes('fundamental')) {
    return audioMap.fundamentals;
  } else if (normalizedTopic.includes('emotion')) {
    return audioMap.emotion;
  }
  
  // Return a default URL if no match found
  return audioMap.fundamentals;
}
