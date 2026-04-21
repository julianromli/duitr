// Component: EvaluateContent
// Description: AI Financial Evaluator content without header - designed to be embedded in Statistics page
// This is a modified version of EvaluatePage that removes the header and navigation for tabbed integration

import React, { useLayoutEffect, useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useOptionalAnalyticsPeriod } from '@/context/AnalyticsPeriodContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Calendar, TrendingUp, BarChart3, PieChart, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { getFinanceInsight } from './api'
import { InsightDisplay } from './InsightDisplay'
import { SuggestedQuestions } from './SuggestedQuestions'
import { ChatBox } from './ChatBox'
import type { FinanceSummary, ChatMessage } from '@/types/finance'
import { useTranslation } from 'react-i18next'
import { useCategories } from '@/hooks/useCategories'

const EvaluateContent: React.FC = () => {
  const { transactions, formatCurrency } = useFinance()
  const analyticsPeriod = useOptionalAnalyticsPeriod()
  const { findById, getDisplayName } = useCategories()
  const { t } = useTranslation()

  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [insight, setInsight] = useState<string>('')
  const [currentSummary, setCurrentSummary] = useState<FinanceSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<string>('')

  const periodStartMs = analyticsPeriod?.periodStart.getTime()
  const periodEndMs = analyticsPeriod?.periodEnd.getTime()

  useLayoutEffect(() => {
    if (analyticsPeriod) {
      setStartDate(new Date(analyticsPeriod.periodStart))
      setEndDate(new Date(analyticsPeriod.periodEnd))
      return
    }
    const today = new Date()
    setStartDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setEndDate(today)
  }, [analyticsPeriod, periodStartMs, periodEndMs])

  const pushPeriodToStatistics = (nextStart: Date | undefined, nextEnd: Date | undefined) => {
    if (nextStart && nextEnd && analyticsPeriod) {
      analyticsPeriod.setPeriodFromAnalysis(nextStart, nextEnd)
    }
  }

  const setStartDateSynced = (d: Date | undefined) => {
    setStartDate(d)
    if (d && endDate) pushPeriodToStatistics(d, endDate)
  }

  const setEndDateSynced = (d: Date | undefined) => {
    setEndDate(d)
    if (startDate && d) pushPeriodToStatistics(startDate, d)
  }

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
      }
    }

    const filteredTransactions = transactions.filter((tr) => {
      const transactionDate = new Date(tr.date)
      const normalizeDate = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate())
      }

      const normalizedTransactionDate = normalizeDate(transactionDate)
      const normalizedStartDate = normalizeDate(startDate)
      const normalizedEndDate = normalizeDate(endDate)

      return (
        normalizedTransactionDate >= normalizedStartDate &&
        normalizedTransactionDate <= normalizedEndDate
      )
    })

    const income = filteredTransactions
      .filter((tr) => tr.type === 'income')
      .reduce(
        (acc, tr) => {
          const category = findById(tr.categoryId)
          const categoryName = category
            ? getDisplayName(category)
            : t('income.categories.other', 'Other Income')
          const existing = acc.find((item) => item.category === categoryName)
          if (existing) {
            existing.amount += tr.amount
          } else {
            acc.push({ category: categoryName, amount: tr.amount })
          }
          return acc
        },
        [] as Array<{ category: string; amount: number }>,
      )

    const expenses = filteredTransactions
      .filter((tr) => tr.type === 'expense')
      .reduce(
        (acc, tr) => {
          const category = findById(tr.categoryId)
          const categoryName = category
            ? getDisplayName(category)
            : t('transactions.categories.other', 'Other Expenses')
          const existing = acc.find((item) => item.category === categoryName)
          if (existing) {
            existing.amount += tr.amount
          } else {
            acc.push({ category: categoryName, amount: tr.amount })
          }
          return acc
        },
        [] as Array<{ category: string; amount: number }>,
      )

    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0)
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0)

    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return {
      startDate: formatLocalDate(startDate),
      endDate: formatLocalDate(endDate),
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netFlow: totalIncome - totalExpenses,
    }
  }

  const handleEvaluate = async () => {
    const summary = calculateSummary()

    if (summary.totalIncome === 0 && summary.totalExpenses === 0) {
      setInsight(
        t(
          'ai.noDataMessage',
          'No transaction data for the selected period. Please choose another period or add transactions first.',
        ),
      )
      return
    }

    setIsLoading(true)
    try {
      const result = await getFinanceInsight(summary)
      setInsight(result)
      setCurrentSummary(summary)
      setChatMessages([])
    } catch (error) {
      console.error('Error getting insight:', error)
      setInsight(
        t(
          'ai.errorMessage',
          'Sorry, an error occurred while analyzing your financial data. Please try again.',
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuestionSelect = (question: string) => {
    setSelectedQuestion(question)
  }

  const handleQuestionUsed = () => {
    setSelectedQuestion('')
  }

  const summary = calculateSummary()

  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: {
      y: 30,
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 25,
        duration: 0.6,
      },
    },
  }

  const statsVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 20,
        staggerChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: {
      x: -20,
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 25,
      },
    },
    hover: {
      scale: 1.02,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 10,
      },
    },
  }

  return (
    <motion.div
      className="space-y-6 px-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5 text-green-600" />
              {t('ai.selectAnalysisPeriod', 'Select Analysis Period')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-gray-300">{t('common.startDate', 'Start Date')}</Label>
                <DatePicker date={startDate} setDate={setStartDateSynced} className="w-full" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">{t('common.endDate', 'End Date')}</Label>
                <DatePicker date={endDate} setDate={setEndDateSynced} className="w-full" />
              </div>
            </div>

            <Button
              onClick={handleEvaluate}
              disabled={!startDate || !endDate || isLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold"
            >
              {isLoading ? t('ai.analyzing', 'Analyzing...') : t('ai.analyzeFinance', 'Analyze Finance')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {(summary.totalIncome > 0 || summary.totalExpenses > 0) && (
        <motion.div
          className="space-y-3 w-full"
          variants={statsVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-400">
                      {t('transactions.income', 'Income')}
                    </span>
                  </div>
                  <p className="text-base font-bold text-green-500">
                    {formatCurrency(summary.totalIncome)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-gray-400">
                      {t('transactions.expense', 'Expenses')}
                    </span>
                  </div>
                  <p className="text-base font-bold text-red-500">
                    {formatCurrency(summary.totalExpenses)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-400">{t('ai.netFlow', 'Net Flow')}</span>
                  </div>
                  <p
                    className={`text-base font-bold ${summary.netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {formatCurrency(summary.netFlow)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-sm text-gray-400">{t('ai.savingRate', 'Saving Rate')}</span>
                  </div>
                  <p className="text-base font-bold text-yellow-500">
                    {summary.totalIncome > 0
                      ? `${((summary.netFlow / summary.totalIncome) * 100).toFixed(1)}%`
                      : '0%'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {(insight || isLoading) && (
        <motion.div variants={itemVariants}>
          <InsightDisplay text={insight} isLoading={isLoading} />
        </motion.div>
      )}

      {insight && currentSummary && (
        <motion.div variants={itemVariants}>
          <SuggestedQuestions onSelect={handleQuestionSelect} />
        </motion.div>
      )}

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
  )
}

export default EvaluateContent
