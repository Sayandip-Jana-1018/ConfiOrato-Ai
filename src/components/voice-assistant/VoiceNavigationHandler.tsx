import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * VoiceNavigationHandler
 * 
 * A component that listens for voice navigation events and handles them
 * This component should be included in _app.tsx to ensure it's available globally
 */
const VoiceNavigationHandler: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Function to handle navigation events
    const handleVoiceNavigation = (event: CustomEvent) => {
      const destination = event.detail?.destination;
      if (!destination) {
        console.error('VoiceNavigationHandler: Navigation event received but no destination provided');
        return;
      }

      console.log('VoiceNavigationHandler: Navigation event received for destination:', destination);
      
      // First attempt: Try using Next.js router
      try {
        console.log('VoiceNavigationHandler: Attempting navigation with Next.js router');
        router.push(destination)
          .then(() => {
            console.log('VoiceNavigationHandler: Router navigation successful');
          })
          .catch((error) => {
            console.error('VoiceNavigationHandler: Router navigation failed:', error);
            forceNavigation(destination);
          });
      } catch (error) {
        console.error('VoiceNavigationHandler: Error during navigation attempt:', error);
        forceNavigation(destination);
      }
    };

    // Function to force navigation using window.location
    const forceNavigation = (destination: string) => {
      console.log('VoiceNavigationHandler: Forcing navigation with window.location');
      
      // Ensure destination starts with a slash
      const normalizedPath = destination.startsWith('/') ? destination : `/${destination}`;
      const fullUrl = window.location.origin + normalizedPath;
      
      console.log('VoiceNavigationHandler: Setting window.location.href to:', fullUrl);
      window.location.href = fullUrl;
    };

    // Add event listener for voice navigation
    document.addEventListener('voice-assistant:navigate', handleVoiceNavigation as EventListener);
    
    // Clean up event listener on unmount
    return () => {
      document.removeEventListener('voice-assistant:navigate', handleVoiceNavigation as EventListener);
    };
  }, [router]);

  // This component doesn't render anything
  return null;
};

export default VoiceNavigationHandler;
