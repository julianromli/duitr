import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import AppLogo from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Globe, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  
  // Animation states
  const [languageClicked, setLanguageClicked] = useState(false);
  const [themeClicked, setThemeClicked] = useState(false);

  const language = i18n.language.includes('id') ? 'ID' : 'EN';
  const isDarkTheme = theme === 'dark';

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        // Set username from metadata
        setUsername(user.user_metadata?.name || user.email?.split('@')[0] || '');
        
        // Try to load profile image using signed URL to avoid ORB errors
        const loadProfileImage = async (retryCount = 0) => {
          try {
            // Use signed URL instead of public URL to avoid CORS/ORB issues
            const { data, error } = await supabase.storage
              .from('avatars')
              .createSignedUrl(`${user.id}`, 3600); // 1 hour expiry

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
              
              await new Promise((resolve, reject) => {
                img.onload = () => {
                  setProfileImage(data.signedUrl);
                  resolve(undefined);
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
      case '/ai':
        return 'Evaluasi Keuangan AI';
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

  const toggleLanguage = () => {
    setLanguageClicked(true);
    setTimeout(() => {
      setLanguageClicked(false);
      i18n.changeLanguage(language === 'ID' ? 'en' : 'id');
    }, 300);
  };

  const toggleTheme = () => {
    setThemeClicked(true);
    setTimeout(() => {
      setThemeClicked(false);
      setTheme(isDarkTheme ? 'light' : 'dark');
    }, 300);
  };

  return (
    <header className="px-6 py-4 flex items-center justify-between border-b animate-fade-in">
      <div className="flex items-center gap-3">
        <AppLogo size={32} withText={false} className="mr-2" />
        <h1 className="text-2xl font-semibold tracking-tight md:block">
          {getPageTitle()}
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={toggleLanguage}
          className="transition-all duration-200 ease-in-out hover:scale-110 rounded-full p-2"
          style={{
            transform: languageClicked ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.3s ease-in-out, box-shadow 0.2s ease-in-out',
            boxShadow: language === 'ID' ? '0 0 6px rgba(198, 254, 30, 0.6)' : 'none'
          }}
        >
          <Globe className="w-4 h-4 mr-1" />
          <span className="text-xs">{language}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={toggleTheme}
          className="transition-all duration-200 ease-in-out hover:scale-110 rounded-full p-2"
          style={{
            transform: themeClicked ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.3s ease-in-out, box-shadow 0.2s ease-in-out',
            boxShadow: isDarkTheme ? '0 0 6px rgba(198, 254, 30, 0.6)' : 'none'
          }}
        >
          {isDarkTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>
        
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
      </div>
    </header>
  );
};

export default Header;
