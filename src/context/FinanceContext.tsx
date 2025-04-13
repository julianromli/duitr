import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { formatIDR } from '@/utils/currency';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Transaction, Budget, Wallet, WantToBuyItem, PinjamanItem } from '@/types/finance';
import { 
  legacyCategoryNameToId, 
  getLocalizedCategoryName,
  getCategoryUuidFromStringId,
  getCategoryStringIdFromUuid
} from '@/utils/categoryUtils';
import { getCategoryById } from '@/services/categoryService';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  wallets: Wallet[];
  wantToBuyItems: WantToBuyItem[];
  pinjamanItems: PinjamanItem[];
  currency: string;
  currencySymbol: string;
  isLoading: boolean;
  updateCurrency: () => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'userId'>) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addWallet: (wallet: Omit<Wallet, 'id' | 'userId'>) => Promise<void>;
  updateWallet: (wallet: Wallet) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  addWantToBuyItem: (item: Omit<WantToBuyItem, 'id' | 'userId' | 'created_at' | 'is_purchased'>) => Promise<void>;
  updateWantToBuyItem: (item: WantToBuyItem) => Promise<void>;
  deleteWantToBuyItem: (id: string) => Promise<void>;
  addPinjamanItem: (item: Omit<PinjamanItem, 'id' | 'userId' | 'created_at' | 'is_settled'>) => Promise<void>;
  updatePinjamanItem: (item: PinjamanItem) => Promise<void>;
  deletePinjamanItem: (id: string) => Promise<void>;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  formatCurrency: (amount: number) => string;
  getDisplayCategoryName: (transaction: Transaction) => string;
  getCategoryKey: (categoryId: any) => string;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [wantToBuyItems, setWantToBuyItems] = useState<WantToBuyItem[]>([]);
  const [pinjamanItems, setPinjamanItems] = useState<PinjamanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currency] = useState('IDR');
  const [currencySymbol] = useState('Rp');

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setTransactions([]);
        setBudgets([]);
        setWallets([]);
        setWantToBuyItems([]);
        setPinjamanItems([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const [walletsRes, transactionsRes, budgetsRes, wantToBuyRes, pinjamanRes] = await Promise.all([
          supabase.from('wallets').select('*').eq('user_id', user.id),
          supabase.from('transactions').select('*').eq('user_id', user.id),
          supabase.from('budgets').select('*').eq('user_id', user.id),
          supabase.from('want_to_buy_items').select('*').eq('user_id', user.id),
          supabase.from('pinjaman_items').select('*').eq('user_id', user.id)
        ]);

        if (walletsRes.error) throw walletsRes.error;
        setWallets(walletsRes.data.map(w => ({
          id: w.id,
          name: w.name,
          balance: w.balance,
          icon: w.icon || 'wallet',
          color: w.color,
          type: w.type || 'cash', // Ensure type is never undefined
          userId: w.user_id
        })));
        
        if (transactionsRes.error) throw transactionsRes.error;
        setTransactions(transactionsRes.data.map(t => {
          // Handle category ID conversions
          let categoryId = t.category_id;
          
          // Convert to a usable category ID for the frontend
          if (categoryId) {
            // If it's a UUID (old format)
            if (typeof categoryId === 'string' && categoryId.length > 30) {
              categoryId = getCategoryStringIdFromUuid(categoryId);
            } 
            // If it's a number (new format after migration)
            else if (typeof categoryId === 'number' || !isNaN(Number(categoryId))) {
              // We can use the numeric ID directly, or convert to string key if needed
              // For now, we'll keep the numeric ID
              categoryId = Number(categoryId);
            }
          } else {
            // Default category ID if none exists
            categoryId = t.type === 'transfer' ? 'system_transfer' : 'expense_other';
          }
          
          return {
            id: t.id,
            amount: t.amount,
            category: '',  // Empty since it's no longer in the database
            categoryId: categoryId,
            description: t.description,
            date: t.date,
            type: t.type as 'income' | 'expense' | 'transfer',
            walletId: t.wallet_id,
            userId: t.user_id,
            destinationWalletId: t.destination_wallet_id,
            fee: t.fee
          };
        }));
        
        if (budgetsRes.error) throw budgetsRes.error;
        setBudgets(budgetsRes.data.map(b => ({
          id: b.id,
          amount: b.amount,
          categoryId: b.category_id,
          month: b.month || new Date().getMonth().toString(),
          year: b.year || new Date().getFullYear().toString(),
          walletId: b.wallet_id || wallets[0]?.id || '',
          userId: b.user_id,
          // Keep legacy fields for compatibility if they exist
          spent: b.spent,
          period: b.period as 'monthly' | 'weekly' | 'yearly' | undefined
        })));

        if (wantToBuyRes.error) {
            console.warn('Error loading want_to_buy_items:', wantToBuyRes.error.message);
            setWantToBuyItems([]);
        } else {
            setWantToBuyItems(wantToBuyRes.data.map(item => ({
                id: item.id,
                userId: item.user_id,
                name: item.name,
                icon: item.icon,
                price: item.price,
                category: item.category as 'Keinginan' | 'Kebutuhan',
                estimated_date: item.estimated_date,
                priority: item.priority as 'Tinggi' | 'Sedang' | 'Rendah',
                is_purchased: item.is_purchased,
                created_at: item.created_at
            })));
        }

        if (pinjamanRes.error) {
            console.warn('Error loading pinjaman_items:', pinjamanRes.error.message);
            setPinjamanItems([]);
        } else {
            setPinjamanItems(pinjamanRes.data.map(item => ({
                id: item.id,
                userId: item.user_id,
                name: item.name,
                icon: item.icon,
                category: item.category as 'Utang' | 'Piutang',
                due_date: item.due_date,
                amount: item.amount,
                is_settled: item.is_settled,
                created_at: item.created_at
            })));
         }

      } catch (error: any) {
        console.error('Error loading user data:', error);
        toast({ variant: 'destructive', title: 'Error loading data', description: error.message });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [user, toast]);

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return (
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear
    );
  });
  
  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const monthlyExpense = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    return formatIDR(amount);
  };

  // Get display category name based on categoryId and current language
  const getDisplayCategoryName = (transaction: Transaction): string => {
    // If we have a categoryId, try to use that first
    if (transaction.categoryId) {
      // First check if it's a UUID from the database
      if (typeof transaction.categoryId === 'string' && transaction.categoryId.includes('-')) {
        // Try to get the category name from the id 
        const categoryStringId = getCategoryStringIdFromUuid(transaction.categoryId);
        return i18next.t(`categories.${categoryStringId}`, { defaultValue: 'Unknown' });
      }
      
      // If it's already a number or string number (new system)
      if (typeof transaction.categoryId === 'number' || 
         (typeof transaction.categoryId === 'string' && !isNaN(Number(transaction.categoryId)))) {
        
        const numericId = Number(transaction.categoryId);
        
        // Map of ID to localized category name
        const idToName: Record<number, string> = {
          // Expense categories
          1: i18next.language === 'id' ? 'Belanjaan' : 'Groceries',
          2: i18next.language === 'id' ? 'Makanan' : 'Food',
          3: i18next.language === 'id' ? 'Transportasi' : 'Transportation',
          4: i18next.language === 'id' ? 'Langganan' : 'Subscription',
          5: i18next.language === 'id' ? 'Perumahan' : 'Housing',
          6: i18next.language === 'id' ? 'Hiburan' : 'Entertainment',
          7: i18next.language === 'id' ? 'Belanja' : 'Shopping',
          8: i18next.language === 'id' ? 'Kesehatan' : 'Health',
          9: i18next.language === 'id' ? 'Pendidikan' : 'Education',
          10: i18next.language === 'id' ? 'Perjalanan' : 'Travel',
          11: i18next.language === 'id' ? 'Pribadi' : 'Personal',
          12: i18next.language === 'id' ? 'Lainnya' : 'Other',
            
          // Income categories
          13: i18next.language === 'id' ? 'Gaji' : 'Salary',
          14: i18next.language === 'id' ? 'Bisnis' : 'Business',
          15: i18next.language === 'id' ? 'Investasi' : 'Investment',
          16: i18next.language === 'id' ? 'Hadiah' : 'Gift',
          17: i18next.language === 'id' ? 'Lainnya' : 'Other',
            
          // System
          18: i18next.language === 'id' ? 'Transfer' : 'Transfer'
        };
        
        const displayName = idToName[numericId];
        if (displayName) {
          return displayName;
        }
        
        // For fallback, determine if it's expense or income based on the ID range
        if (numericId <= 12) {
          return i18next.language === 'id' ? 'Lainnya' : 'Other Expense';
        } else if (numericId <= 17) {
          return i18next.language === 'id' ? 'Lainnya' : 'Other Income';
        } else {
          return 'Transfer';
        }
      }
    }
    
    // If it's a transfer, always return "Transfer"
    if (transaction.type === 'transfer') {
      return t('transactions.transfer');
    }
    
    // Fallback: If we still have a category property (legacy), use that
    if (transaction.category) {
      return transaction.category;
    }
    
    // Ultimate fallback based on transaction type
    return transaction.type === 'income' 
      ? (i18next.language === 'id' ? 'Pendapatan' : 'Income') 
      : (i18next.language === 'id' ? 'Pengeluaran' : 'Expense');
  };

  // Get the category key (e.g., 'expense_food') from a category ID
  const getCategoryKey = (categoryId: any): string => {
    // If it's already a string key (e.g., 'expense_food')
    if (typeof categoryId === 'string' && categoryId.includes('_')) {
      return categoryId;
    }
    
    // If it's a UUID, convert to string ID
    if (typeof categoryId === 'string' && categoryId.includes('-')) {
      return getCategoryStringIdFromUuid(categoryId);
    }
    
    // If it's a number or numeric string, map to category key
    if (typeof categoryId === 'number' || (typeof categoryId === 'string' && !isNaN(Number(categoryId)))) {
      const numId = Number(categoryId);
      
      // Map numeric IDs back to string keys
      const idToCategoryKey: Record<number, string> = {
        // Expense categories (IDs 1-12)
        1: 'expense_groceries',
        2: 'expense_food',
        3: 'expense_transportation',
        4: 'expense_subscription',
        5: 'expense_housing',
        6: 'expense_entertainment',
        7: 'expense_shopping',
        8: 'expense_health',
        9: 'expense_education',
        10: 'expense_travel',
        11: 'expense_personal',
        12: 'expense_other',
        
        // Income categories (IDs 13-17)
        13: 'income_salary',
        14: 'income_business',
        15: 'income_investment',
        16: 'income_gift',
        17: 'income_other',
        
        // System category (ID 18)
        18: 'system_transfer'
      };
      
      // Return the mapped category key or a default based on range
      if (idToCategoryKey[numId]) {
        return idToCategoryKey[numId];
      }
      
      // Fallback based on ID ranges
      if (numId <= 12) {
        return 'expense_other';
      } else if (numId <= 17) {
        return 'income_other';
      } else {
        return 'system_transfer';
      }
    }
    
    // Default fallback for empty or undefined
    if (!categoryId) {
      return 'expense_other';
    }
    
    // Ultimate fallback
    return 'expense_other';
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication required', description: 'You must be logged in.' });
      return;
    }

    let fromWallet: Wallet | undefined;
    let toWallet: Wallet | undefined;
    let updatedFromWallet: Wallet | undefined;
    let updatedToWallet: Wallet | undefined;

    if (transaction.type === 'transfer') {
      if (!transaction.destinationWalletId) {
         toast({ variant: 'destructive', title: 'Transfer Error', description: 'Destination wallet is missing.' });
         return;
      }
      fromWallet = wallets.find(w => w.id === transaction.walletId);
      toWallet = wallets.find(w => w.id === transaction.destinationWalletId);
      if (!fromWallet || !toWallet) {
          toast({ variant: 'destructive', title: 'Transfer Error', description: 'One or both wallets not found.' });
          return;
      }
      if (fromWallet.id === toWallet.id) {
          toast({ variant: 'destructive', title: 'Transfer Error', description: 'Cannot transfer to the same wallet.' });
          return;
      }
       const fee = transaction.fee ?? 0;
       updatedFromWallet = { ...fromWallet, balance: fromWallet.balance - (transaction.amount + fee) };
       updatedToWallet = { ...toWallet, balance: toWallet.balance + transaction.amount };

    } else {
      fromWallet = wallets.find(w => w.id === transaction.walletId);
       if (!fromWallet) {
          toast({ variant: 'destructive', title: 'Transaction Error', description: 'Wallet not found.' });
          return;
       }
       const newBalance = transaction.type === 'income'
           ? fromWallet.balance + transaction.amount
           : fromWallet.balance - transaction.amount;
       updatedFromWallet = { ...fromWallet, balance: newBalance };
    }


    try {
      // Determine the categoryId
      let finalCategoryId = transaction.categoryId;
      
      // Handle specific cases
      if (!finalCategoryId) {
        if (transaction.type === 'transfer') {
          finalCategoryId = 'system_transfer';
        } else if (transaction.category) {
          // Legacy fallback
          finalCategoryId = legacyCategoryNameToId(transaction.category, transaction.type, i18next);
        } else {
          // Default fallbacks
          finalCategoryId = transaction.type === 'income' ? 17 : 12; // Default to other
        }
      }

      // Convert string ID to integer for the database
      const dbCategoryId = getCategoryUuidFromStringId(
        typeof finalCategoryId === 'string' ? finalCategoryId : String(finalCategoryId)
      );

      const newTransactionData = {
        amount: transaction.amount,
        category_id: dbCategoryId,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type,
        wallet_id: transaction.walletId,
        user_id: user.id,
        ...(transaction.type === 'transfer' && transaction.destinationWalletId 
          ? { destination_wallet_id: transaction.destinationWalletId } 
          : {}),
        ...(transaction.type === 'transfer' && transaction.fee != null 
          ? { fee: transaction.fee } 
          : {}),
      };
      
      let finalTransactionData;
      
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert(formatTransactionForDB(newTransactionData))
        .select()
        .single();
        
      if (transactionError) {
        if (transactionError.message.includes('destination_wallet_id') || 
            transactionError.message.includes('column') || 
            transactionError.message.includes('schema')) {
          console.error('Schema error detected:', transactionError);
          
          const fallbackData = {
            amount: transaction.amount,
            category_id: dbCategoryId,
            description: transaction.description,
            date: transaction.date,
            type: transaction.type,
            wallet_id: transaction.walletId,
            user_id: user.id,
          };
          
          if (transaction.type === 'transfer' && transaction.destinationWalletId) {
            try {
              const { data: basicTransData, error: basicTransError } = await supabase
                .from('transactions')
                .insert(formatTransactionForDB(fallbackData))
                .select()
                .single();
                
              if (basicTransError) throw basicTransError;
              
              const { error: updateError } = await supabase
                .from('transactions')
                .update({
                  destination_wallet_id: transaction.destinationWalletId,
                  fee: transaction.fee ?? 0
                })
                .eq('id', basicTransData.id);
                
              if (updateError) {
                console.warn('Could not update transfer details:', updateError);
                finalTransactionData = basicTransData;
              } else {
                const { data: updatedTrans } = await supabase
                  .from('transactions')
                  .select()
                  .eq('id', basicTransData.id)
                  .single();
                  
                finalTransactionData = updatedTrans;
              }
            } catch (fallbackError: any) {
              console.error('Fallback transaction insert failed:', fallbackError);
              throw fallbackError;
            }
          } else {
            const { data: basicData, error: basicError } = await supabase
              .from('transactions')
              .insert(fallbackData)
              .select()
              .single();
              
            if (basicError) throw basicError;
            finalTransactionData = basicData;
          }
        } else {
          throw transactionError;
        }
      } else {
        finalTransactionData = transactionData;
      }

      // Update wallet balances 
      if (transaction.type === 'transfer') {
        const { error: fromWalletError } = await supabase
          .from('wallets')
          .update({ balance: updatedFromWallet!.balance })
          .eq('id', updatedFromWallet!.id);
        if (fromWalletError) throw fromWalletError;

        const { error: toWalletError } = await supabase
          .from('wallets')
          .update({ balance: updatedToWallet!.balance })
          .eq('id', updatedToWallet!.id);
        if (toWalletError) throw toWalletError;
      } else {
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: updatedFromWallet!.balance })
          .eq('id', updatedFromWallet!.id);
        if (walletError) throw walletError;
      }

      const formattedTransaction: Transaction = {
        id: finalTransactionData.id,
        amount: finalTransactionData.amount,
        category: '', // Leave empty as the column no longer exists
        categoryId: finalTransactionData.category_id ? 
          (typeof finalTransactionData.category_id === 'string' && finalTransactionData.category_id.length > 30 ? 
            getCategoryStringIdFromUuid(finalTransactionData.category_id) : 
            finalTransactionData.category_id) : 
          12, // Default to expense_other if no category_id
        description: finalTransactionData.description,
        date: finalTransactionData.date,
        type: finalTransactionData.type,
        walletId: finalTransactionData.wallet_id,
        userId: finalTransactionData.user_id,
        destinationWalletId: finalTransactionData.destination_wallet_id,
        fee: finalTransactionData.fee,
      };

      // Sort transactions in descending order by date
      const sortedTransactions = [formattedTransaction, ...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(sortedTransactions);

      setWallets(wallets.map(w => {
          if (updatedFromWallet && w.id === updatedFromWallet.id) return updatedFromWallet;
          if (updatedToWallet && w.id === updatedToWallet.id) return updatedToWallet;
          return w;
      }));

      toast({ title: 'Success', description: `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} added.` });

    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to add transaction' });
    }
  };


  const updateTransaction = async (updatedTransaction: Transaction) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication required' });
      return;
    }
    
      const oldTransaction = transactions.find(t => t.id === updatedTransaction.id);
      if (!oldTransaction) {
        toast({ variant: 'destructive', title: 'Error', description: 'Original transaction not found.' });
        return;
     }

     let balanceUpdates: { walletId: string; change: number }[] = [];

     if (oldTransaction.type === 'transfer') {
        const oldFee = oldTransaction.fee ?? 0;
        balanceUpdates.push({ walletId: oldTransaction.walletId, change: oldTransaction.amount + oldFee });
        if (oldTransaction.destinationWalletId) {
           balanceUpdates.push({ walletId: oldTransaction.destinationWalletId, change: -oldTransaction.amount });
        }
     } else if (oldTransaction.type === 'income') {
        balanceUpdates.push({ walletId: oldTransaction.walletId, change: -oldTransaction.amount });
          } else if (oldTransaction.type === 'expense') {
        balanceUpdates.push({ walletId: oldTransaction.walletId, change: oldTransaction.amount });
     }

     if (updatedTransaction.type === 'transfer') {
        const newFee = updatedTransaction.fee ?? 0;
        if (!updatedTransaction.destinationWalletId) {
           toast({ variant: 'destructive', title: 'Update Error', description: 'Destination wallet missing for transfer.' });
           return;
        }
         balanceUpdates.push({ walletId: updatedTransaction.walletId, change: -(updatedTransaction.amount + newFee) });
         balanceUpdates.push({ walletId: updatedTransaction.destinationWalletId, change: updatedTransaction.amount });
     } else if (updatedTransaction.type === 'income') {
        balanceUpdates.push({ walletId: updatedTransaction.walletId, change: updatedTransaction.amount });
            } else if (updatedTransaction.type === 'expense') {
        balanceUpdates.push({ walletId: updatedTransaction.walletId, change: -updatedTransaction.amount });
     }

     const netBalanceChanges = balanceUpdates.reduce((acc, update) => {
        acc[update.walletId] = (acc[update.walletId] || 0) + update.change;
        return acc;
     }, {} as { [walletId: string]: number });

     const walletsToUpdateLocally: Wallet[] = [];
     const walletsToUpdateInDB: { id: string; balance: number }[] = [];

     for (const walletId in netBalanceChanges) {
        const change = netBalanceChanges[walletId];
        if (change === 0) continue;

        const wallet = wallets.find(w => w.id === walletId);
        if (!wallet) {
            console.error(`Wallet ID ${walletId} not found during update for transaction ${updatedTransaction.id}`);
            toast({ variant: 'destructive', title: 'Update Error', description: `Wallet ${walletId} not found.`});
            continue;
        }
        const newBalance = wallet.balance + change;
        walletsToUpdateLocally.push({ ...wallet, balance: newBalance });
        walletsToUpdateInDB.push({ id: walletId, balance: newBalance });
     }

     try {
        // Determine the categoryId
        const categoryId = updatedTransaction.categoryId || 
          (updatedTransaction.type === 'transfer' 
            ? 'system_transfer' 
            : legacyCategoryNameToId(updatedTransaction.category || '', updatedTransaction.type, i18next));

        // Convert string ID to integer for the database
        const dbCategoryId = getCategoryUuidFromStringId(typeof categoryId === 'string' ? categoryId : String(categoryId));

        // Create update data with optional fields to handle schema issues
        const updateData: {
          amount: number;
          category_id: string;
          description: string;
          date: string;
          type: 'income' | 'expense' | 'transfer';
          wallet_id: string;
          destination_wallet_id?: string | null;
          fee?: number | null;
        } = {
          amount: updatedTransaction.amount,
          category_id: dbCategoryId,
          description: updatedTransaction.description,
          date: updatedTransaction.date,
          type: updatedTransaction.type,
          wallet_id: updatedTransaction.walletId,
        };

        // Add optional fields only if needed to avoid schema errors
        if (updatedTransaction.type === 'transfer') {
          if (updatedTransaction.destinationWalletId) {
            try {
              const { error: testError } = await supabase
                .from('transactions')
                .update({ destination_wallet_id: updatedTransaction.destinationWalletId })
                .eq('id', updatedTransaction.id);
              
              if (!testError) {
                updateData.destination_wallet_id = updatedTransaction.destinationWalletId;
              }
            } catch (e) {
              console.warn('Cannot update destination_wallet_id due to schema issue');
            }

            try {
              const { error: feeError } = await supabase
                .from('transactions')
                .update({ fee: updatedTransaction.fee ?? 0 })
                .eq('id', updatedTransaction.id);

              if (!feeError) {
                updateData.fee = updatedTransaction.fee ?? 0;
              }
            } catch (e) {
              console.warn('Cannot update fee due to schema issue');
            }
          }
        }

        // Update the transaction in the database
        const { data: updatedData, error: updateError } = await supabase
          .from('transactions')
          .update(formatTransactionForDB(updateData))
          .eq('id', updatedTransaction.id)
          .select()
          .single();

        if (updateError) {
          // If there's a schema error, try a more basic update
          if (updateError.message.includes('column') || 
              updateError.message.includes('schema')) {
            console.error('Schema error on update:', updateError);
            
            // Fallback to basic fields only
            const { error: basicUpdateError } = await supabase
              .from('transactions')
              .update({
                amount: updatedTransaction.amount,
                category_id: dbCategoryId,
                description: updatedTransaction.description,
                date: updatedTransaction.date,
                type: updatedTransaction.type,
                wallet_id: updatedTransaction.walletId,
              })
              .eq('id', updatedTransaction.id);
              
            if (basicUpdateError) throw basicUpdateError;
          } else {
            throw updateError;
          }
        }

        await Promise.all(walletsToUpdateInDB.map(walletUpdate =>
            supabase
          .from('wallets')
                .update({ balance: walletUpdate.balance })
                .eq('id', walletUpdate.id)
        ));

        // Format and update local state
        const formattedTransaction: Transaction = {
          ...updatedTransaction,
          categoryId: updateData.category_id,
        };

        // Sort transactions in descending order by date
        const updatedTransactions = transactions.map(t => 
          t.id === formattedTransaction.id ? formattedTransaction : t
        ).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setTransactions(updatedTransactions);
        setWallets(currentWallets => currentWallets.map(w => {
            const updatedWallet = walletsToUpdateLocally.find(uw => uw.id === w.id);
            return updatedWallet ? updatedWallet : w;
        }));

        toast({ title: 'Success', description: 'Transaction updated.' });

    } catch (error: any) {
        console.error('Error updating transaction:', error);
        toast({ variant: 'destructive', title: 'Update Error', description: error.message || 'Failed to update transaction' });
     }
  };


  const deleteTransaction = async (id: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication required' });
      return;
    }
    
    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) {
      toast({ variant: 'destructive', title: 'Error', description: 'Transaction not found.' });
      return;
    }

    let fromWallet: Wallet | undefined;
    let toWallet: Wallet | undefined;
    let updatedFromWallet: Wallet | undefined;
    let updatedToWallet: Wallet | undefined;

    if (transactionToDelete.type === 'transfer') {
        fromWallet = wallets.find(w => w.id === transactionToDelete.walletId);
        if (transactionToDelete.destinationWalletId) {
            toWallet = wallets.find(w => w.id === transactionToDelete.destinationWalletId);
        }

        if (!fromWallet) {
            toast({ variant: 'destructive', title: 'Deletion Error', description: 'Source wallet not found.' });
            return;
        }
        const fee = transactionToDelete.fee ?? 0;
        updatedFromWallet = { ...fromWallet, balance: fromWallet.balance + (transactionToDelete.amount + fee) };
        if (toWallet) {
            updatedToWallet = { ...toWallet, balance: toWallet.balance - transactionToDelete.amount };
        }

    } else {
        fromWallet = wallets.find(w => w.id === transactionToDelete.walletId);
        if (!fromWallet) {
            toast({ variant: 'destructive', title: 'Deletion Error', description: 'Wallet not found.' });
            return;
        }
        const newBalance = transactionToDelete.type === 'income'
            ? fromWallet.balance - transactionToDelete.amount
            : fromWallet.balance + transactionToDelete.amount;
        updatedFromWallet = { ...fromWallet, balance: newBalance };
    }


    try {
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (deleteError) {
        // If there's a schema-related error, try to reset any fields that might cause issues first
        if (deleteError.message.includes('column') || 
            deleteError.message.includes('schema') || 
            deleteError.message.includes('destination_wallet_id')) {
          console.error('Schema error on delete:', deleteError);
          
          try {
            // Try to set problematic fields to null first
            const { error: resetError } = await supabase
              .from('transactions')
              .update({
                destination_wallet_id: null,
                fee: null
              })
              .eq('id', id);
              
            // Even if reset fails, still try to delete
            console.log('Reset fields result:', resetError ? 'Failed' : 'Success');
            
            // Try delete again
            const { error: secondDeleteError } = await supabase
              .from('transactions')
              .delete()
              .eq('id', id);
              
            if (secondDeleteError) throw secondDeleteError;
          } catch (resetError: any) {
            console.error('Failed to reset fields before delete:', resetError);
            throw deleteError; // Use the original error
          }
        } else {
          throw deleteError;
        }
      }

       if (transactionToDelete.type === 'transfer') {
        const { error: fromWalletError } = await supabase
          .from('wallets')
              .update({ balance: updatedFromWallet!.balance })
              .eq('id', updatedFromWallet!.id);
          if (fromWalletError) console.error("Error updating source wallet on delete:", fromWalletError);
          
        
          if (updatedToWallet) {
        const { error: toWalletError } = await supabase
          .from('wallets')
          .update({ balance: updatedToWallet.balance })
                .eq('id', updatedToWallet.id);
              if (toWalletError) console.error("Error updating destination wallet on delete:", toWalletError);
          }
       } else {
          const { error: walletError } = await supabase
              .from('wallets')
              .update({ balance: updatedFromWallet!.balance })
              .eq('id', updatedFromWallet!.id);
           if (walletError) console.error("Error updating wallet on delete:", walletError);
       }


      setTransactions(transactions.filter(t => t.id !== id));
      setWallets(currentWallets => currentWallets.map(w => {
          if (updatedFromWallet && w.id === updatedFromWallet.id) return updatedFromWallet;
          if (updatedToWallet && w.id === updatedToWallet.id) return updatedToWallet;
          return w;
      }));


      toast({ title: 'Success', description: 'Transaction deleted.' });

    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({ variant: 'destructive', title: 'Deletion Error', description: error.message || 'Failed to delete transaction' });
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'userId'>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to add budgets',
      });
      return;
    }
    
    try {
      const newBudget = {
        category: budget.category,
        amount: budget.amount,
        spent: budget.spent,
        period: budget.period,
        user_id: user.id
      };
      
      const { data, error } = await supabase
        .from('budgets')
        .insert(newBudget)
        .select()
        .single();
        
      if (error) throw error;
      
      const formattedBudget = {
        id: data.id,
        category: data.category,
        amount: data.amount,
        spent: data.spent,
        period: data.period as 'monthly' | 'weekly' | 'yearly',
        userId: data.user_id
      };
      
      setBudgets([...budgets, formattedBudget]);
      
      toast({
        title: 'Budget added',
        description: 'Your budget has been successfully added',
      });
    } catch (error: any) {
      console.error('Error adding budget:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to add budget',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  const updateBudget = async (updatedBudget: Budget) => {
    if (!user) return;
    
    try {
      const budgetData = {
        category: updatedBudget.category,
        amount: updatedBudget.amount,
        spent: updatedBudget.spent,
        period: updatedBudget.period
      };
      
      const { error } = await supabase
        .from('budgets')
        .update(budgetData)
        .eq('id', updatedBudget.id);
        
      if (error) throw error;
      
      setBudgets(budgets.map(budget => 
        budget.id === updatedBudget.id ? updatedBudget : budget
      ));
      
      toast({
        title: 'Budget updated',
        description: 'Your budget has been successfully updated',
      });
    } catch (error: any) {
      console.error('Error updating budget:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update budget',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setBudgets(budgets.filter(budget => budget.id !== id));
      
      toast({
        title: 'Budget deleted',
        description: 'Your budget has been successfully deleted',
      });
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete budget',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  const addWallet = async (wallet: Omit<Wallet, 'id' | 'userId'>) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const tempId = Math.random().toString(36).substring(2, 9);
      
      // Make sure the wallet type is valid
      const walletType = wallet.type || 'cash'; // Default to cash if no type is specified
      
      const newWallet = {
        id: tempId,
        ...wallet,
        type: walletType,
        userId: user.id,
      };
      
      setWallets(prev => [...prev, newWallet]);
      
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          name: wallet.name,
          balance: wallet.balance,
          type: walletType,
          color: wallet.color,
          icon: wallet.icon || 'wallet',
          user_id: user.id,
        })
        .select();
      
      if (error) {
        setWallets(prev => prev.filter(w => w.id !== tempId));
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from insert operation');
      }
      
      setWallets(prev => 
        prev.map(w => 
          w.id === tempId ? {
            id: data[0].id,
            name: data[0].name,
            balance: data[0].balance,
            type: data[0].type || 'cash', // Ensure type is never undefined
            color: data[0].color,
            icon: data[0].icon || 'wallet',
            userId: data[0].user_id
          } : w
        )
      );
      
      toast({
        title: 'Wallet added',
        description: `${wallet.name} has been added to your accounts`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error adding wallet',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  const updateWallet = async (updatedWallet: Wallet) => {
    try {
      // Ensure wallet type is valid
      const walletType = updatedWallet.type || 'cash'; // Default to cash if type is undefined
      
      const walletToUpdate = {
        ...updatedWallet,
        type: walletType
      };
      
      setWallets(prev => prev.map(wallet => 
        wallet.id === walletToUpdate.id ? walletToUpdate : wallet)
      );
      
      const { error } = await supabase
        .from('wallets')
        .update({
          name: walletToUpdate.name,
          balance: walletToUpdate.balance,
          type: walletType,
          color: walletToUpdate.color,
          icon: walletToUpdate.icon || 'wallet',
        })
        .eq('id', walletToUpdate.id);
      
      if (error) {
        setWallets(prev => {
          const originalWallet = wallets.find(w => w.id === updatedWallet.id);
          return prev.map(wallet => 
            wallet.id === updatedWallet.id ? (originalWallet || wallet) : wallet
          );
        });
        throw error;
      }
      
      toast({
        title: 'Wallet updated',
        description: `${updatedWallet.name} has been updated`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating wallet',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  const deleteWallet = async (id: string) => {
    if (!user) return;
    
    try {
      const walletTransactions = transactions.filter(t => t.walletId === id);
      
      if (walletTransactions.length > 0) {
        for (const transaction of walletTransactions) {
          const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', transaction.id);
            
          if (error) throw error;
        }
      }
      
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setTransactions(transactions.filter(t => t.walletId !== id));
      setWallets(wallets.filter(wallet => wallet.id !== id));
      
      toast({
        title: 'Wallet deleted',
        description: 'Your wallet has been successfully deleted',
      });
    } catch (error: any) {
      console.error('Error deleting wallet:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete wallet',
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  const updateCurrency = () => {
    // Currency is always IDR, no need to update
  };

  const addWantToBuyItem = async (item: Omit<WantToBuyItem, 'id' | 'userId' | 'created_at' | 'is_purchased'>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('want_to_buy_items')
        .insert({
          name: item.name,
          price: item.price,
          category: item.category,
          priority: item.priority,
          estimated_date: item.estimated_date,
          icon: item.icon,
          user_id: user.id,
          is_purchased: false
        })
        .select()
        .single();

      if (error) throw error;

      const formattedItem: WantToBuyItem = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        icon: data.icon,
        price: data.price,
        category: data.category,
        estimated_date: data.estimated_date,
        priority: data.priority,
        is_purchased: data.is_purchased,
        created_at: data.created_at
      };

      setWantToBuyItems(prev => [formattedItem, ...prev]);
      toast({ title: 'Success', description: 'Wishlist item added.' });

    } catch (error: any) {
      console.error("Error adding WantToBuy item:", error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const updateWantToBuyItem = async (item: WantToBuyItem) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
        return;
    }
    const { userId, created_at, ...updateData } = item;
    try {
        const { error } = await supabase
            .from('want_to_buy_items')
            .update(updateData)
            .eq('id', item.id)
            .eq('user_id', user.id);
        if (error) throw error;
        setWantToBuyItems(prev => prev.map(i => i.id === item.id ? item : i));
    } catch (error: any) {
        console.error("Error updating WantToBuy item:", error);
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const deleteWantToBuyItem = async (id: string) => {
     if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
        return;
    }
    try {
        const { error } = await supabase
            .from('want_to_buy_items')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        if (error) throw error;
        setWantToBuyItems(prev => prev.filter(i => i.id !== id));
        toast({ title: 'Success', description: 'Wishlist item deleted.' });
    } catch (error: any) {
        console.error("Error deleting WantToBuy item:", error);
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const addPinjamanItem = async (item: Omit<PinjamanItem, 'id' | 'userId' | 'created_at' | 'is_settled'>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('pinjaman_items')
        .insert({
          name: item.name,
          category: item.category,
          due_date: item.due_date,
          amount: item.amount,
          icon: item.icon,
          user_id: user.id,
          is_settled: false
        })
        .select()
        .single();

      if (error) throw error;

      const formattedItem: PinjamanItem = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        icon: data.icon,
        category: data.category,
        due_date: data.due_date,
        amount: data.amount,
        is_settled: data.is_settled,
        created_at: data.created_at
      };

      setPinjamanItems(prev => [formattedItem, ...prev].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()));
      toast({ title: 'Success', description: 'Pinjaman item added.' });

    } catch (error: any) {
      console.error("Error adding Pinjaman item:", error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const updatePinjamanItem = async (item: PinjamanItem) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
      return;
    }
    const { userId, created_at, ...updateData } = item;

    try {
      const { error } = await supabase
        .from('pinjaman_items')
        .update({
          name: updateData.name,
          category: updateData.category,
          due_date: updateData.due_date,
          amount: updateData.amount,
          icon: updateData.icon,
          is_settled: updateData.is_settled
        })
        .eq('id', item.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPinjamanItems(prev =>
        prev.map(i => i.id === item.id ? item : i)
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      );
    } catch (error: any) {
      console.error("Error updating Pinjaman item:", error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const deletePinjamanItem = async (id: string) => {
     if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Authentication required.' });
        return;
    }
    try {
        const { error } = await supabase
            .from('pinjaman_items')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;

        setPinjamanItems(prev => prev.filter(i => i.id !== id)); // No need to re-sort after filter
        toast({ title: 'Success', description: 'Pinjaman item deleted.' });
    } catch (error: any) {
        console.error("Error deleting Pinjaman item:", error);
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Utility function to format transaction data for database operations
  // Ensures compatibility with the updated schema (without 'category' column)
  const formatTransactionForDB = (data: any) => {
    // Create a copy of the data without the 'category' field
    const { category, ...dbData } = data;
    
    try {
      // Make sure category_id is properly formatted for database
      if (dbData.category_id) {
        // If it's a string ID like "expense_groceries", convert it to a proper db ID
        if (typeof dbData.category_id === 'string' && dbData.category_id.includes('_')) {
          // Map string category keys to the corresponding integer IDs
          // These IDs are based on the order they were inserted in the category_reset_fixed.sql migration
          const categoryKeyToId: Record<string, number> = {
            // Expense categories (inserted first, IDs 1-12)
            'expense_groceries': 1,
            'expense_food': 2,
            'expense_dining': 2, // Map dining to food (ID 2)
            'expense_transportation': 3,
            'expense_subscription': 4,
            'expense_housing': 5,
            'expense_entertainment': 6,
            'expense_shopping': 7,
            'expense_health': 8,
            'expense_education': 9,
            'expense_travel': 10,
            'expense_personal': 11,
            'expense_other': 12,
            
            // Income categories (inserted second, IDs 13-17)
            'income_salary': 13,
            'income_business': 14,
            'income_investment': 15,
            'income_gift': 16,
            'income_other': 17,
            
            // System category (inserted last, ID 18)
            'system_transfer': 18
          };
          
          const categoryId = categoryKeyToId[dbData.category_id];
          if (categoryId) {
            dbData.category_id = categoryId;
            console.log(`Converted category key ${dbData.category_id} to ID: ${categoryId}`);
          } else {
            // Fallback to appropriate "other" category if not found
            if (dbData.category_id.startsWith('expense_')) {
              dbData.category_id = 12; // expense_other
            } else if (dbData.category_id.startsWith('income_')) {
              dbData.category_id = 17; // income_other
            } else {
              dbData.category_id = 18; // system_transfer
            }
            console.log(`Using fallback ID for ${dbData.category_id}: ${dbData.category_id}`);
          }
        } 
        // If it's already a number, it's fine
        else if (typeof dbData.category_id === 'number' || !isNaN(Number(dbData.category_id))) {
          // Ensure it's a number
          dbData.category_id = Number(dbData.category_id);
          console.log(`Using numeric category ID: ${dbData.category_id}`);
        }
        // If it's a UUID, convert it to the appropriate integer ID based on type
        else if (typeof dbData.category_id === 'string' && dbData.category_id.includes('-')) {
          // Convert UUID to category_key first
          const categoryKey = getCategoryStringIdFromUuid(dbData.category_id);
          
          // Then convert category_key to integer ID using the mapping
          if (categoryKey.startsWith('expense_')) {
            dbData.category_id = 12; // expense_other as fallback
          } else if (categoryKey.startsWith('income_')) {
            dbData.category_id = 17; // income_other as fallback
          } else {
            dbData.category_id = 18; // system_transfer as fallback
          }
          
          console.log(`Converted UUID to ID: ${dbData.category_id}`);
        }
      } else {
        // Default to "other" category if no category_id is provided
        // If we can determine the type, use the appropriate "other" category
        if (data.type === 'income') {
          dbData.category_id = 17; // income_other
        } else if (data.type === 'transfer') {
          dbData.category_id = 18; // system_transfer
        } else {
          // Default to expense_other
          dbData.category_id = 12; // expense_other
        }
      }
    } catch (error) {
      console.error('Error formatting transaction for DB:', error);
      // Last resort fallback - use expense_other (ID 12)
      dbData.category_id = 12; 
    }
    
    return dbData;
  };

  const value = {
        transactions,
        budgets,
        wallets,
    wantToBuyItems,
    pinjamanItems,
        currency,
        currencySymbol,
        isLoading,
        updateCurrency,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBudget,
        updateBudget,
        deleteBudget,
        addWallet,
        updateWallet,
        deleteWallet,
    addWantToBuyItem,
    updateWantToBuyItem,
    deleteWantToBuyItem,
    addPinjamanItem,
    updatePinjamanItem,
    deletePinjamanItem,
        totalBalance,
        monthlyIncome,
        monthlyExpense,
    formatCurrency,
    getDisplayCategoryName,
    getCategoryKey,
  };

  // Ensure transactions are sorted by date in descending order
  useEffect(() => {
    if (transactions.length > 0) {
      const sortedTransactions = [...transactions].map(t => {
        // Ensure categoryId is in string ID format for client-side use
        let categoryId = t.categoryId;
        if (categoryId && categoryId.length > 30) {
          categoryId = getCategoryStringIdFromUuid(categoryId);
        } else if (!categoryId) {
          categoryId = legacyCategoryNameToId(t.category || '', t.type, i18next);
        }
        
        return {
          ...t,
          categoryId
        };
      }).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setTransactions(sortedTransactions);
    }
  }, []);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
