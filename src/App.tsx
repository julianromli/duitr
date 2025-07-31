
// Main App component with all providers and router setup
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { TransitionProvider } from '@/context/TransitionContext';
import { AppContent } from '@/components/app/AppContent';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { useWebVitals } from '@/hooks/useWebVitals';
import ResourceOptimizer from '@/components/ui/resource-optimizer';
import CriticalCSS from '@/components/ui/critical-css';
import i18n from './i18n';

const queryClient = new QueryClient();

// Loading component while i18n initializes
const AppLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

// App wrapper that waits for i18n to be ready
const AppWrapper: React.FC = () => {
  const { ready, i18n: i18nInstance } = useTranslation();
  const [isI18nReady, setIsI18nReady] = React.useState(false);
  
  // Initialize performance optimizations
  usePerformanceOptimization();
  
  // Monitor Web Vitals
  useWebVitals({
    debug: process.env.NODE_ENV === 'development',
    reportCallback: (metric) => {
      // You can send metrics to analytics service here
      if (process.env.NODE_ENV === 'development') {
        console.log('Web Vitals:', metric);
      }
    }
  });
  
  React.useEffect(() => {
    const checkI18nReady = () => {
      // Check if i18n is initialized and has loaded resources
      const hasResources = i18nInstance.hasResourceBundle(i18nInstance.language, 'translation');
      const isInitialized = i18nInstance.isInitialized;
      
      if (ready && hasResources && isInitialized) {
        setIsI18nReady(true);
      }
    };
    
    // Check immediately
    checkI18nReady();
    
    // Listen for language changes and initialization
    i18nInstance.on('initialized', checkI18nReady);
    i18nInstance.on('languageChanged', checkI18nReady);
    i18nInstance.on('loaded', checkI18nReady);
    
    return () => {
      i18nInstance.off('initialized', checkI18nReady);
      i18nInstance.off('languageChanged', checkI18nReady);
      i18nInstance.off('loaded', checkI18nReady);
    };
  }, [ready, i18nInstance]);
  
  if (!isI18nReady) {
    return <AppLoadingScreen />;
  }
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <TransitionProvider>
            <ResourceOptimizer 
              preconnectDomains={[
                'https://fonts.googleapis.com',
                'https://fonts.gstatic.com',
                'https://trae-api-sg.mchost.guru'
              ]}
              dnsPrefetchDomains={[
                '//www.duitr.my.id'
              ]}
            />
            <CriticalCSS />
            <AppContent />
          </TransitionProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nextProvider i18n={i18n}>
          <AppWrapper />
        </I18nextProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
