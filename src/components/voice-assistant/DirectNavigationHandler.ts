/**
 * DirectNavigationHandler.ts
 * A utility to handle direct navigation in the application
 * This bypasses Next.js router for more reliable navigation
 */

/**
 * Navigate to a specific path in the application
 * Uses multiple fallback methods to ensure navigation happens
 * @param path The path to navigate to (e.g., '/profile', '/practice')
 */
export const navigateTo = (path: string): void => {
  if (!path) {
    console.error('DirectNavigationHandler: Cannot navigate to empty path');
    return;
  }

  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Create a full URL with origin to ensure it's absolute
  const fullUrl = window.location.origin + normalizedPath;
  console.log('DirectNavigationHandler: Navigating to', fullUrl);

  try {
    // Method 1: Use history API
    console.log('DirectNavigationHandler: Trying history.pushState');
    window.history.pushState({}, '', normalizedPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
    
    // Method 2: Use location.assign as backup
    setTimeout(() => {
      if (window.location.pathname !== normalizedPath) {
        console.log('DirectNavigationHandler: History API failed, trying location.assign');
        window.location.assign(fullUrl);
      }
    }, 100);

    // Method 3: Final fallback to direct href change
    setTimeout(() => {
      if (window.location.pathname !== normalizedPath) {
        console.log('DirectNavigationHandler: location.assign failed, using direct href change');
        window.location.href = fullUrl;
      }
    }, 300);

  } catch (error) {
    console.error('DirectNavigationHandler: Navigation error:', error);
    
    // Direct fallback if any errors occur
    console.log('DirectNavigationHandler: Error occurred, using direct href change');
    window.location.href = fullUrl;
  }
};

/**
 * Force reload the current page
 */
export const reloadPage = (): void => {
  console.log('DirectNavigationHandler: Reloading page');
  window.location.reload();
};

/**
 * Navigate to the previous page in history
 */
export const goBack = (): void => {
  console.log('DirectNavigationHandler: Going back');
  window.history.back();
};
