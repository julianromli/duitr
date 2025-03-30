import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { LoginContent } from '@/components/auth/LoginContent';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Client-side only rendering to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Invalid input',
        description: 'Please enter both email and password',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        toast({
          title: 'Welcome back!',
          description: 'You have been logged in successfully.',
        });
        navigate('/');
      } else {
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: result.message || 'An unknown error occurred',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login error',
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    let googleSignInSuccess = false;
    try {
      setIsSubmitting(true);
      const result = await signInWithGoogle();
      googleSignInSuccess = !!(result && result.success);

      if (result && !result.success) {
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: result.message || 'An unknown error occurred during Google sign-in',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login error',
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      if (!googleSignInSuccess) {
        setIsSubmitting(false);
      }
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
                 <div className="h-10 w-full bg-muted rounded-full"></div>
                 <div className="h-4 w-20 bg-muted rounded"></div>
                 <div className="h-10 w-full bg-muted rounded"></div>
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <motion.div
        className="p-6 flex items-start"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
      </motion.div>

      <motion.div
        className="flex-1 flex flex-col p-6 pt-0 items-center justify-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="w-full max-w-sm">
          <motion.div
            className="mb-10 flex flex-col items-center"
            variants={itemVariants}
          >
            <img src="/duitr-logo.svg" alt="Duitr Logo" className="h-16 w-16 mb-4" />
            <h1 className="text-3xl font-semibold text-foreground">Log in to Duitr</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Welcome back! Please enter your details.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="w-full">
            <LoginContent
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              isSubmitting={isSubmitting}
              handleEmailSignIn={handleEmailSignIn}
              handleGoogleSignIn={handleGoogleSignIn}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login; 