import { NextRouter } from 'next/router';

export interface CommandResponse {
  isWakeWord: boolean;
  command?: string;
  response?: string;
  action?: 'navigate' | 'execute' | 'show' | 'record' | 'stop_record' | 'read' | 'edit' | 'analyze' | 'answer';
  destination?: string;
  target?: string;
  value?: string;
  query?: string; // For AI question answering
  language?: string; // For language switching
}

export class VoiceCommandProcessor {
  private router: NextRouter;
  private wakeWords: string[] = [
    'hey assistant',
    'hey sayandeep',
    'hello assistant',
    'hi assistant',
    'ok assistant',
    'assistant'
  ];

  private navigationCommands: { [key: string]: string } = {
    'home': '/home',
    'dashboard': '/dashboard',
    'analytics': '/analytics',
    'practice': '/practice',
    'exercise': '/exercise',
    'exercises': '/exercise',
    'exercise page': '/exercise',
    'speech exercise': '/exercise',
    'speech practice': '/practice',
    'settings': '/settings',
    'profile': '/profile',
    'help': '/help',
    'about': '/about',
    'community': '/community',
    'community page': '/community',
    'forum': '/community'
  };

  // Language commands
  private languageCommands: string[] = [
    'speak hindi',
    'speak in hindi',
    'switch to hindi',
    'hindi mode',
    'speak english',
    'speak in english',
    'switch to english',
    'english mode'
  ];

  // Question indicators
  private questionIndicators: string[] = [
    'what is',
    'what are',
    'how do',
    'how can',
    'how does',
    'how to',
    'why is',
    'why are',
    'who is',
    'who are',
    'when is',
    'when are',
    'where is',
    'where are',
    'can you tell me',
    'tell me about',
    'explain',
    'define',
    'describe',
    'what\'s'
  ];

  constructor(router: NextRouter) {
    this.router = router;
  }

  /**
   * Process a voice command transcript
   * @param transcript The transcript to process
   * @param isAssistantActive Whether the assistant is currently active/awake
   * @returns A command response object
   */
  processCommand(transcript: string, isAssistantActive: boolean = false): CommandResponse {
    console.log('Processing transcript: ', transcript);
    console.log('Assistant active state:', isAssistantActive);
    
    const lowerTranscript = transcript.toLowerCase().trim();
    console.log('Lowercase transcript: ', lowerTranscript);
    
    // Check for wake word first - always process wake word regardless of active state
    if (this.isWakeWord(lowerTranscript)) {
      console.log('Wake word detected');
      return { isWakeWord: true, command: 'wake', response: 'Yes boss, command me.' };
    }
    
    // Check for sleep command - only process if assistant is active
    if (isAssistantActive && (lowerTranscript.includes('go to sleep') || lowerTranscript.includes('sleep'))) {
      console.log('Sleep command detected');
      return { isWakeWord: false, command: 'sleep', response: 'Going to sleep now.' };
    }
    
    // Only process other commands if the assistant is active
    if (!isAssistantActive) {
      console.log('Command received but assistant is not active');
      return { isWakeWord: false, command: 'inactive', response: 'Assistant is not active.' };
    }
    
    console.log('Processing command with active assistant');
    
    // Check for language switching commands
    for (const command of this.languageCommands) {
      if (lowerTranscript.includes(command)) {
        console.log('Language command detected:', command);
        return { 
          isWakeWord: false, 
          command: command, 
          response: command.includes('hindi') ? 
            'मैं अब हिंदी में बात करूंगी' : 
            'I will now speak in English',
          language: command.includes('hindi') ? 'hi-IN' : 'en-US'
        };
      }
    }
    
    // Special case for settings page since it's frequently mentioned
    if (lowerTranscript.includes('settings') || lowerTranscript.includes('setting')) {
      console.log('Settings navigation detected');
      return { 
        isWakeWord: false, 
        command: 'navigate to settings', 
        response: 'Taking you to the settings page.', 
        action: 'navigate', 
        destination: '/settings' 
      };
    }
    
    // Special case for community page since it's frequently used
    const communityKeywords = ['community', 'forum', 'social', 'people'];
    const hasCommunityKeyword = communityKeywords.some(keyword => lowerTranscript.includes(keyword));
    
    if (hasCommunityKeyword) {
      console.log('Community navigation detected');
      return { 
        isWakeWord: false, 
        command: 'navigate to community', 
        response: 'Taking you to the community page.', 
        action: 'navigate', 
        destination: '/community' 
      };
    }
    
    // Check for direct page references (e.g., "settings page")
    for (const [command, destination] of Object.entries(this.navigationCommands)) {
      // Check if the transcript directly mentions a page name
      if (lowerTranscript.includes(`${command} page`) || 
          lowerTranscript.includes(`${command}`) || 
          lowerTranscript.includes(`to ${command}`)) {
        console.log(`Direct page reference detected: ${command} -> ${destination}`);
        return { 
          isWakeWord: false, 
          command: `navigate to ${command}`, 
          response: `Navigating to ${command} page.`, 
          action: 'navigate', 
          destination 
        };
      }
    }
    
    // Check for navigation commands
    for (const [command, destination] of Object.entries(this.navigationCommands)) {
      if (lowerTranscript.includes(`navigate to ${command}`) || 
          lowerTranscript.includes(`go to ${command}`) || 
          lowerTranscript.includes(`open ${command}`)) {
        console.log(`Navigation command detected: ${command} -> ${destination}`);
        return { 
          isWakeWord: false, 
          command: `navigate to ${command}`, 
          response: `Navigating to ${command} page.`, 
          action: 'navigate', 
          destination 
        };
      }
    }
    
    // Check if this is a question for AI
    const isQuestion = this.questionIndicators.some(indicator => lowerTranscript.includes(indicator)) || 
                       lowerTranscript.endsWith('?');
    
    if (isQuestion) {
      console.log('Question detected:', lowerTranscript);
      return {
        isWakeWord: false,
        command: 'answer question',
        response: 'Let me think about that...',
        action: 'answer',
        query: transcript // Use the original transcript for better context
      };
    }
    
    // Default response if no command matched
    return { 
      isWakeWord: false, 
      command: 'unknown', 
      response: 'I\'m not sure what you want me to do. Try saying "navigate to home" or ask me a question.' 
    };
  }
  
  /**
   * Check if the transcript contains a wake word
   * @param transcript The transcript to check
   * @returns True if a wake word is detected
   */
  private isWakeWord(transcript: string): boolean {
    return this.wakeWords.some(wakeWord => 
      transcript === wakeWord || 
      transcript.startsWith(wakeWord + ' ') || 
      transcript.endsWith(' ' + wakeWord)
    );
  }
}
