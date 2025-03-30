import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  
  return (
    <button
      onClick={toggleTheme}
      className="rounded-full w-7 h-7 flex items-center justify-center bg-[#3A3A3C]/70 dark:bg-[#2A2A2C]/70 hover:bg-[#4A4A4C] dark:hover:bg-[#3A3A3C] transition-colors"
      aria-label={theme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')}
    >
      <div className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
        <motion.div
          initial={false}
          animate={{ 
            rotateY: theme === 'dark' ? 0 : 180,
            opacity: [0.6, 1]
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {theme === 'dark' ? (
            <Sun size={14} className="text-white dark:text-[#C6FE1E]" />
          ) : (
            <Moon size={14} className="text-white dark:text-[#C6FE1E]" />
          )}
        </motion.div>
      </div>
    </button>
  );
};

export default ThemeToggle; 