
import React from 'react';
import Header from '@/components/layout/Header';
import BudgetProgress from '@/components/budget/BudgetProgress';
import BudgetList from '@/components/budget/BudgetList';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Budgets: React.FC = () => {
  return (
    <div className="flex flex-col h-full animate-in">
      <Header />
      <div className="flex-1 p-6 pb-24 md:pb-6 space-y-6 overflow-auto fade-mask">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Budget Management</h2>
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Create Budget
          </Button>
        </div>
        
        <BudgetProgress />
        
        <div className="mt-6">
          <BudgetList />
        </div>
      </div>
    </div>
  );
};

export default Budgets;
