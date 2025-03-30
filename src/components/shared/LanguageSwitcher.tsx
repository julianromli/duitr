import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { setAppLanguage } from '@/i18n';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'id' : 'en';
    setAppLanguage(newLang);
  };
  
  return (
    <button
      onClick={toggleLanguage}
      className="rounded-full w-7 h-7 flex items-center justify-center bg-[#3A3A3C]/70 dark:bg-[#2A2A2C]/70 hover:bg-[#4A4A4C] dark:hover:bg-[#3A3A3C] transition-colors"
      aria-label={i18n.language === 'en' ? t('language.switchToId') : t('language.switchToEn')}
    >
      <div className="relative flex items-center justify-center">
        <Globe size={14} className="text-white dark:text-[#C6FE1E]" />
        <motion.div
          initial={false}
          animate={{ 
            scale: [0.9, 1.1, 1],
            opacity: [0.5, 1]
          }}
          transition={{ duration: 0.4 }}
          key={i18n.language}
          className="absolute -bottom-1.5 -right-1.5 text-[8px] font-semibold bg-[#C6FE1E] text-[#0D0D0D] rounded-full w-3.5 h-3.5 flex items-center justify-center"
        >
          {i18n.language === 'en' ? 'ID' : 'EN'}
        </motion.div>
      </div>
    </button>
  );
};

export default LanguageSwitcher; 