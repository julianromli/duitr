import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/types/finance';
import i18next from 'i18next';

export interface TransactionCorrectionHint {
  categoryFrom: string;
  categoryTo: string;
  amountFrom: number;
  amountTo: number;
  descriptionFrom: string;
  descriptionTo: string;
  typeFrom: 'income' | 'expense';
  typeTo: 'income' | 'expense';
  ts: number;
}

const CORRECTION_HINTS_STORAGE_KEY = 'duitr.ai.transaction-correction-hints';
const CORRECTION_HINTS_LIMIT = 20;
const RECENT_CORRECTION_HINTS_LIMIT = 3;

// Minimal category hints for AI (not source of truth - real categories in database)
const AI_CATEGORY_HINTS = {
  expense: [
    { id: 1, name: 'Groceries' }, { id: 2, name: 'Dining' }, { id: 3, name: 'Transportation' },
    { id: 4, name: 'Subscription' }, { id: 5, name: 'Housing' }, { id: 6, name: 'Entertainment' },
    { id: 7, name: 'Shopping' }, { id: 8, name: 'Health' }, { id: 9, name: 'Education' },
    { id: 10, name: 'Vehicle' }, { id: 11, name: 'Personal' }, { id: 12, name: 'Other' }
  ],
  income: [
    { id: 13, name: 'Salary' }, { id: 14, name: 'Business' }, { id: 15, name: 'Investment' },
    { id: 16, name: 'Gift' }, { id: 17, name: 'Other' }
  ]
};

export interface ParsedTransaction {
  description: string;
  amount: number;
  category: string;
  categoryId: number;
  type: 'income' | 'expense';
  confidence: number;
  reason?: string;
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

  async parseTransactionInput(input: string): Promise<AIAddTransactionResponse> {
    try {
      const correctionHints = this.getRecentCorrectionHints();
      const language = (i18next.language || 'id').split('-')[0];
      const { data, error } = await supabase.functions.invoke('gemini-finance-insight', {
        body: {
          action: 'parse_transactions',
          input: input.trim(),
          language,
          availableCategories: this.getAvailableCategories(),
          correctionHints
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
        reason?: string;
        explanation?: string;
      }) => ({
        description: tx.description || '',
        amount: this.parseAmount(tx.amount),
        category: tx.category || '',
        categoryId: this.resolveCategoryId(tx.category || '', tx.type || 'expense'),
        type: tx.type || 'expense',
        confidence: tx.confidence ?? 0.5,
        reason: this.normalizeReason(tx.reason ?? tx.explanation)
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

  recordCorrectionHint(original: ParsedTransaction, edited: ParsedTransaction): void {
    if (!this.hasMeaningfulCorrection(original, edited)) return;

    const hint: TransactionCorrectionHint = {
      categoryFrom: original.category,
      categoryTo: edited.category,
      amountFrom: original.amount,
      amountTo: edited.amount,
      descriptionFrom: this.compactText(original.description),
      descriptionTo: this.compactText(edited.description),
      typeFrom: original.type,
      typeTo: edited.type,
      ts: Date.now()
    };

    const existing = this.readCorrectionHints();
    const next = [hint, ...existing].slice(0, CORRECTION_HINTS_LIMIT);
    this.writeCorrectionHints(next);
  }

  getRecentCorrectionHints(limit = RECENT_CORRECTION_HINTS_LIMIT): TransactionCorrectionHint[] {
    return this.readCorrectionHints().slice(0, Math.max(0, limit));
  }

  clearCorrectionHints(): void {
    this.writeCorrectionHints([]);
  }

  private hasMeaningfulCorrection(original: ParsedTransaction, edited: ParsedTransaction): boolean {
    return original.categoryId !== edited.categoryId
      || original.amount !== edited.amount
      || original.description.trim() !== edited.description.trim()
      || original.type !== edited.type;
  }

  private compactText(value: string, limit = 48): string {
    const compact = value.replace(/\s+/g, ' ').trim();
    return compact.length > limit ? compact.slice(0, limit).trim() : compact;
  }

  private readCorrectionHints(): TransactionCorrectionHint[] {
    if (typeof window === 'undefined') return [];

    try {
      const raw = window.localStorage.getItem(CORRECTION_HINTS_STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw) as TransactionCorrectionHint[];
      if (!Array.isArray(parsed)) return [];

      return parsed.filter((hint): hint is TransactionCorrectionHint => {
        return hint
          && typeof hint.categoryFrom === 'string'
          && typeof hint.categoryTo === 'string'
          && typeof hint.amountFrom === 'number'
          && typeof hint.amountTo === 'number'
          && typeof hint.descriptionFrom === 'string'
          && typeof hint.descriptionTo === 'string'
          && (hint.typeFrom === 'income' || hint.typeFrom === 'expense')
          && (hint.typeTo === 'income' || hint.typeTo === 'expense')
          && typeof hint.ts === 'number';
      }).sort((a, b) => b.ts - a.ts);
    } catch {
      return [];
    }
  }

  private writeCorrectionHints(hints: TransactionCorrectionHint[]): void {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(CORRECTION_HINTS_STORAGE_KEY, JSON.stringify(hints));
    } catch {
      // Ignore storage failures to keep the app local-first and resilient.
    }
  }

  private normalizeReason(reason?: string): string | undefined {
    if (!reason) return undefined;

    const compact = reason.replace(/\s+/g, ' ').trim();
    if (!compact) return undefined;

    return compact.length > 80 ? compact.slice(0, 80).trim() : compact;
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

  resolveCategoryId(categoryName: string, type: 'income' | 'expense'): number {
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

    return category?.id ?? (type === 'expense' ? 12 : 17); // Default to Other
  }

  private findBestCategoryMatch(input: string, type: 'income' | 'expense'): {id: number, name: string} | undefined {
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
      if (tx.amount > 0 && tx.description.trim().length > 0 && tx.category.trim().length > 0) {
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