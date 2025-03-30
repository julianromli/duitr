import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { FaGoogle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import AppLogo from '@/components/shared/Logo';

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
          description: result.message,
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
    try {
      setIsSubmitting(true);
      const result = await signInWithGoogle();
      
      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: result.message,
        });
      }
      // If successful, user will be redirected to Google login page
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

  // Render static version for server-side rendering to prevent blank screen
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
        <div className="p-6 flex items-start">
          <button className="p-1 text-white rounded-full">
            <ChevronLeft size={24} />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col p-6 pt-0">
          <div className="mb-12 flex flex-col items-center">
            <AppLogo size={64} className="mb-4" withText={false} />
            <h1 className="text-3xl font-bold text-white">Log in to Duitr</h1>
          </div>
          
          <div className="space-y-3 mb-8">
            <Button 
              variant="outline" 
              className="w-full py-6 border border-[#292929] bg-transparent text-white flex items-center justify-center gap-3 rounded-full hover:bg-[#292929]"
              disabled={true}
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <FaGoogle className="h-4 w-4 text-black" />
              </div>
              <span className="font-medium">Continue with Google</span>
            </Button>
          </div>
          
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#292929]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[#0D0D0D] text-[#868686]">or</span>
            </div>
          </div>
          
          <form className="space-y-6">
            {/* Form fields without animations */}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* Header with back button */}
      <motion.div 
        className="p-6 flex items-start"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 text-white rounded-full"
        >
          <ChevronLeft size={24} />
        </button>
      </motion.div>
      
      <motion.div 
        className="flex-1 flex flex-col p-6 pt-0"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Logo and Title */}
        <motion.div 
          className="mb-12 flex flex-col items-center"
          variants={itemVariants}
        >
          <AppLogo size={64} className="mb-4" withText={false} />
          <h1 className="text-3xl font-bold text-white">Log in to Duitr</h1>
        </motion.div>
        
        {/* Social Login Buttons */}
        <motion.div 
          className="space-y-3 mb-8"
          variants={itemVariants}
        >
          <Button 
            variant="outline" 
            className="w-full py-6 border border-[#292929] bg-transparent text-white flex items-center justify-center gap-3 rounded-full hover:bg-[#292929]"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
          >
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <FaGoogle className="h-4 w-4 text-black" />
            </div>
            <span className="font-medium">Continue with Google</span>
          </Button>
        </motion.div>
        
        {/* Divider */}
        <motion.div 
          className="relative mb-8" 
          variants={itemVariants}
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#292929]"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-[#0D0D0D] text-[#868686]">or</span>
          </div>
        </motion.div>
        
        {/* Email Login Form */}
        <motion.form 
          onSubmit={handleEmailSignIn}
          className="space-y-6"
          variants={itemVariants}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white mb-2 block">Email or username</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#292929] border-none text-white py-6 px-4 rounded-md placeholder:text-[#868686]"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-white mb-2 block">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#292929] border-none text-white py-6 px-4 rounded-md placeholder:text-[#868686]"
              />
            </div>
            
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-[#C6FE1E] hover:bg-[#B0E018] text-[#0D0D0D] font-bold py-6 rounded-full" 
                disabled={isSubmitting}
              >
                Log In
              </Button>
            </div>
            
            <div className="text-center pt-2">
              <Link to="/auth/forgot-password" className="text-white hover:underline text-sm font-medium">
                Forgot your password?
              </Link>
            </div>
          </div>
        </motion.form>
        
        {/* Sign Up Link */}
        <motion.div 
          className="mt-auto pt-8 border-t border-[#292929] text-center"
          variants={itemVariants}
        >
          <p className="text-[#868686]">
            Don't have an account?
          </p>
          <Link 
            to="/auth/signup" 
            className="block w-full border border-[#868686] text-white py-3 px-6 rounded-full mt-4 font-medium hover:border-white"
          >
            Sign up for Duitr
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login; 