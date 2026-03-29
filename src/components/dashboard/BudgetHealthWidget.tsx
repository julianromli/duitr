/**
 * BudgetHealthWidget Component
 * 
 * Displays budget predictions with risk indicators and insights.
 * Features:
 * - Overall risk assessment
 * - Category-level predictions
 * - Progress bars with risk-based colors
 * - Expandable details per category
 * - Smooth animations with Framer Motion
 * - Responsive design (mobile-first)
 * - Full accessibility support
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useBudgetPredictions } from '@/hooks/useBudgetPredictions';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useFinance } from '@/context/FinanceContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { BudgetPrediction, RiskLevel } from '@/types/finance';
import { cn } from '@/lib/utils';

/**
 * Props for CategoryPredictionCard sub-component
 */
interface CategoryPredictionCardProps {
  prediction: BudgetPrediction;
  formatCurrency: (amount: number) => string;
  onExpand?: () => void;
  isExpanded?: boolean;
}

/**
 * Category Prediction Card Sub-component
 * Displays individual category prediction with expandable details
 */
const CategoryPredictionCard: React.FC<CategoryPredictionCardProps> = ({
  prediction,
  formatCurrency,
  onExpand,
  isExpanded = false,
}) => {
  const { t } = useTranslation();
  const { findById, getDisplayName } = useCategories();

  // Get category details
  const category = useMemo(
    () => findById(prediction.categoryId),
    [findById, prediction.categoryId]
  );
  const categoryName = useMemo(
    () => (category ? getDisplayName(category) : t('budget.unknownCategory')),
    [category, getDisplayName, t]
  );

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (prediction.budgetLimit === 0) return 0;
    return Math.min((prediction.currentSpend / prediction.budgetLimit) * 100, 100);
  }, [prediction.currentSpend, prediction.budgetLimit]);

  // Get risk indicator color
  const getRiskIndicator = (risk: RiskLevel) => {
    switch (risk) {
      case 'low':
        return { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-900/30', borderColor: 'border-green-700' };
      case 'medium':
        return { icon: AlertCircle, color: 'text-yellow-400', bgColor: 'bg-yellow-900/30', borderColor: 'border-yellow-700' };
      case 'high':
        return { icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-900/30', borderColor: 'border-red-700' };
      default:
        return { icon: Info, color: 'text-gray-400', bgColor: 'bg-gray-900/30', borderColor: 'border-gray-700' };
    }
  };

  const riskIndicator = getRiskIndicator(prediction.riskLevel);
  const RiskIcon = riskIndicator.icon;
  const detailsId = `budget-prediction-${prediction.categoryId}`;
  const currentVsLimitLabel = useMemo(() => {
    if (prediction.budgetLimit === 0) return '0%';

    return `${Math.min(Math.round((prediction.currentSpend / prediction.budgetLimit) * 100), 100)}%`;
  }, [prediction.currentSpend, prediction.budgetLimit]);

  // Get progress bar color based on progress percentage
  const getProgressColor = (percentage: number): string => {
    if (percentage < 85) return 'bg-green-500';
    if (percentage < 100) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-white/6 bg-[#151515] p-4 transition-colors hover:border-[#C6FE1E]/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C6FE1E] text-black shadow-[0_12px_30px_rgba(198,254,30,0.18)]">
              <CategoryIcon category={prediction.categoryId} size="sm" animate={false} />
            </div>
            <div className="min-w-0">
              <h4 className="truncate text-base font-semibold text-white">{categoryName}</h4>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium',
                riskIndicator.bgColor,
                riskIndicator.color,
                riskIndicator.borderColor
              )}
            >
              <RiskIcon className="mr-1.5 h-3.5 w-3.5" />
              {t(`budget.risk.${prediction.riskLevel}`)}
            </Badge>
            {prediction.confidence !== undefined && (
              <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-white/60">
                {Math.round(prediction.confidence * 100)}% {t('budget.confidence')}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExpand}
          className="mt-1 h-9 w-9 rounded-full border border-white/8 bg-white/[0.03] p-0 text-white/80 hover:bg-white/[0.08]"
          aria-label={isExpanded ? t('budget.collapse') : t('budget.expand')}
          aria-expanded={isExpanded}
          aria-controls={detailsId}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="space-y-3 border-t border-white/6 pt-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-sm">
          <span className="text-white/72">{t('budget.currentSpend')}</span>
          <span className="text-right font-semibold tabular-nums text-white">
            {formatCurrency(prediction.currentSpend)}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/55">
            <span>{currentVsLimitLabel}</span>
            <span>{formatCurrency(prediction.budgetLimit)}</span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-2.5 bg-white/[0.06]"
            indicatorClassName={getProgressColor(progressPercentage)}
          />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-sm">
          <span className="text-white/72">{t('budget.projectedSpend')}</span>
          <span className={cn(
            'text-right font-semibold tabular-nums',
            prediction.overrunAmount > 0 ? 'text-red-400' : 'text-[#7BF18A]'
          )}>
            {formatCurrency(prediction.projectedSpend)}
          </span>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-sm">
          <span className="text-white/72">{t('budget.limit')}</span>
          <span className="text-right font-semibold tabular-nums text-white">
            {formatCurrency(prediction.budgetLimit)}
          </span>
        </div>

        <div className="rounded-2xl border border-white/6 bg-white/[0.02] px-3 py-3">
          <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/55">
            <span>{t('budget.recommendedDaily')}</span>
            <span>{prediction.daysRemaining} {t('budget.days')}</span>
          </div>
          <div className="text-lg font-semibold tabular-nums text-[#C6FE1E]">
            {formatCurrency(prediction.recommendedDailyLimit)}
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={detailsId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 border-t border-white/6 pt-4">
              {prediction.overrunAmount > 0 ? (
                <div className="flex items-center justify-between rounded-2xl border border-red-800/50 bg-red-900/20 px-3 py-3 text-sm">
                  <span className="flex items-center gap-2 text-red-300">
                    <TrendingUp className="h-4 w-4" />
                    {t('budget.overrun')}
                  </span>
                  <span className="font-semibold tabular-nums text-red-300">
                    +{formatCurrency(prediction.overrunAmount)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-emerald-800/50 bg-emerald-900/20 px-3 py-3 text-sm">
                  <span className="flex items-center gap-2 text-emerald-300">
                    <TrendingDown className="h-4 w-4" />
                    {t('budget.remaining')}
                  </span>
                  <span className="font-semibold tabular-nums text-emerald-300">
                    {formatCurrency(prediction.budgetLimit - prediction.projectedSpend)}
                  </span>
                </div>
              )}

              {prediction.insight && (
                <div className="rounded-2xl border border-white/6 bg-black/20 px-3 py-3 text-sm text-white/70">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#C6FE1E]" />
                    <p className="leading-relaxed">{prediction.insight}</p>
                  </div>
                </div>
              )}

              {prediction.seasonalNote && (
                <div className="text-xs italic text-white/60">
                  {prediction.seasonalNote}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Main BudgetHealthWidget Component
 */
export const BudgetHealthWidget: React.FC = () => {
  const { t } = useTranslation();
  const { budgets } = useBudgets();
  const { transactions, formatCurrency } = useFinance();
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const {
    predictions,
    overallRisk,
    summary,
    isLoading,
    error,
    refresh,
    isRefreshing,
  } = useBudgetPredictions({
    budgets: budgets || [],
    transactions: transactions || [],
  });

  // Toggle card expansion
  const toggleExpand = (categoryId: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Get overall risk indicator
  const getOverallRiskIndicator = (risk?: RiskLevel) => {
    if (!risk) return { icon: Info, color: 'text-gray-400', bgColor: 'bg-gray-900/30', borderColor: 'border-gray-700', label: t('budget.noRisk') };
    
    switch (risk) {
      case 'low':
        return { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-900/30', borderColor: 'border-green-700', label: t('budget.risk.low') };
      case 'medium':
        return { icon: AlertCircle, color: 'text-yellow-400', bgColor: 'bg-yellow-900/30', borderColor: 'border-yellow-700', label: t('budget.risk.medium') };
      case 'high':
        return { icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-900/30', borderColor: 'border-red-700', label: t('budget.risk.high') };
      default:
        return { icon: Info, color: 'text-gray-400', bgColor: 'bg-gray-900/30', borderColor: 'border-gray-700', label: t('budget.noRisk') };
    }
  };

  const overallRiskIndicator = getOverallRiskIndicator(overallRisk);
  const OverallRiskIcon = overallRiskIndicator.icon;

  // Loading State
  if (isLoading) {
    return (
      <Card className="border-[#242425] bg-[#1A1A1A]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error State
  if (error) {
    return (
      <Card className="border-[#242425] bg-[#1A1A1A]">
        <CardContent className="py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-3" />
            <p className="text-gray-300 mb-2">{t('budget.predictionError')}</p>
            <p className="text-sm text-gray-400 mb-4">{error.message}</p>
            <Button
              onClick={refresh}
              variant="outline"
              className="border-[#242425] hover:bg-[#242425]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('common.retry')}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // Empty State
  if (!predictions || predictions.length === 0) {
    return (
      <Card className="border-[#242425] bg-[#1A1A1A]">
        <CardContent className="py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Info className="mx-auto h-12 w-12 text-blue-400 mb-3" />
            <p className="text-gray-300 mb-2">{t('budget.noPredictionsAvailable')}</p>
            <p className="text-sm text-gray-400">
              {t('budget.noPredictionsDescription')}
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // Main Render
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden rounded-[28px] border border-white/6 bg-[#181818] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="h-1 w-full bg-gradient-to-r from-[#C6FE1E] via-[#7BF18A] to-transparent" />
        <CardHeader className="space-y-5 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <CardTitle className="flex items-center gap-3 text-[clamp(1.35rem,4vw,1.9rem)] font-semibold tracking-tight text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.04] text-[#C6FE1E]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                {t('budget.healthWidget.title')}
              </CardTitle>
              {summary && (
                <p className="max-w-[34rem] text-sm leading-7 text-white/72 sm:text-[15px]">
                  {summary}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 self-start">
              <Badge
                variant="outline"
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium',
                  overallRiskIndicator.bgColor,
                  overallRiskIndicator.color,
                  overallRiskIndicator.borderColor
                )}
              >
                <OverallRiskIcon className="mr-2 h-4 w-4" />
                {overallRiskIndicator.label}
              </Badge>
              <Button
                onClick={refresh}
                disabled={isRefreshing}
                size="sm"
                variant="ghost"
                className="h-10 w-10 rounded-full border border-white/8 bg-white/[0.03] p-0 text-white hover:bg-white/[0.08]"
                aria-label={t('budget.refresh')}
              >
                <RefreshCw
                  className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {predictions.map((prediction) => (
              <CategoryPredictionCard
                key={prediction.categoryId}
                prediction={prediction}
                formatCurrency={formatCurrency}
                isExpanded={expandedCards.has(prediction.categoryId)}
                onExpand={() => toggleExpand(prediction.categoryId)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BudgetHealthWidget;
