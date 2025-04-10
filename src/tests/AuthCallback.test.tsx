import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AuthCallback from '@/pages/auth/AuthCallback';
import { mockSupabaseClient } from './mocks/supabaseMock';
import { AuthProvider } from '@/context/AuthContext';

// Mock the supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient
}));

// Mock the auth-logger
vi.mock('@/utils/auth-logger', () => ({
  logAuthEvent: vi.fn()
}));

// Mock isIOS function
vi.mock('@/lib/supabase', () => ({
  isIOS: () => false,
  supabase: mockSupabaseClient,
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  getCurrentUser: vi.fn()
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const renderWithProviders = () => {
  return render(
    <MemoryRouter initialEntries={['/auth/callback?code=test-auth-code']}>
      <AuthProvider>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<div>Dashboard</div>} />
          <Route path="/auth/login" element={<div>Login</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('AuthCallback Component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Mock successful getSession response initially with no session
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should show loading state initially', async () => {
    renderWithProviders();
    
    expect(screen.getByText('Completing authentication...')).toBeInTheDocument();
  });

  it('should handle successful authentication with code parameter', async () => {
    // Mock successful exchange of code for session
    mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
      data: { 
        session: { 
          user: { id: 'user-123', email: 'test@example.com' }
        }
      },
      error: null
    });
    
    renderWithProviders();
    
    // Should navigate to dashboard on success
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
    
    expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-auth-code');
  });

  it('should handle authentication error', async () => {
    // Mock error in exchanging code for session
    mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
      data: null,
      error: { message: 'Invalid authentication code' }
    });
    
    renderWithProviders();
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Authentication Error')).toBeInTheDocument();
      expect(screen.getByText('Invalid authentication code')).toBeInTheDocument();
    });
    
    // Should have retry and back to login buttons
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Back to Login')).toBeInTheDocument();
  });

  it('should handle existing session', async () => {
    // Mock existing session
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { 
        session: { 
          user: { id: 'user-456', email: 'existing@example.com' }
        }
      },
      error: null
    });
    
    renderWithProviders();
    
    // Should navigate to dashboard with existing session
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
    
    // Should not try to exchange code
    expect(mockSupabaseClient.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });
}); 