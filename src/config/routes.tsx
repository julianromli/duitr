// Route configuration for the application
import React from 'react';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageTransition from '@/components/layout/PageTransition';
import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import BudgetPage from '@/pages/BudgetPage';
import Statistics from '@/pages/Statistics';
import Wallets from '@/pages/Wallets';
import ProfilePage from '@/pages/ProfilePage';
import NotFound from '@/pages/NotFound';
import Offline from '@/pages/Offline';
import Login from '@/pages/auth/Login';
import SignUp from '@/pages/auth/SignUp';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import AuthCallback from '@/pages/auth/AuthCallback';
import TransactionDetailPage from '@/pages/TransactionDetailPage';
import EditCategoryPage from '@/pages/EditCategoryPage';
import SupabaseTestPage from '@/pages/SupabaseTestPage';
import { TestDatePicker } from '@/components/ui/test-date-picker';
import LoginButtonTest from '@/components/test/LoginButtonTest';
import EvaluatePage from '@/features/ai-evaluator/EvaluatePage';

export const mainPages = ['/', '/transactions', '/wallets', '/budget', '/profile', '/statistics', '/ai'];

export const protectedRoutes = [
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/ai',
    element: <EvaluatePage />
  },
  {
    path: '/transactions',
    element: <Transactions />
  },
  {
    path: '/transaction-detail',
    element: <TransactionDetailPage />
  },
  {
    path: '/editcategory',
    element: <EditCategoryPage />
  },
  {
    path: '/budget',
    element: <BudgetPage />
  },
  {
    path: '/statistics',
    element: <Statistics />
  },
  {
    path: '/wallets',
    element: <Wallets />
  },
  {
    path: '/profile',
    element: <ProfilePage />
  }
];

export const publicRoutes = [
  {
    path: '/landing',
    element: <LandingPage />
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
  }
];

export const testRoutes = [
  {
    path: '/test-datepicker',
    element: <TestDatePicker />
  },
  {
    path: '/test-supabase',
    element: <SupabaseTestPage />
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
