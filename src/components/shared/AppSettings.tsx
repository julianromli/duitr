import React, { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export const AppSettings: React.FC = () => {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  
  // Prevent hydration mismatch by mounting only on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.2,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };
  
  // Render a simpler version during SSR/initial render to prevent blank screen
  if (!isMounted) {
    return (
      <div className="flex items-center gap-2 p-1 rounded-full bg-gray-900/10 dark:bg-gray-800/30 backdrop-blur-sm">
        <div><LanguageSwitcher /></div>
        <div className="w-px h-4 bg-gray-400/20 dark:bg-gray-600/30" />
        <div><ThemeToggle /></div>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="flex items-center gap-2 p-1 rounded-full bg-gray-900/10 dark:bg-gray-800/30 backdrop-blur-sm"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <LanguageSwitcher />
      </motion.div>
      <motion.div 
        className="w-px h-4 bg-gray-400/20 dark:bg-gray-600/30"
        variants={itemVariants}
      />
      <motion.div variants={itemVariants}>
        <ThemeToggle />
      </motion.div>
    </motion.div>
  );
};

export default AppSettings; 