// Removed xlsx dependency for better performance - using CSV export instead
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
 * Generate CSV data for transactions export
 */
const generateTransactionsCSV = async (transactions: Transaction[]): Promise<string> => {
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

  // Fetch category data to ensure we have proper categories
  const { data: categories } = await supabase
    .from('categories')
    .select('category_id, category_key, en_name, type');
  
  const categoryMap = new Map();
  
  if (categories) {
    categories.forEach(cat => categoryMap.set(cat.category_id, cat));
  }
  
  // CSV header
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Wallet'];
  let csvContent = headers.join(',') + '\n';
  
  // Map transactions to CSV rows
  sortedTransactions.forEach(transaction => {
    // Determine category name
    let categoryName = 'Other';
    
    if (transaction.type === 'transfer') {
      categoryName = 'Transfer';
    } else if (transaction.categoryId) {
      const category = categoryMap.get(transaction.categoryId);
      if (category) {
        categoryName = category.en_name;
      } else if (transaction.category) {
        categoryName = transaction.category || 'Other';
      }
    }
    
    // Get wallet name
    const walletName = walletMap.get(transaction.walletId) || 'Unknown Wallet';
    
    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    };
    
    const row = [
      transaction.date,
      transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
      escapeCSV(categoryName),
      escapeCSV(transaction.description),
      formatCurrency(transaction.amount),
      escapeCSV(walletName)
    ];
    
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
};

/**
 * Export financial data to CSV
 */
export const exportToCSV = async (
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
  
  // Generate CSV content
  if (exportOptions.includeTransactions) {
    const csvContent = await generateTransactionsCSV(filteredTransactions);
    
    // Generate filename with current date
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const filename = `finance_export_${dateStr}.csv`;
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};

// Keep backward compatibility
export const exportToExcel = exportToCSV;

export default {
  exportToExcel,
};