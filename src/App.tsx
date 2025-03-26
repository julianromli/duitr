import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FinanceProvider } from "@/context/FinanceContext";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import Navbar from "@/components/layout/Navbar";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Budgets from "@/pages/Budgets";
import Wallets from "@/pages/Wallets";
import Settings from "@/pages/Settings";
import Statistics from "@/pages/Statistics";
import NotFound from "@/pages/NotFound";
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
          <FinanceProvider>
            <BrowserRouter>
              <div className="max-w-md mx-auto bg-gray-50 min-h-screen overflow-hidden">
                <main className="pb-20"> {/* Add padding bottom for navbar */}
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/budgets" element={<Budgets />} />
                    <Route path="/statistics" element={<Statistics />} />
                    <Route path="/wallets" element={<Wallets />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Navbar />
              </div>
            </BrowserRouter>
            <Toaster />
            <Sonner />
          </FinanceProvider>
        </I18nextProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
