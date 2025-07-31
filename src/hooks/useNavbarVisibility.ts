
// Hook to determine if navbar should be shown based on current route
import { useLocation } from 'react-router-dom';
import { mainPages } from '@/config/routes';

export const useNavbarVisibility = (): boolean => {
  const location = useLocation();
  
  const shouldShowNavbar = (): boolean => {
    const currentPath = location.pathname;
    
    // Exact matches for main pages
    if (mainPages.includes(currentPath)) {
      return true;
    }
    
    // Check for subpaths of main pages (except root)
    for (const path of mainPages) {
      if (path !== '/' && currentPath.startsWith(path + '/')) {
        return true;
      }
    }
    
    // Explicitly exclude landing, auth, and legal pages
    const excludedPaths = ['/landing', '/login', '/signup', '/forgotpassword', '/reset-password', '/auth', '/privacy', '/terms'];
    for (const path of excludedPaths) {
      if (currentPath === path || currentPath.startsWith(path + '/')) {
        return false;
      }
    }
    
    // Default for root path with subpaths (like '/settings')
    return currentPath === '/' || mainPages.some(p => currentPath.startsWith(p));
  };

  return shouldShowNavbar();
};
