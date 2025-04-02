import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceAssistantAnimation } from './VoiceAssistantAnimation';
import { VoiceCommandProcessor, CommandResponse } from './VoiceCommandProcessor';
import { useNavigation } from '../../context/NavigationContext';
import { navigateTo } from './DirectNavigationHandler';
import { useVoiceAssistant } from '../../context/VoiceAssistantContext';

// Define simplified types for the Web Speech API
type SpeechRecognitionType = any;
type SpeechRecognitionEventType = any;
type SpeechSynthesisUtteranceType = typeof SpeechSynthesisUtterance;
type SpeechRecognitionErrorEventType = any;

// Define the assistant state type
type VoiceAssistantState = 'idle' | 'listening' | 'speaking' | 'processing' | 'thinking' | 'error' | 'navigating';

interface VoiceAssistantProps {
  initialOpacity?: number;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ initialOpacity = 0.4 }) => {
  const router = useRouter();
  const { setActiveComponent } = useVoiceAssistant();
  const { navigateTo: contextNavigateTo } = useNavigation();
  
  // Component state
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [assistantState, setAssistantState] = useState<VoiceAssistantState>('idle');
  const [opacity, setOpacity] = useState<number>(initialOpacity);
  const [showWaves, setShowWaves] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);
  const [waveScale, setWaveScale] = useState<number>(0);
  const [waveOpacity, setWaveOpacity] = useState<number>(0);
  const [showManualNavButton, setShowManualNavButton] = useState<boolean>(false);
  const [navigationTarget, setNavigationTarget] = useState<string>('');
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  
  // Refs for tracking state between renders
  const recognitionRef = useRef<any>(null);
  const commandProcessorRef = useRef<VoiceCommandProcessor | null>(null);
  const speechSynthesisRef = useRef<Window['speechSynthesis'] | null>(null);
  const pendingNavigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const isActiveRef = useRef<boolean>(false); // Ref to track active state
  const activationSoundRef = useRef<HTMLAudioElement | null>(null);
  const deactivationSoundRef = useRef<HTMLAudioElement | null>(null);
  const currentLanguage = 'en-US';
  
  // Extremely simple navigation function
  const forceNavigation = (path: string) => {
    if (!path) {
      console.error('Cannot navigate to empty path');
      return;
    }
    
    // Create a full URL with origin to ensure it's absolute
    const fullUrl = window.location.origin + path;
    console.log('DIRECT NAVIGATION to:', fullUrl);
    
    // Most direct method possible
    window.location.href = fullUrl;
    
    // As a fallback, try using the router after a small delay
    setTimeout(() => {
      if (window.location.pathname !== path) {
        console.log('Fallback: Using router.push to navigate to:', path);
        router.push(path);
      }
    }, 100);
  };
  
  // Initialize the command processor and speech recognition
  useEffect(() => {
    // Initialize command processor
    commandProcessorRef.current = new VoiceCommandProcessor(router);
    
    // Initialize activation sound
    activationSoundRef.current = new Audio('/sounds/activate.mp3');
    deactivationSoundRef.current = new Audio('/sounds/activate.mp3'); // Use the same sound for now
    
    // Initialize speech synthesis
    speechSynthesisRef.current = window.speechSynthesis;
    
    // Initialize speech recognition
    initializeSpeechRecognition();
    
    // Cleanup
    return () => {
      stopListening();
      if (speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
        speechSynthesisRef.current.cancel();
      }
      if (pendingNavigationTimeoutRef.current) {
        clearTimeout(pendingNavigationTimeoutRef.current);
      }
    };
  }, [router]);
  
  // Update isActiveRef whenever isActive changes
  useEffect(() => {
    isActiveRef.current = isActive;
    console.log('isActive state changed:', isActive, 'isActiveRef updated:', isActiveRef.current);
  }, [isActive]);
  
  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('Speech recognition not supported in this browser');
        setMessage('Speech recognition not supported in this browser');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = currentLanguage;

      recognition.onstart = () => {
        console.log('Started listening');
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');

        console.log('Speech recognition result:', transcript);
        
        // Check for wake word in the transcript
        const lowerTranscript = transcript.toLowerCase().trim();
        const isWakeWord = ['hey assistant', 'hello assistant', 'hi assistant', 'ok assistant', 'assistant'].some(
          wakeWord => lowerTranscript.includes(wakeWord)
        );
        
        // If we detect a wake word, set the assistant to active immediately
        if (isWakeWord) {
          setIsActive(true);
          isActiveRef.current = true; // Update ref immediately for faster state access
          console.log('Wake word detected in onresult, setting active to true');
          
          // If this is just the wake word by itself, handle it
          if (['hey assistant', 'hello assistant', 'hi assistant', 'ok assistant', 'assistant'].includes(lowerTranscript)) {
            handleSpeechResult(transcript);
            return;
          }
          
          // If there's more content after the wake word, it might be a command
          // Extract the command part (everything after the wake word)
          const wakeWordUsed = ['hey assistant', 'hello assistant', 'hi assistant', 'ok assistant', 'assistant'].find(
            wakeWord => lowerTranscript.includes(wakeWord)
          );
          
          if (wakeWordUsed) {
            const commandPart = transcript.substring(transcript.toLowerCase().indexOf(wakeWordUsed) + wakeWordUsed.length).trim();
            console.log('Command part after wake word:', commandPart);
            
            // If there's a command after the wake word, process it
            if (commandPart.length > 0) {
              // First process the wake word
              handleCommandResult({
                isWakeWord: true,
                command: 'wake',
                response: 'Yes boss, command me.'
              });
              
              // Then process the command part
              setTimeout(() => {
                handleSpeechResult(commandPart);
              }, 1000); // Small delay to ensure state updates have propagated
              return;
            }
          }
        }
        
        // Only process the final result
        if (event.results[0].isFinal) {
          handleSpeechResult(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'no-speech') {
          console.log('No speech detected, restarting recognition');
          restartRecognition();
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        
        // Don't restart if we're intentionally stopping
        if (!isStoppingRef.current) {
          console.log('Restarting speech recognition');
          restartRecognition();
        }
      };

      recognitionRef.current = recognition;
      
      // Don't automatically start recognition here
      // Instead, check if we're already listening first
      if (!isListening) {
        startListening();
      } else {
        console.log('Recognition already active, not starting again');
      }
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setMessage('Error initializing speech recognition');
    }
  };

  // Restart speech recognition
  const restartRecognition = () => {
    isStoppingRef.current = false;
    startListening();
  };

  // Start listening for voice commands
  const startListening = () => {
    try {
      if (recognitionRef.current) {
        // Check if already listening to prevent InvalidStateError
        if (isListening) {
          console.log('Speech recognition is already running');
          return;
        }
        
        recognitionRef.current.start();
        setIsListening(true);
        console.log('Started listening');
      } else {
        console.error('Speech recognition not initialized');
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      
      // If already started, just update the state to match reality
      if (error instanceof DOMException && error.name === 'InvalidStateError') {
        console.log('Recognition was already started');
        setIsListening(true);
      } else {
        // For other errors, try to reinitialize
        console.log('Attempting to reinitialize speech recognition');
        setTimeout(() => {
          initializeSpeechRecognition();
        }, 1000);
      }
    }
  };

  // Stop listening for speech
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        isStoppingRef.current = true;
        recognitionRef.current.stop();
        setIsListening(false);
        console.log('Stopped listening');
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  };

  // Process the speech recognition result
  const handleSpeechResult = (text: string) => {
    if (!text || text.trim() === '') return;
    
    console.log('Processing recognized text:', text);
    
    // Process the command
    if (!commandProcessorRef.current) {
      console.error('Command processor not initialized');
      return;
    }
    
    // Log the current active state before processing
    console.log('Current active state before processing:', isActive, 'isActiveRef:', isActiveRef.current);
    
    // Use the ref value for the current active state to ensure we have the latest value
    const result = commandProcessorRef.current.processCommand(text, isActiveRef.current);
    
    console.log('Command processing result:', result);
    handleCommandResult(result);
  };

  // Handle the command result
  const handleCommandResult = (result: CommandResponse) => {
    console.log('Command processing result:', result);

    if (result.isWakeWord) {
      console.log('Wake word detected!');
      setIsActive(true);
      setAssistantState('listening');
      setOpacity(1);
      setShowWaves(true);
      setScale(1.3);
      setWaveScale(1);
      setWaveOpacity(0.8);
      setMessage('I am awake and listening');
      speakText(result.response ?? 'I am awake and listening');
      return;
    }

    if (result.command === 'sleep') {
      console.log('Sleep command detected');
      setIsActive(false);
      setAssistantState('idle');
      setOpacity(initialOpacity);
      setShowWaves(false);
      setScale(1);
      setWaveOpacity(0);
      setMessage('Going to sleep now');
      speakText(result.response ?? 'Going to sleep now');
      return;
    }

    // Check if the assistant is active before processing other commands
    if (!isActiveRef.current) {
      console.log('Command received but assistant is not awake');
      return;
    }
    
    // For all other commands, keep the assistant active
    console.log('Processing command while assistant is active:', result.command);
    
    // Ensure the assistant stays active after processing a command
    setIsActive(true);
    
    // Handle navigation commands
    if (result.action === 'navigate' && result.destination) {
      console.log('Navigation command detected to:', result.destination);
      setAssistantState('navigating');
      setMessage(`Navigating to ${result.destination}`);
      
      // Speak the response and navigate immediately
      speakText(result.response ?? `Navigating to ${result.destination}`);
      
      // Execute navigation directly
      console.log('Executing direct navigation to:', result.destination);
      forceNavigation(result.destination);
      return;
    }
    
    // Handle language change commands
    if (result.command === 'speak hindi') {
      console.log('Switching to Hindi');
      speakText('मैं अब हिंदी में बात करूंगी', undefined, 'hi-IN');
      return;
    }
    
    if (result.command === 'speak english') {
      console.log('Switching to English');
      speakText('I will now speak in English');
      return;
    }
    
    // Handle AI question answering
    if (result.action === 'answer') {
      console.log('Question detected:', result.query);
      setAssistantState('thinking');
      setMessage('Thinking...');
      
      // Call Gemini API to get an answer
      fetchAIResponse(result.query ?? 'Unknown question')
        .then(answer => {
          setMessage(answer);
          speakText(answer);
          setAssistantState('listening');
        })
        .catch(error => {
          console.error('Error getting AI response:', error);
          const fallbackResponse = "I'm sorry, I couldn't get an answer for that question.";
          setMessage(fallbackResponse);
          speakText(fallbackResponse);
          setAssistantState('listening');
        });
      return;
    }

    // For all other commands, speak the response and stay active
    setMessage(result.response ?? 'Command processed');
    speakText(result.response ?? 'Command processed');
  };
  
  // Add an effect to log state changes for debugging
  useEffect(() => {
    console.log('isActive state changed:', isActive);
  }, [isActive]);

  // Function to fetch AI response from Gemini API
  const fetchAIResponse = async (query: string): Promise<string> => {
    try {
      console.log('Fetching AI response for:', query);
      
      // Try to use the Gemini API if available
      try {
        // This is a placeholder for the actual Gemini API call
        // In a real implementation, you would make a fetch request to your Gemini API endpoint
        
        // Example implementation (commented out):
        /*
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch from Gemini API');
        }
        
        const data = await response.json();
        return data.response;
        */
        
        // For now, use the fallback system
        throw new Error('Gemini API not implemented yet');
      } catch (error) {
        console.log('Falling back to client-side response generation:', error);
        
        // Fallback to client-side generated responses
        // This is similar to the robust fallback system implemented for speech analysis
        return generateFallbackResponse(query);
      }
    } catch (error) {
      console.error('Error in AI response:', error);
      return "I'm sorry, I couldn't process that question. Please try again.";
    }
  };
  
  // Generate a fallback response when Gemini API is unavailable
  const generateFallbackResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    // Check for specific topics related to the app
    if (lowerQuery.includes('speech') || lowerQuery.includes('practice') || lowerQuery.includes('speaking')) {
      return `Based on my knowledge, effective speech practice involves regular sessions, recording yourself, 
      analyzing your pace, clarity, and confidence. Our app provides tools to track these metrics and 
      offers personalized feedback to help you improve over time.`;
    }
    
    if (lowerQuery.includes('confidence') || lowerQuery.includes('nervous') || lowerQuery.includes('anxiety')) {
      return `Building speaking confidence takes practice. Try these techniques: 
      1. Start with short practice sessions
      2. Record yourself and identify areas for improvement
      3. Practice in front of friends or family
      4. Focus on your breathing to reduce anxiety
      5. Use our app's real-time feedback to track your progress`;
    }
    
    if (lowerQuery.includes('analytics') || lowerQuery.includes('metrics') || lowerQuery.includes('data')) {
      return `Our analytics dashboard tracks key metrics like speaking pace, clarity, confidence, and pitch variation.
      You can view your progress over time, see recent achievements, and get suggestions for areas to focus on.
      The interactive charts help visualize your improvement journey.`;
    }
    
    if (lowerQuery.includes('voice') || lowerQuery.includes('tone') || lowerQuery.includes('pitch')) {
      return `Voice modulation is important for engaging presentations. Our app analyzes your pitch variation,
      tone, and speaking pace. Try varying your tone to emphasize key points, and practice maintaining a
      consistent pace that's neither too fast nor too slow.`;
    }
    
    // General fallback responses
    const fallbackResponses = [
      `That's an interesting question about ${extractTopic(query)}. Based on my understanding, it relates to effective communication skills.`,
      `When it comes to ${extractTopic(query)}, practice and feedback are essential for improvement.`,
      `${extractTopic(query, true)} is an important aspect of public speaking. Our app can help you track and improve this through regular practice.`,
      `I'd recommend focusing on clarity, confidence, and connection with your audience when working on ${extractTopic(query)}.`,
      `For questions about ${extractTopic(query)}, I'd suggest trying our practice sessions which provide real-time feedback.`
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  };
  
  // Extract a topic from the query for more natural responses
  const extractTopic = (query: string, capitalize: boolean = false): string => {
    // Remove question words and common phrases
    const cleanQuery = query.toLowerCase()
      .replace(/what is|what are|how do|how can|how does|how to|why is|why are|who is|who are|when is|when are|where is|where are|can you tell me|tell me about|explain|define|describe|what's/g, '')
      .trim();
    
    // If the query is too short after cleaning, return a generic topic
    if (cleanQuery.length < 3) {
      return 'public speaking';
    }
    
    // Get the first few words as the topic
    const words = cleanQuery.split(' ');
    const topic = words.slice(0, Math.min(3, words.length)).join(' ');
    
    return capitalize ? topic.charAt(0).toUpperCase() + topic.slice(1) : topic;
  };

  // Handle navigation commands
  const handleNavigationCommand = (result: CommandResponse) => {
    if (!result.destination) {
      console.error('Navigation command received but no destination provided');
      return;
    }
    
    const destination = result.destination;
    console.log('NAVIGATION COMMAND DETECTED to:', destination);
    console.log('Current router path:', router.pathname);
    
    // Keep the assistant active during navigation
    setAssistantState('navigating');
    setMessage(`Navigating to ${destination}`);
    
    // Set up manual navigation button immediately
    console.log('Setting up manual navigation button');
    setShowManualNavButton(true);
    setNavigationTarget(destination);
    
    // Execute direct navigation
    console.log('Executing direct navigation to:', destination);
    forceNavigation(destination);
    
    // Dispatch a custom event for navigation
    console.log('Dispatching voice-assistant:navigate event with destination:', destination);
    const navigationEvent = new CustomEvent('voice-assistant:navigate', {
      detail: { destination }
    });
    document.dispatchEvent(navigationEvent);
  };

  // Handle show commands
  const handleShowCommand = (result: CommandResponse) => {
    setMessage('Showing analytics data.');
    
    const responseText = result.response ?? 'Showing analytics data.';
    
    if (result.destination) {
      console.log('SHOW ACTION with destination:', result.destination);
      const destination = result.destination;
      
      // Speak and navigate when done speaking
      speakText(responseText, () => {
        console.log('Speech complete, now navigating to:', destination);
        // Force navigation after speech completes
        window.location.href = window.location.origin + destination;
      });
    } else {
      speakText(responseText);
    }
  };

  // Handle record commands
  const handleRecordCommand = (result: CommandResponse) => {
    setMessage('Starting to record now.');
    
    // Speak the response
    const responseText = result.response ?? 'Starting to record now.';
    speakText(responseText, () => {
      console.log('Starting recording via DOM event');
      // Dispatch a custom event to start recording
      const startRecordEvent = new CustomEvent('voice-assistant:start-recording');
      document.dispatchEvent(startRecordEvent);
    });
  };

  // Handle stop record commands
  const handleStopRecordCommand = (result: CommandResponse) => {
    setMessage('Stopping recording now.');
    
    // Speak the response
    const responseText = result.response ?? 'Recording stopped.';
    speakText(responseText, () => {
      console.log('Stopping recording via DOM event');
      // Dispatch a custom event to stop recording
      const stopRecordEvent = new CustomEvent('voice-assistant:stop-recording');
      document.dispatchEvent(stopRecordEvent);
    });
  };

  // Handle analyze commands
  const handleAnalyzeCommand = (result: CommandResponse) => {
    setMessage('Analyzing your speech performance.');
    
    // Speak the response
    const responseText = result.response ?? 'Analyzing your speech performance.';
    speakText(responseText, () => {
      console.log('Triggering speech analysis via DOM event');
      // Dispatch a custom event to analyze speech
      const analyzeEvent = new CustomEvent('voice-assistant:analyze-speech');
      document.dispatchEvent(analyzeEvent);
    });
  };

  // Handle read commands
  const handleReadCommand = (result: CommandResponse) => {
    setMessage(`Reading ${result.target ?? 'information'} for you.`);
    
    // Speak the response first
    const responseText = result.response ?? `Reading ${result.target ?? 'information'} for you.`;
    speakText(responseText, () => {
      console.log(`Reading ${result.target} via DOM event`);
      
      // Dispatch a custom event to read the target
      const readEvent = new CustomEvent('voice-assistant:read', { 
        detail: { target: result.target } 
      });
      document.dispatchEvent(readEvent);
      
      // For graph reading, navigate to analytics if not already there
      if (result.target === 'graph' && router.pathname !== '/analytics') {
        window.location.href = window.location.origin + '/analytics';
      }
    });
  };

  // Handle edit commands
  const handleEditCommand = (result: CommandResponse) => {
    const target = result.target ?? 'profile';
    const value = result.value ?? '';
    
    setMessage(`Editing ${target}: ${value}`);
    
    // Speak the response
    const responseText = result.response ?? `Updating your ${target}.`;
    speakText(responseText, () => {
      console.log(`Editing ${target} with value: ${value} via DOM event`);
      
      // Navigate to profile page if not already there
      if (router.pathname !== '/profile') {
        window.location.href = window.location.origin + '/profile';
        
        // Set a timeout to allow page to load before dispatching the edit event
        setTimeout(() => {
          // Dispatch a custom event for editing
          const editEvent = new CustomEvent('voice-assistant:edit', { 
            detail: { target, value } 
          });
          document.dispatchEvent(editEvent);
        }, 1000);
      } else {
        // Dispatch a custom event for editing
        const editEvent = new CustomEvent('voice-assistant:edit', { 
          detail: { target, value } 
        });
        document.dispatchEvent(editEvent);
      }
    });
  };

  // Handle execute commands (generic commands)
  const handleExecuteCommand = (result: CommandResponse) => {
    setMessage(result.response ?? 'Executing command.');
    
    // Speak the response
    speakText(result.response ?? 'Executing command.');
  };

  // Handle default response for unrecognized commands
  const handleDefaultResponse = (result: CommandResponse) => {
    setMessage(result.response ?? 'I didn\'t understand that command.');
    
    // Speak the error message
    speakText(result.response ?? 'I didn\'t understand that command.');
  };

  // Speak text using the Web Speech API
  const speakText = (text: string, onEnd?: () => void, language?: string) => {
    if (!text) return;
    
    console.log('Speaking:', text);
    
    // Cancel any ongoing speech first
    if (speechSynthesisRef.current) {
      if (speechSynthesisRef.current.speaking) {
        console.log('Canceling previous speech');
        speechSynthesisRef.current.cancel();
      }
      
      // Small delay to ensure previous speech is fully canceled
      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          
          // Set language if provided, otherwise use default
          utterance.lang = language || currentLanguage;
          
          // Get available voices
          const voices = speechSynthesisRef.current?.getVoices() || [];
          console.log('Available voices:', voices.map(v => v.name));
          
          // Set voice based on language
          if (language === 'hi-IN') {
            // Find Hindi voice
            const hindiVoice = voices.find(voice => voice.lang === 'hi-IN');
            if (hindiVoice) {
              utterance.voice = hindiVoice;
              console.log('Using voice:', hindiVoice.name);
            } else {
              console.log('Hindi voice not found, using default');
            }
          } else {
            // Find English voice - prefer female voices if available
            const englishVoice = voices.find(voice => 
              (voice.name.includes('Google US English') && !voice.name.includes('Male')) || 
              voice.name.includes('Zira') || 
              voice.name.includes('Female')
            );
            
            if (englishVoice) {
              utterance.voice = englishVoice;
              console.log('Using voice:', englishVoice.name);
            } else {
              console.log('Preferred English voice not found, using default');
            }
          }
          
          // Set event handlers
          utterance.onend = () => {
            console.log('Speech ended');
            if (onEnd) {
              onEnd();
            }
          };
          
          utterance.onerror = (event) => {
            console.log('Speech error:', event);
            // If there's an error, still call onEnd to ensure the flow continues
            if (onEnd && event.error !== 'interrupted') {
              onEnd();
            }
          };
          
          // Speak the text
          console.log('Calling speechSynthesis.speak');
          speechSynthesisRef.current?.speak(utterance);
        } catch (error) {
          console.error('Error speaking text:', error);
          // If there's an error, still call onEnd to ensure the flow continues
          if (onEnd) {
            onEnd();
          }
        }
      }, 100); // Small delay to ensure previous speech is fully canceled
    }
  };
  
  return (
    <div className="relative flex items-center justify-center">
      {/* Voice assistant animation */}
      <motion.div
        animate={{
          scale: scale,
          opacity: opacity,
          transition: { duration: 0.3 }
        }}
      >
        <VoiceAssistantAnimation state={assistantState} />
      </motion.div>
      
      {/* Navigation button for direct access */}
      <AnimatePresence>
        {showManualNavButton && navigationTarget && (
          <motion.div 
            className="absolute bottom-16 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <button
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              onClick={() => {
                if (navigationTarget) {
                  console.log('Manual navigation using button to:', navigationTarget);
                  navigateTo(navigationTarget);
                  setShowManualNavButton(false);
                }
              }}
              aria-label={`Navigate to ${navigationTarget?.replace('/', '') || 'page'}`}
            >
              <span>Navigate to {navigationTarget?.replace('/', '')}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hidden iframe for navigation */}
      {iframeUrl && (
        <iframe 
          src={iframeUrl}
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            border: 'none',
            opacity: 0,
            pointerEvents: 'none'
          }}
          onLoad={() => {
            console.log('iframe loaded, redirecting to:', iframeUrl);
            window.location.href = window.location.origin + iframeUrl;
            setIframeUrl(null);
          }}
          title="Navigation"
        />
      )}
      
      {/* Wave animations when active */}
      <AnimatePresence>
        {showWaves && (
          <>
            {/* First wave */}
            <motion.div
              className="absolute rounded-full bg-indigo-500/10"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ 
                scale: [1, 1.5, 2], 
                opacity: [waveOpacity, waveOpacity * 0.7, 0] 
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatType: 'loop',
                ease: "easeInOut" 
              }}
              style={{ width: '100%', height: '100%', zIndex: -1 }}
            />
            
            {/* Second wave */}
            <motion.div
              className="absolute rounded-full bg-purple-500/10"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ 
                scale: [1, 1.7, 2.2], 
                opacity: [waveOpacity, waveOpacity * 0.6, 0] 
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatType: 'loop',
                delay: 0.3,
                ease: "easeInOut"
              }}
              style={{ width: '100%', height: '100%', zIndex: -1 }}
            />
            
            {/* Third wave */}
            <motion.div
              className="absolute rounded-full bg-blue-500/10"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ 
                scale: [1, 1.9, 2.4], 
                opacity: [waveOpacity, waveOpacity * 0.5, 0] 
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatType: 'loop',
                delay: 0.6,
                ease: "easeInOut"
              }}
              style={{ width: '100%', height: '100%', zIndex: -1 }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
