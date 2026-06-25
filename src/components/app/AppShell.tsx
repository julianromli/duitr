import React, { Suspense, useEffect, useState } from 'react';
import { Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { InstallAppBanner } from '@/components/shared/InstallAppBanner';
import { useAuth } from '@/context/AuthContext';
import Offline from '@/pages/Offline';

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

/**
 * Global app shell: bootstrapping, offline handling, and shared UI chrome.
 * Auth guards live on `_authenticated`; finance state lives in that layout too.
 */
export const AppShell: React.FC = () => {
  const { isLoading: isAuthLoading } = useAuth();
  const { ready: i18nReady } = useTranslation();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Offline />
      </Suspense>
    );
  }

  if (isAuthLoading || !i18nReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground">
            {isAuthLoading && !i18nReady ? 'Loading application and translations...' :
             isAuthLoading ? 'Loading application...' :
             'Loading translations...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Outlet />
      <Toaster />
      <Sonner />
      <InstallAppBanner />
    </>
  );
};
