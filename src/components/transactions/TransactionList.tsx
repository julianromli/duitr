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

const TransactionList: React.FC = () => {
  const { t } = useTranslation();
  const { transactions, formatCurrency, deleteTransaction } = useFinance();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  
  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      // Type filter
      if (typeFilter !== 'all' && transaction.type !== typeFilter) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          transaction.description.toLowerCase().includes(searchLower) ||
          transaction.category.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
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

  return (
    <div className="space-y-4">
      <div className="relative w-full mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#868686]" />
        <Input
          placeholder={t('transactions.search')}
          className="pl-10 bg-[#242425] border-none h-12 rounded-xl text-white placeholder:text-[#868686]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-full ${typeFilter === 'all' ? 'bg-[#C6FE1E] text-[#0D0D0D] font-medium' : 'bg-[#242425] text-white'}`}
          onClick={() => setTypeFilter('all')}
        >
          {t('transactions.all')}
        </button>
        <button
          className={`px-4 py-2 rounded-full ${typeFilter === 'income' ? 'bg-[#C6FE1E] text-[#0D0D0D] font-medium' : 'bg-[#242425] text-white'}`}
          onClick={() => setTypeFilter('income')}
        >
          {t('transactions.income')}
        </button>
        <button
          className={`px-4 py-2 rounded-full ${typeFilter === 'expense' ? 'bg-[#C6FE1E] text-[#0D0D0D] font-medium' : 'bg-[#242425] text-white'}`}
          onClick={() => setTypeFilter('expense')}
        >
          {t('transactions.expense')}
        </button>
      </div>
      
      <div className="space-y-3 text-white">
        {filteredTransactions.length > 0 ? (
          <>
            {filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                className="flex items-center justify-between bg-[#242425] p-4 rounded-xl cursor-pointer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                    <CategoryIcon category={transaction.category} />
                  </div>
                  <div>
                    <p className="font-medium">{transaction.category}</p>
                    <p className="text-xs text-[#868686]">{transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`font-medium ${transaction.type === 'income' ? 'text-[#C6FE1E]' : 'text-white'}`}>
                      {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-[#868686]">{formatDate(transaction.date)}</p>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteClick(transaction.id, e)}
                    className="text-[#868686] hover:text-red-500 transition-colors"
                    title={t('transactions.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-[#868686]">{t('transactions.no_transactions')}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#242425] text-white border-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('transactions.delete')}</AlertDialogTitle>
            <AlertDialogDescription className="text-[#868686]">
              {t('transactions.delete_confirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1a1a1a] text-white border-none hover:bg-[#333]">
              {t('buttons.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {t('buttons.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TransactionList;
