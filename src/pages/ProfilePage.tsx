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
import CategoryManagement from '@/components/CategoryManagement';
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

  // Enhanced Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const headerVariants = {
    hidden: { y: -30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.6
      }
    }
  };

  const profileVariants = {
    hidden: { scale: 0.8, opacity: 0, y: 30 },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: 0.8
      }
    }
  };

  const cardVariants = {
    hidden: { y: 40, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.7
      }
    }
  };

  const buttonVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.5
      }
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };


  return (
    <motion.div
      className="max-w-md mx-auto bg-background min-h-screen pb-24 text-foreground px-2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="p-4 pt-12">
        {/* Header */}
        <motion.div 
          className="mb-6 flex items-center justify-between"
          variants={headerVariants}
        >
          <div className="flex items-center">
            <motion.button 
              onClick={() => navigate(-1)} 
              className="mr-4 text-foreground"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <ChevronLeft size={24} />
            </motion.button>
            <motion.h1 
              className="text-xl font-bold"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {t('settings.profile')}
            </motion.h1>
          </div>
        </motion.div>

        {/* Profile Header */}
        <motion.div
          className="flex flex-col items-center justify-center mb-8"
          variants={profileVariants}
        >
          <motion.div 
            className="relative mb-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.div
              className="relative cursor-pointer"
              onClick={handleProfileImageClick}
              title={profileImage ? t('settings.viewProfileImage') : ''}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Avatar className="h-24 w-24 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt={userProfile.username} className="aspect-square object-cover w-full h-full" />
                ) : (
                  <AvatarFallback className="bg-card text-primary text-2xl flex items-center justify-center">
                    {userProfile.username ? userProfile.username.substring(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              {profileImage && (
                <motion.div 
                  className="absolute bottom-0 left-0 bg-black/50 w-full p-1 flex justify-center rounded-b-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <ZoomIn size={14} className="text-white" />
                </motion.div>
              )}
            </motion.div>
            <motion.button
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full shadow-md"
              onClick={triggerFileInput}
              whileHover={{ scale: 1.2, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              disabled={isUploadingImage}
              title={t('settings.changeProfileImage')}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 400, damping: 20 }}
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
          </motion.div>

          <motion.h2 
            className="text-xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {userProfile.username}
          </motion.h2>
          <motion.p 
            className="text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {userProfile.email}
          </motion.p>
        </motion.div>

        {/* Profile Image View Modal */}
        <Dialog open={isImageViewOpen} onOpenChange={setIsImageViewOpen}>
          <DialogContent className="bg-popover border-0 p-0 overflow-hidden max-w-md w-full rounded-lg">
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
        <motion.div 
          className="space-y-6"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.3
              }
            }
          }}
        >
          <motion.div variants={cardVariants}>
            <Card className="bg-card border shadow-none text-card-foreground rounded-xl">
              <CardContent className="p-5 space-y-4">
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <Label htmlFor="username" className="text-muted-foreground">{t('settings.username')}</Label>
                  <Input
                    id="username"
                    value={userProfile.username}
                    onChange={(e) => setUserProfile({...userProfile, username: e.target.value})}
                    className="bg-input border-none text-foreground rounded-lg focus:ring-2 focus:ring-ring"
                  />
                </motion.div>

                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                >
                  <Label htmlFor="email" className="text-muted-foreground">{t('settings.email')}</Label>
                  <Input
                    id="email"
                    value={userProfile.email}
                    readOnly
                    className="bg-input border-none text-foreground opacity-70 rounded-lg"
                  />
                </motion.div>

                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                >
                  <Button
                    onClick={handleProfileSave}
                    disabled={isSaving}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold"
                  >
                    {isSaving ? t('settings.saving') : t('settings.saveProfile')}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Management Section */}
          <motion.div variants={cardVariants}>
            <Card className="bg-card border shadow-none text-card-foreground rounded-xl">
              <CardContent className="p-5">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.6 }}
                >
                  <CategoryManagement />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card border shadow-none text-card-foreground rounded-xl">
              <CardContent className="p-5 space-y-4">
                {/* Logout Button */}
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                >
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10 rounded-lg font-semibold"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('settings.logout')}
                  </Button>
                </motion.div>
                
                {/* Donate Button */}
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                >
                  <Button
                    onClick={handleDonateClick}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 border border-border mt-4 rounded-lg font-semibold"
                    aria-label="Donate to Developer via Saweria"
                  >
                    <Heart className="mr-2 h-4 w-4" />Support the Author<Heart className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
                
                {/* Copyright Text */}
                <motion.div 
                  className="text-center mt-4 text-xs text-muted-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4, duration: 0.5 }}
                >
                  Made by{" "}
                  <motion.button 
                    onClick={handleInstagramClick}
                    className="text-muted-foreground hover:text-primary underline focus:outline-none"
                    aria-label="Visit Faiz Intifada's Instagram"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Faiz Intifada
                  </motion.button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;