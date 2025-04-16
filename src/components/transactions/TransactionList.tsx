import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Filter, Search, Trash2, ChevronDown, Loader } from 'lucide-react';
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
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { getCategoryStringIdFromUuid } from '@/utils/categoryUtils';

interface TransactionListProps {
  onTransactionClick?: (id: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ onTransactionClick }) => {
  const { t } = useTranslation();
  const { formatCurrency, deleteTransaction, getDisplayCategoryName, getCategoryKey } = useFinance();
  const { toast } = useToast();
  
  // Pagination and loading state
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const pageSize = 20;
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'date-newest' | 'date-latest' | 'amount-highest' | 'amount-lowest'>('date-newest');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterParams, setFilterParams] = useState({
    searchTerm: '',
    typeFilter: 'all',
    selectedCategory: 'all',
    sortOption: 'date-newest'
  });
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Reference to track if component is mounted
  const isMounted = useRef(true);
  
  // Add a loading flag to prevent multiple loading states
  const isLoadingRef = useRef(false);
  
  // Fetch transactions with pagination
  const fetchTransactions = async (pageNum: number, isInitialLoad = false) => {
    // Prevent duplicate loading
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      // Set loading flags
      isLoadingRef.current = true;
      
      if (isInitialLoad) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }
      
      // Calculate pagination
      const start = pageNum * pageSize;
      const end = start + pageSize - 1;
      
      // Basic transaction query
      const { data, error: queryError } = await supabase
        .from('transactions')
        .select('id, date, type, amount, description, wallet_id, category_id')
        .order('date', { ascending: false })
        .range(start, end);
      
      // Handle query errors
      if (queryError) {
        throw new Error(`Transaction query error: ${queryError.message}`);
      }
      
      // Handle no data
      if (!data || data.length === 0) {
        if (isInitialLoad) {
          setTransactions([]);
        }
        setHasMore(false);
        return;
      }
      
      // Get wallet names
      let walletNames: Record<string, string> = {};
      const walletIds = [...new Set(data.map(t => t.wallet_id).filter(Boolean))];
      
      if (walletIds.length > 0) {
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('id, name')
          .in('id', walletIds);
        
        if (walletError) {
          console.warn('Error fetching wallet data:', walletError);
        } else if (walletData) {
          walletNames = walletData.reduce((acc, wallet) => {
            acc[wallet.id] = wallet.name;
            return acc;
          }, {} as Record<string, string>);
        }
      }
      
      // Format transaction data
      const processedTransactions = data.map(t => {
        // Handle category conversion
        let categoryId = t.category_id;
        
        if (categoryId) {
          if (typeof categoryId === 'string' && categoryId.length > 30) {
            categoryId = getCategoryStringIdFromUuid(categoryId);
          } else if (typeof categoryId === 'number' || !isNaN(Number(categoryId))) {
            categoryId = Number(categoryId);
          }
        } else {
          categoryId = t.type === 'transfer' ? 'system_transfer' : 'expense_other';
        }
        
        return {
          id: t.id,
          amount: t.amount,
          category: '',
          categoryId: categoryId,
          description: t.description || '',
          date: t.date,
          type: t.type,
          walletId: t.wallet_id,
          walletName: walletNames[t.wallet_id] || 'Unknown Wallet'
        };
      });
      
      // Update state
      if (isMounted.current) {
        if (isInitialLoad) {
          setTransactions(processedTransactions);
        } else {
          setTransactions(prev => [...prev, ...processedTransactions]);
        }
        
        setHasMore(processedTransactions.length === pageSize);
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      if (isMounted.current) {
        setError(err.message || 'Failed to load transactions');
        
        if (isInitialLoad) {
          setTransactions([]);
        }
      }
    } finally {
      // Reset loading flags
      isLoadingRef.current = false;
      
      if (isMounted.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };
  
  // Initial data loading - simplify to avoid double loading
  useEffect(() => {
    // Make sure we're not already loading
    if (!isLoadingRef.current) {
      // Reset state 
      setPage(0);
      setHasMore(true);
      setError(null);
      
      // Reset transactions only if we're changing filters
      if (Object.values(filterParams).some(param => param !== '')) {
        setTransactions([]);
      }
      
      // Fetch data with minimal delay
      fetchTransactions(0, true);
    }
    
    // Cleanup
    return () => {
      // Nothing to clean up for this effect
    };
  }, [filterParams]);
  
  // Component cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Handle filter changes
  const applyFilters = () => {
    setFilterParams({
      searchTerm,
      typeFilter,
      selectedCategory,
      sortOption
    });
  };
  
  // Apply search filter with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      applyFilters();
    }, 500);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);
  
  // Apply other filters immediately
  useEffect(() => {
    applyFilters();
  }, [typeFilter, selectedCategory, sortOption]);
  
  // Load more transactions
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTransactions(nextPage, false);
    }
  };
  
  // Delete transaction
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTransactionToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (transactionToDelete) {
      try {
        await deleteTransaction(transactionToDelete);
        toast({
          title: t('common.success'),
          description: t('transactions.delete_success'),
        });
        
        // Reset page and fetch transactions again
        setPage(0);
        fetchTransactions(0, true);
      } catch (err) {
        console.error('Error deleting transaction:', err);
        toast({
          title: t('common.error'),
          description: t('transactions.delete_error'),
          variant: 'destructive'
        });
      } finally {
        setTransactionToDelete(null);
        setIsDeleteDialogOpen(false);
      }
    }
  };
  
  // Handle transaction click
  const handleClick = (transaction: any) => {
    if (onTransactionClick) {
      onTransactionClick(transaction.id);
    }
  };
  
  // Group transactions by date
  const groupTransactionsByDate = () => {
    const groups: Record<string, any[]> = {};
    
    transactions.forEach(transaction => {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    
    return Object.entries(groups)
      .map(([date, transactions]) => ({ date, transactions }))
      .sort((a, b) => {
        if (sortOption.includes('date-newest')) {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortOption.includes('date-latest')) {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        return 0;
      });
  };
  
  const groupedTransactions = groupTransactionsByDate();
  
  // Category list
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
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
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
  
  // Transaction rendering with wallet name
  const renderTransactionItem = (transaction: any) => (
    <motion.div
      key={transaction.id}
      className="bg-[#242425] p-4 rounded-xl cursor-pointer mb-2"
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
  );
  
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
      
      {/* Single loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="w-8 h-8 animate-spin text-[#C6FE1E]" />
        </div>
      ) : (
        <>
          {/* Error state */}
          {error && (
            <div className="text-center py-8 text-[#FF6B6B]">
              <p className="mb-2">{error}</p>
              <Button 
                onClick={() => fetchTransactions(0, true)}
                className="bg-[#242425] hover:bg-[#333] text-white mt-2"
              >
                {t('common.retry')}
              </Button>
            </div>
          )}
          
          {/* Empty state */}
          {!error && transactions.length === 0 && (
            <div className="text-center py-8 text-[#868686]">
              {t('transactions.no_transactions')}
            </div>
          )}
          
          {/* Transactions list */}
          {!error && transactions.length > 0 && (
            <motion.div 
              className="space-y-8 pb-20"
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
                  
                  {group.transactions.map(transaction => renderTransactionItem(transaction))}
                </motion.div>
              ))}
              
              {/* Load more button */}
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="bg-[#242425] hover:bg-[#333] text-white"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('transactions.loadMore')
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </>
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
