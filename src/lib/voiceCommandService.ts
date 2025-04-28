import { NextRouter } from 'next/router';

export interface CommandResponse {
  message: string;
  action?: 'navigate' | 'toggle' | 'info' | 'none';
  destination?: string;
  data?: any;
  success: boolean;
}

export class VoiceCommandService {
  private router: NextRouter;
  
  constructor(router: NextRouter) {
    this.router = router;
  }
  
  async processCommand(command: string): Promise<CommandResponse> {
    console.log("Processing command:", command);
    
    // Normalize the command
    const normalizedCommand = command.toLowerCase().trim();
    
    // Navigation commands
    if (
      normalizedCommand.includes("go to home") || 
      normalizedCommand.includes("navigate to home") ||
      normalizedCommand.includes("take me home")
    ) {
      return {
        message: "Navigating to the home page",
        action: "navigate",
        destination: "/",
        success: true
      };
    }
    
    if (
      normalizedCommand.includes("go to practice") || 
      normalizedCommand.includes("navigate to practice") ||
      normalizedCommand.includes("open practice")
    ) {
      return {
        message: "Opening the practice page",
        action: "navigate",
        destination: "/practice",
        success: true
      };
    }
    
    if (
      normalizedCommand.includes("go to analytics") || 
      normalizedCommand.includes("navigate to analytics") ||
      normalizedCommand.includes("show analytics") ||
      normalizedCommand.includes("open analytics")
    ) {
      return {
        message: "Opening the analytics page",
        action: "navigate",
        destination: "/analytics",
        success: true
      };
    }
    
    if (
      normalizedCommand.includes("go to video") || 
      normalizedCommand.includes("navigate to video") ||
      normalizedCommand.includes("open video") ||
      normalizedCommand.includes("video analysis") ||
      normalizedCommand.includes("video page")
    ) {
      return {
        message: "Opening the video analysis page",
        action: "navigate",
        destination: "/video",
        success: true
      };
    }
    
    if (
      normalizedCommand.includes("go to exercises") || 
      normalizedCommand.includes("navigate to exercises") ||
      normalizedCommand.includes("show exercises") ||
      normalizedCommand.includes("open exercises")
    ) {
      return {
        message: "Opening the exercises page",
        action: "navigate",
        destination: "/exercises",
        success: true
      };
    }
    
    if (
      normalizedCommand.includes("go to community") || 
      normalizedCommand.includes("navigate to community") ||
      normalizedCommand.includes("open community")
    ) {
      return {
        message: "Opening the community page",
        action: "navigate",
        destination: "/community",
        success: true
      };
    }
    
    if (
      normalizedCommand.includes("go to accessibility") || 
      normalizedCommand.includes("navigate to accessibility") ||
      normalizedCommand.includes("open accessibility") ||
      normalizedCommand.includes("accessibility options")
    ) {
      return {
        message: "Opening the accessibility page",
        action: "navigate",
        destination: "/accessibility",
        success: true
      };
    }
    
    if (
      normalizedCommand.includes("go to profile") || 
      normalizedCommand.includes("navigate to profile") ||
      normalizedCommand.includes("open profile") ||
      normalizedCommand.includes("show profile") ||
      normalizedCommand.includes("go to settings") || 
      normalizedCommand.includes("open settings")
    ) {
      return {
        message: "Opening your profile settings",
        action: "navigate",
        destination: "/settings",
        success: true
      };
    }
    
    // Information commands
    if (
      normalizedCommand.includes("what can you do") || 
      normalizedCommand.includes("help") ||
      normalizedCommand.includes("commands") ||
      normalizedCommand.includes("what commands")
    ) {
      return {
        message: "I can help you navigate the app, provide information, and control features. Try saying 'go to home', 'open analytics', or 'tell me about this app'.",
        action: "info",
        success: true
      };
    }
    
    if (
      normalizedCommand.includes("who are you") || 
      normalizedCommand.includes("what are you") ||
      normalizedCommand.includes("your name")
    ) {
      return {
        message: "I'm your voice assistant. I can help you navigate and use this application hands-free.",
        action: "info",
        success: true
      };
    }
    
    if (
      normalizedCommand.includes("about this app") || 
      normalizedCommand.includes("tell me about") ||
      normalizedCommand.includes("what is this app")
    ) {
      return {
        message: "This is an AI-powered application that helps you with interview practice, video analysis, and exercise tracking. You can navigate through different sections using the navbar or by asking me.",
        action: "info",
        success: true
      };
    }
    
    // Action commands
    if (
      normalizedCommand.includes("start recording") || 
      normalizedCommand.includes("start video") ||
      normalizedCommand.includes("begin recording")
    ) {
      // This would need to be handled by the video component
      return {
        message: "Starting video recording. Please make sure your camera is enabled.",
        action: "toggle",
        data: { action: "startRecording" },
        success: true
      };
    }
    
    if (
      normalizedCommand.includes("stop recording") || 
      normalizedCommand.includes("stop video") ||
      normalizedCommand.includes("end recording")
    ) {
      return {
        message: "Stopping video recording.",
        action: "toggle",
        data: { action: "stopRecording" },
        success: true
      };
    }
    
    if (
      normalizedCommand.includes("turn on camera") || 
      normalizedCommand.includes("enable camera") ||
      normalizedCommand.includes("start camera")
    ) {
      return {
        message: "Turning on the camera.",
        action: "toggle",
        data: { action: "enableCamera" },
        success: true
      };
    }
    
    if (
      normalizedCommand.includes("turn off camera") || 
      normalizedCommand.includes("disable camera") ||
      normalizedCommand.includes("stop camera")
    ) {
      return {
        message: "Turning off the camera.",
        action: "toggle",
        data: { action: "disableCamera" },
        success: true
      };
    }
    
    // Current page info
    if (
      normalizedCommand.includes("where am i") || 
      normalizedCommand.includes("current page") ||
      normalizedCommand.includes("what page")
    ) {
      const currentPath = this.router.pathname;
      let pageName = "an unknown page";
      
      switch (currentPath) {
        case "/":
          pageName = "the home page";
          break;
        case "/practice":
          pageName = "the practice page";
          break;
        case "/analytics":
          pageName = "the analytics page";
          break;
        case "/video":
          pageName = "the video analysis page";
          break;
        case "/exercises":
          pageName = "the exercises page";
          break;
        case "/community":
          pageName = "the community page";
          break;
        case "/accessibility":
          pageName = "the accessibility page";
          break;
        case "/settings":
          pageName = "the profile settings page";
          break;
      }
      
      return {
        message: `You are currently on ${pageName}.`,
        action: "info",
        success: true
      };
    }
    
    // Default response for unrecognized commands
    return {
      message: `I'm sorry, I don't understand "${command}". Try saying "help" for a list of commands.`,
      action: "none",
      success: false
    };
  }
}

// Singleton pattern to ensure we only have one instance
let voiceCommandServiceInstance: VoiceCommandService | null = null;

export function getVoiceCommandService(router: NextRouter): VoiceCommandService {
  if (!voiceCommandServiceInstance) {
    voiceCommandServiceInstance = new VoiceCommandService(router);
  }
  return voiceCommandServiceInstance;
}
