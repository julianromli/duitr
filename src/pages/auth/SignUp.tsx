import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { SignupContent } from '@/components/auth/SignupContent';
import { WebViewWarningModal } from '@/components/auth/WebViewWarningModal';
import { validatePassword, validateEmail, sanitizeEmail } from '@/utils/password-validation';
import { shouldWarnAboutGoogleOAuth } from '@/utils/webview-detection';
import { logAuthEvent } from '@/utils/auth-logger';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showWebViewWarning, setShowWebViewWarning] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!email || !password || !username) {
      toast({
        variant: 'destructive',
        title: 'Invalid input',
        description: 'Please fill in all fields',
      });
      return;
    }
    
    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      toast({
        variant: 'destructive',
        title: 'Invalid email',
        description: emailValidation.error,
      });
      return;
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast({
        variant: 'destructive',
        title: 'Weak password',
        description: passwordValidation.errors[0] || 'Please choose a stronger password',
      });
      return;
    }
    
    // Check terms agreement
    if (!agreedToTerms) {
      toast({
        variant: 'destructive',
        title: 'Terms Agreement Required',
        description: 'You must agree to the Terms and Conditions to sign up',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Sanitize email before signup
      const sanitizedEmail = sanitizeEmail(email);
      const result = await signUp(sanitizedEmail, password);
      
      if (result.success) {
        toast({
          title: 'Account created',
          description: 'Your account has been created successfully. Please check your email to verify.',
        });
        navigate('/login');
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign up failed',
          description: result.message || 'An unknown error occurred',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign up error',
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    // Check if we're in a WebView or in-app browser first
    if (shouldWarnAboutGoogleOAuth()) {
      logAuthEvent('signup_google_blocked_webview');
      setShowWebViewWarning(true);
      return;
    }
    
    let googleSignInSuccess = false;
    try {
      setIsSubmitting(true);
      const result = await signInWithGoogle();
      googleSignInSuccess = !!(result && result.success);

      // Check if blocked by WebView (double safety check)
      if (result && (result as any).isWebViewBlocked) {
        logAuthEvent('signup_google_blocked_webview_secondary');
        setShowWebViewWarning(true);
        return;
      }

      if (result && !result.success) {
        toast({
          variant: 'destructive',
          title: 'Sign up failed',
          description: result.message || 'An unknown error occurred during Google sign-up',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign up error',
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      if (!googleSignInSuccess) {
        setIsSubmitting(false);
      }
    }
  };
  
  const handleUseEmailInstead = () => {
    // Close modal and let user use email signup
    setShowWebViewWarning(false);
    // Optionally focus on email input
    // You can add a ref to the email input and focus it here
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

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <div className="p-6 flex items-start">
          <span className="p-1 rounded-full opacity-50">
            <ChevronLeft size={24} />
          </span>
        </div>
        <div className="flex-1 flex flex-col p-6 pt-0 items-center justify-center">
          <div className="w-full max-w-sm space-y-6 animate-pulse">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted"></div>
              <div className="h-8 w-56 bg-muted rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-10 w-full bg-muted rounded-full"></div>
              <div className="h-4 w-20 bg-muted rounded"></div>
              <div className="h-10 w-full bg-muted rounded"></div>
              <div className="h-4 w-20 bg-muted rounded"></div>
              <div className="h-10 w-full bg-muted rounded"></div>
              <div className="h-4 w-20 bg-muted rounded"></div>
              <div className="h-10 w-full bg-muted rounded"></div>
              <div className="flex items-start space-x-2 pt-2">
                <div className="h-4 w-4 bg-muted rounded"></div>
                <div className="space-y-1.5">
                  <div className="h-4 w-48 bg-muted rounded"></div>
                  <div className="h-3 w-64 bg-muted rounded"></div>
                </div>
              </div>
              <div className="h-10 w-full bg-muted rounded-full pt-4"></div>
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
            <img src="/pwa-icons/new/192.png" alt="Duitr Logo" className="h-16 w-16 mb-4" />
            <h1 className="text-3xl font-semibold text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-2">
Enter your details below to get started.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="w-full">
            <SignupContent
              username={username}
              setUsername={setUsername}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              agreedToTerms={agreedToTerms}
              setAgreedToTerms={setAgreedToTerms}
              isSubmitting={isSubmitting}
              handleEmailSignUp={handleEmailSignUp}
              handleGoogleSignUp={handleGoogleSignUp}
            />
          </motion.div>
        </div>
      </motion.div>
      
      {/* WebView Warning Modal */}
      <WebViewWarningModal
        open={showWebViewWarning}
        onOpenChange={setShowWebViewWarning}
        onUseEmailInstead={handleUseEmailInstead}
      />
    </div>
  );
};

export default SignUp; 