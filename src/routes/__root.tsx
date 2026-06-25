import type { ReactNode } from 'react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { TransitionProvider } from '@/context/TransitionContext';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { CurrencyOnboardingDialog } from '@/components/currency/CurrencyOnboardingDialog';
import { useCurrencyOnboarding } from '@/hooks/useCurrencyOnboarding';
import { AppShell } from '@/components/app/AppShell';
import { CANONICAL_SITE_URL } from '@/config/auth-routes';
import { DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE } from '@/lib/seo';
import i18n from '@/i18n';
import appCss from '@/index.css?url';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: (query) => {
        if (query.queryKey[0] === 'categories') {
          return 5 * 60 * 1000;
        }
        if (query.queryKey[0] === 'transactions') {
          return 2 * 60 * 1000;
        }
        if (query.queryKey[0] === 'budgets') {
          return 3 * 60 * 1000;
        }
        return 10 * 60 * 1000;
      },
      retry: (failureCount, error: unknown) => {
        const errorWithStatus = error as { status?: number };
        if (errorWithStatus?.status >= 400 && errorWithStatus?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      refetchOnReconnect: 'always',
    },
  },
});

const AppLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

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

const AppWrapper: React.FC = () => {
  const { ready, i18n: i18nInstance } = useTranslation();
  const [isI18nReady, setIsI18nReady] = React.useState(false);

  React.useEffect(() => {
    const checkReady = () => {
      if (!ready || !i18nInstance.isInitialized) {
        return false;
      }

      const currentLang = i18nInstance.language || 'id';
      return i18nInstance.hasResourceBundle(currentLang, 'translation');
    };

    if (checkReady()) {
      setIsI18nReady(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (checkReady()) {
        setIsI18nReady(true);
      } else {
        console.warn('i18n timeout - proceeding with available translations');
        setIsI18nReady(true);
      }
    }, 1000);

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
            <TransitionProvider>
              <AppShell />
            </TransitionProvider>
          </CurrencyOnboardingWrapper>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' },
      { title: DEFAULT_SITE_TITLE },
      {
        name: 'description',
        content: DEFAULT_SITE_DESCRIPTION,
      },
      { name: 'theme-color', content: '#C6FE1E' },
      { name: 'application-name', content: 'Duitr' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'stylesheet', href: '/fonts.css' },
      { rel: 'manifest', href: '/manifest.json', crossOrigin: 'use-credentials' },
      { rel: 'icon', type: 'image/png', href: '/pwa-icons/new/32.png' },
      { rel: 'apple-touch-icon', href: '/pwa-icons/new/apple-touch-icon.png' },
      { rel: 'canonical', href: `${CANONICAL_SITE_URL}/` },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <I18nextProvider i18n={i18n}>
            <AppWrapper />
          </I18nextProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        <script src="/auth-helper.js" />
        <script src="/pwa-register.js" />
      </body>
    </html>
  );
}
