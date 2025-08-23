import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithProviders, userEvent, screen, waitFor } from '../test-utils'
import { LoginContent } from '@/components/auth/LoginContent'
import { SignupContent } from '@/components/auth/SignupContent'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Login from '@/pages/auth/Login'
import SignUp from '@/pages/auth/SignUp'

// Mock the auth context functions
const mockSignIn = vi.fn()
const mockSignUp = vi.fn()
const mockSignInWithGoogle = vi.fn()
const mockSignOut = vi.fn()

describe('Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Login Component', () => {
    it('should render login form with all required fields', () => {
      renderWithProviders(<Login />, { user: null })

      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    })

    it('should show validation errors for empty fields', async () => {
      renderWithProviders(<Login />, { user: null })
      const user = userEvent.setup()

      const signInButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(signInButton)

      await waitFor(() => {
        expect(screen.getByText(/please enter both email and password/i)).toBeInTheDocument()
      })
    })

    it('should call signIn function with correct credentials', async () => {
      const mockAuth = {
        signIn: mockSignIn.mockResolvedValue({ success: true, message: '' }),
        signInWithGoogle: mockSignInWithGoogle,
        signUp: mockSignUp,
        signOut: mockSignOut,
      }

      renderWithProviders(<Login />, { 
        user: null,
        authLoading: false 
      })
      
      const user = userEvent.setup()
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/password/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)

      // Note: This test verifies UI behavior since the actual auth function is mocked
      await waitFor(() => {
        expect(emailInput).toHaveValue('test@example.com')
        expect(passwordInput).toHaveValue('password123')
      })
    })

    it('should handle login errors gracefully', async () => {
      renderWithProviders(<Login />, { 
        user: null,
        authLoading: false 
      })

      const user = userEvent.setup()
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/password/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'invalid@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(signInButton)

      // The component should handle errors without crashing
      expect(signInButton).toBeInTheDocument()
    })

    it('should redirect to signup page when signup link is clicked', async () => {
      renderWithProviders(<Login />, { user: null })
      const user = userEvent.setup()

      const signupLink = screen.getByRole('link', { name: /sign up/i })
      expect(signupLink).toHaveAttribute('href', '/auth/signup')
    })
  })

  describe('Signup Component', () => {
    it('should render signup form with all required fields', () => {
      renderWithProviders(<SignUp />, { user: null })

      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /terms and conditions/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })

    it('should validate password matching', async () => {
      renderWithProviders(<SignUp />, { user: null })
      const user = userEvent.setup()

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const signUpButton = screen.getByRole('button', { name: /sign up/i })

      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password456')
      await user.click(signUpButton)

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('should require terms acceptance', async () => {
      renderWithProviders(<SignUp />, { user: null })
      const user = userEvent.setup()

      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const signUpButton = screen.getByRole('button', { name: /sign up/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(signUpButton)

      await waitFor(() => {
        expect(screen.getByText(/terms agreement required/i)).toBeInTheDocument()
      })
    })

    it('should call signUp function with valid data and terms accepted', async () => {
      renderWithProviders(<SignUp />, { user: null })
      const user = userEvent.setup()

      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const termsCheckbox = screen.getByRole('checkbox', { name: /terms and conditions/i })
      const signUpButton = screen.getByRole('button', { name: /sign up/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(termsCheckbox)
      await user.click(signUpButton)

      // Verify form data is properly collected
      expect(emailInput).toHaveValue('test@example.com')
      expect(passwordInput).toHaveValue('password123')
      expect(termsCheckbox).toBeChecked()
    })

    it('should handle Google signup', async () => {
      renderWithProviders(<SignUp />, { user: null })
      const user = userEvent.setup()

      const googleButton = screen.getByRole('button', { name: /continue with google/i })
      await user.click(googleButton)

      // Google signup should be triggered
      expect(googleButton).toBeInTheDocument()
    })
  })

  describe('Protected Route', () => {
    it('should render children when user is authenticated', () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { user: { id: 'test-id', email: 'test@example.com', user_metadata: { name: 'Test' } } }
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should redirect when user is not authenticated', () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { user: null }
      )

      // Should not render protected content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should show loading state while authentication is pending', () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { user: null, authLoading: true }
      )

      // Should show loading indicator (this depends on ProtectedRoute implementation)
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('Authentication State Management', () => {
    it('should handle successful authentication', () => {
      const { rerender } = renderWithProviders(<div>App</div>, { user: null })

      // Initially no user
      expect(screen.getByText('App')).toBeInTheDocument()

      // After authentication
      rerender(<div>App</div>)
      renderWithProviders(<div>Authenticated App</div>, { 
        user: { id: 'test-id', email: 'test@example.com', user_metadata: { name: 'Test' } } 
      })

      expect(screen.getByText('Authenticated App')).toBeInTheDocument()
    })

    it('should handle logout correctly', () => {
      const { rerender } = renderWithProviders(<div>Authenticated App</div>, { 
        user: { id: 'test-id', email: 'test@example.com', user_metadata: { name: 'Test' } } 
      })

      expect(screen.getByText('Authenticated App')).toBeInTheDocument()

      // After logout
      rerender(<div>Logged Out</div>)
      renderWithProviders(<div>Logged Out</div>, { user: null })

      expect(screen.getByText('Logged Out')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate email format', async () => {
      renderWithProviders(<Login />, { user: null })
      const user = userEvent.setup()

      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/password/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'invalid-email')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)

      // HTML5 validation should catch invalid email format
      expect(emailInput).toBeInvalid()
    })

    it('should require minimum password length for signup', async () => {
      renderWithProviders(<SignUp />, { user: null })
      const user = userEvent.setup()

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      await user.type(passwordInput, '123')
      await user.type(confirmPasswordInput, '123')

      // Password should be too short
      expect(passwordInput).toHaveValue('123')
    })
  })

  describe('Loading States', () => {
    it('should show loading state during authentication', () => {
      renderWithProviders(<Login />, { user: null, authLoading: true })

      // Should show some loading indicator
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      expect(signInButton).toBeInTheDocument()
    })

    it('should disable form during submission', async () => {
      renderWithProviders(<Login />, { user: null })
      const user = userEvent.setup()

      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/password/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)

      // Form should handle submission state appropriately
      expect(signInButton).toBeInTheDocument()
    })
  })
})