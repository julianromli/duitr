import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SignupContent } from './SignupContent';
import { MemoryRouter } from 'react-router-dom';

// Mock props needed by SignupContent
const mockProps = {
  username: '',
  setUsername: vi.fn(),
  email: '',
  setEmail: vi.fn(),
  password: '',
  setPassword: vi.fn(),
  agreedToTerms: false,
  setAgreedToTerms: vi.fn(),
  isSubmitting: false,
  handleEmailSignUp: vi.fn(),
  handleGoogleSignUp: vi.fn(),
};

describe('SignupContent', () => {
  it('renders signup button', () => {
    render(
      <MemoryRouter>
        <SignupContent {...mockProps} />
      </MemoryRouter>
    );
    
    // Check for the button content
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('uses theme colors correctly', () => {
    const { container } = render(
      <MemoryRouter>
        <SignupContent {...mockProps} />
      </MemoryRouter>
    );
    
    // Check for theme color usage in the component
    // This is a basic check - we'd need more sophisticated tests for actual styles
    expect(container.querySelector('.text-foreground')).toBeInTheDocument();
    expect(container.querySelector('.text-muted-foreground')).toBeInTheDocument();
    expect(container.querySelector('.text-primary')).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    render(
      <MemoryRouter>
        <SignupContent {...mockProps} />
      </MemoryRouter>
    );
    
    // Find the link by its text
    const loginLink = screen.getByRole('link', { name: /log in/i });
    
    // Assert that the link points to the correct route
    expect(loginLink).toHaveAttribute('to', '/login');
  });

  it('renders terms checkbox', () => {
    render(
      <MemoryRouter>
        <SignupContent {...mockProps} />
      </MemoryRouter>
    );
    
    // Check for the terms checkbox
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });
}); 