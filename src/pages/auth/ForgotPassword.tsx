import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();

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
          description: error.message,
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
          <h1 className="text-2xl font-bold mt-4 mb-8">Forgot Password</h1>
        </motion.div>
        
        <motion.div 
          className="bg-white p-8 rounded-t-3xl -mt-4"
          variants={itemVariants}
        >
          {isEmailSent ? (
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
              >
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <h2 className="text-xl font-semibold">Email Sent!</h2>
              <p className="text-gray-600">
                We've sent a password reset link to <span className="font-semibold">{email}</span>. 
                Please check your inbox and follow the instructions to reset your password.
              </p>
              <Button asChild className="mt-4">
                <Link to="/auth/login">Return to Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <p className="text-sm text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <Button 
                type="submit" 
                className="w-full bg-[#292D32] hover:bg-[#3E3E3E] text-white" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
              
              <div className="text-center">
                <Link 
                  to="/auth/login" 
                  className="text-sm text-[#7B61FF] hover:underline"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword; 