import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { formatIDR } from '@/utils/currency';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Transaction, Budget, Wallet, WantToBuyItem, PinjamanItem } from '@/types/finance';

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
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
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
          type: w.type === 'credit' ? 'e-wallet' as const : w.type as 'cash' | 'bank' | 'e-wallet' | 'investment',
          color: w.color,
          userId: w.user_id
        })));
        
        if (transactionsRes.error) throw transactionsRes.error;
        setTransactions(transactionsRes.data.map(t => ({
          id: t.id,
          amount: t.amount,
          category: t.category,
          description: t.description,
          date: t.date,
          type: t.type as 'income' | 'expense' | 'transfer',
          walletId: t.wallet_id,
          userId: t.user_id,
          destinationWalletId: t.destination_wallet_id,
          fee: t.fee
        })));
        
        if (budgetsRes.error) throw budgetsRes.error;
        setBudgets(budgetsRes.data.map(b => ({
          id: b.id,
          category: b.category,
          amount: b.amount,
          spent: b.spent,
          period: b.period as 'monthly' | 'weekly' | 'yearly',
          userId: b.user_id
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
      const newTransactionData = {
        amount: transaction.amount,
        category: transaction.type === 'transfer' ? 'Transfer' : transaction.category,
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
        .insert(newTransactionData)
        .select()
        .single();
        
      if (transactionError) {
        if (transactionError.message.includes('destination_wallet_id') || 
            transactionError.message.includes('column') || 
            transactionError.message.includes('schema')) {
          console.error('Schema error detected:', transactionError);
          
          const fallbackData = {
            amount: transaction.amount,
            category: transaction.type === 'transfer' ? 'Transfer' : transaction.category,
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
                .insert(fallbackData)
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
        category: finalTransactionData.category,
        description: finalTransactionData.description,
        date: finalTransactionData.date,
        type: finalTransactionData.type,
        walletId: finalTransactionData.wallet_id,
        userId: finalTransactionData.user_id,
        destinationWalletId: finalTransactionData.destination_wallet_id,
        fee: finalTransactionData.fee,
      };

      setTransactions([formattedTransaction, ...transactions]);

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
        // Create update data with optional fields to handle schema issues
        const updateData: {
          amount: number;
          category: string;
          description: string;
          date: string;
          type: 'income' | 'expense' | 'transfer';
          wallet_id: string;
          destination_wallet_id?: string | null;
          fee?: number | null;
        } = {
          amount: updatedTransaction.amount,
          category: updatedTransaction.type === 'transfer' ? 'Transfer' : updatedTransaction.category,
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

        // Update transaction with core fields
        const { error: transactionUpdateError } = await supabase
          .from('transactions')
          .update(updateData)
          .eq('id', updatedTransaction.id);

        if (transactionUpdateError) {
          // If there's a schema error, try a more basic update
          if (transactionUpdateError.message.includes('column') || 
              transactionUpdateError.message.includes('schema')) {
            console.error('Schema error on update:', transactionUpdateError);
            
            // Fallback to basic fields only
            const { error: basicUpdateError } = await supabase
              .from('transactions')
              .update({
                amount: updatedTransaction.amount,
                category: updatedTransaction.type === 'transfer' ? 'Transfer' : updatedTransaction.category,
                description: updatedTransaction.description,
                date: updatedTransaction.date,
                type: updatedTransaction.type,
                wallet_id: updatedTransaction.walletId,
              })
              .eq('id', updatedTransaction.id);
              
            if (basicUpdateError) throw basicUpdateError;
          } else {
            throw transactionUpdateError;
          }
        }

        await Promise.all(walletsToUpdateInDB.map(walletUpdate =>
            supabase
          .from('wallets')
                .update({ balance: walletUpdate.balance })
                .eq('id', walletUpdate.id)
        ));

        setTransactions(transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
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
      
      const newWallet = {
        id: tempId,
        ...wallet,
        userId: user.id,
      };
      
      setWallets(prev => [...prev, newWallet]);
      
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          name: wallet.name,
          balance: wallet.balance,
          type: wallet.type,
          color: wallet.color,
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
            type: data[0].type === 'credit' ? 'e-wallet' as const : data[0].type as 'cash' | 'bank' | 'e-wallet' | 'investment',
            color: data[0].color,
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
      setWallets(prev => prev.map(wallet => 
        wallet.id === updatedWallet.id ? updatedWallet : wallet)
      );
      
      const { error } = await supabase
        .from('wallets')
        .update({
          name: updatedWallet.name,
          balance: updatedWallet.balance,
          type: updatedWallet.type,
          color: updatedWallet.color,
        })
        .eq('id', updatedWallet.id);
      
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
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
