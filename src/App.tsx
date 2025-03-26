import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FinanceProvider } from "@/context/FinanceContext";
import { AuthProvider } from "@/context/AuthContext";
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
import Login from "@/pages/auth/Login";
import SignUp from "@/pages/auth/SignUp";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import AuthCallback from "@/pages/auth/AuthCallback";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  // Load saved theme settings on app startup
  useEffect(() => {
    const savedSettings = localStorage.getItem('settings');
    
    // Apply default light theme if no settings exist
    if (!savedSettings) {
      document.documentElement.classList.add('light');
      return;
    }
    
    try {
      const { theme } = JSON.parse(savedSettings);
      
      // Default to light theme if no theme is saved
      if (!theme) {
        document.documentElement.classList.add('light');
        return;
      }
      
      // Apply the saved theme
      if (theme === 'light' || theme === 'dark') {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
      } else if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(systemTheme);
      }
    } catch (error) {
      // If there's an error parsing the settings, apply the default light theme
      document.documentElement.classList.add('light');
    }
  }, []);

  // Listen for settings changes from other parts of the app
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'settings' && e.newValue) {
        try {
          const { theme } = JSON.parse(e.newValue);
          
          if (theme === 'light' || theme === 'dark') {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(theme);
          } else if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(systemTheme);
          }
        } catch (error) {
          console.error('Error handling settings change:', error);
        }
      }
    };

    // Handle both storage events and custom events
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <FinanceProvider>
              <BrowserRouter>
                <Routes>
                  {/* Auth Routes */}
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/signup" element={<SignUp />} />
                  <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  
                  {/* Protected App Routes */}
                  <Route 
                    path="/"
                    element={
                      <ProtectedRoute>
                        <div className="max-w-md mx-auto bg-gray-50 min-h-screen overflow-hidden">
                          <main className="pb-20">
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
                        <div className="max-w-md mx-auto bg-gray-50 min-h-screen overflow-hidden">
                          <main className="pb-20">
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
                        <div className="max-w-md mx-auto bg-gray-50 min-h-screen overflow-hidden">
                          <main className="pb-20">
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
                        <div className="max-w-md mx-auto bg-gray-50 min-h-screen overflow-hidden">
                          <main className="pb-20">
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
                        <div className="max-w-md mx-auto bg-gray-50 min-h-screen overflow-hidden">
                          <main className="pb-20">
                            <Wallets />
                          </main>
                          <Navbar />
                        </div>
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route 
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <div className="max-w-md mx-auto bg-gray-50 min-h-screen overflow-hidden">
                          <main className="pb-20">
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
              </BrowserRouter>
            </FinanceProvider>
          </AuthProvider>
        </I18nextProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
