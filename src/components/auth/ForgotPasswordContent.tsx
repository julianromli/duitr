// Component: ForgotPasswordContent
// Description: Renders the UI for the forgot password form (inputs, buttons, links).
// To be used within the ForgotPassword page component which handles state and logic.

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useId } from "react";
import { Link } from "react-router-dom";

// Define props expected from the parent ForgotPassword page
interface ForgotPasswordContentProps {
  email: string;
  setEmail: (value: string) => void;
  isSubmitting: boolean;
  isEmailSent: boolean;
  handleResetPassword: (e: React.FormEvent) => Promise<void>;
}

function ForgotPasswordContent({
  email,
  setEmail,
  isSubmitting,
  isEmailSent,
  handleResetPassword,
}: ForgotPasswordContentProps) {
  const id = useId();

  return (
    <>
      {isEmailSent ? (
        <div className="text-center space-y-6">
          <div
            className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center"
          >
            <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Email Sent!</h2>
          <p className="text-muted-foreground">
            We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>. 
            Please check your inbox and follow the instructions to reset your password.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link to="/auth/login">Return to Login</Link>
          </Button>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground mb-8 text-center">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${id}-email`} className="text-foreground">Email address</Label>
                <Input
                  id={`${id}-email`}
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-auto py-3"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-4" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          </form>
          
          {/* Link to Login */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Remember your password?{' '}
            <Link to="/auth/login" className="text-primary underline hover:no-underline">
              Back to Login
            </Link>
          </p>
        </>
      )}
    </>
  );
}

export { ForgotPasswordContent }; 