import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Filter, Search, Trash2, ChevronDown, Loader, X, Wallet } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
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
import { useNavigate } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import TransactionDetailOverlay from '@/components/transactions/TransactionDetailOverlay';
import i18next from 'i18next';
import { format, parseISO, isToday, isYesterday, parse } from 'date-fns';
import { id as idLocale, enUS as enUSLocale } from 'date-fns/locale';

interface TransactionListProps {
  onTransactionClick?: (id: string) => void;
}

interface WalletOption {
  id: string;
  name: string;
}

const TransactionList: React.FC<TransactionListProps> = ({ onTransactionClick }) => {
  const { t, i18n } = useTranslation();
  const { formatCurrency, deleteTransaction } = useFinance();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getDisplayName, findById, categories } = useCategories();
  
  // Pagination and loading state
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadedTransactionIds, setLoadedTransactionIds] = useState<Set<string>>(new Set());
  const pageSize = 20;
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'date-newest' | 'date-latest' | 'amount-highest' | 'amount-lowest'>('date-newest');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [filterParams, setFilterParams] = useState({
    searchTerm: '',
    typeFilter: 'all',
    selectedCategory: 'all',
    selectedWallet: 'all',
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
  
  // Fetch wallets on component mount
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const { data, error } = await supabase
          .from('wallets')
          .select('id, name')
          .order('name');
        
        if (error) {
          console.error('Error fetching wallets:', error);
          return;
        }
        
        if (data) {
          setWallets(data);
        }
      } catch (err) {
        console.error('Error fetching wallets:', err);
      }
    };
    
    fetchWallets();
  }, []);
  
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
      
      console.log(`Fetching transactions: page ${pageNum}, sort: ${filterParams.sortOption}, type: ${filterParams.typeFilter}, category: ${filterParams.selectedCategory}, wallet: ${filterParams.selectedWallet}`);
      
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
        // Default to timestamp sorting (newest or latest)
        // Use 'created_at' instead of 'date' for accurate sorting including time
        query = query.order('created_at', { ascending: filterParams.sortOption === 'date-latest' });
      }
      
      // Apply type filter if not 'all'
      if (filterParams.typeFilter !== 'all') {
        query = query.eq('type', filterParams.typeFilter);
      }
      
      // Apply wallet filter if not 'all'
      if (filterParams.selectedWallet !== 'all') {
        query = query.eq('wallet_id', filterParams.selectedWallet);
      }
      
      // Apply category filter if not 'all'
      if (filterParams.selectedCategory !== 'all') {
        logCategoryDebug('Filtering transactions by category', filterParams.selectedCategory);
        
        try {
          // Use categories from useCategories hook instead of direct queries
          let categoryId: number | null = null;
          
          // If the selected category value contains underscore (like expense_food), use that directly as category_key
          if (filterParams.selectedCategory.includes('_')) {
            const categoryByKey = categories.find(cat => cat.category_key === filterParams.selectedCategory);
              
            if (categoryByKey?.category_id) {
              categoryId = categoryByKey.category_id;
              logCategoryDebug('Found category by key match', {
                categoryKey: filterParams.selectedCategory,
                categoryId,
                matchedName: categoryByKey.en_name
              });
            } else {
              // Try to look up by category label as fallback
              const categoryLabel = categoryOptions.find(cat => cat.value === filterParams.selectedCategory)?.label;
              if (categoryLabel) {
                const categoryByName = categories.find(cat => 
                  cat.en_name?.toLowerCase() === categoryLabel.toLowerCase() ||
                  cat.id_name?.toLowerCase() === categoryLabel.toLowerCase()
                );
                  
                if (categoryByName?.category_id) {
                  categoryId = categoryByName.category_id;
                  logCategoryDebug('Found category by name match', {
                    categoryLabel,
                    matchedName: categoryByName.en_name,
                    categoryId,
                    key: categoryByName.category_key
                  });
                } else {
                  // To show no results (empty state), use an impossible category_id
                  categoryId = -999;
                }
              } else {
                // No label found for the selected category
                categoryId = -999;
              }
            }
          } else {
            // Last resort: try with the numeric ID if it's a number
            const numericId = Number(filterParams.selectedCategory);
            if (!isNaN(numericId)) {
              logCategoryDebug('Using direct numeric ID', numericId);
              categoryId = numericId;
            } else {
              // Log that we couldn't find the category
              logCategoryDebug('Could not find matching category', {
                selectedCategory: filterParams.selectedCategory
              });
              
              // To show no results (empty state), use an impossible category_id
              categoryId = -999;
            }
          }
          
          // Apply the category filter if we found a valid category ID
          if (categoryId !== null) {
            query = query.eq('category_id', categoryId);
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
        const categoryId = t.category_id;
        
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
          setLoadedTransactionIds(new Set(processedTransactions.map(t => t.id)));
          // Only set hasMore to false if we got fewer transactions than pageSize
          setHasMore(processedTransactions.length >= pageSize);
          
          // Log details of the fetched transactions for debugging
          console.log(`Fetched ${processedTransactions.length} transactions, ${processedTransactions.length} new, ${processedTransactions.length} total loaded`);
        } else {
          // Filter out any transactions already loaded to prevent duplicates
          const newTransactions = processedTransactions.filter(t => !loadedTransactionIds.has(t.id));
          
          // Update the list of loaded transaction IDs
          const updatedIds = new Set([...loadedTransactionIds]);
          newTransactions.forEach(t => updatedIds.add(t.id));
          setLoadedTransactionIds(updatedIds);
          
          // Add only new transactions to the list
          if (newTransactions.length > 0) {
            setTransactions(prev => [...prev, ...newTransactions]);
          }
          
          // Only set hasMore to false if we received fewer transactions than requested
          // This means we've reached the end of available data
          setHasMore(processedTransactions.length >= pageSize);
          
          // Log details of the fetched transactions for debugging
          console.log(`Fetched ${processedTransactions.length} transactions, ${newTransactions.length} new, ${transactions.length + newTransactions.length} total loaded`);
        }
        
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
      setLoadedTransactionIds(new Set());
      
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
  
  // Helper function to log all category information for debugging
  const logAllCategories = () => {
    try {
      if (categories && categories.length > 0) {
        console.log('All available categories:', categories.map(cat => ({
          category_id: cat.category_id,
          en_name: cat.en_name,
          id_name: cat.id_name,
          category_key: cat.category_key,
          type: cat.type
        })));
      } else {
        console.log('No categories available from useCategories hook');
      }
    } catch (e) {
      console.error('Exception logging categories:', e);
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
      selectedWallet,
      sortOption
    });
  };
  
  // Update the selectedWallet when changed and apply filters
  useEffect(() => {
    applyFilters();
  }, [selectedWallet]);
  
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
      // Group by local date string (YYYY-MM-DD)
      const localDateString = format(parseISO(transaction.date), 'yyyy-MM-dd');
      if (!groups[localDateString]) {
        groups[localDateString] = [];
      }
      groups[localDateString].push(transaction);
    });
    
    return Object.entries(groups)
      .map(([date, transactions]) => ({ date, transactions })) // date here is 'yyyy-MM-dd'
      .sort((a, b) => {
        // Sort groups by date string 
        if (sortOption === 'date-newest') {
          return b.date.localeCompare(a.date); // Descending
        } else if (sortOption === 'date-latest') {
          return a.date.localeCompare(b.date); // Ascending
        }
        return 0;
      });
  };
  
  const groupedTransactions = groupTransactionsByDate();
  
  // Category list - generate from database categories
  const generateCategoryOptions = () => {
    const allOption = [{ value: 'all', label: t('categories.all') }];
    
    // Generate category options from database
    const categoryOptions = categories.map(cat => {
      return {
        value: cat.category_id.toString(),
        label: getDisplayName(cat)
      };
    });
    
    // Combine all options
    return [...allOption, ...categoryOptions];
  };
  
  const categoryOptions = generateCategoryOptions();
  
  // Format date for display headers (accepts YYYY-MM-DD string)
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    
    try {
      // Get the locale based on i18n language
      const currentLocale = i18n.language.startsWith('id') ? idLocale : enUSLocale;
      
      // Parse the YYYY-MM-DD string
      const date = parse(dateString, 'yyyy-MM-dd', new Date());
      
      if (isToday(date)) {
        return t('common.today'); // Use translation for "Today"
      }
      if (isYesterday(date)) {
        return t('common.yesterday'); // Use translation for "Yesterday"
      }
      // Format other dates like "April 26, 2024" or "26 April 2024"
      return format(date, 'PPP', { locale: currentLocale }); 
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return dateString; // Fallback to the original string
    }
  };
  
  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };
  
  const searchSectionVariants = {
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
  
  const filterButtonsVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25,
        delay: 0.2
      }
    }
  };
  
  const sortingFiltersVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25,
        delay: 0.3
      }
    }
  };
  
  const transactionListVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.05,
        delayChildren: 0.4
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };
  
  const dateHeaderVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25
      }
    }
  };
  
  const loadMoreButtonVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };
  
  // Transaction rendering with wallet name
  const renderTransactionItem = (transaction: any) => (
    <motion.div
      key={transaction.id}
      className="border bg-card p-4 rounded-xl cursor-pointer mb-2"
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
              {transaction.type === 'transfer' 
                ? t('transactions.transfer') 
                : (transaction.categoryId && findById(transaction.categoryId)
                  ? getDisplayName(findById(transaction.categoryId)!)
                  : t('transactions.uncategorized'))}
            </h3>
            <p className="text-xs text-[#868686]">
              {transaction.description}
              {/* Show date on the same line when sorting by amount */}
              {sortOption.includes('amount-') && (
                <span className="ml-2 text-[#A0A0A0]">
                  {/* Format the full ISO string for inline display */}
                  {format(parseISO(transaction.date), 'Pp')}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <div className={`font-medium mr-3 ${transaction.type === 'expense' ? 'text-red-500' : 'text-[#C6FE1E]'}`}>
            <span>{transaction.type === 'expense' ? '-' : '+'}</span>
            <CurrencyDisplay 
              amount={transaction.amount}
              className="inline"
            />
          </div>
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
  
  // Update the component to re-render category options when language changes
  useEffect(() => {
    // Re-render component when language changes to update category labels
  }, [i18n.language]);
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="space-y-6">
        {/* Search and filter section */}
        <motion.div className="space-y-4" variants={searchSectionVariants}>
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
          <motion.div className="flex bg-[#242425] rounded-full overflow-hidden" variants={filterButtonsVariants}>
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
          </motion.div>
          
          {/* Sorting and additional filters row */}
          <motion.div className="flex gap-3" variants={sortingFiltersVariants}>
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
            
            {/* Wallet Filter Dropdown */}
            <Select
              value={selectedWallet}
              onValueChange={setSelectedWallet}
            >
              <SelectTrigger 
                className={`bg-[#242425] border-none text-white h-auto py-2 flex-1 transition-all duration-200 ease-in-out
                  ${selectedWallet !== 'all' ? 'bg-[#242425] border-[#C6FE1E] shadow-[0_0_6px_rgba(198,254,30,0.6)]' : ''}
                `}
              >
                <div className="flex items-center">
                  <Wallet className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t('wallets.all')} />
                </div>
              </SelectTrigger>
              <SelectContent 
                className="bg-[#1A1A1A] border-[#333] text-white"
                style={{
                  animationName: 'fadeIn',
                  animationDuration: '0.2s',
                  animationTimingFunction: 'ease-in-out',
                  animationFillMode: 'forwards'
                }}
              >
                <SelectItem value="all">{t('wallets.all')}</SelectItem>
                {wallets.map(wallet => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
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
          </motion.div>
        </motion.div>
        
        <motion.div
          className="space-y-4"
          variants={transactionListVariants}
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
                  {(searchTerm || typeFilter !== 'all' || selectedCategory !== 'all' || selectedWallet !== 'all') ? (
                    <>
                      <p className="mb-2">{t('transactions.no_transactions_filtered')}</p>
                      <Button 
                        onClick={() => {
                          setSearchTerm('');
                          setTypeFilter('all');
                          setSelectedCategory('all');
                          setSelectedWallet('all');
                          setFilterParams({
                            searchTerm: '',
                            typeFilter: 'all',
                            selectedCategory: 'all',
                            selectedWallet: 'all',
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
                <motion.div key={groupIndex} className="space-y-2" variants={itemVariants}>
                  {/* Date header - Only show if we're grouping by date */}
                  {group.date && (
                    <motion.div className="flex items-center gap-1.5 text-[#A0A0A0] text-sm mb-2" variants={dateHeaderVariants}>
                      <Calendar size={14} />
                      <span>{new Date(group.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </motion.div>
                  )}
                  
                  {/* Transactions */}
                  {group.transactions.map((transaction: any) => (
                    renderTransactionItem(transaction)
                  ))}
                </motion.div>
              ))}
              
              {/* Load more button */}
              {hasMore && (
                <motion.div className="text-center py-4" variants={loadMoreButtonVariants}>
                  <Button 
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="bg-[#242425] hover:bg-[#333] text-white"
                  >
                    {isLoadingMore ? (
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {t('common.load_more')}
                  </Button>
                </motion.div>
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
    </motion.div>
  );
};

export default TransactionList;
