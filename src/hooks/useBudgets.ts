
import { useEffect, useState } from 'react';
import { useFinance } from '../context/FinanceContext';

export const useBudgets = () => {
  const { budgets, transactions } = useFinance();
  const [updatedBudgets, setUpdatedBudgets] = useState(budgets);

  // Calculate actual spending for each budget based on transactions
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filter transactions for current month
    const currentMonthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return (
        transaction.type === 'expense' &&
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });
    
    // Calculate spending by category
    const categorySpending: Record<string, number> = {};
    currentMonthTransactions.forEach(transaction => {
      const { category, amount } = transaction;
      if (!categorySpending[category]) {
        categorySpending[category] = 0;
      }
      categorySpending[category] += amount;
    });
    
    // Update budgets with actual spending
    const updated = budgets.map(budget => {
      const spent = categorySpending[budget.category] || 0;
      return {
        ...budget,
        spent
      };
    });
    
    setUpdatedBudgets(updated);
  }, [budgets, transactions]);

  // Calculate overall budget stats
  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = updatedBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  const remainingBudget = totalBudgeted - totalSpent;
  const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  return {
    budgets: updatedBudgets,
    totalBudgeted,
    totalSpent,
    remainingBudget,
    overallProgress
  };
};
