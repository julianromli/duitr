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
    <motion.div 
      className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen pb-24 text-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >category.all
    
      <div className="p-6 pt-12">
        <motion.div 
          className="flex items-center justify-between mb-6"
          variants={itemVariants}
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
        
        <TransactionList onTransactionClick={handleTransactionClick} />
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
