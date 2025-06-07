
// Fixed useWallets to use wallet_id instead of walletId for database compatibility

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
    
    // Transactions by wallet - use wallet_id instead of walletId
    const walletTransactions = wallets.map(wallet => {
      const relatedTransactions = transactions.filter(t => t.wallet_id === wallet.id);
      const income = relatedTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = relatedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        wallet,
        transactions: relatedTransactions,
        income,
        expense,
        net: income - expense
      };
    });
    
    return {
      totalBalance,
      positiveBalance,
      negativeBalance,
      walletTransactions,
      walletCount: wallets.length
    };
  }, [wallets, transactions]);

  return {
    wallets,
    ...walletStats
  };
};
