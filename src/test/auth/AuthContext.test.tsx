import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

// Create wrapper for AuthProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication State', () => {
    it('should initialize with no user and not loading', async () => {
      // Mock getSession to return no session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.isBalanceHidden).toBe(false)
    })

    it('should load user when session exists', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
          is_balance_hidden: true
        }
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token'
          } 
        },
        error: null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      expect(result.current.isBalanceHidden).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Authentication Methods', () => {
    it('should handle successful email sign in', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const signInResult = await result.current.signIn('test@example.com', 'password123')

      expect(signInResult.success).toBe(true)
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle sign in errors', async () => {
      const errorMessage = 'Invalid login credentials'
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: errorMessage }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const signInResult = await result.current.signIn('test@example.com', 'wrongpassword')

      expect(signInResult.success).toBe(false)
      expect(signInResult.message).toBe(errorMessage)
    })

    it('should handle successful sign up', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const signUpResult = await result.current.signUp('test@example.com', 'password123')

      expect(signUpResult.success).toBe(true)
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: expect.objectContaining({
          emailRedirectTo: expect.any(String),
          data: {
            name: 'test'
          }
        })
      })
    })

    it('should handle Google sign in', async () => {
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { url: 'https://oauth-url.com', provider: 'google' },
        error: null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const googleSignInResult = await result.current.signInWithGoogle()

      expect(googleSignInResult.success).toBe(true)
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: expect.any(String)
        })
      })
    })

    it('should handle sign out', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.signOut()

      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('Balance Visibility', () => {
    it('should toggle balance visibility', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
          is_balance_hidden: false
        }
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token'
          } 
        },
        error: null
      })

      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      expect(result.current.isBalanceHidden).toBe(false)

      // Toggle balance visibility
      await result.current.updateBalanceVisibility(true)

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: {
          is_balance_hidden: true
        }
      })
    })
  })

  describe('Auth State Changes', () => {
    it('should listen for auth state changes', async () => {
      const mockUnsubscribe = vi.fn()
      const mockSubscription = {
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe
          }
        }
      }

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue(mockSubscription as any)

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled()

      // Cleanup should unsubscribe
      unmount()
      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('should handle auth state change events', async () => {
      let authChangeCallback: (event: string, session: any) => void

      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authChangeCallback = callback
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn()
            }
          }
        } as any
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Simulate sign in event
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' }
      }

      authChangeCallback!('SIGNED_IN', {
        user: mockUser,
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token'
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle session initialization errors', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBe(null)
    })

    it('should handle exceptions during authentication', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(
        new Error('Network error')
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const signInResult = await result.current.signIn('test@example.com', 'password123')

      expect(signInResult.success).toBe(false)
      expect(signInResult.message).toBe('Network error')
    })
  })
})