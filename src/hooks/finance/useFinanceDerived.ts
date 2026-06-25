import { useMemo } from 'react';
import { formatCurrency as utilsFormatCurrency } from '@/utils/currency';
import type { Transaction, Wallet } from '@/types/finance';

export function useFinanceDerived(
  wallets: Wallet[],
  transactions: Transaction[],
  userCurrency: string,
) {
  return useMemo(() => {
    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    const convertedTotalBalance = totalBalance;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    const monthlyIncome = monthlyTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const monthlyExpense = monthlyTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const formatCurrency = (amount: number) => utilsFormatCurrency(amount, userCurrency);

    return {
      totalBalance,
      convertedTotalBalance,
      monthlyIncome,
      monthlyExpense,
      formatCurrency,
    };
  }, [wallets, transactions, userCurrency]);
}
