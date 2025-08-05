
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
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { CurrencyOnboardingDialog } from '@/components/currency/CurrencyOnboardingDialog';
import { useCurrencyOnboarding } from '@/hooks/useCurrencyOnboarding';
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

// Currency onboarding wrapper component
const CurrencyOnboardingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currencyOnboarding = useCurrencyOnboarding();
  
  return (
    <>
      {children}
      <CurrencyOnboardingDialog 
        open={currencyOnboarding.isRequired && !currencyOnboarding.isLoading} 
      />
    </>
  );
};

// App wrapper that waits for i18n to be ready
const AppWrapper: React.FC = () => {
  const { ready, i18n: i18nInstance } = useTranslation();
  const [isI18nReady, setIsI18nReady] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkI18nReady = () => {
      try {
        // Check if i18n is initialized and has loaded resources
        const currentLang = i18nInstance.language || 'id';
        const hasResources = i18nInstance.hasResourceBundle(currentLang, 'translation');
        const isInitialized = i18nInstance.isInitialized;
        
        // Additional check: ensure we have actual translation data
        const hasTranslationData = i18nInstance.exists('landing.hero.title', { lng: currentLang });
        
        if (ready && hasResources && isInitialized && hasTranslationData) {
          setIsI18nReady(true);
          setHasError(false);
        } else if (ready && isInitialized && !hasResources && retryCount < 3) {
          // Retry loading resources if they failed to load
          console.warn(`i18n resources not loaded for ${currentLang}, retrying...`);
          setRetryCount(prev => prev + 1);
          i18nInstance.reloadResources([currentLang]);
        }
      } catch (error) {
        console.error('Error checking i18n readiness:', error);
        setHasError(true);
      }
    };
    
    // Check immediately
    checkI18nReady();
    
    // Set up timeout to prevent infinite loading (fallback after 10 seconds)
    timeoutId = setTimeout(() => {
      if (!isI18nReady) {
        console.warn('i18n loading timeout, proceeding with fallback');
        setIsI18nReady(true);
      }
    }, 10000);
    
    // Listen for language changes and initialization
    i18nInstance.on('initialized', checkI18nReady);
    i18nInstance.on('languageChanged', checkI18nReady);
    i18nInstance.on('loaded', checkI18nReady);
    i18nInstance.on('failedLoading', () => {
      console.error('Failed to load i18n resources');
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
      } else {
        setHasError(true);
      }
    });
    
    return () => {
      clearTimeout(timeoutId);
      i18nInstance.off('initialized', checkI18nReady);
      i18nInstance.off('languageChanged', checkI18nReady);
      i18nInstance.off('loaded', checkI18nReady);
      i18nInstance.off('failedLoading');
    };
  }, [ready, i18nInstance, retryCount]);
  
  // Show error state if i18n failed to load after retries
  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">Failed to load language resources</p>
          <button 
            onClick={() => {
              setHasError(false);
              setRetryCount(0);
              window.location.reload();
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!isI18nReady) {
    return <AppLoadingScreen />;
  }
  
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log errors for debugging
        console.error('App Error Boundary caught error:', error, errorInfo);
        // Could send to error tracking service here
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <CurrencyOnboardingWrapper>
            <BrowserRouter>
              <TransitionProvider>
                <AppContent />
              </TransitionProvider>
            </BrowserRouter>
          </CurrencyOnboardingWrapper>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
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
