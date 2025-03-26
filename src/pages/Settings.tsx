import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '@/components/layout/Header';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sun, Moon, User, LogOut, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFinance } from '@/context/FinanceContext';
import LanguageSwitcher from '@/components/settings/LanguageSwitcher';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';

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
      title: t('buttons.save'),
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
        title: 'File too large',
        description: 'Profile image must be less than 2MB',
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an image file',
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
          // Try to clear cache for this image
          const cacheKeys = await window.caches.keys();
          for (const cacheKey of cacheKeys) {
            const cache = await window.caches.open(cacheKey);
            await cache.delete(imageUrl);
          }
        } catch (cacheError) {
          console.log('Cache clearing failed, but not critical', cacheError);
        }
      }
      
      // Show success message
      toast({
        title: 'Profile photo updated',
        description: 'Your profile photo has been updated successfully',
      });
      
      // Force reload the image in the header and other places by dispatching an event
      window.dispatchEvent(new Event('profileImageUpdated'));
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: `Failed to upload profile image: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setIsUploadingImage(false);
      
      // Reset file input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleProfileSave = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          name: userProfile.username
        }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Failed to update profile. Please try again.',
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
      console.error('Error signing out:', error);
      toast({
        variant: 'destructive',
        title: 'Sign out failed',
        description: 'Failed to sign out. Please try again.',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 p-6 pb-24 md:pb-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{t('settings.title')}</h2>
        </div>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="appearance" className="flex items-center justify-center">
              <Sun className="h-5 w-5" />
              <span className="ml-2 hidden sm:block">{t('settings.appearance')}</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center justify-center">
              <User className="h-5 w-5" />
              <span className="ml-2 hidden sm:block">{t('settings.account')}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.appearance')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('settings.theme')}</Label>
                  <RadioGroup 
                    value={theme} 
                    onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50">
                      <RadioGroupItem value="light" id="light" className="rounded-full" />
                      <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                        <Sun className="h-4 w-4" />
                        {t('settings.light')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50">
                      <RadioGroupItem value="dark" id="dark" className="rounded-full" />
                      <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                        <Moon className="h-4 w-4" />
                        {t('settings.dark')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50">
                      <RadioGroupItem value="system" id="system" className="rounded-full" />
                      <Label htmlFor="system" className="cursor-pointer">{t('settings.system')}</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <LanguageSwitcher />
                
                <Button className="w-full sm:w-auto" onClick={handleSaveAppearance}>
                  {t('buttons.save')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image Section */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-[#7B61FF] border-dashed rounded-full">
                      {profileImage ? (
                        <AvatarImage src={profileImage} alt="Profile" />
                      ) : (
                        <AvatarFallback className="bg-[#E6DDFF] text-[#7B61FF] text-xl">
                          {userProfile.username ? userProfile.username.substring(0, 2).toUpperCase() : 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <Button
                      type="button"
                      onClick={triggerFileInput}
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-[#7B61FF] hover:bg-[#6247D9] text-white"
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </div>
                  <p className="text-sm text-center font-medium uppercase">
                    {userProfile.username}
                  </p>
                </div>
                
                {/* Profile Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Your Email Account</Label>
                    <Input
                      id="email"
                      value={userProfile.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={userProfile.username}
                      onChange={(e) => setUserProfile({...userProfile, username: e.target.value})}
                      placeholder="Enter your username"
                    />
                  </div>
                  
                  <Button 
                    className="w-full bg-[#7B61FF] hover:bg-[#6247D9] text-white mt-4" 
                    onClick={handleProfileSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Change'}
                  </Button>
                  
                  <Button 
                    className="w-full bg-red-500 hover:bg-red-600 text-white mt-2" 
                    onClick={handleLogout}
                    type="button"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
