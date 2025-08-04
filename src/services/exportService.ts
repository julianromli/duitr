import * as XLSX from 'xlsx';
import { Transaction } from '@/types/finance';
import { supabase } from '@/lib/supabase';

interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  includeTransactions?: boolean;
  includeSummary?: boolean;
  includeBudgets?: boolean;
  includeWallets?: boolean;
}

/**
 * Formats currency values according to IDR format
 * @param amount Number to format as currency
 * @returns Formatted currency string
 */
const formatCurrency = (amount: number): string => {
  const locale = 'id-ID';
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    currencyDisplay: 'narrowSymbol'
  };
  
  return new Intl.NumberFormat(locale, options).format(amount);
};

/**
 * Filter transactions by date range
 */
const filterTransactionsByDate = (
  transactions: Transaction[], 
  startDate?: Date, 
  endDate?: Date
): Transaction[] => {
  if (!startDate && !endDate) return transactions;
  
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    
    if (startDate && endDate) {
      return transactionDate >= startDate && transactionDate <= endDate;
    } else if (startDate) {
      return transactionDate >= startDate;
    } else if (endDate) {
      return transactionDate <= endDate;
    }
    
    return true;
  });
};

/**
 * Generate worksheet for transactions export
 */
const generateTransactionsWorksheet = async (transactions: Transaction[]): Promise<XLSX.WorkSheet> => {
  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Fetch wallet data to map wallet IDs to names
  const { data: wallets } = await supabase
    .from('wallets')
    .select('id, name');
  
  const walletMap = new Map();
  if (wallets) {
    wallets.forEach(wallet => walletMap.set(wallet.id, wallet.name));
  }

  // Try to fetch category data with proper error handling
  const categoryMap = new Map();
  const defaultExpenseCategory = { en_name: 'Other', type: 'expense' };
  const defaultIncomeCategory = { en_name: 'Other', type: 'income' };
  const transferCategory = { en_name: 'Transfer', type: 'system' };
  
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('category_id, category_key, en_name, type');
    
    if (error) {
      // Check if it's a "relation does not exist" error
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.warn('Categories table does not exist, using fallback categories for export');
      } else {
        console.warn('Could not fetch categories for export:', error.message);
      }
      // Continue with empty category map - will use fallback logic
    } else if (categories) {
      categories.forEach(cat => categoryMap.set(cat.category_id, cat));
    }
  } catch (error: any) {
    // Check if it's a "relation does not exist" error
    if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
      console.warn('Categories table does not exist, using fallback categories for export');
    } else {
      console.warn('Error fetching categories for export:', error);
    }
    // Continue with empty category map - will use fallback logic
  }
  
  // Map transactions to table rows
  const tableData = sortedTransactions.map(transaction => {
    // Determine category name
    let categoryName = 'Other';
    
    if (transaction.type === 'transfer') {
      categoryName = 'Transfer';
    } else if (transaction.categoryId) {
      // Try to get category name from the categories table
      const category = categoryMap.get(transaction.categoryId);
      if (category) {
        categoryName = category.en_name;
      } else if (transaction.category) {
        // Use transaction.category if it exists and is not empty
        categoryName = transaction.category || (transaction.type === 'income' ? 'Other' : 'Other');
      } else {
        // Default to "Other" based on transaction type
        categoryName = transaction.type === 'income' ? 'Other' : 'Other';
      }
    } else {
      // Default to "Other" based on transaction type
      categoryName = transaction.type === 'income' ? 'Other' : 'Other';
    }
    
    // Get wallet name (or use "Unknown Wallet" if not found)
    const walletName = walletMap.get(transaction.walletId) || 'Unknown Wallet';
    
    return {
      Date: transaction.date,
      Type: transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
      Category: categoryName,
      Description: transaction.description,
      Amount: formatCurrency(transaction.amount),
      Wallet: walletName,
    };
  });
  
  return XLSX.utils.json_to_sheet(tableData);
};

/**
 * Export financial data to Excel
 */
export const exportToExcel = async (
  transactions: Transaction[],
  options: ExportOptions = {}
): Promise<void> => {
  // Set default options
  const defaultOptions: ExportOptions = {
    includeTransactions: true,
    includeSummary: true,
    includeBudgets: true,
    includeWallets: true,
  };
  
  const exportOptions = { ...defaultOptions, ...options };
  
  // Filter transactions by date range if specified
  const filteredTransactions = filterTransactionsByDate(
    transactions, 
    exportOptions.startDate, 
    exportOptions.endDate
  );
  
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Add transactions sheet if requested
  if (exportOptions.includeTransactions) {
    const transactionsSheet = await generateTransactionsWorksheet(filteredTransactions);
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
  }
  
  // Generate filename with current date
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  const filename = `finance_export_${dateStr}.xlsx`;
  
  // Export the workbook
  XLSX.writeFile(workbook, filename);
};

export default {
  exportToExcel,
};