import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Filter, Search, Trash2, ChevronDown } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransactionListProps {
  onTransactionClick?: (id: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ onTransactionClick }) => {
  const { t } = useTranslation();
  const { transactions, formatCurrency, deleteTransaction, getDisplayCategoryName, getCategoryKey } = useFinance();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'date-newest' | 'date-latest' | 'amount-highest' | 'amount-lowest'>('date-newest');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // For debugging - log first few transactions with categories
  useEffect(() => {
    const sampleTransactions = transactions.slice(0, 5);
    console.log('Sample transactions with categories:', sampleTransactions.map(t => ({
      id: t.id,
      description: t.description,
      categoryId: t.categoryId,
      categoryKey: getCategoryKey(t.categoryId)
    })));
  }, [transactions]);
  
  // Category list in specified order
  const categoryOptions = [
    { value: 'all', label: 'All' },
    { value: 'expense_groceries', label: 'Groceries' },
    { value: 'expense_food', label: 'Dining' },
    { value: 'expense_transportation', label: 'Transportation' },
    { value: 'expense_subscription', label: 'Subscription' },
    { value: 'expense_housing', label: 'Housing' },
    { value: 'expense_entertainment', label: 'Entertainment' },
    { value: 'expense_shopping', label: 'Shopping' },
    { value: 'expense_health', label: 'Health' },
    { value: 'expense_education', label: 'Education' },
    { value: 'expense_travel', label: 'Travel' },
    { value: 'expense_personal', label: 'Personal Care' },
    { value: 'expense_other', label: 'Other (Expense)' },
    { value: 'income_salary', label: 'Salary' },
    { value: 'income_business', label: 'Business' },
    { value: 'income_investment', label: 'Investment' },
    { value: 'income_gift', label: 'Gift' },
    { value: 'income_other', label: 'Other (Income)' },
    { value: 'system_transfer', label: 'Transfer' },
  ];
  
  // Filter transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      // Type filter
      if (typeFilter !== 'all' && transaction.type !== typeFilter) {
        return false;
      }
      
      // Category filter
      if (selectedCategory !== 'all') {
        // Get the category key for this transaction using the FinanceContext utility
        const categoryKey = getCategoryKey(transaction.categoryId);
        
        // Filter out if category key doesn't match selected category
        if (categoryKey !== selectedCategory) {
          return false;
        }
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
    
    // Sort transactions within each group based on sortOption
    Object.keys(groups).forEach(date => {
      const transactionsInGroup = groups[date];
      
      switch (sortOption) {
        case 'date-newest':
          // Already sorted by date in original data
          break;
        case 'date-latest':
          transactionsInGroup.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          break;
        case 'amount-highest':
          transactionsInGroup.sort((a, b) => b.amount - a.amount);
          break;
        case 'amount-lowest':
          transactionsInGroup.sort((a, b) => a.amount - b.amount);
          break;
      }
    });
    
    // Convert to array and sort the groups based on sortOption
    let sortedGroups = Object.entries(groups).map(([date, transactions]) => ({
      date,
      transactions
    }));
    
    switch (sortOption) {
      case 'date-newest':
        sortedGroups.sort((groupA, groupB) => {
          return new Date(groupB.date).getTime() - new Date(groupA.date).getTime();
        });
        break;
      case 'date-latest':
        sortedGroups.sort((groupA, groupB) => {
          return new Date(groupA.date).getTime() - new Date(groupB.date).getTime();
        });
        break;
      case 'amount-highest':
        sortedGroups.sort((groupA, groupB) => {
          // Find maximum amount in each group
          const maxAmountA = Math.max(...groupA.transactions.map(t => t.amount));
          const maxAmountB = Math.max(...groupB.transactions.map(t => t.amount));
          return maxAmountB - maxAmountA;
        });
        break;
      case 'amount-lowest':
        sortedGroups.sort((groupA, groupB) => {
          // Find minimum amount in each group
          const minAmountA = Math.min(...groupA.transactions.map(t => t.amount));
          const minAmountB = Math.min(...groupB.transactions.map(t => t.amount));
          return minAmountA - minAmountB;
        });
        break;
    }
    
    return sortedGroups;
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
      
      {/* Sorting and category filter dropdowns */}
      <div className="flex justify-between mb-4 gap-2">
        {/* Category filter dropdown */}
        <Select 
          value={selectedCategory} 
          onValueChange={(value) => setSelectedCategory(value)}
        >
          <SelectTrigger className="w-[180px] bg-[#242425] border-0 text-white">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent className="bg-[#242425] border-0 text-white max-h-[300px]">
            {categoryOptions.map(category => (
              <SelectItem 
                key={category.value} 
                value={category.value} 
                className="hover:bg-[#333] focus:bg-[#333]"
              >
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Sorting dropdown */}
        <Select 
          value={sortOption} 
          onValueChange={(value) => setSortOption(value as any)}
        >
          <SelectTrigger className="w-[180px] bg-[#242425] border-0 text-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-[#242425] border-0 text-white">
            <SelectItem value="date-newest" className="hover:bg-[#333] focus:bg-[#333]">
              Sort by Date - Newest
            </SelectItem>
            <SelectItem value="date-latest" className="hover:bg-[#333] focus:bg-[#333]">
              Sort by Date - Latest
            </SelectItem>
            <SelectItem value="amount-highest" className="hover:bg-[#333] focus:bg-[#333]">
              Sort by Highest Amount
            </SelectItem>
            <SelectItem value="amount-lowest" className="hover:bg-[#333] focus:bg-[#333]">
              Sort by Lowest Amount
            </SelectItem>
          </SelectContent>
        </Select>
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
              <div className="flex items-center justify-between text-[#868686] mb-2">
                <div className="flex items-center">
                  <Calendar size={14} className="mr-2" />
                  <span className="text-sm">{formatDate(group.date)}</span>
                </div>
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
