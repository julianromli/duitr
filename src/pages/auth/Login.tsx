import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { FaGoogle } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
          <h1 className="text-2xl font-bold mt-4 mb-8">Login</h1>
        </motion.div>
        
        <motion.form 
          onSubmit={handleEmailSignIn}
          className="bg-white p-8 rounded-t-3xl -mt-4"
          variants={itemVariants}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link to="/auth/forgot-password" className="text-sm text-[#7B61FF] hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#292D32] hover:bg-[#3E3E3E] text-white" 
              disabled={isSubmitting}
            >
              Login
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
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              <FaGoogle className="h-4 w-4" />
              <span>Google</span>
            </Button>
            
            <p className="text-sm text-center mt-6">
              You don't have an account?{' '}
              <Link to="/auth/signup" className="text-[#7B61FF] hover:underline font-medium">
                Sign Up
              </Link>
            </p>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Login; 