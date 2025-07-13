// Fixed issue with bottom navbar not showing on Transactions page
// Ensured proper spacing for the navbar with pb-24 class on container

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { motion } from 'framer-motion';
import TransactionList from '@/components/transactions/TransactionList';
import { Button } from '@/components/ui/button';
import TransactionDetailOverlay from '@/components/transactions/TransactionDetailOverlay';
import ExportButton from '@/components/export/ExportButton';
import TransactionForm from '@/components/transactions/TransactionForm';

const Transactions: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { transactions } = useFinance();
  
  // State for transaction detail overlay
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleTransactionClick = (id: string) => {
    // Get the transaction data from our context
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setSelectedTransaction(transaction);
      setIsDetailOpen(true);
    }
  };
  
  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const headerVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        delay: 0.1
      }
    }
  };

  const transactionListVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25,
        delay: 0.2
      }
    }
  };
  
  return (
    <motion.div 
      className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen pb-24 text-white px-2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
    
    <div className="p-4 pt-12">
        <motion.div 
          className="flex items-center justify-between mb-6"
          variants={headerVariants}
        >
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="mr-4">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="text-xl font-bold">{t('transactions.history')}</h1>
          </div>
          <div className="flex gap-2">
            <ExportButton />
            <TransactionForm />
          </div>
        </motion.div>
        
        <motion.div variants={transactionListVariants}>
          <TransactionList onTransactionClick={handleTransactionClick} />
        </motion.div>
      </div>
      
      {/* Transaction Detail Overlay */}
      {selectedTransaction && (
        <TransactionDetailOverlay
          transaction={selectedTransaction}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      )}
    </motion.div>
  );
};

export default Transactions;
