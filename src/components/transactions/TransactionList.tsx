import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Filter, Search, Trash2 } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CategoryIcon from '@/components/shared/CategoryIcon';
import { motion } from 'framer-motion';

interface TransactionListProps {
  onTransactionClick?: (id: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ onTransactionClick }) => {
  const { t } = useTranslation();
  const { transactions, formatCurrency, deleteTransaction, getDisplayCategoryName } = useFinance();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  
  // Filter transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      // Type filter
      if (typeFilter !== 'all' && transaction.type !== typeFilter) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const displayCategory = getDisplayCategoryName(transaction).toLowerCase();
        
        return (
          transaction.description.toLowerCase().includes(searchLower) ||
          displayCategory.includes(searchLower)
        );
      }
      
      return true;
    });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTransactionToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete);
      toast({
        title: t('common.success'),
        description: t('transactions.delete_success'),
      });
      setTransactionToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleClick = (transaction: any) => {
    if (onTransactionClick) {
      onTransactionClick(transaction.id);
    }
  };
  
  // Group transactions by date for better UI organization
  const groupTransactionsByDate = () => {
    const groups: { [date: string]: typeof filteredTransactions } = {};
    
    filteredTransactions.forEach(transaction => {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    
    // Convert to array and sort by date (newest first)
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => {
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .map(([date, transactions]) => ({
        date,
        transactions
      }));
  };
  
  const groupedTransactions = groupTransactionsByDate();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
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
    <div>
      {/* Search and filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#868686]" size={16} />
          <Input 
            placeholder={t('transactions.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#242425] border-0 text-white"
          />
        </div>
        
        <div className="flex items-center bg-[#242425] rounded-full p-1">
          <button 
            className={`flex-1 py-2 text-center rounded-full ${typeFilter === 'all' ? 'bg-[#C6FE1E] text-[#0D0D0D]' : 'text-white'}`}
            onClick={() => setTypeFilter('all')}
          >
            {t('transactions.all')}
          </button>
          <button 
            className={`flex-1 py-2 text-center rounded-full ${typeFilter === 'income' ? 'bg-[#C6FE1E] text-[#0D0D0D]' : 'text-white'}`}
            onClick={() => setTypeFilter('income')}
          >
            {t('transactions.income')}
          </button>
          <button 
            className={`flex-1 py-2 text-center rounded-full ${typeFilter === 'expense' ? 'bg-[#C6FE1E] text-[#0D0D0D]' : 'text-white'}`}
            onClick={() => setTypeFilter('expense')}
          >
            {t('transactions.expense')}
          </button>
        </div>
      </div>
      
      {/* Transaction list */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8 text-[#868686]">
          {t('transactions.no_transactions')}
        </div>
      ) : (
        <motion.div 
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {groupedTransactions.map(group => (
            <motion.div 
              key={group.date} 
              className="space-y-3"
              variants={itemVariants}
            >
              <div className="flex items-center text-[#868686] mb-2">
                <Calendar size={14} className="mr-2" />
                <span className="text-sm">{formatDate(group.date)}</span>
              </div>
              
              {group.transactions.map(transaction => (
                <motion.div
                  key={transaction.id}
                  className="bg-[#242425] p-4 rounded-xl cursor-pointer"
                  onClick={() => handleClick(transaction)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  variants={itemVariants}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CategoryIcon category={transaction.categoryId || transaction.category} size="sm" />
                      <div className="ml-3">
                        <h3 className="font-medium">
                          {getDisplayCategoryName(transaction)}
                        </h3>
                        <p className="text-xs text-[#868686]">
                          {transaction.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`font-medium mr-3 ${transaction.type === 'expense' ? 'text-[#FF6B6B]' : 'text-[#C6FE1E]'}`}>
                        {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                      </span>
                      <button 
                        onClick={(e) => handleDeleteClick(transaction.id, e)}
                        className="text-[#868686] hover:text-[#FF6B6B] transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ))}
        </motion.div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1A1A1A] border-0 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription className="text-[#868686]">
              {t('transactions.delete_confirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#242425] border-0 text-white hover:bg-[#333]">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-[#FF6B6B] text-white hover:bg-red-400"
            >
              {t('transactions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TransactionList;
