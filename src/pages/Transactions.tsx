import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionForm from '@/components/transactions/TransactionForm';
import ExportButton from '@/components/export/ExportButton';
import { ArrowLeftRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TransactionDetail from '@/components/transactions/TransactionDetail';

const Transactions: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Log performance on initial load
  useEffect(() => {
    const startTime = performance.now();
    
    // This will be called after the component has rendered
    return () => {
      const loadTime = performance.now() - startTime;
      console.log(`Transactions page initial render time: ${loadTime.toFixed(2)}ms`);
    };
  }, []);
  
  // Animation variants
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

  const handleTransactionClick = (id: string) => {
    setSelectedTransactionId(id);
    setIsDetailOpen(true);
  };
  
  // Log that floating '+' button has been removed
  useEffect(() => {
    console.log("Floating '+' button removed");
  }, []);
  
  return (
    <motion.div 
      className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen pb-24 text-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
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
        
        {/* Transaction Detail Dialog */}
        <TransactionDetail 
          transactionId={selectedTransactionId}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      </div>
    </motion.div>
  );
};

export default Transactions;
