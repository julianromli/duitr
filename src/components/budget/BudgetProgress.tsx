import React from 'react';
import { PieChart, LineChart, BarChart3, Calendar } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white dark:bg-black border shadow-lg rounded-lg">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-xs" style={{ color: payload[0].color }}>
            {formatCurrency(payload[0].value)}
          </p>
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
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <LineChart className="w-5 h-5" /> {t('budgets.overview')}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('budgets.overall_budget')}</span>
                <span className="text-sm font-medium">
                  {formatCurrency(totalSpent)} / {formatCurrency(totalBudgeted)}
                </span>
              </div>
              
              <Progress 
                value={overallProgress} 
                className="h-3" 
                indicatorClassName={overallProgress >= 90 ? 'bg-finance-expense' : 'bg-finance-income'} 
              />
              
              {/* Period badges */}
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(budgetCounts).map(([period, count]) => (
                  <Badge key={period} variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{count}x {getPeriodLabel(period)}</span>
                  </Badge>
                ))}
              </div>
              
              <div className="space-y-4 pt-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('budgets.spent')}</p>
                  <p className="text-lg font-semibold">{formatCurrency(totalSpent)}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('budgets.overall_remaining')}</p>
                  <p className={`text-lg font-semibold ${remainingBudget < 0 ? 'text-finance-expense' : 'text-finance-income'}`}>
                    {formatCurrency(Math.abs(remainingBudget))}
                    {remainingBudget < 0 ? ` ${t('budgets.over')}` : ''}
                  </p>
                </div>
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
