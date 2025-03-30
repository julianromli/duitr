import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFinance } from '@/context/FinanceContext';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'income' | 'outcome';
type DateRange = '7days' | '30days' | 'month' | 'custom';

const Statistics: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('outcome');
  const { formatCurrency } = useFinance();
  const { allTransactions } = useTransactions();
  
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Get current month and year for display
  const currentDate = new Date();
  const currentMonthYear = format(currentDate, 'MMMM yyyy');
  
  // Function to get filtered transactions based on selected date range
  const getFilteredTransactions = () => {
    const now = new Date();
    let startDate: Date;
    const endDate = new Date();
    
    if (dateRange === '7days') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
    } else if (dateRange === '30days') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 30);
    } else if (dateRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      // Custom range
      if (!customStartDate || !customEndDate) {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        startDate = customStartDate;
        endDate.setTime(customEndDate.getTime());
        endDate.setHours(23, 59, 59, 999); // End of the selected day
      }
    }
    
    // Use the correct type mapping for filtering
    const typeMapping = {
      'income': 'income',
      'outcome': 'expense'
    };
    
    return allTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate >= startDate && 
        transactionDate <= endDate && 
        t.type === typeMapping[activeTab]
      );
    });
  };
  
  const filteredTransactions = getFilteredTransactions();
  
  // Calculate total for current filter
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Group by category and calculate percentages for pie chart
  const categoryTotals: Record<string, number> = {};
  filteredTransactions.forEach(t => {
    if (!categoryTotals[t.category]) {
      categoryTotals[t.category] = 0;
    }
    categoryTotals[t.category] += t.amount;
  });
  
  // Convert to chart data format and calculate percentages
  const chartData = Object.keys(categoryTotals).map(category => {
    const value = categoryTotals[category];
    const percentage = totalAmount > 0 ? Math.round((value / totalAmount) * 100) : 0;
    return {
      name: category,
      value: value,
      percentage: percentage,
    };
  });
  
  // Colors for pie chart - using a varied yet harmonious color palette
  const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#14B8A6', '#6366F1', '#F43F5E', '#84CC16', '#06B6D4'];
  
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };
  
  const getDateRangeLabel = () => {
    switch (dateRange) {
      case '7days':
        return t('statistics.last7Days');
      case '30days':
        return t('statistics.last30Days');
      case 'month':
        return currentMonthYear;
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${format(customStartDate, 'MMM d')} - ${format(customEndDate, 'MMM d, yyyy')}`;
        }
        return t('statistics.customRange');
      default:
        return currentMonthYear;
    }
  };

  // Animation variants
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

  const chartVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", stiffness: 200, damping: 20, delay: 0.2 }
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
        {/* Header */}
        <motion.div 
          className="mb-6 flex items-center justify-between"
          variants={itemVariants}
        >
          <div className="flex items-center">
            <Link to="/" className="mr-4 text-white">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">{t('statistics.title')}</h1>
          </div>
          <div className="relative">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 rounded-full text-sm font-normal bg-[#242425] border-0 text-white hover:bg-[#333]"
                >
                  {getDateRangeLabel()}
                  <ChevronDown size={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4 bg-[#242425] border-0 text-white" align="end">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={dateRange === '7days' ? 'default' : 'outline'} 
                      className={dateRange === '7days' ? 'bg-[#C6FE1E] text-[#0D0D0D]' : 'bg-[#1A1A1A] text-white border-0'}
                      onClick={() => {
                        setDateRange('7days');
                        setIsCalendarOpen(false);
                      }}
                    >
                      {t('statistics.last7Days')}
                    </Button>
                    <Button 
                      variant={dateRange === '30days' ? 'default' : 'outline'} 
                      className={dateRange === '30days' ? 'bg-[#C6FE1E] text-[#0D0D0D]' : 'bg-[#1A1A1A] text-white border-0'}
                      onClick={() => {
                        setDateRange('30days');
                        setIsCalendarOpen(false);
                      }}
                    >
                      {t('statistics.last30Days')}
                    </Button>
                    <Button 
                      variant={dateRange === 'month' ? 'default' : 'outline'} 
                      className={dateRange === 'month' ? 'bg-[#C6FE1E] text-[#0D0D0D]' : 'bg-[#1A1A1A] text-white border-0'}
                      onClick={() => {
                        setDateRange('month');
                        setIsCalendarOpen(false);
                      }}
                    >
                      {t('statistics.thisMonth')}
                    </Button>
                    <Button 
                      variant={dateRange === 'custom' ? 'default' : 'outline'} 
                      className={dateRange === 'custom' ? 'bg-[#C6FE1E] text-[#0D0D0D]' : 'bg-[#1A1A1A] text-white border-0'}
                      onClick={() => {
                        setDateRange('custom');
                        if (!customStartDate || !customEndDate) {
                          const today = new Date();
                          setCustomStartDate(new Date(today.getFullYear(), today.getMonth(), 1));
                          setCustomEndDate(today);
                        }
                      }}
                    >
                      {t('statistics.customRange')}
                    </Button>
                  </div>
                  
                  {dateRange === 'custom' && (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm mb-1">{t('statistics.startDate')}</p>
                          <Calendar
                            className="bg-[#1A1A1A] rounded-lg text-white"
                            mode="single"
                            selected={customStartDate}
                            onSelect={setCustomStartDate}
                            disabled={(date) => date > new Date() || (customEndDate ? date > customEndDate : false)}
                            initialFocus
                          />
                        </div>
                        <div>
                          <p className="text-sm mb-1">{t('statistics.endDate')}</p>
                          <Calendar
                            className="bg-[#1A1A1A] rounded-lg text-white"
                            mode="single"
                            selected={customEndDate}
                            onSelect={setCustomEndDate}
                            disabled={(date) => date > new Date() || (customStartDate ? date < customStartDate : false)}
                            initialFocus
                          />
                        </div>
                      </div>
                      <Button 
                        className="mt-2 bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#A6DD00]"
                        onClick={() => setIsCalendarOpen(false)}
                      >
                        {t('common.apply')}
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </motion.div>
        
        {/* Tabs */}
        <motion.div 
          className="mb-6"
          variants={itemVariants}
        >
          <div className="flex bg-[#242425] rounded-full p-1">
            <motion.button
              className={`flex-1 py-2 text-center rounded-full ${activeTab === 'outcome' ? 'bg-[#C6FE1E] text-[#0D0D0D] font-medium' : 'text-white'}`}
              onClick={() => handleTabChange('outcome')}
              whileTap={{ scale: 0.98 }}
            >
              {t('statistics.expense')}
            </motion.button>
            <motion.button
              className={`flex-1 py-2 text-center rounded-full ${activeTab === 'income' ? 'bg-[#C6FE1E] text-[#0D0D0D] font-medium' : 'text-white'}`}
              onClick={() => handleTabChange('income')}
              whileTap={{ scale: 0.98 }}
            >
              {t('statistics.income')}
            </motion.button>
          </div>
        </motion.div>
        
        {/* Chart Section */}
        <div className="py-6">
          {filteredTransactions.length > 0 ? (
            <>
              <motion.div 
                className="flex justify-center items-center mb-8 bg-[#242425] p-6 rounded-xl"
                variants={chartVariants}
                key={`chart-${activeTab}`}
              >
                <div className="h-[220px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={0}
                        dataKey="value"
                        strokeWidth={0}
                        animationBegin={300}
                        animationDuration={800}
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}-${activeTab}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Text */}
                  <motion.div 
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    key={`text-${activeTab}`}
                  >
                    <p className="text-xs text-[#868686] uppercase tracking-wide">
                      {t('statistics.total')} {activeTab === 'income' ? t('statistics.income').toUpperCase() : t('statistics.expense').toUpperCase()}
                    </p>
                    <p className="text-xl font-bold mt-1 text-white">{formatCurrency(totalAmount)}</p>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Category Breakdown */}
              <motion.div 
                className="mt-8" 
                variants={itemVariants}
                key={`breakdown-${activeTab}`}
              >
                <h3 className="text-lg font-bold mb-4">
                  {activeTab === 'income' ? t('statistics.incomeBreakdown') : t('statistics.expenseBreakdown')}
                </h3>
                <div className="space-y-3">
                  {chartData.map((category, index) => (
                    <motion.div 
                      key={`${category.name}-${index}-${activeTab}`}
                      className="flex justify-between items-center p-4 bg-[#242425] rounded-xl"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (index * 0.05) }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{formatCurrency(category.value)}</span>
                        <div className="px-2 py-1 rounded-full text-xs font-medium text-white" style={{ 
                          backgroundColor: COLORS[index % COLORS.length]
                        }}>
                          {category.percentage}%
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div 
              className="h-[250px] flex items-center justify-center bg-[#242425] rounded-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              key="no-data"
            >
              <p className="text-[#868686]">{t('statistics.noData')}</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Statistics; 