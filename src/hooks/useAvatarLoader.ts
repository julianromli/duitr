import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UseAvatarLoaderReturn {
  profileImage: string | null;
  isLoading: boolean;
  loadAvatar: (userId: string, retryCount?: number) => Promise<void>;
  clearAvatar: () => void;
}

/**
 * Custom hook for loading user avatars with ORB error handling
 * Uses signed URLs to avoid CORS/ORB issues with Supabase storage
 */
export const useAvatarLoader = (): UseAvatarLoaderReturn => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAvatar = useCallback(async (userId: string, retryCount = 0) => {
    if (!userId) {
      setProfileImage(null);
      return;
    }

    setIsLoading(true);

    try {
      // Use signed URL instead of public URL to avoid CORS/ORB issues
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(userId, 3600); // 1 hour expiry

      if (error) {
        // Handle specific ORB/CORS errors immediately
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          console.log('Avatar not found, using fallback');
          setProfileImage(null);
          return;
        }
        throw error;
      }

      if (data?.signedUrl) {
        // Test if the signed URL is accessible
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Handle CORS properly
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            setProfileImage(data.signedUrl);
            resolve();
          };
          img.onerror = (e) => {
            console.log('Signed URL image failed to load:', e);
            reject(new Error('Image load failed'));
          };
          img.src = data.signedUrl;
        });
      } else {
        setProfileImage(null);
      }
    } catch (error: any) {
      console.log('Error loading avatar image:', error);

      // Handle ORB errors immediately without retry
      if (error.message?.includes('ERR_BLOCKED_BY_ORB') || 
          error.message?.includes('CORS') ||
          error.name === 'NetworkError') {
        console.log('ORB/CORS error detected, using fallback avatar');
        setProfileImage(null);
        return;
      }

      // Retry only for other types of errors
      if (retryCount < 2) {
        const delay = 500 * Math.pow(2, retryCount);
        console.log(`Retrying avatar load after ${delay}ms...`);
        setTimeout(() => loadAvatar(userId, retryCount + 1), delay);
      } else {
        console.log('Max retries reached, showing fallback avatar');
        setProfileImage(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAvatar = useCallback(() => {
    setProfileImage(null);
  }, []);

  return {
    profileImage,
    isLoading,
    loadAvatar,
    clearAvatar
  };
};

export default useAvatarLoader;