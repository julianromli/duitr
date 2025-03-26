
import React from 'react';
import { PieChart } from 'lucide-react';
import { useBudgets } from '@/hooks/useBudgets';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BudgetList: React.FC = () => {
  const { budgets } = useBudgets();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-finance-expense';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-finance-income';
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5" /> Budget Categories
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {budgets.map((budget) => {
              const percentage = (budget.spent / budget.amount) * 100;
              const remaining = budget.amount - budget.spent;
              
              return (
                <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium">{budget.category}</h3>
                    <div className="text-sm font-medium">
                      <span className={remaining < 0 ? 'text-finance-expense' : ''}>
                        {formatCurrency(budget.spent)}
                      </span>
                      <span className="text-muted-foreground"> / {formatCurrency(budget.amount)}</span>
                    </div>
                  </div>
                  
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className="h-2" 
                    indicatorClassName={getProgressColor(percentage)} 
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(percentage)}% used</span>
                    <span className={remaining < 0 ? 'text-finance-expense' : ''}>
                      {remaining < 0 ? 'Over by ' : 'Remaining: '}
                      {formatCurrency(Math.abs(remaining))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetList;
