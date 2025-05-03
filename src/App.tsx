import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FinanceProvider } from "@/context/FinanceContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Wallets from "@/pages/Wallets";
import BudgetPage from "@/pages/BudgetPage";
import Statistics from "@/pages/Statistics";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/NotFound";
import Offline from "@/pages/Offline";
import Login from "@/pages/auth/Login";
import SignUp from "@/pages/auth/SignUp";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import AuthCallback from "@/pages/auth/AuthCallback";
import TransactionDetailPage from "@/pages/TransactionDetailPage";
import { useEffect, useState } from "react";
import { TestDatePicker } from "@/components/ui/test-date-picker";
import { InstallAppBanner } from "@/components/shared/InstallAppBanner";
import EditCategoryPage from "@/pages/EditCategoryPage";
import SupabaseTestPage from "@/pages/SupabaseTestPage";
import { TransitionProvider } from "@/context/TransitionContext";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/layout/PageTransition";

const queryClient = new QueryClient();

// Main App content separated from router structure
const AppRoutes = () => {
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
    return <Offline />;
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

  // If not logged in, redirect to landing
  if (!user) {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      <main className="pb-24">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Home route directly renders Dashboard */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <Dashboard />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgotpassword" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Redirects for potential 404 during auth flow */}
            <Route path="/r5sms-*" element={<Navigate to="/auth/callback" replace />} />
            <Route path="/sin1:*" element={<Navigate to="/auth/callback" replace />} />
            <Route path="*NOT_FOUND*" element={<Navigate to="/auth/callback" replace />} />

            {/* Offline page */}
            <Route path="/offline" element={<Offline />} />
            
            {/* Test Routes */}
            <Route path="/test-datepicker" element={<TestDatePicker />} />
            <Route path="/test-supabase" element={<SupabaseTestPage />} />

            {/* Protected App Routes */}
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <Transactions />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transaction-detail"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <TransactionDetailPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/editcategory"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <EditCategoryPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/budget"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <BudgetPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistics"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <Statistics />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallets"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <Wallets />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <ProfilePage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            {/* Landing page */}
            <Route path="/landing" element={<LandingPage />} />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
};

// App content with navbar positioned outside the animated routes
const AppContent = () => {
  const location = useLocation();
  
  // Better approach to check if navbar should be shown
  const mainPages = ['/', '/transactions', '/wallets', '/budget', '/profile', '/statistics'];
  
  // More robust path matching logic
  const shouldShowNavbar = () => {
    const currentPath = location.pathname;
    
    // Exact matches for main pages
    if (mainPages.includes(currentPath)) {
      return true;
    }
    
    // Check for subpaths of main pages (except root)
    for (const path of mainPages) {
      if (path !== '/' && currentPath.startsWith(path + '/')) {
        return true;
      }
    }
    
    // Explicitly exclude landing and auth pages
    const excludedPaths = ['/landing', '/login', '/signup', '/forgotpassword', '/reset-password', '/auth'];
    for (const path of excludedPaths) {
      if (currentPath === path || currentPath.startsWith(path + '/')) {
        return false;
      }
    }
    
    // Default for root path with subpaths (like '/settings')
    return currentPath === '/' || mainPages.some(p => currentPath.startsWith(p));
  };

  return (
    <>
      <AppRoutes />
      {shouldShowNavbar() && <Navbar />}
      <Toaster />
      <Sonner />
      <InstallAppBanner />
    </>
  );
};

// App wrapper providing all contexts
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider>
            <AuthProvider>
              <FinanceProvider>
                <BrowserRouter>
                  <TransitionProvider>
                    <AppContent />
                  </TransitionProvider>
                </BrowserRouter>
              </FinanceProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nextProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
