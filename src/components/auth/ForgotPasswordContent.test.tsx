import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ForgotPasswordContent } from './ForgotPasswordContent';
import { MemoryRouter } from 'react-router-dom';

// Mock props needed by ForgotPasswordContent
const mockProps = {
  email: '',
  setEmail: vi.fn(),
  isSubmitting: false,
  isEmailSent: false,
  handleResetPassword: vi.fn(),
};

describe('ForgotPasswordContent', () => {
  it('renders reset password button when not sent', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordContent {...mockProps} />
      </MemoryRouter>
    );
    
    // Check for the button content
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('uses theme colors correctly', () => {
    const { container } = render(
      <MemoryRouter>
        <ForgotPasswordContent {...mockProps} />
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
        <ForgotPasswordContent {...mockProps} />
      </MemoryRouter>
    );
    
    // Find the link by its text
    const loginLink = screen.getByRole('link', { name: /back to login/i });
    
    // Assert that the link points to the correct route
    expect(loginLink).toHaveAttribute('to', '/login');
  });

  it('renders success message when email is sent', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordContent {...{...mockProps, isEmailSent: true, email: 'test@example.com'}} />
      </MemoryRouter>
    );
    
    // Check for success message
    expect(screen.getByText(/email sent/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to login/i })).toBeInTheDocument();
  });
}); 