
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 🔧 Optimized staleTime to reduce unnecessary refetching
      staleTime: (query) => {
        if (query.queryKey[0] === 'categories') {
          return 5 * 60 * 1000; // 🔧 Increased to 5 minutes for categories
        }
        if (query.queryKey[0] === 'transactions') {
          return 2 * 60 * 1000; // 🔧 2 minutes for transactions
        }
        if (query.queryKey[0] === 'budgets') {
          return 3 * 60 * 1000; // 🔧 3 minutes for budgets
        }
        return 10 * 60 * 1000; // 🔧 10 minutes for other queries
      },
      // 🔧 Add retry configuration to prevent aggressive retries
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors (client errors)
        const errorWithStatus = error as { status?: number };
        if (errorWithStatus?.status >= 400 && errorWithStatus?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 🔧 Prevent refetch on window focus in development
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      // 🔧 Prevent refetch on reconnect for better UX
      refetchOnReconnect: 'always',
    },
  },
});

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
  const retryAttemptedRef = React.useRef(false);
  
  // 🔧 Separate effect for initial i18n check to prevent dependency issues
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let checkTimeoutId: NodeJS.Timeout;
    
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
          retryAttemptedRef.current = false;
        } else if (ready && isInitialized && !hasResources && !retryAttemptedRef.current) {
          // 🔧 Use ref instead of state to prevent re-render loop
          console.warn(`i18n resources not loaded for ${currentLang}, retrying once...`);
          retryAttemptedRef.current = true;
          // 🔧 Debounce the retry attempt
          setTimeout(() => {
            i18nInstance.reloadResources([currentLang]);
          }, 500);
        }
      } catch (error) {
        console.error('Error checking i18n readiness:', error);
        setHasError(true);
      }
    };
    
    // 🔧 Debounce initial check to prevent rapid fire
    checkTimeoutId = setTimeout(checkI18nReady, 100);
    
    // Set up timeout to prevent infinite loading (fallback after 10 seconds)
    timeoutId = setTimeout(() => {
      if (!isI18nReady) {
        console.warn('i18n loading timeout, proceeding with fallback');
        setIsI18nReady(true);
      }
    }, 10000);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(checkTimeoutId);
    };
  }, [ready, i18nInstance]); // 🔧 Removed retryCount from dependencies
  
  // 🔧 Separate effect for event listeners to prevent re-registration
  React.useEffect(() => {
    if (!ready || !i18nInstance) return;
    
    const handleI18nEvent = () => {
      // 🔧 Debounced check to prevent rapid state updates
      setTimeout(() => {
        const currentLang = i18nInstance.language || 'id';
        const hasResources = i18nInstance.hasResourceBundle(currentLang, 'translation');
        const isInitialized = i18nInstance.isInitialized;
        const hasTranslationData = i18nInstance.exists('landing.hero.title', { lng: currentLang });
        
        if (hasResources && isInitialized && hasTranslationData) {
          setIsI18nReady(true);
          setHasError(false);
        }
      }, 200);
    };
    
    const handleFailedLoading = () => {
      console.error('Failed to load i18n resources');
      // 🔧 Only set error after timeout, don't retry from event
      setTimeout(() => {
        setHasError(true);
      }, 1000);
    };
    
    // Listen for language changes and initialization
    i18nInstance.on('initialized', handleI18nEvent);
    i18nInstance.on('languageChanged', handleI18nEvent);
    i18nInstance.on('loaded', handleI18nEvent);
    i18nInstance.on('failedLoading', handleFailedLoading);
    
    return () => {
      i18nInstance.off('initialized', handleI18nEvent);
      i18nInstance.off('languageChanged', handleI18nEvent);
      i18nInstance.off('loaded', handleI18nEvent);
      i18nInstance.off('failedLoading', handleFailedLoading);
    };
  }, [ready, i18nInstance]); // 🔧 Stable dependencies
  
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
