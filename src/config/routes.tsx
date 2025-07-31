
// Route configuration for the application
import React from 'react';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageTransition from '@/components/layout/PageTransition';

// Lazy load main pages for better performance
const LandingPage = React.lazy(() => import('@/pages/LandingPage'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Transactions = React.lazy(() => import('@/pages/Transactions'));
const BudgetPage = React.lazy(() => import('@/pages/BudgetPage'));
const Statistics = React.lazy(() => import('@/pages/Statistics'));
const Wallets = React.lazy(() => import('@/pages/Wallets'));
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage'));
const TransactionDetailPage = React.lazy(() => import('@/pages/TransactionDetailPage'));
const EditCategoryPage = React.lazy(() => import('@/pages/EditCategoryPage'));

// Keep critical pages as regular imports
import NotFound from '@/pages/NotFound';
import Offline from '@/pages/Offline';
import Login from '@/pages/auth/Login';
import SignUp from '@/pages/auth/SignUp';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import AuthCallback from '@/pages/auth/AuthCallback';

// Lazy load test pages
const SupabaseTestPage = React.lazy(() => import('@/pages/SupabaseTestPage'));
// Lazy load legal pages to reduce initial bundle size
const PrivacyPolicy = React.lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('@/pages/TermsOfService'));
import { TestDatePicker } from '@/components/ui/test-date-picker';
import LoginButtonTest from '@/components/test/LoginButtonTest';

export const mainPages = ['/', '/transactions', '/wallets', '/budget', '/profile', '/statistics'];

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export const protectedRoutes = [
  {
    path: '/',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <Dashboard />
      </React.Suspense>
    )
  },
  {
    path: '/transactions',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <Transactions />
      </React.Suspense>
    )
  },
  {
    path: '/transaction-detail',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <TransactionDetailPage />
      </React.Suspense>
    )
  },
  {
    path: '/editcategory',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <EditCategoryPage />
      </React.Suspense>
    )
  },
  {
    path: '/budget',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <BudgetPage />
      </React.Suspense>
    )
  },
  {
    path: '/statistics',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <Statistics />
      </React.Suspense>
    )
  },
  {
    path: '/wallets',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <Wallets />
      </React.Suspense>
    )
  },
  {
    path: '/profile',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <ProfilePage />
      </React.Suspense>
    )
  }
];

export const publicRoutes = [
  {
    path: '/landing',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <LandingPage />
      </React.Suspense>
    )
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <SignUp />
  },
  {
    path: '/forgotpassword',
    element: <ForgotPassword />
  },
  {
    path: '/reset-password',
    element: <ResetPassword />
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />
  },
  {
    path: '/privacy',
    element: (
      <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <PrivacyPolicy />
      </React.Suspense>
    )
  },
  {
    path: '/terms',
    element: (
      <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <TermsOfService />
      </React.Suspense>
    )
  }
];

export const testRoutes = [
  {
    path: '/test-datepicker',
    element: <TestDatePicker />
  },
  {
    path: '/test-supabase',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <SupabaseTestPage />
      </React.Suspense>
    )
  },
  {
    path: '/test-login-button',
    element: <LoginButtonTest />
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
    element: <Offline />
  }
];
