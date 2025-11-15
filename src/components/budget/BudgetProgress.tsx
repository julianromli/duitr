import React, { useMemo, useCallback } from 'react';
import { PieChart, LineChart, BarChart3, Calendar } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useBudgets } from '@/hooks/useBudgets';

ChartJS.register(ArcElement, Tooltip, Legend);
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/context/FinanceContext';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import { useCurrency } from '@/hooks/useCurrency';
import { useCategories } from '@/hooks/useCategories';

const BudgetProgress: React.FC = () => {
  const { budgets, totalBudgeted, totalSpent, remainingBudget, overallProgress } = useBudgets();
  const { formatCurrency } = useFinance();
  const { currency } = useCurrency();
  const { t, i18n } = useTranslation();
  const { categories } = useCategories();
  
  // Function to get translated category name
  const getCategoryDisplayName = useCallback((categoryName: string, categoryId?: string) => {
    // PRIORITY 1: Look up by categoryId if available (most reliable)
    if (categoryId) {
      const categoryById = categories.find(cat => 
        cat.id === categoryId || 
        cat.category_id?.toString() === categoryId
      );
      
      if (categoryById) {
        return i18n.language === 'id' ? 
          (categoryById.id_name || categoryById.en_name || 'Unknown') : 
          (categoryById.en_name || categoryById.id_name || 'Unknown');
      }
    }
    
    // PRIORITY 2: Fallback to name matching (for legacy budgets)
    const category = categories.find(cat => 
      cat.en_name === categoryName || 
      cat.id_name === categoryName ||
      cat.category_key === categoryName
    );
    
    if (category) {
      return i18n.language === 'id' ? 
        (category.id_name || category.en_name || 'Unknown') : 
        (category.en_name || category.id_name || 'Unknown');
    }
    
    // PRIORITY 3: Check if it's the "Other" category
    if (categoryName?.toLowerCase() === 'other' || categoryName?.toLowerCase() === 'lainnya') {
      return t('budgets.categories.other');
    }
    
    // Final fallback
    return categoryName || t('budgets.no_category');
  }, [categories, i18n.language, t]);
  
  // Count budgets by period for the summary
  const budgetCounts = budgets.reduce((acc, budget) => {
    const period = budget.period || 'monthly';
    acc[period] = (acc[period] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Prepare data for pie chart with translated category names
  const pieData = useMemo(() => 
    budgets.map((budget) => ({
      name: getCategoryDisplayName(budget.category, budget.categoryId),
      value: budget.spent,
      period: budget.period || 'monthly'
    })),
    [budgets, categories, i18n.language]
  );
  
  // Colors for pie chart
  const COLORS = ['#4263EB', '#0CA678', '#F59F00', '#FA5252', '#7950F2', '#74C0FC'];

  // Prepare Chart.js data structure for pie chart
  const pieChartData = useMemo(() => ({
    labels: pieData.map(item => item.name),
    datasets: [{
      data: pieData.map(item => item.value),
      backgroundColor: pieData.map((_, index) => COLORS[index % COLORS.length]),
      borderWidth: 0,
      borderRadius: 8,
    }]
  }), [pieData, COLORS]);

  // Chart.js options
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#000',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context: any) => {
            const budgetData = pieData[context.dataIndex];
            return `${budgetData.name}: ${currency === 'IDR' ? `Rp ${Math.round(context.parsed).toLocaleString('id-ID')}` : `$${context.parsed.toLocaleString('en-US', {minimumFractionDigits: 2})}`}`;
          },
          afterLabel: (context: any) => {
            const budgetData = pieData[context.dataIndex];
            return `${budgetData.period}`;
          }
        }
      }
    }
  }), [pieData, currency]);

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
            <Pie 
              data={pieChartData} 
              options={chartOptions}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetProgress;
