import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { FaGoogle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !username) {
      toast({
        variant: 'destructive',
        title: 'Invalid input',
        description: 'Please fill in all fields',
      });
      return;
    }
    
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
      const result = await signUp(email, password);
      
      if (result.success) {
        toast({
          title: 'Account created',
          description: 'Your account has been created successfully.',
        });
        navigate('/');
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign up failed',
          description: result.message,
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
          <div className="w-16 h-16 bg-[#C6FE1E] rounded-full flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="#0D0D0D" strokeWidth="2">
              <path d="M3 6.5V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V6.5M3 6.5H21M3 6.5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V6.5M12 11C12 9.89543 12.8954 9 14 9H17C18.1046 9 19 9.89543 19 11V14C19 15.1046 18.1046 16 17 16H14C12.8954 16 12 15.1046 12 14V11Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Sign up for free</h1>
        </motion.div>
        
        {/* Social Login Buttons */}
        <motion.div 
          className="space-y-3 mb-8"
          variants={itemVariants}
        >
          <Button 
            variant="outline" 
            className="w-full py-6 border border-[#292929] bg-transparent text-white flex items-center justify-center gap-3 rounded-full hover:bg-[#292929]"
            onClick={handleGoogleSignUp}
          >
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <FaGoogle className="h-4 w-4 text-black" />
            </div>
            <span className="font-medium">Sign up with Google</span>
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
        
        {/* Email Sign Up Form */}
        <motion.form 
          onSubmit={handleEmailSignUp}
          className="space-y-6"
          variants={itemVariants}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white mb-2 block">What's your email?</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#292929] border-none text-white py-6 px-4 rounded-md placeholder:text-[#868686]"
              />
            </div>
            
            <div>
              <Label htmlFor="username" className="text-white mb-2 block">Create a username</Label>
              <Input
                id="username"
                placeholder="Create a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-[#292929] border-none text-white py-6 px-4 rounded-md placeholder:text-[#868686]"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-white mb-2 block">Create a password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#292929] border-none text-white py-6 px-4 rounded-md placeholder:text-[#868686]"
              />
            </div>
            
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox 
                id="terms" 
                checked={agreedToTerms}
                onCheckedChange={(checked) => {
                  setAgreedToTerms(checked as boolean);
                }}
                className="bg-[#292929] border-[#868686] data-[state=checked]:bg-[#C6FE1E] data-[state=checked]:text-[#0D0D0D]"
              />
              <label
                htmlFor="terms"
                className="text-[#868686] text-sm leading-relaxed cursor-pointer"
              >
                I agree to the <Link to="/terms" className="text-white hover:underline">Terms and Conditions</Link> and <Link to="/privacy" className="text-white hover:underline">Privacy Policy</Link>.
              </label>
            </div>
            
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-[#C6FE1E] hover:bg-[#B0E018] text-[#0D0D0D] font-bold py-6 rounded-full" 
                disabled={isSubmitting}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </motion.form>
        
        {/* Login Link */}
        <motion.div 
          className="mt-auto pt-8 border-t border-[#292929] text-center"
          variants={itemVariants}
        >
          <p className="text-[#868686]">
            Already have an account?
          </p>
          <Link 
            to="/auth/login" 
            className="block w-full border border-[#868686] text-white py-3 px-6 rounded-full mt-4 font-medium hover:border-white"
          >
            Log in
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SignUp; 