
// Route configuration for the application
import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TranslationErrorBoundary } from '@/components/shared/ErrorBoundary';

// Lazy load components for code splitting
const LandingPage = React.lazy(() => import('@/pages/LandingPage'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Transactions = React.lazy(() => import('@/pages/Transactions'));
const BudgetPage = React.lazy(() => import('@/pages/BudgetPage'));
const Statistics = React.lazy(() => import('@/pages/Statistics'));
const Wallets = React.lazy(() => import('@/pages/Wallets'));
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));
const Offline = React.lazy(() => import('@/pages/Offline'));
const Login = React.lazy(() => import('@/pages/auth/Login'));
const SignUp = React.lazy(() => import('@/pages/auth/SignUp'));
const ForgotPassword = React.lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('@/pages/auth/ResetPassword'));
const AuthCallback = React.lazy(() => import('@/pages/auth/AuthCallback'));
const TransactionDetailPage = React.lazy(() => import('@/pages/TransactionDetailPage'));
const EditCategoryPage = React.lazy(() => import('@/pages/EditCategoryPage'));
const SupabaseTestPage = React.lazy(() => import('@/pages/SupabaseTestPage'));
const PrivacyPolicy = React.lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('@/pages/TermsOfService'));
const TestDatePicker = React.lazy(() => import('@/components/ui/test-date-picker').then(module => ({ default: module.TestDatePicker })));
const LoginButtonTest = React.lazy(() => import('@/components/test/LoginButtonTest'));

// Enhanced loading component that's aware of translation state
const LoadingSpinner = () => {
  const { ready } = useTranslation();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="text-muted-foreground text-sm">
          {ready ? 'Loading...' : 'Loading translations...'}
        </p>
      </div>
    </div>
  );
};

// Enhanced wrapper component for lazy loaded components with translation error handling
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <TranslationErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  </TranslationErrorBoundary>
);

export const mainPages = ['/', '/transactions', '/wallets', '/budget', '/profile', '/statistics'];

export const protectedRoutes = [
  {
    path: '/',
    element: <LazyWrapper><Dashboard /></LazyWrapper>
  },
  {
    path: '/transactions',
    element: <LazyWrapper><Transactions /></LazyWrapper>
  },
  {
    path: '/transaction-detail',
    element: <LazyWrapper><TransactionDetailPage /></LazyWrapper>
  },
  {
    path: '/editcategory',
    element: <LazyWrapper><EditCategoryPage /></LazyWrapper>
  },
  {
    path: '/budget',
    element: <LazyWrapper><BudgetPage /></LazyWrapper>
  },
  {
    path: '/statistics',
    element: <LazyWrapper><Statistics /></LazyWrapper>
  },
  {
    path: '/wallets',
    element: <LazyWrapper><Wallets /></LazyWrapper>
  },
  {
    path: '/profile',
    element: <LazyWrapper><ProfilePage /></LazyWrapper>
  }
];

export const publicRoutes = [
  {
    path: '/landing',
    element: <LazyWrapper><LandingPage /></LazyWrapper>
  },
  {
    path: '/login',
    element: <LazyWrapper><Login /></LazyWrapper>
  },
  {
    path: '/signup',
    element: <LazyWrapper><SignUp /></LazyWrapper>
  },
  {
    path: '/forgotpassword',
    element: <LazyWrapper><ForgotPassword /></LazyWrapper>
  },
  {
    path: '/reset-password',
    element: <LazyWrapper><ResetPassword /></LazyWrapper>
  },
  {
    path: '/auth/callback',
    element: <LazyWrapper><AuthCallback /></LazyWrapper>
  },
  {
    path: '/privacy',
    element: <LazyWrapper><PrivacyPolicy /></LazyWrapper>
  },
  {
    path: '/terms',
    element: <LazyWrapper><TermsOfService /></LazyWrapper>
  }
];

export const testRoutes = [
  {
    path: '/test-datepicker',
    element: <LazyWrapper><TestDatePicker /></LazyWrapper>
  },
  {
    path: '/test-supabase',
    element: <LazyWrapper><SupabaseTestPage /></LazyWrapper>
  },
  {
    path: '/test-login-button',
    element: <LazyWrapper><LoginButtonTest /></LazyWrapper>
  }
];

export const fallbackRoutes = [
  {
    path: '/r5sms-*',
    element: <Navigate to="/auth/callback" replace />
  },
  {
    path: '/sin1:*',
    element: <Navigate to="/auth/callback" replace />
  },
  {
    path: '*NOT_FOUND*',
    element: <Navigate to="/auth/callback" replace />
  },
  {
    path: '/offline',
    element: <LazyWrapper><Offline /></LazyWrapper>
  }
];
