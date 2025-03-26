
import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';

export const useWallets = () => {
  const { wallets, transactions } = useFinance();

  // Calculate wallet statistics
  const walletStats = useMemo(() => {
    // Total across all wallets
    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    
    // Positive and negative balances
    const positiveBalance = wallets
      .filter(wallet => wallet.balance > 0)
      .reduce((sum, wallet) => sum + wallet.balance, 0);
      
    const negativeBalance = wallets
      .filter(wallet => wallet.balance < 0)
      .reduce((sum, wallet) => sum + wallet.balance, 0);
    
    // Transactions by wallet
    const walletTransactions = wallets.map(wallet => {
      const relatedTransactions = transactions.filter(t => t.walletId === wallet.id);
      const income = relatedTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = relatedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
        
      return {
        ...wallet,
        transactions: relatedTransactions,
        income,
        expense,
        netFlow: income - expense
      };
    });
    
    return {
      totalBalance,
      positiveBalance,
      negativeBalance,
      walletTransactions
    };
  }, [wallets, transactions]);

  return {
    wallets,
    ...walletStats
  };
};
