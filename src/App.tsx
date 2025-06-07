
// Main App component with all providers and router setup
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { TransitionProvider } from '@/context/TransitionContext';
import { AppContent } from '@/components/app/AppContent';
import i18n from './i18n';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider>
            <AuthProvider>
              <BrowserRouter>
                <TransitionProvider>
                  <AppContent />
                </TransitionProvider>
              </BrowserRouter>
            </AuthProvider>
          </ThemeProvider>
        </I18nextProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
