import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FinanceProvider } from "@/context/FinanceContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Budgets from "@/pages/Budgets";
import Wallets from "@/pages/Wallets";
import Settings from "@/pages/Settings";
import Statistics from "@/pages/Statistics";
import NotFound from "@/pages/NotFound";
import Offline from "@/pages/Offline";
import Login from "@/pages/auth/Login";
import SignUp from "@/pages/auth/SignUp";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import AuthCallback from "@/pages/auth/AuthCallback";
import { useEffect, useState } from "react";
import { TestDatePicker } from "@/components/ui/test-date-picker";
import { InstallAppBanner } from "@/components/shared/InstallAppBanner";
import { logAuthEvent } from '@/utils/auth-logger';
import { supabase, getSession } from '@/lib/supabase';

const queryClient = new QueryClient();

const App = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Online status monitor
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

  // When checking auth state
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        setAuthLoading(true);
        const { data, error } = await getSession();
        
        if (error) {
          logAuthEvent('session_check_error', {}, error);
          setUser(null);
          return;
        }
        
        if (data.session) {
          logAuthEvent('existing_session_found', { 
            userId: data.session.user.id,
            expiresAt: data.session.expires_at
          });
          
          setUser(data.session.user);
          
          // Check if user is in auth callback route path
          const isInAuthCallback = window.location.pathname.includes('/auth/callback');
          if (isInAuthCallback) {
            logAuthEvent('redirecting_from_callback', { path: window.location.pathname });
          }
        } else {
          logAuthEvent('no_session_found');
          setUser(null);
        }
      } catch (err) {
        logAuthEvent('session_check_exception', {}, err);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    
    checkAuthState();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logAuthEvent('auth_state_change', { event, userId: session?.user?.id });
        
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // If offline, show the offline page
  if (!isOnline) {
    return <Offline />;
  }

  // Show loading indicator while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-[#C6FE1E] border-t-transparent rounded-full"></div>
          <p className="text-gray-300">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider>
            <AuthProvider>
              <FinanceProvider>
                <BrowserRouter>
                  <Routes>
                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/forgotpassword" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    
                    {/* Auth callback route - must match Supabase redirect URI */}
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    
                    {/* Handle common 404 patterns during auth flow by redirecting to the auth callback page */}
                    {/* These might occur due to specific OAuth provider behaviors or network issues */}
                    <Route path="/r5sms-*" element={<Navigate to="/callback" replace />} />
                    <Route path="/sin1:*" element={<Navigate to="/callback" replace />} />
                    <Route path="*NOT_FOUND*" element={<Navigate to="/callback" replace />} />
                    
                    {/* Offline page */}
                    <Route path="/offline" element={<Offline />} />
                    
                    {/* Test Route */}
                    <Route path="/test-datepicker" element={<TestDatePicker />} />
                    
                    {/* Protected App Routes */}
                    <Route 
                      path="/"
                      element={
                        <ProtectedRoute>
                          <div className="max-w-md mx-auto bg-background min-h-screen overflow-hidden">
                            <main className="pb-24">
                              <Dashboard />
                            </main>
                            <Navbar />
                          </div>
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route 
                      path="/transactions"
                      element={
                        <ProtectedRoute>
                          <div className="max-w-md mx-auto bg-background min-h-screen overflow-hidden">
                            <main className="pb-24">
                              <Transactions />
                            </main>
                            <Navbar />
                          </div>
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route 
                      path="/budgets"
                      element={
                        <ProtectedRoute>
                          <div className="max-w-md mx-auto bg-background min-h-screen overflow-hidden">
                            <main className="pb-24">
                              <Budgets />
                            </main>
                            <Navbar />
                          </div>
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route 
                      path="/statistics"
                      element={
                        <ProtectedRoute>
                          <div className="max-w-md mx-auto bg-background min-h-screen overflow-hidden">
                            <main className="pb-24">
                              <Statistics />
                            </main>
                            <Navbar />
                          </div>
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route 
                      path="/wallets"
                      element={
                        <ProtectedRoute>
                          <div className="max-w-md mx-auto bg-background min-h-screen overflow-hidden">
                            <main className="pb-24">
                              <Wallets />
                            </main>
                            <Navbar />
                          </div>
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route 
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <div className="max-w-md mx-auto bg-background min-h-screen overflow-hidden">
                            <main className="pb-24">
                              <Settings />
                            </main>
                            <Navbar />
                          </div>
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* Fallback */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  
                  <Toaster />
                  <Sonner />
                  <InstallAppBanner />
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
