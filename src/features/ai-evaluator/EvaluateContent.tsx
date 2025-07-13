// Component: EvaluateContent
// Description: AI Financial Evaluator content without header - designed to be embedded in Statistics page
// This is a modified version of EvaluatePage that removes the header and navigation for tabbed integration

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Calendar, TrendingUp, BarChart3, PieChart, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFinanceInsight } from './api';
import { InsightDisplay } from './InsightDisplay';
import { SuggestedQuestions } from './SuggestedQuestions';
import { ChatBox } from './ChatBox';
import type { FinanceSummary, ChatMessage } from '@/types/finance';
import { useTranslation } from 'react-i18next';

const EvaluateContent: React.FC = () => {
  const { transactions, wallets, getDisplayCategoryName } = useFinance();
  const { t } = useTranslation();
  
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [insight, setInsight] = useState<string>('');
  const [currentSummary, setCurrentSummary] = useState<FinanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');

  // Calculate finance summary
  const calculateSummary = (): FinanceSummary => {
    if (!startDate || !endDate) {
      return {
        startDate: '',
        endDate: '',
        income: [],
        expenses: [],
        totalIncome: 0,
        totalExpenses: 0,
        netFlow: 0,
      };
    }

    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      // Normalize dates to avoid timezone issues
      const normalizeDate = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      };

      const normalizedTransactionDate = normalizeDate(transactionDate);
      const normalizedStartDate = normalizeDate(startDate);
      const normalizedEndDate = normalizeDate(endDate);

      return normalizedTransactionDate >= normalizedStartDate && normalizedTransactionDate <= normalizedEndDate;
    });

    // Process income transactions with proper category names
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        // Use getDisplayCategoryName to get the proper category name
        const categoryName = getDisplayCategoryName(t) || 'Pendapatan Lainnya';
        const existing = acc.find(item => item.category === categoryName);
        if (existing) {
          existing.amount += t.amount;
        } else {
          acc.push({ category: categoryName, amount: t.amount });
        }
        return acc;
      }, [] as Array<{ category: string; amount: number }>);

    // Process expense transactions with proper category names
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        // Use getDisplayCategoryName to get the proper category name
        const categoryName = getDisplayCategoryName(t) || 'Pengeluaran Lainnya';
        const existing = acc.find(item => item.category === categoryName);
        if (existing) {
          existing.amount += t.amount;
        } else {
          acc.push({ category: categoryName, amount: t.amount });
        }
        return acc;
      }, [] as Array<{ category: string; amount: number }>);

    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    // Format dates properly to avoid timezone issues
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatLocalDate(startDate),
      endDate: formatLocalDate(endDate),
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netFlow: totalIncome - totalExpenses,
    };
  };

  const handleEvaluate = async () => {
    const summary = calculateSummary();
    
    if (summary.totalIncome === 0 && summary.totalExpenses === 0) {
      setInsight('Tidak ada data transaksi untuk periode yang dipilih. Silakan pilih periode lain atau tambahkan transaksi terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await getFinanceInsight(summary);
      setInsight(result);
      setCurrentSummary(summary);
      // Reset chat messages when new evaluation is done
      setChatMessages([]);
    } catch (error) {
      console.error('Error getting insight:', error);
      setInsight('Maaf, terjadi kesalahan saat menganalisis data keuangan Anda. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSelect = (question: string) => {
    // Set the selected question to be auto-filled in ChatBox
    setSelectedQuestion(question);
  };

  const handleQuestionUsed = () => {
    // Reset selected question after it's been used
    setSelectedQuestion('');
  };

  const summary = calculateSummary();

  // Enhanced animation variants for smooth reveal effects
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: 30, 
      opacity: 0,
      scale: 0.95
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        duration: 0.6
      }
    }
  };

  const statsVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: {
      x: -20,
      opacity: 0
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    },
    hover: {
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  return (
    <motion.div 
      className="space-y-6 px-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Date Selection */}
      <motion.div variants={itemVariants}>
        <Card className="border-[#242425]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5 text-green-600" />
              Pilih Periode Analisis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Tanggal Mulai</Label>
                <DatePicker
                  date={startDate}
                  setDate={setStartDate}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Tanggal Selesai</Label>
                <DatePicker
                  date={endDate}
                  setDate={setEndDate}
                  className="w-full"
                />
              </div>
            </div>

            <Button
              onClick={handleEvaluate}
              disabled={!startDate || !endDate || isLoading}
              className="w-full bg-[#C6FE1E] hover:bg-[#B0E018] text-[#0D0D0D] font-semibold py-6 rounded-full"
            >
              {isLoading ? 'Menganalisis...' : 'Analisis Keuangan'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      {(summary.totalIncome > 0 || summary.totalExpenses > 0) && (
        <motion.div 
          className="space-y-3 w-full" 
          variants={statsVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="border-[#242425]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-400">Pemasukan</span>
                  </div>
                  <p className="text-base font-bold text-green-500">
                    Rp{summary.totalIncome.toLocaleString('id-ID')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="border-[#242425]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-gray-400">Pengeluaran</span>
                  </div>
                  <p className="text-base font-bold text-red-500">
                    Rp{summary.totalExpenses.toLocaleString('id-ID')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="border-[#242425]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-400">Net Flow</span>
                  </div>
                  <p className={`text-base font-bold ${summary.netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    Rp{summary.netFlow.toLocaleString('id-ID')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="border-[#242425]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-sm text-gray-400">Saving Rate</span>
                  </div>
                  <p className="text-base font-bold text-yellow-500">
                    {summary.totalIncome > 0
                      ? `${((summary.netFlow / summary.totalIncome) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* AI Insight Display */}
      {(insight || isLoading) && (
        <motion.div variants={itemVariants}>
          <InsightDisplay text={insight} isLoading={isLoading} />
        </motion.div>
      )}

      {/* Suggested Questions */}
      {insight && currentSummary && (
        <motion.div variants={itemVariants}>
          <SuggestedQuestions onSelect={handleQuestionSelect} />
        </motion.div>
      )}

      {/* Chat Box */}
      {insight && currentSummary && (
        <motion.div variants={itemVariants}>
          <ChatBox
            messages={chatMessages}
            onSendMessage={setChatMessages}
            context={currentSummary}
            suggestedQuestion={selectedQuestion}
            onQuestionUsed={handleQuestionUsed}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default EvaluateContent;