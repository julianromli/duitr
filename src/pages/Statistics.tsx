// Page: Statistics  
// Description: Shows financial statistics and charts
// Fixed categoryId type conversion

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, PieChart, BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, format, parseISO } from 'date-fns';

const Statistics: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { transactions, formatCurrency, getDisplayCategoryName } = useFinance();
  
  const [timeFilter, setTimeFilter] = useState<'month' | 'year'>('month');
  const [currentDate] = useState(new Date());
  
  const getFilteredTransactions = () => {
    const interval = timeFilter === 'month' 
      ? { start: startOfMonth(currentDate), end: endOfMonth(currentDate) }
      : { start: startOfYear(currentDate), end: endOfYear(currentDate) };
    
    return transactions.filter(transaction => {
      const transactionDate = parseISO(transaction.date);
      return isWithinInterval(transactionDate, interval);
    });
  };

  const filteredTransactions = getFilteredTransactions();

  const getCategoryStats = (type: 'income' | 'expense') => {
    const typeTransactions = filteredTransactions.filter(t => t.type === type);
    const categoryTotals = new Map();

    typeTransactions.forEach(transaction => {
      const categoryKey = String(transaction.categoryId); // Convert to string
      const displayName = getDisplayCategoryName(transaction);
      
      if (categoryTotals.has(categoryKey)) {
        categoryTotals.set(categoryKey, {
          ...categoryTotals.get(categoryKey),
          amount: categoryTotals.get(categoryKey).amount + transaction.amount
        });
      } else {
        categoryTotals.set(categoryKey, {
          name: displayName,
          amount: transaction.amount,
          categoryId: categoryKey
        });
      }
    });

    return Array.from(categoryTotals.values()).sort((a, b) => b.amount - a.amount);
  };

  const incomeStats = getCategoryStats('income');
  const expenseStats = getCategoryStats('expense');

  const totalIncome = incomeStats.reduce((sum, category) => sum + category.amount, 0);
  const totalExpenses = expenseStats.reduce((sum, category) => sum + category.amount, 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#9c6ade', '#8dd1e1', '#af826d'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded-md shadow-md text-black">
          <p className="font-semibold">{payload[0].payload.name}</p>
          <p>{t('common.amount')}: {formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

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

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-transparent">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#242424] data-[state=active]:text-white">{t('statistics.overview')}</TabsTrigger>
              <TabsTrigger value="details" className="data-[state=active]:bg-[#242424] data-[state=active]:text-white">{t('statistics.details')}</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <Card className="bg-[#1A1A1A]">
                <CardHeader>
                  <CardTitle>{t('statistics.period')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="bg-[#242424] border-0 text-white">
                      <SelectValue placeholder={t('statistics.selectPeriod')} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#242424] border-0 text-white">
                      <SelectItem value="month">{t('statistics.thisMonth')}</SelectItem>
                      <SelectItem value="year">{t('statistics.thisYear')}</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A]">
                <CardHeader>
                  <CardTitle>{t('statistics.summary')}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="bg-green-500 text-white rounded-full p-2">
                      <TrendingUp className="h-4 w-4" />
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{t('transactions.income')}</p>
                      <p className="text-xl font-bold">{formatCurrency(totalIncome)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="bg-red-500 text-white rounded-full p-2">
                      <TrendingUp className="h-4 w-4 rotate-180" />
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{t('transactions.expense')}</p>
                      <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A]">
                <CardHeader>
                  <CardTitle>{t('statistics.netFlow')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(totalIncome - totalExpenses)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="details">
              <Card className="bg-[#1A1A1A]">
                <CardHeader>
                  <CardTitle>{t('statistics.incomeByCategory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {incomeStats.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <RechartsPieChart
                            dataKey="amount"
                            data={incomeStats}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            label
                          >
                            {
                              incomeStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))
                            }
                          </RechartsPieChart>
                          <Tooltip content={<CustomTooltip />} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      <ul className="mt-4">
                        {incomeStats.map((category, index) => (
                          <li key={category.categoryId} className="flex items-center justify-between py-2">
                            <div className="flex items-center">
                              <div className="mr-2">
                                <CategoryIcon category={category.categoryId} size="sm" />
                              </div>
                              <span>{category.name}</span>
                            </div>
                            <span>{formatCurrency(category.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p>{t('statistics.noIncome')}</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A]">
                <CardHeader>
                  <CardTitle>{t('statistics.expensesByCategory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenseStats.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <RechartsPieChart
                            dataKey="amount"
                            data={expenseStats}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            label
                          >
                            {
                              expenseStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))
                            }
                          </RechartsPieChart>
                          <Tooltip content={<CustomTooltip />} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      <ul className="mt-4">
                        {expenseStats.map((category, index) => (
                          <li key={category.categoryId} className="flex items-center justify-between py-2">
                            <div className="flex items-center">
                              <div className="mr-2">
                                <CategoryIcon category={category.categoryId} size="sm" />
                              </div>
                              <span>{category.name}</span>
                            </div>
                            <span>{formatCurrency(category.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p>{t('statistics.noExpenses')}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Statistics;
