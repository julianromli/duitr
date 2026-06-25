import { useNavigate, useRouter } from '@tanstack/react-router';
import { useCallback } from 'react';

/**
 * Custom hook that provides safe navigation with fallback when router is unavailable.
 */
export const useSafeNavigate = () => {
  const navigate = useNavigate();
  const router = useRouter();

  const safeNavigate = useCallback((to: string | number, options?: { replace?: boolean }) => {
    try {
      if (typeof to === 'string') {
        navigate({ to, replace: options?.replace });
      } else if (to === -1) {
        router.history.back();
      }
    } catch (error) {
      console.error('Navigation failed:', error);
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
  }, [navigate, router]);

  return safeNavigate;
};
