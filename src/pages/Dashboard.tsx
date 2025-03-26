
import React from 'react';
import Header from '@/components/layout/Header';
import BalanceSummary from '@/components/dashboard/BalanceSummary';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import SpendingChart from '@/components/dashboard/SpendingChart';
import BudgetList from '@/components/budget/BudgetList';
import { Card } from '@/components/ui/card';

const Dashboard: React.FC = () => {
  return (
    <div className="flex flex-col h-full animate-in">
      <Header />
      <div className="flex-1 p-6 pb-24 md:pb-6 space-y-6 overflow-auto fade-mask">
        <BalanceSummary />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingChart />
          <RecentTransactions />
        </div>
        
        <BudgetList />
      </div>
    </div>
  );
};

export default Dashboard;
