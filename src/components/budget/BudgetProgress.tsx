import React from 'react';
import { PieChart, LineChart, BarChart3, Calendar } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useBudgets } from '@/hooks/useBudgets';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/context/FinanceContext';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import { useCurrency } from '@/hooks/useCurrency';

const BudgetProgress: React.FC = () => {
  const { budgets, totalBudgeted, totalSpent, remainingBudget, overallProgress } = useBudgets();
  const { formatCurrency } = useFinance();
  const { currency } = useCurrency();
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
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white dark:bg-black border shadow-lg rounded-lg">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <div className="text-xs" style={{ color: payload[0].color }}>
            <CurrencyDisplay 
              amount={payload[0].value}
              currency={currency}
              
              size="sm"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t(`budgets.${payload[0].payload.period}`)}
          </p>
        </div>
      );
    }
    return null;
  };

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
              <div className={`text-3xl font-bold ${remainingBudget < 0 ? 'text-finance-expense' : 'text-finance-income'}`}>
                <CurrencyDisplay 
                  amount={Math.abs(remainingBudget)}
                  currency={currency}
                  
                  size="lg"
                />
              </div>
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
                   <span className="font-medium text-foreground">
                     <CurrencyDisplay 
                       amount={totalSpent}
                       currency={currency}
                       
                       size="sm"
                     />
                   </span> /{' '}
                   <span className="font-medium text-foreground">
                     <CurrencyDisplay 
                       amount={totalBudgeted}
                       currency={currency}
                       
                       size="sm"
                     />
                   </span>
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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetProgress;
