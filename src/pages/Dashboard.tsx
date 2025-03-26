import React from 'react';
import Header from '@/components/layout/Header';
import BalanceSummary from '@/components/dashboard/BalanceSummary';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import SpendingChart from '@/components/dashboard/SpendingChart';
import BudgetList from '@/components/budget/BudgetList';
import ExportButton from '@/components/export/ExportButton';
import { Card } from '@/components/ui/card';

const Dashboard: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Financial Overview</h2>
          <ExportButton />
        </div>
        
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
