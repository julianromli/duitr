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
    hidden: { 
      opacity: 0,
      y: 10
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 15,
      filter: "blur(4px)"
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        duration: 0.6
      }
    }
  };

  const dividerVariants = {
    hidden: {
      opacity: 0,
      scaleY: 0,
      originY: 0.5
    },
    visible: {
      opacity: 1,
      scaleY: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
        delay: 0.2
      }
    }
  };
  
  // Render a simpler version during SSR/initial render to prevent blank screen
  if (!isMounted) {
    return (
      <div className="flex items-center gap-0 p-0 rounded-full">
        <div><LanguageSwitcher /></div>
        <div className="w-px h-1 bg-gray-400/20 dark:bg-gray-600/30" />
        <div><ThemeToggle /></div>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="flex items-center gap-0 p-0 rounded-full"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div 
        variants={itemVariants}
        whileHover={{ 
          scale: 1.05,
          transition: { duration: 0.2 }
        }}
        whileTap={{ 
          scale: 0.95,
          transition: { duration: 0.1 }
        }}
      >
        <LanguageSwitcher />
      </motion.div>
      
      <motion.div 
        // className="w-px h-4 bg-gray-400/20 dark:bg-gray-600/30"
        // variants={dividerVariants}
      />
      
      <motion.div 
      //   variants={itemVariants}
      //   whileHover={{ 
      //     scale: 1.05,
      //     transition: { duration: 0.2 }
      //   }}
      //   whileTap={{ 
      //     scale: 0.95,
      //     transition: { duration: 0.1 }
      //   }}
      // >
      //   <ThemeToggle />
      >
      </motion.div>
    </motion.div>
  );
};

export default AppSettings;