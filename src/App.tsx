import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FinanceProvider } from "@/context/FinanceContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Wallets from "@/pages/Wallets";
import BudgetPage from "@/pages/BudgetPage";
import Statistics from "@/pages/Statistics";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/NotFound";
import Offline from "@/pages/Offline";
import Login from "@/pages/auth/Login";
import SignUp from "@/pages/auth/SignUp";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import AuthCallback from "@/pages/auth/AuthCallback";
import TransactionDetailPage from "@/pages/TransactionDetailPage";
import { useEffect, useState } from "react";
import { TestDatePicker } from "@/components/ui/test-date-picker";
import { InstallAppBanner } from "@/components/shared/InstallAppBanner";
import EditCategoryPage from "@/pages/EditCategoryPage";
import SupabaseTestPage from "@/pages/SupabaseTestPage";

const queryClient = new QueryClient();

// Main App component structure
const AppContent = () => {
  const { isLoading, user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return <Offline />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Root path now checks auth and shows either app or redirects to landing */}
        <Route path="/" element={<RootRoute />} />
        
        {/* Move landing page to /landing */}
        <Route path="/landing" element={<LandingPage />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Redirects for potential 404 during auth flow */}
        <Route path="/r5sms-*" element={<Navigate to="/auth/callback" replace />} />
        <Route path="/sin1:*" element={<Navigate to="/auth/callback" replace />} />
        <Route path="*NOT_FOUND*" element={<Navigate to="/auth/callback" replace />} />

        {/* Offline page */}
        <Route path="/offline" element={<Offline />} />
        
        {/* Test Routes */}
        <Route path="/test-datepicker" element={<TestDatePicker />} />
        <Route path="/test-supabase" element={<SupabaseTestPage />} />

        {/* Protected App Routes - Notice /app route is removed as it's now at root */}
        <Route
          path="/transactions"
          element={<ProtectedRoute><Layout><Transactions /></Layout></ProtectedRoute>}
        />
        <Route
          path="/transaction-detail"
          element={<ProtectedRoute><Layout><TransactionDetailPage /></Layout></ProtectedRoute>}
        />
        <Route
          path="/editcategory"
          element={<ProtectedRoute><Layout><EditCategoryPage /></Layout></ProtectedRoute>}
        />
        <Route
          path="/budget"
          element={<ProtectedRoute><Layout><BudgetPage /></Layout></ProtectedRoute>}
        />
        <Route
          path="/statistics"
          element={<ProtectedRoute><Layout><Statistics /></Layout></ProtectedRoute>}
        />
        <Route
          path="/wallets"
          element={<ProtectedRoute><Layout><Wallets /></Layout></ProtectedRoute>}
        />
        <Route
          path="/profile"
          element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>}
        />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster />
      <Sonner />
      <InstallAppBanner />
    </BrowserRouter>
  );
}

// Layout component for protected routes
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-md mx-auto bg-background min-h-screen">
    <main className="pb-24">
      {children}
    </main>
    <Navbar />
  </div>
);

// Add a new component to handle root path routing
const RootRoute = () => {
  const { user, isLoading } = useAuth();
  
  // While checking auth status, show loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If user is logged in, show Dashboard, otherwise redirect to landing page
  return user ? (
    <Layout><Dashboard /></Layout>
  ) : (
    <Navigate to="/landing" replace />
  );
};

// App wrapper providing all contexts
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider>
            <AuthProvider>
              <FinanceProvider>
                <AppContent />
              </FinanceProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nextProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
