import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Invalid input',
        description: 'Please fill in all fields',
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match',
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
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Reset failed',
          description: error.message,
        });
      } else {
        setIsSuccess(true);
        toast({
          title: 'Password updated',
          description: 'Your password has been successfully reset',
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
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* Header with back button */}
      <motion.div 
        className="p-6 flex items-start"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <button 
          onClick={() => navigate('/auth/login')} 
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
          <div className="w-16 h-16 bg-[#C6FE1E] rounded-full flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="#0D0D0D" strokeWidth="2">
              <path d="M3 6.5V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V6.5M3 6.5H21M3 6.5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V6.5M12 11C12 9.89543 12.8954 9 14 9H17C18.1046 9 19 9.89543 19 11V14C19 15.1046 18.1046 16 17 16H14C12.8954 16 12 15.1046 12 14V11Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
        </motion.div>

        {isSuccess ? (
          <motion.div 
            className="text-center space-y-6"
            variants={itemVariants}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="mx-auto w-16 h-16 bg-[#C6FE1E] rounded-full flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-[#0D0D0D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h2 className="text-xl font-semibold text-white">Password Reset Complete!</h2>
            <p className="text-[#868686]">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <Button 
              onClick={() => navigate('/auth/login')} 
              className="mt-4 bg-[#C6FE1E] hover:bg-[#B0E018] text-[#0D0D0D] font-bold py-6 rounded-full w-full"
            >
              Go to Login
            </Button>
          </motion.div>
        ) : (
          <>
            <motion.p 
              className="text-[#868686] mb-8 text-center"
              variants={itemVariants}
            >
              Please enter your new password to continue.
            </motion.p>
            
            <motion.form 
              onSubmit={handleResetPassword} 
              className="space-y-6"
              variants={itemVariants}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="password" className="text-white mb-2 block">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-[#292929] border-none text-white py-6 px-4 rounded-md placeholder:text-[#868686]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword" className="text-white mb-2 block">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {isSubmitting ? 'Updating...' : 'Reset Password'}
                  </Button>
                </div>
              </div>
            </motion.form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword; 