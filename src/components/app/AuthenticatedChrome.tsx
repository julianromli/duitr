import React from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import PageTransition from '@/components/layout/PageTransition';
import { AIFloatingButton } from '@/components/transactions/AIFloatingButton';
import { useNavbarVisibility } from '@/hooks/useNavbarVisibility';

/**
 * Layout chrome for authenticated app pages: mobile container, transitions, navbar.
 */
export const AuthenticatedChrome: React.FC = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const shouldShowNavbar = useNavbarVisibility();

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      <main className="pb-24">
        <AnimatePresence mode="wait">
          <PageTransition key={pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      {shouldShowNavbar && <AIFloatingButton />}
      {shouldShowNavbar && <Navbar />}
    </div>
  );
};
