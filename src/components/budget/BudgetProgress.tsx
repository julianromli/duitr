
import React from 'react';
import { PieChart, LineChart, BarChart3 } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useBudgets } from '@/hooks/useBudgets';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BudgetProgress: React.FC = () => {
  const { budgets, totalBudgeted, totalSpent, remainingBudget, overallProgress } = useBudgets();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Prepare data for pie chart
  const pieData = budgets.map((budget) => ({
    name: budget.category,
    value: budget.spent,
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
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <LineChart className="w-5 h-5" /> Budget Overview
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Overall Budget</span>
                <span className="text-sm font-medium">
                  {formatCurrency(totalSpent)} / {formatCurrency(totalBudgeted)}
                </span>
              </div>
              
              <Progress 
                value={overallProgress} 
                className="h-3" 
                indicatorClassName={overallProgress >= 90 ? 'bg-finance-expense' : 'bg-finance-income'} 
              />
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Spent</p>
                  <p className="text-lg font-semibold">{formatCurrency(totalSpent)}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className={`text-lg font-semibold ${remainingBudget < 0 ? 'text-finance-expense' : 'text-finance-income'}`}>
                    {formatCurrency(Math.abs(remainingBudget))}
                    {remainingBudget < 0 ? ' over' : ''}
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
            <PieChart className="w-5 h-5" /> Spending by Category
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
