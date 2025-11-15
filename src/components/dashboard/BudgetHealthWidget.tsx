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
  DollarSign,
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

  // Calculate projected progress percentage
  const projectedProgressPercentage = useMemo(() => {
    if (prediction.budgetLimit === 0) return 0;
    return Math.min((prediction.projectedSpend / prediction.budgetLimit) * 100, 100);
  }, [prediction.projectedSpend, prediction.budgetLimit]);

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
      className="border border-[#242425] rounded-lg p-4 hover:border-[#333] transition-colors bg-[#1A1A1A]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <CategoryIcon category={prediction.categoryId} size="sm" animate={false} />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{categoryName}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  riskIndicator.bgColor,
                  riskIndicator.color,
                  riskIndicator.borderColor
                )}
              >
                <RiskIcon className="w-3 h-3 mr-1" />
                {t(`budget.risk.${prediction.riskLevel}`)}
              </Badge>
              {prediction.confidence !== undefined && (
                <span className="text-xs text-gray-400">
                  {Math.round(prediction.confidence * 100)}% {t('budget.confidence')}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExpand}
          className="h-8 w-8 p-0 hover:bg-[#242425]"
          aria-label={isExpanded ? t('budget.collapse') : t('budget.expand')}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Current Spending */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">{t('budget.currentSpend')}</span>
          <span className="font-medium">{formatCurrency(prediction.currentSpend)}</span>
        </div>
        <div className="relative">
          <Progress
            value={progressPercentage}
            className="h-2"
            indicatorClassName={getProgressColor(progressPercentage)}
          />
        </div>
      </div>

      {/* Projected Spending */}
      <div className="flex justify-between text-sm mb-3">
        <span className="text-gray-400">{t('budget.projectedSpend')}</span>
        <span className={cn(
          'font-medium',
          prediction.overrunAmount > 0 ? 'text-red-400' : 'text-green-400'
        )}>
          {formatCurrency(prediction.projectedSpend)}
        </span>
      </div>

      {/* Budget Limit */}
      <div className="flex justify-between text-sm pb-3 border-b border-[#242425]">
        <span className="text-gray-400">{t('budget.limit')}</span>
        <span className="font-medium">{formatCurrency(prediction.budgetLimit)}</span>
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">
              {/* Overrun Amount */}
              {prediction.overrunAmount > 0 && (
                <div className="flex items-center justify-between text-sm p-2 rounded bg-red-900/20 border border-red-800/50">
                  <span className="text-red-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {t('budget.overrun')}
                  </span>
                  <span className="font-medium text-red-400">
                    +{formatCurrency(prediction.overrunAmount)}
                  </span>
                </div>
              )}

              {/* Remaining Budget */}
              {prediction.overrunAmount <= 0 && (
                <div className="flex items-center justify-between text-sm p-2 rounded bg-green-900/20 border border-green-800/50">
                  <span className="text-green-400 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    {t('budget.remaining')}
                  </span>
                  <span className="font-medium text-green-400">
                    {formatCurrency(prediction.budgetLimit - prediction.projectedSpend)}
                  </span>
                </div>
              )}

              {/* Days Remaining */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('budget.daysRemaining')}</span>
                <span className="font-medium">{prediction.daysRemaining} {t('budget.days')}</span>
              </div>

              {/* Recommended Daily Limit */}
              <div className="flex justify-between text-sm p-2 rounded bg-blue-900/20 border border-blue-800/50">
                <span className="text-blue-400 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {t('budget.recommendedDaily')}
                </span>
                <span className="font-medium text-blue-400">
                  {formatCurrency(prediction.recommendedDailyLimit)}
                </span>
              </div>

              {/* AI Insight */}
              {prediction.insight && (
                <div className="text-sm p-3 rounded bg-[#242425] border border-[#333]">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-xs leading-relaxed">
                      {prediction.insight}
                    </p>
                  </div>
                </div>
              )}

              {/* Seasonal Note */}
              {prediction.seasonalNote && (
                <div className="text-xs text-gray-400 italic">
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
      <Card className="border-[#242425] bg-[#1A1A1A] rounded-xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('budget.healthWidget.title')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-sm',
                  overallRiskIndicator.bgColor,
                  overallRiskIndicator.color,
                  overallRiskIndicator.borderColor
                )}
              >
                <OverallRiskIcon className="w-4 h-4 mr-1" />
                {overallRiskIndicator.label}
              </Badge>
              <Button
                onClick={refresh}
                disabled={isRefreshing}
                size="sm"
                variant="ghost"
                className="h-8 hover:bg-[#242425]"
                aria-label={t('budget.refresh')}
              >
                <RefreshCw
                  className={cn('w-4 h-4', isRefreshing && 'animate-spin')}
                />
              </Button>
            </div>
          </div>
          {summary && (
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              {summary}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
