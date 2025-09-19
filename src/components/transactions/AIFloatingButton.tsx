import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useFinance } from '@/context/FinanceContext';
import { AIAddTransactionDialog } from './AIAddTransactionDialog';

export function AIFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { addTransaction, wallets, currencySymbol } = useFinance();

  const handleClick = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-20 right-4 z-[60] md:bottom-24 md:right-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full bg-gradient-to-br from-[#C6FE1E] to-[#A8E617] text-black shadow-lg hover:shadow-xl hover:from-[#B8F519] hover:to-[#98D414] transition-all duration-200 border-0 relative overflow-hidden"
          onClick={handleClick}
          aria-label={t('ai.addWithAI', 'Add transactions with AI')}
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="relative z-10"
          >
            <Sparkles className="h-6 w-6" strokeWidth={2} />
          </motion.div>

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-[#C6FE1E] to-[#A8E617] rounded-full opacity-75"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.75, 0.4, 0.75],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </Button>
      </motion.div>

      {/* Tooltip */}
      <motion.div
        className="fixed bottom-36 right-4 z-[60] bg-[#1A1A1A] text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 1 }}
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#C6FE1E]" />
          {t('ai.addWithAI', 'Add with AI')}
        </span>
        <div className="absolute -bottom-1 right-4 w-2 h-2 bg-[#1A1A1A] transform rotate-45" />
      </motion.div>

      {/* Dialog */}
      <AnimatePresence>
        {isOpen && (
          <AIAddTransactionDialog
            open={isOpen}
            onClose={handleClose}
            addTransaction={addTransaction}
            wallets={wallets}
            currencySymbol={currencySymbol}
          />
        )}
      </AnimatePresence>
    </>
  );
}