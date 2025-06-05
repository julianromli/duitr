
import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Calendar, TrendingUp, BarChart3, PieChart, DollarSign } from 'lucide-react';
import { getFinanceInsight } from './api';
import { InsightDisplay } from './InsightDisplay';
import { SuggestedQuestions } from './SuggestedQuestions';
import { ChatBox } from './ChatBox';
import type { FinanceSummary, ChatMessage } from '@/types/finance';
import { useTranslation } from 'react-i18next';

const EvaluatePage: React.FC = () => {
  const { transactions, wallets } = useFinance();
  const { t } = useTranslation();
  
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [insight, setInsight] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

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
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        const existing = acc.find(item => item.category === (t.category || 'Unknown'));
        if (existing) {
          existing.amount += t.amount;
        } else {
          acc.push({ category: t.category || 'Unknown', amount: t.amount });
        }
        return acc;
      }, [] as Array<{ category: string; amount: number }>);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const existing = acc.find(item => item.category === (t.category || 'Unknown'));
        if (existing) {
          existing.amount += t.amount;
        } else {
          acc.push({ category: t.category || 'Unknown', amount: t.amount });
        }
        return acc;
      }, [] as Array<{ category: string; amount: number }>);

    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
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
    } catch (error) {
      console.error('Error getting insight:', error);
      setInsight('Maaf, terjadi kesalahan saat menganalisis data keuangan Anda. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSelect = (question: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const summary = calculateSummary();

  return (
    <div className="container mx-auto p-4 pb-24 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Evaluasi Keuangan AI</h1>
        <p className="text-gray-400">Dapatkan insight mendalam tentang kondisi keuangan Anda</p>
      </div>

      {/* Date Selection */}
      <Card className="mb-6 bg-gray-900 border-gray-800">
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
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? 'Menganalisis...' : 'Analisis Keuangan'}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {(summary.totalIncome > 0 || summary.totalExpenses > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-400">Pemasukan</span>
              </div>
              <p className="text-lg font-bold text-green-500">
                Rp{summary.totalIncome.toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-red-500" />
                <span className="text-xs text-gray-400">Pengeluaran</span>
              </div>
              <p className="text-lg font-bold text-red-500">
                Rp{summary.totalExpenses.toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-400">Net Flow</span>
              </div>
              <p className={`text-lg font-bold ${summary.netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                Rp{summary.netFlow.toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-gray-400">Saving Rate</span>
              </div>
              <p className="text-lg font-bold text-yellow-500">
                {summary.totalIncome > 0 
                  ? `${((summary.netFlow / summary.totalIncome) * 100).toFixed(1)}%`
                  : '0%'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Insight Display */}
      {(insight || isLoading) && (
        <InsightDisplay text={insight} isLoading={isLoading} />
      )}

      {/* Suggested Questions */}
      {insight && (
        <SuggestedQuestions onSelect={handleQuestionSelect} />
      )}

      {/* Chat Box */}
      {insight && (
        <ChatBox 
          messages={chatMessages}
          onSendMessage={setChatMessages}
          context={insight}
        />
      )}
    </div>
  );
};

export default EvaluatePage;
