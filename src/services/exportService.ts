import * as XLSX from 'xlsx';
import { Transaction } from '@/types/finance';

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
const generateTransactionsWorksheet = (transactions: Transaction[]): XLSX.WorkSheet => {
  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Map transactions to table rows
  const tableData = sortedTransactions.map(transaction => ({
    Date: transaction.date,
    Type: transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
    Category: transaction.category,
    Description: transaction.description,
    Amount: formatCurrency(transaction.amount),
    'Wallet ID': transaction.walletId,
  }));
  
  return XLSX.utils.json_to_sheet(tableData);
};

/**
 * Export financial data to Excel
 */
export const exportToExcel = (
  transactions: Transaction[],
  options: ExportOptions = {}
): void => {
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
    const transactionsSheet = generateTransactionsWorksheet(filteredTransactions);
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