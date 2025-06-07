
// Fixed Statistics page to handle categoryId type properly
// Ensured proper string conversion for category display

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTransactions } from '@/hooks/useTransactions';
import { useFinance } from '@/context/FinanceContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CategoryIcon from '@/components/shared/CategoryIcon';

const Statistics: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency, getDisplayCategoryName } = useFinance();
  const { transactions, categoryTotals, monthlyData } = useTransactions();
  
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  // Filter transactions based on time period
  const getFilteredTransactions = () => {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeFilter) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return transactions.filter(t => new Date(t.date) >= startDate);
  };

  const filteredTransactions = getFilteredTransactions();
  
  // Calculate statistics
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netFlow = totalIncome - totalExpenses;

  // Prepare chart data for expenses by category
  const expensesByCategory = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const categoryKey = String(t.categoryId || t.category || 'other'); // Fixed: convert to string
      if (!acc[categoryKey]) {
        acc[categoryKey] = {
          categoryId: t.categoryId,
          category: t.category,
          amount: 0,
          name: getDisplayCategoryName(t)
        };
      }
      acc[categoryKey].amount += t.amount;
      return acc;
    }, {} as Record<string, { categoryId: string | number | undefined; category: string | undefined; amount: number; name: string }>);

  const chartData = Object.values(expensesByCategory)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8) // Top 8 categories
    .map((item, index) => ({
      ...item,
      color: `hsl(${index * 45}, 70%, 60%)`
    }));

  const COLORS = ['#C6FE1E', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div 
      className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen pb-24 text-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="p-6 pt-12">
        <motion.div 
          className="flex items-center justify-between mb-6"
          variants={itemVariants}
        >
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="mr-4">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="text-xl font-bold">{t('statistics.title')}</h1>
          </div>
        </motion.div>

        {/* Time Filter */}
        <motion.div className="mb-6" variants={itemVariants}>
          <Select value={timeFilter} onValueChange={(value: 'week' | 'month' | 'year') => setTimeFilter(value)}>
            <SelectTrigger className="bg-[#242425] border-none text-white">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#333] text-white">
              <SelectItem value="week">{t('statistics.last_week')}</SelectItem>
              <SelectItem value="month">{t('statistics.last_month')}</SelectItem>
              <SelectItem value="year">{t('statistics.last_year')}</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Summary Cards */}
        <motion.div className="grid grid-cols-1 gap-4 mb-6" variants={itemVariants}>
          <Card className="bg-[#242425] border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#868686]">
                {t('statistics.total_income')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-[#C6FE1E]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#C6FE1E]">{formatCurrency(totalIncome)}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#242425] border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#868686]">
                {t('statistics.total_expenses')}
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-[#FF6B6B]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#FF6B6B]">{formatCurrency(totalExpenses)}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#242425] border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#868686]">
                {t('statistics.net_flow')}
              </CardTitle>
              <DollarSign className={`h-4 w-4 ${netFlow >= 0 ? 'text-[#C6FE1E]' : 'text-[#FF6B6B]'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-[#C6FE1E]' : 'text-[#FF6B6B]'}`}>
                {formatCurrency(netFlow)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chart Type Toggle */}
        <motion.div className="flex gap-2 mb-4" variants={itemVariants}>
          <Button
            onClick={() => setChartType('pie')}
            variant={chartType === 'pie' ? 'default' : 'outline'}
            size="sm"
            className={chartType === 'pie' ? 'bg-[#C6FE1E] text-black' : 'bg-[#242425] text-white border-[#333]'}
          >
            {t('statistics.pie_chart')}
          </Button>
          <Button
            onClick={() => setChartType('bar')}
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            className={chartType === 'bar' ? 'bg-[#C6FE1E] text-black' : 'bg-[#242425] text-white border-[#333]'}
          >
            {t('statistics.bar_chart')}
          </Button>
        </motion.div>

        {/* Expense Chart */}
        {chartData.length > 0 && (
          <motion.div className="mb-6" variants={itemVariants}>
            <Card className="bg-[#242425] border-none">
              <CardHeader>
                <CardTitle className="text-white">{t('statistics.expenses_by_category')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), t('statistics.amount')]}
                        contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', color: 'white' }}
                      />
                    </PieChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#868686"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="#868686" fontSize={12} />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), t('statistics.amount')]}
                        contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', color: 'white' }}
                      />
                      <Bar dataKey="amount" fill="#C6FE1E" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Monthly Trend */}
        {monthlyData.length > 0 && (
          <motion.div className="mb-6" variants={itemVariants}>
            <Card className="bg-[#242425] border-none">
              <CardHeader>
                <CardTitle className="text-white">{t('statistics.monthly_trend')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#868686" fontSize={12} />
                    <YAxis stroke="#868686" fontSize={12} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value), 
                        name === 'income' ? t('statistics.income') : t('statistics.expenses')
                      ]}
                      contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', color: 'white' }}
                    />
                    <Line type="monotone" dataKey="income" stroke="#C6FE1E" strokeWidth={2} />
                    <Line type="monotone" dataKey="expense" stroke="#FF6B6B" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Category Breakdown */}
        {chartData.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="bg-[#242425] border-none">
              <CardHeader>
                <CardTitle className="text-white">{t('statistics.top_categories')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CategoryIcon category={item.categoryId || item.category} size="sm" />
                        <span className="ml-3 text-white">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{formatCurrency(item.amount)}</div>
                        <div className="text-xs text-[#868686]">
                          {((item.amount / totalExpenses) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {chartData.length === 0 && (
          <motion.div className="text-center py-8" variants={itemVariants}>
            <div className="text-[#868686]">
              <p className="mb-2">{t('statistics.no_data')}</p>
              <p className="text-sm">{t('statistics.no_data_description')}</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Statistics;
