import React, { useLayoutEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFinance } from '@/context/FinanceContext'
import { ChevronLeft, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCategories } from '@/hooks/useCategories'
import { Pie, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { useTransactions } from '@/hooks/useTransactions'
import {
  AnalyticsPeriodProvider,
  useAnalyticsPeriod,
} from '@/context/AnalyticsPeriodContext'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Transaction } from '@/types/finance'
import type { Category } from '@/types/category'
import EvaluateContent from '@/features/ai-evaluator/EvaluateContent'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
)

type TabType = 'income' | 'outcome' | 'analysis'

interface CategoryTotal {
  total: number
  categoryId: string | null
  displayName: string
}

interface ChartDataItem {
  name: string
  value: number
  percentage: number
  categoryId: string | null
}

function groupTransactionsByCategory(
  transactions: Transaction[],
  t: (key: string) => string,
  findById: (id: number) => Category | undefined,
  getDisplayName: (category: Category) => string,
): CategoryTotal[] {
  const categoryTotals: Record<string, CategoryTotal> = {}

  transactions.forEach((transaction) => {
    let categoryName: string
    if (transaction.type === 'transfer') {
      categoryName = t('transactions.transfer')
    } else if (transaction.categoryId && findById(transaction.categoryId)) {
      categoryName = getDisplayName(findById(transaction.categoryId)!)
    } else {
      categoryName = t('transactions.uncategorized')
    }

    const key = categoryName

    if (!categoryTotals[key]) {
      categoryTotals[key] = {
        total: 0,
        categoryId: transaction.categoryId?.toString() ?? null,
        displayName: categoryName,
      }
    }

    categoryTotals[key].total += transaction.amount
  })

  return Object.values(categoryTotals)
}

function hslFromVar(raw: string, fallback: string): string {
  const v = raw.trim()
  if (!v) return fallback
  if (v.startsWith('#')) return v
  return `hsl(${v})`
}

function StatisticsInner() {
  const { t } = useTranslation()
  const { transactions, formatCurrency } = useFinance()
  const { findById, getDisplayName } = useCategories()
  const { monthlyData } = useTransactions()
  const {
    preset: dateRange,
    setPreset: setDateRange,
    customStartDate,
    customEndDate,
    setCustomRange,
    periodStart,
    periodEnd,
  } = useAnalyticsPeriod()

  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('outcome')

  const [chartTheme, setChartTheme] = useState({
    tooltipBg: 'hsl(0 0% 10%)',
    tooltipFg: 'hsl(0 0% 100%)',
    tooltipBorder: 'hsl(0 0% 20%)',
    incomeBar: 'hsl(142 76% 45%)',
    expenseBar: 'hsl(0 84% 55%)',
  })

  useLayoutEffect(() => {
    const root = document.documentElement
    const cs = getComputedStyle(root)
    setChartTheme({
      tooltipBg: hslFromVar(cs.getPropertyValue('--popover'), 'hsl(0 0% 10%)'),
      tooltipFg: hslFromVar(
        cs.getPropertyValue('--popover-foreground'),
        'hsl(0 0% 100%)',
      ),
      tooltipBorder: hslFromVar(cs.getPropertyValue('--border'), 'hsl(0 0% 20%)'),
      incomeBar: hslFromVar(cs.getPropertyValue('--finance-income'), 'hsl(142 76% 45%)'),
      expenseBar: hslFromVar(cs.getPropertyValue('--finance-expense'), 'hsl(0 84% 55%)'),
    })
  }, [])

  const currentDate = new Date()
  const currentMonthYear = format(currentDate, 'MMMM yyyy')

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date)
      return (
        transactionDate >= periodStart &&
        transactionDate <= periodEnd &&
        transaction.type === (activeTab === 'income' ? 'income' : 'expense')
      )
    })
  }, [transactions, periodStart, periodEnd, activeTab])

  const totalAmount = filteredTransactions.reduce((sum, tr) => sum + tr.amount, 0)

  const groupedCategories = useMemo(
    () =>
      groupTransactionsByCategory(filteredTransactions, t, findById, getDisplayName),
    [filteredTransactions, t, findById, getDisplayName],
  )

  const chartData: ChartDataItem[] = useMemo(() => {
    const rows = groupedCategories.map((category) => {
      const percentage =
        totalAmount > 0 ? Math.round((category.total / totalAmount) * 100) : 0
      return {
        name: category.displayName,
        value: category.total,
        percentage,
        categoryId: category.categoryId,
      }
    })
    rows.sort((a, b) => b.value - a.value)
    return rows
  }, [groupedCategories, totalAmount])

  const COLORS = useMemo(
    () => [
      '#8B5CF6',
      '#EC4899',
      '#F59E0B',
      '#10B981',
      '#3B82F6',
      '#14B8A6',
      '#6366F1',
      '#F43F5E',
      '#84CC16',
      '#06B6D4',
    ],
    [],
  )

  const pieChartData = useMemo(
    () => ({
      labels: chartData.map((item) => item.name),
      datasets: [
        {
          data: chartData.map((item) => item.value),
          backgroundColor: chartData.map((_, index) => COLORS[index % COLORS.length]),
          borderWidth: 0,
          borderRadius: 8,
        },
      ],
    }),
    [chartData, COLORS],
  )

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: chartTheme.tooltipBg,
          titleColor: chartTheme.tooltipFg,
          bodyColor: chartTheme.tooltipFg,
          borderColor: chartTheme.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          titleFont: { size: 12, weight: 'bold' as const },
          bodyFont: { size: 12 },
          callbacks: {
            label: (context: { parsed: number }) => formatCurrency(context.parsed),
          },
        },
      },
    }),
    [formatCurrency, chartTheme],
  )

  const barChartData = useMemo(
    () => ({
      labels: monthlyData.map((m) => m.month),
      datasets: [
        {
          label: t('statistics.trendIncome'),
          data: monthlyData.map((m) => m.income),
          backgroundColor: chartTheme.incomeBar,
          borderRadius: 6,
        },
        {
          label: t('statistics.trendExpense'),
          data: monthlyData.map((m) => m.expense),
          backgroundColor: chartTheme.expenseBar,
          borderRadius: 6,
        },
      ],
    }),
    [monthlyData, t, chartTheme],
  )

  const barChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: chartTheme.tooltipFg },
        },
        tooltip: {
          backgroundColor: chartTheme.tooltipBg,
          titleColor: chartTheme.tooltipFg,
          bodyColor: chartTheme.tooltipFg,
          borderColor: chartTheme.tooltipBorder,
          borderWidth: 1,
          callbacks: {
            label: (ctx: {
              dataset: { label?: string }
              parsed: number | { x?: string; y: number }
            }) => {
              const raw = ctx.parsed
              const v = typeof raw === 'number' ? raw : raw.y
              return `${ctx.dataset.label ?? ''}: ${formatCurrency(v)}`
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: chartTheme.tooltipFg },
          grid: { color: chartTheme.tooltipBorder },
        },
        y: {
          ticks: { color: chartTheme.tooltipFg },
          grid: { color: chartTheme.tooltipBorder },
        },
      },
    }),
    [formatCurrency, chartTheme],
  )

  const pieSummaryCaption = useMemo(() => {
    const rangeLabel =
      dateRange === 'month'
        ? currentMonthYear
        : `${format(periodStart, 'MMM d, yyyy')} – ${format(periodEnd, 'MMM d, yyyy')}`
    return t('statistics.chartSummary', {
      range: rangeLabel,
      total: formatCurrency(totalAmount),
    })
  }, [dateRange, currentMonthYear, periodStart, periodEnd, t, formatCurrency, totalAmount])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case '7days':
        return t('statistics.last7Days')
      case '30days':
        return t('statistics.last30Days')
      case 'month':
        return currentMonthYear
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${format(customStartDate, 'MMM d')} - ${format(customEndDate, 'MMM d, yyyy')}`
        }
        return t('statistics.customRange')
      default:
        return currentMonthYear
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: 'beforeChildren' as const,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
    },
  }

  return (
    <motion.div
      className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen pb-24 text-white px-0"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="p-6 pt-12">
        <motion.div className="mb-6 flex items-center justify-between" variants={itemVariants}>
          <div className="flex items-center">
            <Link to="/" className="mr-4 text-white">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">{t('statistics.title')}</h1>
          </div>

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    variant={dateRange === '7days' ? 'default' : 'outline'}
                    className={
                      dateRange === '7days'
                        ? 'bg-[#C6FE1E] text-[#0D0D0D]'
                        : 'bg-[#1A1A1A] text-white border-0'
                    }
                    onClick={() => {
                      setDateRange('7days')
                      setIsCalendarOpen(false)
                    }}
                  >
                    {t('statistics.last7Days')}
                  </Button>
                  <Button
                    variant={dateRange === '30days' ? 'default' : 'outline'}
                    className={
                      dateRange === '30days'
                        ? 'bg-[#C6FE1E] text-[#0D0D0D]'
                        : 'bg-[#1A1A1A] text-white border-0'
                    }
                    onClick={() => {
                      setDateRange('30days')
                      setIsCalendarOpen(false)
                    }}
                  >
                    {t('statistics.last30Days')}
                  </Button>
                  <Button
                    variant={dateRange === 'month' ? 'default' : 'outline'}
                    className={
                      dateRange === 'month'
                        ? 'bg-[#C6FE1E] text-[#0D0D0D]'
                        : 'bg-[#1A1A1A] text-white border-0'
                    }
                    onClick={() => {
                      setDateRange('month')
                      setIsCalendarOpen(false)
                    }}
                  >
                    {t('statistics.thisMonth')}
                  </Button>
                  <Button
                    variant={dateRange === 'custom' ? 'default' : 'outline'}
                    className={
                      dateRange === 'custom'
                        ? 'bg-[#C6FE1E] text-[#0D0D0D]'
                        : 'bg-[#1A1A1A] text-white border-0'
                    }
                    onClick={() => {
                      setDateRange('custom')
                      if (!customStartDate || !customEndDate) {
                        const today = new Date()
                        setCustomRange(
                          new Date(today.getFullYear(), today.getMonth(), 1),
                          today,
                        )
                      }
                    }}
                  >
                    {t('statistics.customRange')}
                  </Button>
                </div>

                {dateRange === 'custom' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#868686] mb-1">{t('statistics.startDate')}</p>
                        <p className="text-sm">
                          {customStartDate ? format(customStartDate, 'MMM d, yyyy') : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#868686] mb-1">{t('statistics.endDate')}</p>
                        <p className="text-sm">
                          {customEndDate ? format(customEndDate, 'MMM d, yyyy') : '-'}
                        </p>
                      </div>
                    </div>

                    <Calendar
                      mode="range"
                      selected={{
                        from: customStartDate,
                        to: customEndDate,
                      }}
                      onSelect={(range) => {
                        setCustomRange(range?.from, range?.to)
                      }}
                      className="rounded-md border-0 bg-[#1A1A1A]"
                    />

                    <Button
                      className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-medium"
                      onClick={() => setIsCalendarOpen(false)}
                    >
                      {t('statistics.apply')}
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </motion.div>

        <motion.div className="mb-6" variants={itemVariants}>
          <div className="flex bg-[#242425] rounded-full p-1">
            <motion.button
              type="button"
              className={`flex-1 py-2 text-center rounded-full text-sm ${activeTab === 'outcome' ? 'bg-[#C6FE1E] text-[#0D0D0D] font-medium' : 'text-white'}`}
              onClick={() => handleTabChange('outcome')}
              whileTap={{ scale: 0.98 }}
            >
              {t('statistics.expense')}
            </motion.button>
            <motion.button
              type="button"
              className={`flex-1 py-2 text-center rounded-full text-sm ${activeTab === 'income' ? 'bg-[#C6FE1E] text-[#0D0D0D] font-medium' : 'text-white'}`}
              onClick={() => handleTabChange('income')}
              whileTap={{ scale: 0.98 }}
            >
              {t('statistics.income')}
            </motion.button>
            <motion.button
              type="button"
              className={`flex-1 py-2 text-center rounded-full text-sm ${activeTab === 'analysis' ? 'bg-[#C6FE1E] text-[#0D0D0D] font-medium' : 'text-white'}`}
              onClick={() => handleTabChange('analysis')}
              whileTap={{ scale: 0.98 }}
            >
              {t('statistics.analysis')}
            </motion.button>
          </div>
        </motion.div>

        {activeTab === 'analysis' ? (
          <motion.div className="-mx-6 -mb-6" variants={itemVariants}>
            <EvaluateContent />
          </motion.div>
        ) : filteredTransactions.length > 0 ? (
          <>
            <div className="mb-6 border bg-card p-6 rounded-xl">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {t('statistics.sixMonthTrend')}
              </h3>
              <div className="h-[220px] w-full relative">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>

            <div className="mb-8 border bg-card p-6 rounded-xl">
              <figure className="relative">
                <figcaption className="sr-only">{pieSummaryCaption}</figcaption>
                <div className="h-[280px] w-full relative">
                  <Pie data={pieChartData} options={chartOptions} />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-[#868686] text-sm">{t('statistics.total')}</p>
                    <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>
              </figure>
              <table className="sr-only">
                <caption>{t('statistics.breakdownTableCaption')}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('statistics.categoryColumn')}</th>
                    <th scope="col">{t('statistics.amountColumn')}</th>
                    <th scope="col">{t('statistics.percentColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row) => (
                    <tr key={`${row.name}-${row.categoryId ?? 'x'}`}>
                      <td>{row.name}</td>
                      <td>{formatCurrency(row.value)}</td>
                      <td>{row.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <motion.div className="mt-8" variants={itemVariants}>
              <h3 className="text-lg font-bold mb-4">
                {activeTab === 'income'
                  ? t('statistics.incomeBreakdown')
                  : t('statistics.expenseBreakdown')}
              </h3>
              <div className="space-y-3">
                {chartData.map((category, index) => (
                  <motion.div
                    key={`${category.name}-${index}`}
                    className="flex justify-between items-center p-4 border bg-card rounded-xl"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatCurrency(category.value)}</span>
                      <div
                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      >
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
          >
            <p className="text-[#868686]">{t('statistics.noData')}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

const Statistics: React.FC = () => (
  <AnalyticsPeriodProvider>
    <StatisticsInner />
  </AnalyticsPeriodProvider>
)

export default Statistics
