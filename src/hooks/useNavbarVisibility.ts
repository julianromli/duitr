
// Hook to determine if navbar should be shown based on current route
import { useLocation } from '@tanstack/react-router';
import { APP_HOME, mainPages } from '@/config/route-paths';

export const useNavbarVisibility = (): boolean => {
  const location = useLocation();
  
  const shouldShowNavbar = (): boolean => {
    const currentPath = location.pathname;
    
    // Exact matches for main app pages
    if (mainPages.includes(currentPath as (typeof mainPages)[number])) {
      return true;
    }
    
    // Check for subpaths of main app pages
    for (const path of mainPages) {
      if (path !== APP_HOME && currentPath.startsWith(`${path}/`)) {
        return true;
      }
    }
    
    // Explicitly exclude public marketing, auth, and legal pages
    const excludedPaths = ['/login', '/signup', '/forgotpassword', '/reset-password', '/auth', '/privacy', '/terms', '/landing'];
    for (const path of excludedPaths) {
      if (currentPath === path || currentPath.startsWith(`${path}/`)) {
        return false;
      }
    }
    
    // Public home and other non-app routes
    if (currentPath === '/') {
      return false;
    }

    return currentPath.startsWith(`${APP_HOME}/`) || mainPages.some((p) => currentPath.startsWith(p));
  };

  return shouldShowNavbar();
};
