
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
  
  React.useEffect(() => {
    // Simple readiness check with timeout
    const checkReady = () => {
      if (!ready || !i18nInstance.isInitialized) {
        return false;
      }
      
      const currentLang = i18nInstance.language || 'id';
      const hasResources = i18nInstance.hasResourceBundle(currentLang, 'translation');
      
      return hasResources;
    };
    
    // Immediate check
    if (checkReady()) {
      setIsI18nReady(true);
      return;
    }
    
    // Wait for i18n to be ready with short timeout
    const timeoutId = setTimeout(() => {
      if (checkReady()) {
        setIsI18nReady(true);
      } else {
        // Force proceed after timeout - translations are bundled so they should always be available
        console.warn('i18n timeout - proceeding with available translations');
        setIsI18nReady(true);
      }
    }, 1000);
    
    // Listen for i18n ready events
    const handleReady = () => {
      if (checkReady()) {
        setIsI18nReady(true);
      }
    };
    
    i18nInstance.on('initialized', handleReady);
    i18nInstance.on('loaded', handleReady);
    i18nInstance.on('languageChanged', handleReady);
    
    return () => {
      clearTimeout(timeoutId);
      i18nInstance.off('initialized', handleReady);
      i18nInstance.off('loaded', handleReady);
      i18nInstance.off('languageChanged', handleReady);
    };
  }, [ready, i18nInstance]);
  
  if (!isI18nReady) {
    return <AppLoadingScreen />;
  }
  
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App Error Boundary caught error:', error, errorInfo);
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
