// Created ProfilePage to handle user profile viewing and editing.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LogOut,
  Camera,
  ChevronLeft,
  X,
  ZoomIn,
  Heart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState({
    email: user?.email || '',
    username: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isImageViewOpen, setIsImageViewOpen] = useState(false);

  // Load profile image and data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        setUserProfile({
          email: user.email || '',
          username: user.user_metadata?.name || user.email?.split('@')[0] || '',
        });

        try {
          const { data } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(`${user.id}`);

          if (data?.publicUrl) {
            const timestamp = new Date().getTime();
            const imageUrl = `${data.publicUrl}?t=${timestamp}`;

            const img = new Image();
            img.onload = () => setProfileImage(imageUrl);
            img.onerror = () => console.log('Public avatar image not found, will show fallback');
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: t('settings.fileTooLarge'), description: t('settings.profileImageSizeLimit') });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: t('settings.invalidFileType'), description: t('settings.pleaseUploadImage') });
      return;
    }

    try {
      setIsUploadingImage(true);
      const fileName = `${user.id}`;
      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(fileName, file, { upsert: true, contentType: file.type, cacheControl: '0' });

      if (uploadError) {
         if (uploadError.message.includes('not found') || uploadError.message.includes('does not exist') || uploadError.message.includes('No such bucket')) {
          throw new Error('Profile image storage is not configured.');
        }
        if (uploadError.message.includes('not authorized') || uploadError.message.includes('permission')) {
           throw new Error('You do not have permission to upload files.');
        }
        throw new Error(uploadError.message);
      }

      const timestamp = new Date().getTime();
      const { data } = await supabase.storage.from('avatars').getPublicUrl(fileName);
      if (!data?.publicUrl) throw new Error('Failed to get public URL for uploaded image');
      const imageUrl = `${data.publicUrl}?t=${timestamp}`;

      setProfileImage(imageUrl);

      if ('caches' in window) {
        try {
          caches.open('avatars').then(cache => {
            cache.delete(data.publicUrl);
          });
        } catch (e) { console.log('Could not clear cache', e); }
      }

      window.dispatchEvent(new Event('profileImageUpdated'));
      toast({ title: t('settings.profileImageUpdated') });

    } catch (error: any) {
      toast({ variant: 'destructive', title: t('settings.uploadFailed'), description: error.message || t('settings.failedToUploadImage') });
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
      const { error } = await supabase.auth.updateUser({ data: { name: userProfile.username } });
      if (error) throw error;
      toast({ title: t('settings.profileUpdated') });
      // Optionally update the user context or state if needed after successful update
      // For example: fetchUser(); // If you have such a function in AuthContext
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('settings.updateFailed'), description: error.message || t('settings.failedToUpdateProfile') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({ variant: 'destructive', title: t('settings.logoutFailed'), description: t('settings.errorLoggingOut') });
    }
  };

  const handleDonateClick = () => {
    window.open('https://saweria.co/faizintifada', '_blank');
  };

  const handleInstagramClick = () => {
    window.open('https://instagram.com/faizintifada', '_blank');
  };

  const handleProfileImageClick = () => {
    if (profileImage) {
      setIsImageViewOpen(true);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delay: 0.1, duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };


  return (
    <motion.div
      className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen pb-24 text-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="p-6 pt-12">
        {/* Header */}
        <motion.div 
          className="mb-6 flex items-center justify-between"
          variants={itemVariants}
        >
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="mr-4 text-white">
              <ChevronLeft size={24} />
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
            <div
              className="relative cursor-pointer"
              onClick={handleProfileImageClick}
              title={profileImage ? t('settings.viewProfileImage') : ''}
            >
              <Avatar className="h-24 w-24 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#C6FE1E]">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt={userProfile.username} className="aspect-square object-cover w-full h-full" />
                ) : (
                  <AvatarFallback className="bg-[#242425] text-[#C6FE1E] text-2xl flex items-center justify-center">
                    {userProfile.username ? userProfile.username.substring(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              {profileImage && (
                <div className="absolute bottom-0 left-0 bg-black/50 w-full p-1 flex justify-center rounded-b-full">
                  <ZoomIn size={14} className="text-white" />
                </div>
              )}
            </div>
            <motion.button
              className="absolute bottom-0 right-0 bg-[#C6FE1E] text-[#0D0D0D] p-2 rounded-full shadow-md"
              onClick={triggerFileInput}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={isUploadingImage}
              title={t('settings.changeProfileImage')}
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

        {/* Profile Image View Modal */}
        <Dialog open={isImageViewOpen} onOpenChange={setIsImageViewOpen}>
          <DialogContent className="bg-[#1A1A1A] border-0 p-0 overflow-hidden max-w-md w-full rounded-lg">
            <div className="relative">
              <DialogClose className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors">
                <X size={18} />
              </DialogClose>
              <div className="w-full max-h-[80vh] overflow-hidden flex items-center justify-center">
                <img
                  src={profileImage || ''}
                  alt={userProfile.username}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Info Card */}
        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="bg-[#242425] border-none shadow-none text-white rounded-xl">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#868686]">{t('settings.username')}</Label>
                <Input
                  id="username"
                  value={userProfile.username}
                  onChange={(e) => setUserProfile({...userProfile, username: e.target.value})}
                  className="bg-[#1A1A1A] border-none text-white rounded-lg focus:ring-2 focus:ring-[#C6FE1E]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#868686]">{t('settings.email')}</Label>
                <Input
                  id="email"
                  value={userProfile.email}
                  readOnly
                  className="bg-[#1A1A1A] border-none text-white opacity-70 rounded-lg"
                />
              </div>

              <Button
                onClick={handleProfileSave}
                disabled={isSaving}
                className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#A6DD00] rounded-lg font-semibold"
              >
                {isSaving ? t('settings.saving') : t('settings.saveProfile')}
              </Button>

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10 mt-4 rounded-lg font-semibold"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('settings.logout')}
              </Button>
              
              {/* Donate Button */}
              <Button
                onClick={handleDonateClick}
                className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#A6DD00] border border-black mt-4 rounded-lg font-semibold"
                aria-label="Donate to Developer via Saweria"
              >
                <Heart className="mr-2 h-4 w-4" />Support the Author<Heart className="ml-2 h-4 w-4" />
              </Button>
              
              {/* Copyright Text */}
              <div className="text-center mt-4 text-xs text-[#CCCCCC] dark:text-[#CCCCCC]">
                Made by{" "}
                <button 
                  onClick={handleInstagramClick}
                  className="text-[#CCCCCC] hover:text-[#A6DD00] dark:text-[#CCCCCC] underline focus:outline-none"
                  aria-label="Visit Faiz Intifada's Instagram"
                >
                  Faiz Intifada
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProfilePage; 