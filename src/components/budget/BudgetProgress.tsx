import React from 'react';
import { PieChart, LineChart, BarChart3, Calendar } from 'lucide-react';
// Removed recharts dependency for better performance
import { useBudgets } from '@/hooks/useBudgets';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/context/FinanceContext';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

const BudgetProgress: React.FC = () => {
  const { budgets, totalBudgeted, totalSpent, remainingBudget, overallProgress } = useBudgets();
  const { formatCurrency } = useFinance();
  const { t } = useTranslation();
  
  // Count budgets by period for the summary
  const budgetCounts = budgets.reduce((acc, budget) => {
    const period = budget.period || 'monthly';
    acc[period] = (acc[period] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Prepare data for pie chart
  const pieData = budgets.map((budget) => ({
    name: budget.category,
    value: budget.spent,
    period: budget.period || 'monthly'
  }));
  
  // Colors for pie chart
  const COLORS = ['#4263EB', '#0CA678', '#F59F00', '#FA5252', '#7950F2', '#74C0FC'];
  
  // Simplified category display without charts

  // Function to get period labels
  const getPeriodLabel = (period: string) => {
    switch(period) {
      case 'weekly': return t('budgets.weekly');
      case 'monthly': return t('budgets.monthly');
      case 'yearly': return t('budgets.yearly');
      default: return t('budgets.monthly');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <LineChart className="w-5 h-5" /> {t('budgets.overview')}
            </CardTitle>
            {/* Period badges moved to header */}
            <div className="flex flex-wrap gap-1">
              {Object.entries(budgetCounts).map(([period, count]) => (
                <Badge key={period} variant="secondary" className="text-xs px-2 py-1">
                  {count}x {getPeriodLabel(period)}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Hero Metric - Remaining Budget */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground font-medium">
                {remainingBudget < 0 ? t('budgets.over_budget') : t('budgets.remaining_this_period')}
              </p>
              <p className={`text-3xl font-bold ${remainingBudget < 0 ? 'text-finance-expense' : 'text-finance-income'}`}>
                {formatCurrency(Math.abs(remainingBudget))}
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress 
                value={overallProgress} 
                className="h-3" 
                indicatorClassName={overallProgress >= 90 ? 'bg-finance-expense' : 'bg-finance-income'} 
              />
              
              {/* Consolidated Supporting Details */}
               <div className="text-center">
                 <p className="text-sm text-muted-foreground">
                   <span className="font-medium text-foreground">{formatCurrency(totalSpent)}</span> /{' '}
                   <span className="font-medium text-foreground">{formatCurrency(totalBudgeted)}</span>
                 </p>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5" /> {t('budgets.spending_by_category')}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {pieData.length > 0 ? (
              pieData.map((item, index) => {
                const percentage = totalSpent > 0 ? Math.round((item.value / totalSpent) * 100) : 0;
                return (
                  <div key={`category-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{getPeriodLabel(item.period)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.value)}</p>
                      <p className="text-sm text-muted-foreground">{percentage}%</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('budgets.no_spending_data')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetProgress;
