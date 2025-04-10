import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockSupabaseClient } from './mocks/supabaseMock';
import { signInWithGoogle } from '@/lib/supabase';

// Mock the supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient
}));

// Mock the auth-logger
vi.mock('@/utils/auth-logger', () => ({
  logAuthEvent: vi.fn()
}));

// Mock window.location
const originalLocation = window.location;

describe('Google Authentication Flow', () => {
  beforeEach(() => {
    // Mock environment variables
    vi.stubEnv('MODE', 'development');
    
    // Mock the window.location
    delete window.location;
    window.location = {
      ...originalLocation,
      origin: 'http://localhost:5173',
      href: 'http://localhost:5173/auth/login'
    };
    
    // Reset localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.resetAllMocks();
    window.location = originalLocation;
  });

  it('should successfully initiate Google sign in', async () => {
    // Mock successful OAuth response
    mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
      data: { provider: 'google', url: 'https://accounts.google.com/o/oauth2/auth?response_type=code&...' },
      error: null
    });

    const result = await signInWithGoogle();
    
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data?.provider).toBe('google');
    expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({
        redirectTo: 'http://localhost:5173/auth/callback',
        queryParams: expect.objectContaining({
          access_type: 'offline',
          prompt: 'consent'
        })
      })
    });
  });

  it('should handle errors during Google sign in initiation', async () => {
    // Mock error response
    mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
      data: null,
      error: { message: 'Failed to initiate OAuth flow' }
    });

    const result = await signInWithGoogle();
    
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Failed to initiate OAuth flow');
    expect(result.data).toBeNull();
  });

  it('should properly handle iOS devices', async () => {
    // Mock iOS device
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true
    });

    mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
      data: { provider: 'google', url: 'https://accounts.google.com/o/oauth2/auth?response_type=code&...' },
      error: null
    });

    const result = await signInWithGoogle();
    
    expect(result.error).toBeNull();
    expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({
        queryParams: expect.objectContaining({
          response_mode: 'query'
        })
      })
    });

    // Restore original user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    });
  });
}); 