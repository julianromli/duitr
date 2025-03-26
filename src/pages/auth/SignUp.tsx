import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { FaGoogle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { supabase, testDirectSignup } from '@/lib/supabase'; // Import fungsi test

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Invalid input',
        description: 'Please fill in all required fields',
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Password mismatch',
        description: 'Passwords do not match',
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Password too short',
        description: 'Password must be at least 6 characters long',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Try with direct Supabase call first
      const directResult = await testDirectSignup(email, password);
      console.log("Direct signup test result:", directResult);
      
      // Then try with the normal Supabase client
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      console.log("Signup response:", { data, error }); // Detailed logging
      
      if (error) {
        console.error("Signup error details:", error);
        toast({
          variant: 'destructive',
          title: 'Sign up failed',
          description: `Error: ${error.message}. Code: ${error.status || 'unknown'}`,
        });
        return;
      }
      
      if (data?.user) {
        toast({
          title: 'Account created!',
          description: 'Please check your email for verification link',
        });
        navigate('/auth/login');
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign up failed',
          description: 'No user data returned, but no error either. Please try again.',
        });
      }
    } catch (error: any) {
      console.error("Exception during signup:", error);
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
    try {
      setIsSubmitting(true);
      const result = await signInWithGoogle();
      
      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Sign up failed',
          description: result.message,
        });
      }
      // If successful, user will be redirected to Google
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

  // Fungsi debug untuk cek session
  const debugCheckSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      console.log("Current session check:", { data, error });
      
      // Tampilkan info URL dan key dari environment variable
      console.log("Supabase config check:", { 
        envUrl: import.meta.env.VITE_SUPABASE_URL || 'not set',
        keyPrefix: (import.meta.env.VITE_SUPABASE_ANON_KEY || 'not set').substring(0, 10) + '...'
      });
      
      toast({
        title: 'Debug info',
        description: `Check console for session data`,
      });
    } catch (e) {
      console.error("Error checking session:", e);
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

  return (
    <div className="min-h-screen bg-[#FFF3AA] flex items-center justify-center p-4">
      <motion.div 
        className="max-w-md w-full bg-[#E6DDFF] rounded-3xl overflow-hidden shadow-lg"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Unicorn Illustration */}
        <motion.div 
          className="p-8 flex flex-col items-center"
          variants={itemVariants}
        >
          <div className="relative w-44 h-44 mb-4">
            {/* Unicorn head and body */}
            <div className="absolute w-40 h-44 bg-[#FFC0CB] rounded-t-[120px] rounded-bl-[80px] rounded-br-[30px] transform rotate-6">
              {/* Ears */}
              <div className="absolute top-5 right-4 w-6 h-10 bg-[#FFC0CB] rounded-full transform rotate-[-20deg]"></div>
              
              {/* Horn */}
              <div className="absolute top-0 left-1/2 w-3 h-10 bg-white transform -translate-x-1/2 -translate-y-4 rotate-[-10deg]">
                {/* Horn stripes */}
                <div className="absolute top-1 w-full h-0.5 bg-black transform rotate-[-70deg]"></div>
                <div className="absolute top-3 w-full h-0.5 bg-black transform rotate-[-70deg]"></div>
                <div className="absolute top-5 w-full h-0.5 bg-black transform rotate-[-70deg]"></div>
              </div>
              
              {/* Eye */}
              <div className="absolute top-16 right-10 w-4 h-2 bg-black rounded-full"></div>
              
              {/* Eyelid closed (smile) */}
              <div className="absolute top-16 right-12 w-6 h-3 border-b-2 border-black rounded-b-full"></div>
              
              {/* Mane */}
              <div className="absolute top-10 left-6 w-10 h-12 bg-black rounded-full"></div>
              <div className="absolute top-14 left-4 w-8 h-8 bg-black rounded-full"></div>
              <div className="absolute top-18 left-2 w-6 h-6 bg-black rounded-full"></div>
              
              {/* Spots */}
              <div className="absolute bottom-10 left-1/2 w-8 h-8 bg-black rounded-full"></div>
              <div className="absolute bottom-20 left-1/3 w-6 h-6 bg-black rounded-full"></div>
              <div className="absolute bottom-14 left-2/3 w-4 h-4 bg-black rounded-full"></div>
              
              {/* Mouth */}
              <div className="absolute top-24 right-10 w-8 h-1 bg-black"></div>
              
              {/* White spot */}
              <div className="absolute top-20 right-6 w-6 h-6 bg-white rounded-full"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold mt-4 mb-8">Sign Up</h1>
        </motion.div>
        
        <motion.form 
          onSubmit={handleEmailSignUp}
          className="bg-white p-8 rounded-t-3xl -mt-4"
          variants={itemVariants}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">Must be at least 6 characters long</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#292D32] hover:bg-[#3E3E3E] text-white" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing up...' : 'Sign Up'}
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleGoogleSignUp}
              className="w-full flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              <FaGoogle className="h-4 w-4" />
              <span>Google</span>
            </Button>
            
            <p className="text-sm text-center mt-6">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-[#7B61FF] hover:underline font-medium">
                Login
              </Link>
            </p>
            
            {/* Add debug button */}
            <Button 
              type="button"
              variant="ghost"
              onClick={debugCheckSession}
              className="w-full text-xs text-gray-400 mt-4"
            >
              Check Connection Status
            </Button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default SignUp; 