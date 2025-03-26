
import React from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import DashboardCard from './DashboardCard';

const BalanceSummary: React.FC = () => {
  const { totalBalance, monthlyIncome, monthlyExpense } = useFinance();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DashboardCard 
        title="Total Balance" 
        icon={<DollarSign className="w-4 h-4" />}
      >
        <div className="mt-2">
          <h3 className="text-2xl font-bold">{formatCurrency(totalBalance)}</h3>
          <p className="text-xs text-muted-foreground mt-1">All accounts</p>
        </div>
      </DashboardCard>
      
      <DashboardCard 
        title="Monthly Income" 
        icon={<ArrowUpRight className="w-4 h-4 text-finance-income" />}
      >
        <div className="mt-2">
          <h3 className="text-2xl font-bold text-finance-income">{formatCurrency(monthlyIncome)}</h3>
          <p className="text-xs text-muted-foreground mt-1">Current month</p>
        </div>
      </DashboardCard>
      
      <DashboardCard 
        title="Monthly Expenses" 
        icon={<ArrowDownRight className="w-4 h-4 text-finance-expense" />}
      >
        <div className="mt-2">
          <h3 className="text-2xl font-bold text-finance-expense">{formatCurrency(monthlyExpense)}</h3>
          <p className="text-xs text-muted-foreground mt-1">Current month</p>
        </div>
      </DashboardCard>
    </div>
  );
};

export default BalanceSummary;
