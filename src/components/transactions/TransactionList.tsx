import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Filter, Search, Trash2, ChevronDown, Loader, X } from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';
import TransactionDetailOverlay from '@/components/transactions/TransactionDetailOverlay';

interface TransactionListProps {
  onTransactionClick?: (id: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ onTransactionClick }) => {
  const { t } = useTranslation();
  const { formatCurrency, deleteTransaction, getDisplayCategoryName, getCategoryKey } = useFinance();
  const { toast } = useToast();
  const navigate = useNavigate();
  
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
  
  // State for transaction detail overlay
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
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
      
      console.log(`Fetching transactions: page ${pageNum}, sort: ${filterParams.sortOption}, type: ${filterParams.typeFilter}, category: ${filterParams.selectedCategory}`);
      
      // Build the query with filters
      let query = supabase
        .from('transactions')
        .select('id, date, type, amount, description, wallet_id, category_id');
      
      // Apply sorting based on option
      if (filterParams.sortOption === 'amount-highest') {
        query = query.order('amount', { ascending: false });
      } else if (filterParams.sortOption === 'amount-lowest') {
        query = query.order('amount', { ascending: true });
      } else {
        // Default to date sorting (newest or latest)
        query = query.order('date', { ascending: filterParams.sortOption === 'date-latest' });
      }
      
      // Apply type filter if not 'all'
      if (filterParams.typeFilter !== 'all') {
        query = query.eq('type', filterParams.typeFilter);
      }
      
      // Apply category filter if not 'all'
      if (filterParams.selectedCategory !== 'all') {
        logCategoryDebug('Filtering transactions by category', filterParams.selectedCategory);
        
        try {
          // If the selected category value contains underscore (like expense_food), use that directly as category_key
          if (filterParams.selectedCategory.includes('_')) {
            const { data: categoryByKey, error: keyError } = await supabase
              .from('categories')
              .select('category_id, category_key, en_name, type')
              .eq('category_key', filterParams.selectedCategory)
              .single();
              
            if (!keyError && categoryByKey?.category_id) {
              const categoryId = categoryByKey.category_id;
              logCategoryDebug('Found category by key match', {
                categoryKey: filterParams.selectedCategory,
                categoryId,
                matchedName: categoryByKey.en_name
              });
              
              // Apply direct filter by category_id
              query = query.eq('category_id', categoryId);
            } else {
              // Try to look up by category label as fallback
              const categoryLabel = categoryOptions.find(cat => cat.value === filterParams.selectedCategory)?.label;
              if (categoryLabel) {
                const { data: categoryByName, error: nameError } = await supabase
                  .from('categories')
                  .select('category_id, en_name, category_key, type')
                  .ilike('en_name', categoryLabel)
                  .single();
                  
                if (!nameError && categoryByName?.category_id) {
                  const categoryId = categoryByName.category_id;
                  logCategoryDebug('Found category by name match', {
                    categoryLabel,
                    matchedName: categoryByName.en_name,
                    categoryId,
                    key: categoryByName.category_key
                  });
                  
                  // Apply direct filter by category_id
                  query = query.eq('category_id', categoryId);
                } else {
                  // To show no results (empty state), use an impossible category_id
                  query = query.eq('category_id', -999);
                }
              } else {
                // No label found for the selected category
                query = query.eq('category_id', -999);
              }
            }
          } else {
            // Last resort: try with the numeric ID if it's a number
            const numericId = Number(filterParams.selectedCategory);
            if (!isNaN(numericId)) {
              logCategoryDebug('Using direct numeric ID', numericId);
              query = query.eq('category_id', numericId);
            } else {
              // Log that we couldn't find the category
              logCategoryDebug('Could not find matching category', {
                selectedCategory: filterParams.selectedCategory
              });
              
              // To show no results (empty state), use an impossible category_id
              query = query.eq('category_id', -999);
            }
          }
        } catch (error) {
          console.error('Error processing category filter:', error);
          logCategoryDebug('Exception during category filtering', error);
          query = query.eq('category_id', -999);
        }
      }
      
      // Apply search term if present
      if (filterParams.searchTerm) {
        query = query.ilike('description', `%${filterParams.searchTerm}%`);
      }
      
      // Apply pagination
      query = query.range(start, end);
      
      // Execute the query
      const { data, error: queryError } = await query;
      
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
        
        // For numeric category_id, keep it as is - we'll display by category_id directly
        // The getDisplayCategoryName function will handle the proper display
        
        return {
          id: t.id,
          amount: t.amount,
          category: '',
          categoryId: categoryId, // Keep as the numeric ID from database
          description: t.description || '',
          date: t.date,
          type: t.type,
          walletId: t.wallet_id,
          walletName: walletNames[t.wallet_id] || 'Unknown Wallet'
        };
      });
      
      // Update state based on sort option
      if (isMounted.current) {
        if (isInitialLoad) {
          setTransactions(processedTransactions);
        } else {
          setTransactions(prev => [...prev, ...processedTransactions]);
        }
        
        setHasMore(processedTransactions.length === pageSize);
        
        // Log details of the fetched transactions for debugging
        if (filterParams.selectedCategory !== 'all') {
          // Get the visible category name for the selected filter
          const selectedCategoryLabel = categoryOptions.find(cat => cat.value === filterParams.selectedCategory)?.label || filterParams.selectedCategory;
          
          logCategoryDebug('Fetched transactions with category filter', {
            categoryFilter: selectedCategoryLabel,
            categoryValue: filterParams.selectedCategory,
            count: processedTransactions.length,
            transactionDetails: processedTransactions.map(t => ({
              id: t.id,
              categoryId: t.categoryId,
              description: t.description,
              type: t.type,
              amount: t.amount
            }))
          });
          
          // Verify all fetched transactions match the selected category
          const matchingCategory = processedTransactions.every(t => {
            if (filterParams.selectedCategory.includes('_')) {
              // For category values like "expense_transportation"
              // Need to check if transaction's category_id matches the correct numeric ID from database
              const categoryKey = filterParams.selectedCategory;
              
              // We already filtered in the database query, so this should always be true
              // But we'll keep this validation for debugging purposes
              return t.categoryId !== undefined && t.categoryId !== null;
            } else {
              // For direct category IDs (numeric values)
              return t.categoryId === Number(filterParams.selectedCategory);
            }
          });
          
          // Log if all transactions match the expected category
          logCategoryDebug('Category filter validation', {
            allTransactionsMatchCategory: matchingCategory,
            selectedCategory: filterParams.selectedCategory
          });
        }
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
  
  // Fetch transactions when filters or sorting changes
  useEffect(() => {
    console.log('Filter params changed:', filterParams);
    
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
  
  // Apply search filter with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      // Reset transactions when search changes
      setTransactions([]);
      applyFilters();
    }, 500);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);
  
  // Apply other filters immediately
  useEffect(() => {
    // Reset transactions when filters change
    setTransactions([]);
    applyFilters();
  }, [typeFilter, selectedCategory, sortOption]);
  
  // Debug function to log category selection and filtering
  const logCategoryDebug = (action: string, details?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Category Debug] ${action}`, details || '');
    }
  }
  
  // Helper function to fetch all category information for debugging
  const logAllCategories = async () => {
    try {
      const { data: allCategories, error } = await supabase
        .from('categories')
        .select('category_id, en_name, category_key, type');
        
      if (error) {
        console.error('Error fetching all categories:', error);
      } else {
        console.log('All available categories:', allCategories);
      }
    } catch (e) {
      console.error('Exception fetching categories:', e);
    }
  }
  
  // Handle filter changes
  const applyFilters = () => {
    if (selectedCategory !== 'all') {
      const categoryLabel = categoryOptions.find(cat => cat.value === selectedCategory)?.label;
      logCategoryDebug('Applying category filter', { 
        value: selectedCategory, 
        label: categoryLabel 
      });
      
      // When selecting a category, log all available categories for debugging
      if (process.env.NODE_ENV !== 'production') {
        logAllCategories();
      }
    }
    
    setFilterParams({
      searchTerm,
      typeFilter,
      selectedCategory,
      sortOption
    });
  };
  
  // Load more transactions
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      console.log(`Loading more transactions with sorting: ${sortOption}`);
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
  
  // Handle transaction click - updated to use overlay
  const handleClick = (transaction: any) => {
    if (onTransactionClick) {
      // Support legacy dialog mode if callback is provided
      onTransactionClick(transaction.id);
    } else {
      // Show transaction detail overlay
      setSelectedTransaction(transaction);
      setIsDetailOpen(true);
    }
  };
  
  // Group transactions by date - but only if sorting by date
  const groupTransactionsByDate = () => {
    // For amount-based sorting, we don't group by date
    if (sortOption.includes('amount-')) {
      // Ensure client-side sorting is consistent with database ordering
      const sortedTransactions = [...transactions].sort((a, b) => {
        if (sortOption === 'amount-highest') {
          return b.amount - a.amount;
        } else if (sortOption === 'amount-lowest') {
          return a.amount - b.amount;
        }
        return 0;
      });
      
      return [{ date: null, transactions: sortedTransactions }];
    }
    
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
        if (sortOption === 'date-newest') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortOption === 'date-latest') {
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
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return dateString || 'Unknown date';
    }
  };
  
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
          <div className="ml-4">
            <h3 className="font-medium">
              {getDisplayCategoryName(transaction)}
            </h3>
            <p className="text-xs text-[#868686]">
              {transaction.description}
              {/* Show date on the same line when sorting by amount */}
              {sortOption.includes('amount-') && (
                <span className="ml-2 text-[#A0A0A0]">
                  {formatDate(transaction.date)}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <span className={`font-medium mr-3 ${transaction.type === 'expense' ? 'text-red-500' : 'text-[#C6FE1E]'}`}>
            {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
          </span>
          <button 
            onClick={(e) => handleDeleteClick(transaction.id, e)}
            className="text-[#868686] hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
  
  return (
    <>
      <div className="space-y-6">
        {/* Search and filter section */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#868686]" size={18} />
            <Input
              placeholder={t('transactions.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#242425] border-none text-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#868686] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          {/* Filter buttons */}
          <div className="flex bg-[#242425] rounded-full overflow-hidden">
            <button
              className={`flex-1 py-2 px-4 text-sm ${typeFilter === 'all' ? 'bg-[#C6FE1E] text-black font-medium' : 'text-[#868686]'}`}
              onClick={() => setTypeFilter('all')}
            >
              {t('common.all')}
            </button>
            <button
              className={`flex-1 py-2 px-4 text-sm ${typeFilter === 'income' ? 'bg-[#C6FE1E] text-black font-medium' : 'text-[#868686]'}`}
              onClick={() => setTypeFilter('income')}
            >
              {t('income.title')}
            </button>
            <button
              className={`flex-1 py-2 px-4 text-sm ${typeFilter === 'expense' ? 'bg-[#C6FE1E] text-black font-medium' : 'text-[#868686]'}`}
              onClick={() => setTypeFilter('expense')}
            >
              {t('expense.title')}
            </button>
          </div>
          
          {/* Sorting and additional filters row */}
          <div className="flex gap-3">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="bg-[#242425] border-none text-white h-auto py-2 flex-1">
                <SelectValue placeholder={t('categories.all')} />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#333] text-white">
                {categoryOptions.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={sortOption}
              onValueChange={(value: 'date-newest' | 'date-latest' | 'amount-highest' | 'amount-lowest') => setSortOption(value)}
            >
              <SelectTrigger className="bg-[#242425] border-none text-white h-auto py-2 flex-1">
                <SelectValue placeholder={t('sort.date_newest')} />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#333] text-white">
                <SelectItem value="date-newest">{t('sort.date_newest')}</SelectItem>
                <SelectItem value="date-latest">{t('sort.date_oldest')}</SelectItem>
                <SelectItem value="amount-highest">{t('sort.amount_highest')}</SelectItem>
                <SelectItem value="amount-lowest">{t('sort.amount_lowest')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
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
              
              {/* Empty state - show filter notice if filters are applied */}
              {!error && transactions.length === 0 && (
                <div className="text-center py-8 text-[#868686]">
                  {(searchTerm || typeFilter !== 'all' || selectedCategory !== 'all') ? (
                    <>
                      <p className="mb-2">{t('transactions.no_transactions_filtered')}</p>
                      <Button 
                        onClick={() => {
                          setSearchTerm('');
                          setTypeFilter('all');
                          setSelectedCategory('all');
                          setFilterParams({
                            searchTerm: '',
                            typeFilter: 'all',
                            selectedCategory: 'all',
                            sortOption
                          });
                        }}
                        className="bg-[#242425] hover:bg-[#333] text-white mt-2"
                      >
                        {t('common.clear_filters')}
                      </Button>
                    </>
                  ) : (
                    <p>{t('transactions.no_transactions')}</p>
                  )}
                </div>
              )}
              
              {/* Transaction list */}
              {groupedTransactions.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-2">
                  {/* Date header - Only show if we're grouping by date */}
                  {group.date && (
                    <div className="flex items-center gap-1.5 text-[#A0A0A0] text-sm mb-2">
                      <Calendar size={14} />
                      <span>{new Date(group.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}
                  
                  {/* Transactions */}
                  {group.transactions.map((transaction: any) => (
                    renderTransactionItem(transaction)
                  ))}
                </div>
              ))}
              
              {/* Load more button */}
              {hasMore && (
                <div className="text-center py-4">
                  <Button 
                    onClick={() => fetchTransactions(page + 1)}
                    disabled={isLoadingMore}
                    className="bg-[#242425] hover:bg-[#333] text-white"
                  >
                    {isLoadingMore ? (
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {t('common.load_more')}
                  </Button>
                </div>
              )}
            </>
          )}
        </motion.div>
        
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
      
      {/* Transaction Detail Overlay */}
      {selectedTransaction && !onTransactionClick && (
        <TransactionDetailOverlay
          transaction={selectedTransaction}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      )}
    </>
  );
};

export default TransactionList;
