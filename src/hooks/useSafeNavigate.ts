// Safe navigation hook that checks for Router context before using useNavigate
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Custom hook that provides safe navigation functionality.
 * Checks if Router context is available before attempting navigation.
 * @returns A safe navigate function that won't throw Router context errors
 */
export const useSafeNavigate = () => {
  let navigate: ReturnType<typeof useNavigate> | null = null;
  
  try {
    // Try to get the navigate function from Router context
    navigate = useNavigate();
  } catch (error) {
    // If Router context is not available, navigate will remain null
    console.warn('Router context not available, navigation will be disabled');
  }

  const safeNavigate = useCallback((to: string | number, options?: { replace?: boolean }) => {
    if (navigate) {
      try {
        if (typeof to === 'string') {
          navigate(to, options);
        } else {
          navigate(to);
        }
      } catch (error) {
        console.error('Navigation failed:', error);
        // Fallback to window.location for critical navigation
        if (typeof to === 'string') {
          if (options?.replace) {
            window.location.replace(to);
          } else {
            window.location.href = to;
          }
        } else if (to === -1) {
          window.history.back();
        }
      }
    } else {
      // Fallback navigation when Router context is not available
      console.warn('Router context not available, using fallback navigation');
      if (typeof to === 'string') {
        if (options?.replace) {
          window.location.replace(to);
        } else {
          window.location.href = to;
        }
      } else if (to === -1) {
        window.history.back();
      }
    }
  }, [navigate]);

  return safeNavigate;
};