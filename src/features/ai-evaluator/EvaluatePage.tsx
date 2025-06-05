
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Calendar, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getFinanceInsight } from './api';
import { InsightDisplay } from './InsightDisplay';
import { ChatBox } from './ChatBox';
import { SuggestedQuestions } from './SuggestedQuestions';
import type { FinanceSummary } from '@/types/finance';

export const EvaluatePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { transactions } = useFinance();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');

  // Get summary data from transactions
  const fetchSummary = (start: string, end: string): FinanceSummary => {
    const startDateTime = new Date(start).getTime();
    const endDateTime = new Date(end).getTime();
    
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date).getTime();
      return transactionDate >= startDateTime && transactionDate <= endDateTime;
    });

    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        const category = t.category || 'Lainnya';
        const existing = acc.find(item => item.category === category);
        if (existing) {
          existing.amount += t.amount;
        } else {
          acc.push({ category, amount: t.amount });
        }
        return acc;
      }, [] as Array<{ category: string; amount: number }>);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category || 'Lainnya';
        const existing = acc.find(item => item.category === category);
        if (existing) {
          existing.amount += t.amount;
        } else {
          acc.push({ category, amount: t.amount });
        }
        return acc;
      }, [] as Array<{ category: string; amount: number }>);

    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netFlow = totalIncome - totalExpenses;

    return {
      startDate: start,
      endDate: end,
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netFlow
    };
  };

  const handleEvaluate = async () => {
    if (!startDate || !endDate) {
      setError('Silakan pilih tanggal mulai dan tanggal akhir');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
      return;
    }

    setLoading(true);
    setError('');
    setInsight(null);

    try {
      const summary = fetchSummary(startDate, endDate);
      
      if (summary.totalIncome === 0 && summary.totalExpenses === 0) {
        setError('Tidak ada data transaksi dalam periode yang dipilih');
        setLoading(false);
        return;
      }

      const insightResult = await getFinanceInsight(summary);
      setInsight(insightResult);
    } catch (err) {
      console.error('Error evaluating:', err);
      setError('Gagal evaluasi. Coba lagi nanti.');
    }
    setLoading(false);
  };

  const handleQuestionSelect = (question: string) => {
    setSelectedQuestion(question);
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
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C6FE1E]" />
              Evaluate by AI
            </h1>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="mb-6 bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5 text-[#C6FE1E]" />
                Pilih Periode Evaluasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-gray-300">Tanggal Mulai</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-gray-300">Tanggal Akhir</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleEvaluate}
                disabled={loading || !startDate || !endDate}
                className="w-full bg-[#C6FE1E] text-black hover:bg-[#B5E619] disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"></div>
                    Evaluating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Evaluate
                  </div>
                )}
              </Button>

              {error && (
                <div className="p-3 bg-red-900 border border-red-700 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {(loading || insight) && (
          <motion.div 
            variants={itemVariants}
            className="space-y-6"
          >
            <div className="bg-gray-900 rounded-lg p-1">
              <InsightDisplay text={insight || ''} isLoading={loading} />
            </div>
            
            {insight && !loading && (
              <>
                <div className="bg-gray-900 rounded-lg p-1">
                  <SuggestedQuestions onSelect={handleQuestionSelect} />
                </div>
                
                <div className="bg-gray-900 rounded-lg p-1">
                  <ChatBox contextSummary={insight} suggestedQuestion={selectedQuestion} />
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
