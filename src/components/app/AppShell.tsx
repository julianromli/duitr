import React, { Suspense, useEffect, useState } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { InstallAppBanner } from '@/components/shared/InstallAppBanner';
import Navbar from '@/components/layout/Navbar';
import PageTransition from '@/components/layout/PageTransition';
import { AIFloatingButton } from '@/components/transactions/AIFloatingButton';
import { useNavbarVisibility } from '@/hooks/useNavbarVisibility';
import { useAuth } from '@/context/AuthContext';
import { FinanceProvider } from '@/context/FinanceContext';
import Offline from '@/pages/Offline';

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

export const AppShell: React.FC = () => {
  const { isLoading, user } = useAuth();
  const { ready: i18nReady } = useTranslation();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const shouldShowNavbar = useNavbarVisibility();

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

  if (isLoading || !i18nReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground">
            {isLoading && !i18nReady ? 'Loading application and translations...' :
             isLoading ? 'Loading application...' :
             'Loading translations...'}
          </p>
        </div>
      </div>
    );
  }

  const content = user ? (
    <FinanceProvider>
      <div className="max-w-md mx-auto bg-background min-h-screen">
        <main className="pb-24">
          <AnimatePresence mode="wait">
            <PageTransition key={pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
        {shouldShowNavbar && <AIFloatingButton />}
      </div>
    </FinanceProvider>
  ) : (
    <Outlet />
  );

  return (
    <>
      {content}
      {user && shouldShowNavbar && <Navbar />}
      <Toaster />
      <Sonner />
      <InstallAppBanner />
    </>
  );
};
