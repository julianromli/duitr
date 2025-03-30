import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginForm } from './LoginForm';
import { MemoryRouter } from 'react-router-dom';

// Mock props needed by LoginForm
const mockProps = {
  email: '',
  setEmail: vi.fn(),
  password: '',
  setPassword: vi.fn(),
  isSubmitting: false,
  handleEmailSignIn: vi.fn(),
  handleGoogleSignIn: vi.fn(),
};

describe('LoginForm', () => {
  it('renders login button', () => {
    render(
      <MemoryRouter>
        <LoginForm {...mockProps} />
      </MemoryRouter>
    );
    
    // Check for the button content
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('uses theme colors correctly', () => {
    const { container } = render(
      <MemoryRouter>
        <LoginForm {...mockProps} />
      </MemoryRouter>
    );
    
    // Check for theme color usage in the component
    // This is a basic check - we'd need more sophisticated tests for actual styles
    expect(container.querySelector('.text-foreground')).toBeInTheDocument();
    expect(container.querySelector('.text-muted-foreground')).toBeInTheDocument();
    expect(container.querySelector('.text-primary')).toBeInTheDocument();
  });

  it('renders link to signup page with correct href', () => {
    render(
      <MemoryRouter>
        <LoginForm {...mockProps} />
      </MemoryRouter>
    );
    
    // Find the link by its text
    const signUpLink = screen.getByRole('link', { name: /sign up/i });
    
    // Assert that the href points to the correct route
    expect(signUpLink).toHaveAttribute('href', '/auth/signup');
  });
}); 