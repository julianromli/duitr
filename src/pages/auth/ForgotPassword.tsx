import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { ForgotPasswordContent } from '@/components/auth/ForgotPasswordContent';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Client-side only rendering to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Invalid input',
        description: 'Please enter your email address',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Reset failed',
          description: error.message || 'An unknown error occurred',
        });
      } else {
        setIsEmailSent(true);
        toast({
          title: 'Email sent',
          description: 'Check your inbox for the password reset link',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Reset error',
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  // Simplified static version for SSR
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <div className="p-6 flex items-start">
          <span className="p-1 rounded-full opacity-50">
            <ChevronLeft size={24} />
          </span>
        </div>
        <div className="flex-1 flex flex-col p-6 pt-0 items-center justify-center">
           {/* Basic Loading Skeleton */}
           <div className="w-full max-w-sm space-y-6 animate-pulse">
              <div className="flex flex-col items-center space-y-4">
                 <div className="w-16 h-16 rounded-full bg-muted"></div>
                 <div className="h-8 w-48 bg-muted rounded"></div>
                 <div className="h-4 w-64 bg-muted rounded"></div>
              </div>
              <div className="space-y-4">
                 <div className="h-4 w-20 bg-muted rounded"></div>
                 <div className="h-10 w-full bg-muted rounded"></div>
                 <div className="h-10 w-full bg-muted rounded-full"></div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    // Use theme background and text color
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header with back button */}
      <motion.div
        className="p-6 flex items-start"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
      </motion.div>

      <motion.div
        className="flex-1 flex flex-col p-6 pt-0 items-center justify-center" // Center content
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
         <div className="w-full max-w-sm"> {/* Constrain width */}
            {/* Logo and Title */}
            <motion.div
              className="mb-10 flex flex-col items-center" // Reduced margin
              variants={itemVariants}
            >
              {/* Use img tag for logo */}
              <img src="/duitr-logo.svg" alt="Duitr Logo" className="h-16 w-16 mb-4" />
              <h1 className="text-3xl font-semibold text-foreground">Reset Password</h1>
              <p className="text-sm text-muted-foreground mt-2">
                We'll send you instructions to reset your password
              </p>
            </motion.div>

            {/* Integrate ForgotPasswordContent Component */}
            <motion.div variants={itemVariants} className="w-full">
                 <ForgotPasswordContent
                    email={email}
                    setEmail={setEmail}
                    isSubmitting={isSubmitting}
                    isEmailSent={isEmailSent}
                    handleResetPassword={handleResetPassword}
                 />
            </motion.div>
          </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword; 