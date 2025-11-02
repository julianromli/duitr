import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/types/finance';
import i18next from 'i18next';

// Minimal category hints for AI (not source of truth - real categories in database)
const AI_CATEGORY_HINTS = {
  expense: [
    { id: '1', name: 'Groceries' }, { id: '2', name: 'Dining' }, { id: '3', name: 'Transportation' },
    { id: '4', name: 'Subscription' }, { id: '5', name: 'Housing' }, { id: '6', name: 'Entertainment' },
    { id: '7', name: 'Shopping' }, { id: '8', name: 'Health' }, { id: '9', name: 'Education' },
    { id: '10', name: 'Vehicle' }, { id: '11', name: 'Personal' }, { id: '12', name: 'Other' }
  ],
  income: [
    { id: '13', name: 'Salary' }, { id: '14', name: 'Business' }, { id: '15', name: 'Investment' },
    { id: '16', name: 'Gift' }, { id: '17', name: 'Other' }
  ]
};

export interface ParsedTransaction {
  description: string;
  amount: number;
  category: string;
  categoryId: string;
  type: 'income' | 'expense';
  confidence: number;
}

export interface AIAddTransactionResponse {
  success: boolean;
  transactions: ParsedTransaction[];
  message: string;
  error?: string;
}

export class AITransactionService {
  private static instance: AITransactionService;

  static getInstance(): AITransactionService {
    if (!AITransactionService.instance) {
      AITransactionService.instance = new AITransactionService();
    }
    return AITransactionService.instance;
  }

  async parseTransactionInput(input: string, defaultWalletId?: string): Promise<AIAddTransactionResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-finance-insight', {
        body: {
          action: 'parse_transactions',
          input: input.trim(),
          language: i18next.language || 'id',
          availableCategories: this.getAvailableCategories()
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return {
          success: false,
          transactions: [],
          message: i18next.t('ai.failedToParse', 'Failed to parse transactions'),
          error: error.message
        };
      }

      const result = data?.result;
      if (!result || !result.transactions) {
        return {
          success: false,
          transactions: [],
          message: i18next.t('ai.noTransactionsFound', 'No transactions found'),
          error: 'Invalid response format'
        };
      }

      // Handle case where transactions might be a string (JSON in markdown)
      let transactionsData = result.transactions;
      if (typeof transactionsData === 'string') {
        try {
          // Try to parse as JSON directly
          transactionsData = JSON.parse(transactionsData);
        } catch {
          // Try to extract JSON from markdown code blocks
          let jsonMatch = transactionsData.match(/```json\s*([\s\S]*?)\s*```/);
          if (!jsonMatch) {
            // Try alternative format: ```json {content} ```
            jsonMatch = transactionsData.match(/```json\s*(\{[\s\S]*\})\s*```/);
          }
          if (!jsonMatch) {
            // Try to find any JSON object between backticks
            jsonMatch = transactionsData.match(/```\s*(\{[\s\S]*\})\s*```/);
          }
          if (jsonMatch) {
            try {
              transactionsData = JSON.parse(jsonMatch[1]);
            } catch {
              return {
                success: false,
                transactions: [],
                message: i18next.t('ai.failedToParse', 'Failed to parse transactions'),
                error: 'Invalid JSON format in response'
              };
            }
          } else {
            return {
              success: false,
              transactions: [],
              message: i18next.t('ai.failedToParse', 'Failed to parse transactions'),
              error: 'No valid JSON found in response'
            };
          }
        }
      }

      const transactions: ParsedTransaction[] = transactionsData.map((tx: {
        description?: string;
        amount?: string | number;
        category?: string;
        type?: 'income' | 'expense';
        confidence?: number;
      }) => ({
        description: tx.description || '',
        amount: this.parseAmount(tx.amount),
        category: tx.category || '',
        categoryId: this.mapToCategoryId(tx.category, tx.type),
        type: tx.type || 'expense',
        confidence: tx.confidence || 0.5
      }));

      return {
        success: true,
        transactions,
        message: result.message || i18next.t('ai.transactionsParsed', 'Transactions parsed successfully')
      };
    } catch (error) {
      console.error('Error parsing transactions:', error);
      return {
        success: false,
        transactions: [],
        message: i18next.t('ai.parseError', 'Error parsing transactions'),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getAvailableCategories(): Array<{name: string, type: string, keywords: string[]}> {
    return [
      ...AI_CATEGORY_HINTS.expense.map(cat => ({
        name: cat.name,
        type: 'expense',
        keywords: this.getCategoryKeywords(cat.name.toLowerCase())
      })),
      ...AI_CATEGORY_HINTS.income.map(cat => ({
        name: cat.name,
        type: 'income',
        keywords: this.getCategoryKeywords(cat.name.toLowerCase())
      }))
    ];
  }

  private getCategoryKeywords(categoryName: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'dining': ['makan', 'makanan', 'nasi', 'padang', 'restoran', 'cafe', 'kopi', 'makan', 'kuliner', 'food'],
      'groceries': ['belanja', 'supermarket', 'minimarket', 'sembako', 'bahan makanan', 'grocery'],
      'transportation': ['transport', 'kendaraan', 'mobil', 'motor', 'bensin', 'parkir', 'tol', 'ojek', 'grab', 'gojek'],
      'subscription': ['langganan', 'netflix', 'spotify', 'youtube', 'premium', 'berlangganan'],
      'housing': ['rumah', 'kost', 'kontrakan', 'listrik', 'air', 'internet', 'tagihan'],
      'entertainment': ['hiburan', 'film', 'bioskop', 'game', 'music', 'concert'],
      'shopping': ['belanja', 'baju', 'celana', 'sepatu', 'tas', 'kemeja', 'jaket'],
      'health': ['kesehatan', 'dokter', 'rumah sakit', 'obat', 'vitamin'],
      'education': ['pendidikan', 'sekolah', 'kuliah', 'buku', 'kursus'],
      'travel': ['travel', 'liburan', 'hotel', 'pesawat', 'tiket'],
      'personal': ['personal', 'potong rambut', 'spa', 'salon'],
      'salary': ['gaji', 'salary', 'pendapatan', 'upah'],
      'business': ['bisnis', 'usaha', 'toko', 'jualan'],
      'gift': ['hadiah', 'kado', 'bonus', 'uang']
    };

    return keywordMap[categoryName] || [categoryName];
  }

  private parseAmount(amount: string | number): number {
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const lowerAmount = amount.toLowerCase();
      
      // Detect multiplier BEFORE cleaning digits
      let multiplier = 1;
      if (lowerAmount.includes('juta') || lowerAmount.includes('jt')) {
        multiplier = 1000000;
      } else if (lowerAmount.includes('ribu') || lowerAmount.includes('rb')) {
        multiplier = 1000;
      } else if (lowerAmount.includes('k')) {
        multiplier = 1000;
      }
      
      // Extract numeric value (supports decimals like "2.5 juta")
      const numericMatch = lowerAmount.match(/[\d.]+/);
      if (!numericMatch) return 0;
      
      const numericValue = parseFloat(numericMatch[0]);
      
      return Math.round(numericValue * multiplier);
    }
    return 0;
  }

  private mapToCategoryId(categoryName: string, type: 'income' | 'expense'): string {
    const allCategories = [
      ...AI_CATEGORY_HINTS.expense,
      ...AI_CATEGORY_HINTS.income
    ];

    // Find best matching category
    const normalizedInput = categoryName.toLowerCase();

    // Direct match
    let category = allCategories.find(cat =>
      cat.name.toLowerCase() === normalizedInput
    );

    if (!category) {
      // Fuzzy match based on keywords
      category = this.findBestCategoryMatch(normalizedInput, type);
    }

    return category?.id || (type === 'expense' ? '12' : '18'); // Default to Other
  }

  private findBestCategoryMatch(input: string, type: 'income' | 'expense'): {id: string, name: string} | undefined {
    const categories = type === 'expense' ? AI_CATEGORY_HINTS.expense : AI_CATEGORY_HINTS.income;

    // Simple keyword matching
    for (const category of categories) {
      const keywords = this.getCategoryKeywords(category.name.toLowerCase());
      if (keywords.some(keyword => input.includes(keyword))) {
        return category;
      }
    }

    // Fallback to Other category
    return categories.find(cat => cat.name.toLowerCase() === 'other') || categories[categories.length - 1];
  }

  validateTransactions(transactions: ParsedTransaction[]): {valid: ParsedTransaction[], invalid: ParsedTransaction[]} {
    const valid: ParsedTransaction[] = [];
    const invalid: ParsedTransaction[] = [];

    for (const tx of transactions) {
      if (tx.amount > 0 && tx.description.trim().length > 0) {
        valid.push(tx);
      } else {
        invalid.push(tx);
      }
    }

    return { valid, invalid };
  }

  convertToTransactionFormat(parsedTx: ParsedTransaction, walletId: string): Omit<Transaction, 'id' | 'userId'> {
    return {
      amount: parsedTx.amount,
      categoryId: parsedTx.categoryId,
      description: parsedTx.description,
      date: new Date().toISOString().split('T')[0], // Today's date
      type: parsedTx.type,
      walletId,
      created_at: new Date().toISOString()
    };
  }
}