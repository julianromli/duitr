import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  Camera, 
  ChevronLeft, 
  Settings as SettingsIcon, 
  Languages,
  Bell,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFinance } from '@/context/FinanceContext';
import LanguageSwitcher from '@/components/settings/LanguageSwitcher';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

// Currency data - Only keep IDR
const currencies = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
];

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { updateCurrency } = useFinance();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if we need to open a specific tab from URL query params
  const urlParams = new URLSearchParams(location.search);
  const tabFromUrl = urlParams.get('tab');
  const defaultTab = tabFromUrl || 'account';
  
  const [initialSettings, setInitialSettings] = useState({
    theme: 'light' as 'light' | 'dark' | 'system',
    currency: 'IDR'
  });
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(initialSettings.theme);
  
  // Profile state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState({
    email: user?.email || '',
    username: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load profile image and data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        // Load user profile details if needed
        setUserProfile({
          email: user.email || '',
          username: user.user_metadata?.name || user.email?.split('@')[0] || '',
        });
        
        // Check if user has a profile image - try public URL first
        try {
          const { data } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(`${user.id}`);
            
          if (data?.publicUrl) {
            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            const imageUrl = `${data.publicUrl}?t=${timestamp}`;
            
            // Check if image exists by loading it
            const img = new Image();
            img.onload = () => {
              setProfileImage(imageUrl);
            };
            img.onerror = () => {
              console.log('Public avatar image not found, will show fallback');
            };
            img.src = imageUrl;
          }
        } catch (error) {
          console.log('No public avatar found, will show fallback');
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };
    
    loadUserProfile();
  }, [user]);

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        const loadedSettings = {
          theme: parsedSettings.theme || 'light',
          currency: 'IDR', // Always set to IDR
        };
        setInitialSettings(loadedSettings);
        setTheme(loadedSettings.theme);
        
        // Force update currency to IDR
        updateCurrency();
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, [updateCurrency]);

  // Apply theme effect only after user saves changes
  const applyTheme = (themeToApply: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement;
    
    if (themeToApply === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(themeToApply);
    }
  };

  const handleSaveAppearance = () => {
    // Save to localStorage
    const settings = { 
      theme, 
      currency: 'IDR', // Always save as IDR
    };
    
    localStorage.setItem('settings', JSON.stringify(settings));
    
    // Dispatch an event to notify other components
    const event = new StorageEvent('storage', {
      key: 'settings',
      newValue: JSON.stringify(settings)
    });
    window.dispatchEvent(event);
    
    // Apply theme only after user saves
    applyTheme(theme);
    
    // Update initial settings
    setInitialSettings({
      theme,
      currency: 'IDR',
    });
    
    toast({
      title: t('common.saved'),
      duration: 3000,
    });
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: t('settings.fileTooLarge'),
        description: t('settings.profileImageSizeLimit'),
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: t('settings.invalidFileType'),
        description: t('settings.pleaseUploadImage'),
      });
      return;
    }
    
    try {
      setIsUploadingImage(true);
      
      // Create a unique filename with user ID to avoid caching issues
      const fileName = `${user.id}`;
      
      // Try uploading directly without checking bucket info first
      // This simplifies the process and avoids extra API calls
      const { error: uploadError, data: uploadData } = await supabase
        .storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: '0'
        });
      
      // Handle specific Supabase storage errors
      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        // Handle bucket not found error specifically
        if (uploadError.message.includes('not found') || 
            uploadError.message.includes('does not exist') || 
            uploadError.message.includes('No such bucket')) {
          throw new Error('Profile image storage is not configured. Please contact the administrator to set up the avatars bucket in Supabase.');
        }
        
        // Handle permission errors
        if (uploadError.message.includes('not authorized') || uploadError.message.includes('permission')) {
          throw new Error('You do not have permission to upload files. Please contact the administrator to check storage policies.');
        }
        
        // Throw the original error message for other issues
        throw new Error(uploadError.message);
      }
      
      // Add timestamp to URL to prevent browser caching
      const timestamp = new Date().getTime();
      
      // Get public URL
      const { data } = await supabase
        .storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      if (!data?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }
      
      // Add timestamp to URL to prevent browser caching
      const imageUrl = `${data.publicUrl}?t=${timestamp}`;
      
      // Set profile image with the public URL
      setProfileImage(imageUrl);
      
      // Clear any cached images
      if ('caches' in window) {
        try {
          caches.open('avatars').then(cache => {
            cache.delete(data.publicUrl).then(() => {
              console.log('Cleared cached avatar image');
            });
          });
        } catch (e) {
          console.log('Could not clear cache, but this is not critical', e);
        }
      }
      
      // Trigger event to update avatar in other components
      window.dispatchEvent(new Event('profileImageUpdated'));
      
      toast({
        title: t('settings.profileImageUpdated'),
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('settings.uploadFailed'),
        description: error.message || t('settings.failedToUploadImage'),
      });
      console.error('Upload error:', error);
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleProfileSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: userProfile.username,
        }
      });
      
      if (error) throw error;
      
      toast({
        title: t('settings.profileUpdated'),
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('settings.updateFailed'),
        description: error.message || t('settings.failedToUpdateProfile'),
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        variant: 'destructive',
        title: t('settings.logoutFailed'),
        description: t('settings.errorLoggingOut'),
      });
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div 
      className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen pb-24 text-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="p-6">
        {/* Header with back button */}
        <motion.div 
          className="flex items-center justify-between mb-6"
          variants={itemVariants}
        >
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="mr-3">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="text-xl font-bold">{t('settings.profile')}</h1>
          </div>
        </motion.div>
        
        {/* Profile Header */}
        <motion.div 
          className="flex flex-col items-center justify-center mb-8"
          variants={itemVariants}
        >
          <div className="relative mb-4">
            <Avatar className="h-24 w-24 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#C6FE1E]">
              {profileImage ? (
                <AvatarImage src={profileImage} alt={userProfile.username} className="aspect-square object-cover w-full h-full" />
              ) : (
                <AvatarFallback className="bg-[#242425] text-[#C6FE1E] text-2xl flex items-center justify-center">
                  {userProfile.username ? userProfile.username.substring(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <motion.button 
              className="absolute bottom-0 right-0 bg-[#C6FE1E] text-[#0D0D0D] p-2 rounded-full"
              onClick={triggerFileInput}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={isUploadingImage}
            >
              <Camera size={16} />
            </motion.button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*"
            />
          </div>
          
          <h2 className="text-xl font-bold">{userProfile.username}</h2>
          <p className="text-[#868686]">{userProfile.email}</p>
        </motion.div>
        
        {/* Profile Tabs */}
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid grid-cols-1 mb-6 bg-[#242425] p-1 rounded-xl">
            <TabsTrigger 
              value="account" 
              className="data-[state=active]:bg-[#C6FE1E] data-[state=active]:text-[#0D0D0D] rounded-lg"
            >
              {t('settings.account')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="mt-0">
            <motion.div
              variants={itemVariants}
              className="space-y-6"
            >
              {/* Profile Info */}
              <Card className="bg-[#242425] border-none shadow-none text-white">
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-[#868686]">{t('settings.username')}</Label>
                    <Input
                      id="username"
                      value={userProfile.username}
                      onChange={(e) => setUserProfile({...userProfile, username: e.target.value})}
                      className="bg-[#1A1A1A] border-none text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#868686]">{t('settings.email')}</Label>
                    <Input
                      id="email"
                      value={userProfile.email}
                      readOnly
                      className="bg-[#1A1A1A] border-none text-white opacity-70"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleProfileSave}
                    disabled={isSaving}
                    className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#A6DD00]"
                  >
                    {isSaving ? t('settings.saving') : t('settings.saveProfile')}
                  </Button>
                  
                  {/* Logout Button - Moved from Settings tab */}
                  <Button 
                    onClick={handleLogout} 
                    variant="outline" 
                    className="w-full bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10 mt-4"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('settings.logout')}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default Settings;
