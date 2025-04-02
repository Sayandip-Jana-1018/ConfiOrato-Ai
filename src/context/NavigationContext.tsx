import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface NavigationContextType {
  navigateTo: (destination: string) => void;
  currentNavigation: string | null;
  isNavigating: boolean;
}

const NavigationContext = createContext<NavigationContextType>({
  navigateTo: () => {},
  currentNavigation: null,
  isNavigating: false
});

export const useNavigation = () => useContext(NavigationContext);

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const router = useRouter();
  const [currentNavigation, setCurrentNavigation] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Handle navigation with multiple fallback methods
  const navigateTo = (destination: string) => {
    if (isNavigating) return;
    
    console.log('NavigationContext: Navigating to', destination);
    setCurrentNavigation(destination);
    setIsNavigating(true);
    
    // Create a full URL for fallback methods
    const fullPath = window.location.origin + destination;
    
    // Announce navigation for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('role', 'status');
    announcement.className = 'sr-only';
    announcement.textContent = `Navigating to ${destination.replace('/', '')} page`;
    document.body.appendChild(announcement);
    
    // Method 1: Try Next.js router
    router.push(destination)
      .then(() => {
        console.log('NavigationContext: Next.js navigation successful');
      })
      .catch(error => {
        console.error('NavigationContext: Next.js navigation failed', error);
        
        // Method 2: Try window.location.assign
        try {
          console.log('NavigationContext: Trying window.location.assign');
          window.location.assign(fullPath);
        } catch (error) {
          console.error('NavigationContext: window.location.assign failed', error);
          
          // Method 3: Last resort - direct href change
          console.log('NavigationContext: Trying direct href change');
          window.location.href = fullPath;
        }
      });
    
    // Set a backup timeout to ensure navigation happens
    setTimeout(() => {
      console.log('NavigationContext: Backup timeout triggered');
      window.location.href = fullPath;
    }, 1000);
  };
  
  // Reset navigation state when route changes
  useEffect(() => {
    const handleRouteChangeComplete = () => {
      console.log('NavigationContext: Route change complete');
      setIsNavigating(false);
      setCurrentNavigation(null);
      
      // Clean up any announcements - safely
      const announcements = document.querySelectorAll('.sr-only[role="status"]');
      announcements.forEach(el => {
        try {
          // Only remove if it's actually a child of document.body
          if (document.body.contains(el)) {
            document.body.removeChild(el);
          }
        } catch (error) {
          console.log('NavigationContext: Error removing announcement element', error);
        }
      });
    };
    
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router.events]);
  
  return (
    <NavigationContext.Provider value={{ navigateTo, currentNavigation, isNavigating }}>
      {children}
    </NavigationContext.Provider>
  );
};
