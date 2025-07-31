
// Main routing component that handles authenticated and unauthenticated routes
import React, { useEffect, useState, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { FinanceProvider } from '@/context/FinanceContext';

import PageTransition from '@/components/layout/PageTransition';
import { protectedRoutes, publicRoutes, testRoutes, fallbackRoutes } from '@/config/routes';

// Lazy load components used directly in AppRoutes
const Offline = React.lazy(() => import('@/pages/Offline'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

export const AppRoutes: React.FC = () => {
  const { isLoading, user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const location = useLocation();

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show public routes only
  if (!user) {
    return (
      <Routes location={location} key={location.pathname}>
        {publicRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    );
  }

  // If logged in, show protected routes with FinanceProvider
  return (
    <FinanceProvider>
      <div className="max-w-md mx-auto bg-background min-h-screen">
        <main className="pb-24">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Protected Routes */}
              {protectedRoutes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    <PageTransition>
                      {route.element}
                    </PageTransition>
                  }
                />
              ))}

              {/* Public Routes (still accessible when logged in) */}
              {publicRoutes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}

              {/* Test Routes */}
              {testRoutes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}

              {/* Fallback Routes */}
              {fallbackRoutes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}

              {/* Default fallback */}
              <Route path="*" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <NotFound />
                </Suspense>
              } />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </FinanceProvider>
  );
};
