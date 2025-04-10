import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import AppLogo from '@/components/shared/Logo';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        // Set username from metadata
        setUsername(user.user_metadata?.name || user.email?.split('@')[0] || '');
        
        // Try to load profile image from public URL with retry logic
        const loadProfileImage = async (retryCount = 0) => {
          try {
            // Get public URL with timestamp to prevent caching
            const timestamp = new Date().getTime();
            const { data } = await supabase
              .storage
              .from('avatars')
              .getPublicUrl(`${user.id}`);
              
            if (data?.publicUrl) {
              // Add timestamp to prevent caching
              const imageUrl = `${data.publicUrl}?t=${timestamp}`;
              
              // Check if image exists by loading it
              const img = new Image();
              
              // Create a promise that resolves when the image loads or rejects on error
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
              });
              
              // If we get here, the image loaded successfully
              setProfileImage(imageUrl);
            }
          } catch (error) {
            console.log('Error loading avatar image:', error);
            
            // Retry up to 2 times with increasing delay if we get network errors
            if (retryCount < 2) {
              const delay = 500 * Math.pow(2, retryCount); // Exponential backoff: 500ms, 1000ms
              console.log(`Retrying avatar load after ${delay}ms...`);
              setTimeout(() => loadProfileImage(retryCount + 1), delay);
            } else {
              console.log('Max retries reached, showing fallback avatar');
              setProfileImage(null);
            }
          }
        };
        
        // Start the loading process
        loadProfileImage();
      } catch (error) {
        console.error('Error loading profile data:', error);
        setProfileImage(null);
      }
    };
    
    loadUserProfile();
    
    // Add event listener for profile image updates
    const handleProfileImageUpdate = () => {
      loadUserProfile();
    };
    
    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
    };
  }, [user]);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return t('navbar.dashboard');
      case '/transactions':
        return t('navbar.transactions');
      case '/budget':
        return t('navbar.budget');
      case '/wallets':
        return t('navbar.wallets');
      case '/settings':
        return t('navbar.settings');
      case '/profile':
        return t('navbar.profile');
      default:
        return t('navbar.dashboard');
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="px-6 py-4 flex items-center justify-between border-b animate-fade-in">
      <div className="flex items-center gap-3">
        <AppLogo size={32} withText={false} className="mr-2" />
        <h1 className="text-2xl font-semibold tracking-tight md:block">
          {getPageTitle()}
        </h1>
      </div>
      {user && (
        <Avatar 
          className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 cursor-pointer"
          onClick={handleProfileClick}
        >
          {profileImage ? (
            <AvatarImage src={profileImage} alt={username} className="aspect-square object-cover" />
          ) : (
            <AvatarFallback className="bg-[#E6DDFF] text-[#7B61FF] flex items-center justify-center">
              {username ? username.substring(0, 2).toUpperCase() : 'U'}
            </AvatarFallback>
          )}
        </Avatar>
      )}
    </header>
  );
};

export default Header;
