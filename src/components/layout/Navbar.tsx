import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, CreditCard, User, FileText, Home, PiggyBank } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CustomCursor from './CustomCursor';

const Navbar: React.FC = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const navRef = useRef<HTMLDivElement>(null);
  
  // Debug log to confirm the navbar is mounted
  useEffect(() => {
    console.log('Navbar mounted, path:', pathname);
    return () => console.log('Navbar unmounted');
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 z-[999] p-4 w-full max-w-md mx-auto"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      ref={navRef}
    >
      <nav className="bg-[#1A1A1A]/80 backdrop-blur-md p-3 rounded-full flex justify-between items-center shadow-lg border border-[#242425]">
        <Link to="/" aria-label={t('navbar.dashboard')}>
          <div className={`p-2 rounded-full transition-all duration-200 ease-in-out ${isActive('/') ? 'bg-[#C6FE1E] text-[#0D0D0D]' : 'text-[#868686] hover:text-white'}`}>
            <Home size={24} />
          </div>
        </Link>
        
        <Link to="/transactions" aria-label={t('navbar.transactions')}>
          <div className={`p-2 rounded-full transition-all duration-200 ease-in-out ${isActive('/transactions') ? 'bg-[#C6FE1E] text-[#0D0D0D]' : 'text-[#868686] hover:text-white'}`}>
            <FileText size={24} />
          </div>
        </Link>
        
        <Link to="/wallets" aria-label={t('navbar.wallets')}>
          <div className={`p-2 rounded-full transition-all duration-200 ease-in-out ${isActive('/wallets') ? 'bg-[#C6FE1E] text-[#0D0D0D]' : 'text-[#868686] hover:text-white'}`}>
            <CreditCard size={24} />
          </div>
        </Link>
        
        <Link to="/statistics" aria-label={t('navbar.statistics')}>
          <div className={`p-2 rounded-full transition-all duration-200 ease-in-out ${isActive('/statistics') ? 'bg-[#C6FE1E] text-[#0D0D0D]' : 'text-[#868686] hover:text-white'}`}>
            <BarChart3 size={24} />
          </div>
        </Link>
        
        <Link to="/budget" aria-label={t('navbar.budget')}>
          <div className={`p-2 rounded-full transition-all duration-200 ease-in-out ${isActive('/budget') ? 'bg-[#C6FE1E] text-[#0D0D0D]' : 'text-[#868686] hover:text-white'}`}>
            <PiggyBank size={24} />
          </div>
        </Link>
        
        <Link to="/profile" aria-label={t('navbar.profile')}>
          <div className={`p-2 rounded-full transition-all duration-200 ease-in-out ${isActive('/profile') ? 'bg-[#C6FE1E] text-[#0D0D0D]' : 'text-[#868686] hover:text-white'}`}>
            <User size={24} />
          </div>
        </Link>
      </nav>
      <CustomCursor />
    </motion.div>
  );
};

export default Navbar;
