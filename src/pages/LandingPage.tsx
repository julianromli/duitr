import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hero195 } from '@/components/ui/hero-195';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { motion } from 'framer-motion';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full relative">
      {/* Emerald Void */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: "radial-gradient(125% 125% at 50% 90%, #000000 40%, #072607 100%)", 
        }} 
      />
      {/* Navigation */}
      <motion.header 
        className="absolute top-0 left-0 right-0 z-50 py-4 px-6 md:px-10 lg:px-20 border-b border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-2xl font-bold text-lime-400">Duitr</h1>
          </motion.div>
          
          {/* Navigation Links - Desktop */}
          {/* <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium hover:text-green-600 transition-colors">Home</Link>
            <Link to="/features" className="text-sm font-medium hover:text-green-600 transition-colors">Features</Link>
            <Link to="/product" className="text-sm font-medium hover:text-green-600 transition-colors">Product</Link>
            <Link to="/resources" className="text-sm font-medium hover:text-green-600 transition-colors">Resources</Link>
            <Link to="/community" className="text-sm font-medium hover:text-green-600 transition-colors">Community</Link>
          </nav> */}
          
          {/* Auth Buttons */}
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <LanguageToggle className="hidden md:block" />
            <button 
              onClick={() => navigate('/login')} 
              className="hidden md:block text-sm font-medium px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white transition-colors"
            >
              Sign in
            </button>
            <button 
              onClick={() => navigate('/signup')} 
              className="text-sm font-medium px-4 py-2 rounded-lg bg-lime-400 text-black hover:bg-lime-500 transition-colors"
            >
              Sign up
            </button>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero195 Component */}
      <Hero195 />

      {/* Footer */}
      <motion.footer 
        className="relative py-8 px-6 md:px-10 lg:px-20 border-t border-white/10 bg-black z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.3 }}
          >
            <div className="mb-4 md:mb-0">
              <h1 className="text-xl font-bold text-lime-400">Duitr</h1>
              <p className="text-sm text-gray-300 mt-1">Your AI-powered financial assistant</p>
            </div>
            <div className="flex space-x-6">
              <a href="https://threads.com/faizintifada" className="text-gray-400 hover:text-lime-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.01c0-3.576.85-6.43 2.495-8.481C5.845 1.225 8.598.044 12.179.02h.014c3.581.024 6.334 1.205 8.184 3.509C21.65 5.58 22.5 8.434 22.5 12.01c0 3.576-.85 6.43-2.495 8.481C18.155 22.775 15.402 23.956 11.821 23.98h-.007zm.014-21.46h-.014c-2.769.02-4.943.725-6.458 2.095C4.239 6.34 3.5 8.537 3.5 12.01c0 3.473.739 5.67 2.228 7.375 1.515 1.37 3.689 2.075 6.458 2.095h.014c2.769-.02 4.943-.725 6.458-2.095C19.761 17.68 20.5 15.483 20.5 12.01c0-3.473-.739-5.67-2.228-7.375C16.757 3.265 14.583 2.56 11.814 2.54h-.014z" />
                  <path d="M12 16.5c-2.485 0-4.5-2.015-4.5-4.5s2.015-4.5 4.5-4.5 4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5zm0-7c-1.378 0-2.5 1.122-2.5 2.5s1.122 2.5 2.5 2.5 2.5-1.122 2.5-2.5-1.122-2.5-2.5-2.5z" />
                </svg>
              </a>
              <a href="https://x.com/faizintfd" className="text-gray-400 hover:text-lime-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://instagram.com/faizintifada" className="text-gray-400 hover:text-lime-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </motion.div>
          <motion.div 
            className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            <p className="text-sm text-gray-300">© {new Date().getFullYear()} Duitr. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-sm text-gray-300 hover:text-lime-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-gray-300 hover:text-lime-400 transition-colors">Terms of Service</Link>
              <a href="mailto:faizintifada@gmail.com" className="text-sm text-gray-300 hover:text-lime-400 transition-colors">Contact Us</a>
            </div>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
};

export default LandingPage;